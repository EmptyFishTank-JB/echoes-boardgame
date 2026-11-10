// Echo O.S. author tools. Loaded on first [AUTHOR UNLOCK]; the engine holds the tree and
// the prompt plumbing (terminal.html), this file is the editing commands.
// Every command works on the folder the author is standing in (ctx.cwd). Edits change the
// in-memory tree and a localStorage draft; [EXPORT] downloads the file to commit.

const COMMANDS = ['[AUTHOR HELP]', '[MKDIR]', '[NEW DOC]', '[NEW LOG]', '[NEW PROGRAM]', '[NEW GATEWAY]', '[EDIT]',
  '[HIDE]', '[SHOW]', '[ALIAS]', '[MV]', '[RM]', '[EXPORT]', '[RESTORE DRAFT]', '[DISCARD DRAFT]'];
// Typed commands an alias must never shadow.
const RESERVED = new Set(['[HELP]', '[TREE]', '[LS]', '[BACK]', '[ROOT]', '[EXIT]', '[CLEAR]', '[SYSTEM OVERRIDE]',
  '[AUTHOR UNLOCK]', '[AUTHOR LOCK]', '[STATUS]', '[SCAN]', ...COMMANDS]);

const HELP = [
  ['[MKDIR]', 'new folder in this folder'],
  ['[NEW DOC]', 'new page with its own text'],
  ['[NEW LOG]', 'new page showing a lore.json / dev_logs.json entry'],
  ['[NEW PROGRAM]', 'register a program from terminal-data/programs'],
  ['[NEW GATEWAY]', 'hidden command that jumps to another folder or tier'],
  ['[EDIT]', 'change an item: name, alias, title, hidden, text'],
  ['[HIDE] [SHOW]', 'unlist an item (still opens by alias) / list it again'],
  ['[ALIAS]', 'change an item\'s [COMMAND]'],
  ['[MV]', 'move an item to another folder'],
  ['[RM]', 'delete an item and everything under it'],
  ['[LS] [TREE]', 'this folder with hidden items / the whole tree'],
  ['[EXPORT]', 'download echo-os.json to commit'],
  ['[RESTORE DRAFT] [DISCARD DRAFT]', 'recover or drop the autosaved draft'],
  ['[AUTHOR LOCK]', 'leave author mode'],
];

const bracket = (s) => { s = s.trim().toUpperCase(); return /^\[.*\]$/.test(s) ? s : '[' + s + ']'; };
const bare = (s) => bracket(s).slice(1, -1);
const slug = (s) => s.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'ITEM';
const all = (ctx) => Object.values(ctx.os.items);
const isGlobalType = (it) => it.type === 'program' || it.type === 'gateway';

function uid(ctx, prefix, name) {
  const base = prefix + slug(name);
  let id = base, n = 2;
  while (ctx.os.items[id]) id = base + '_' + n++;
  return id;
}
function make(o) {
  return Object.assign({ hidden: false, title: o.name, footer: '', body: [], children: [], commands: [] }, o);
}

async function ask(ctx, label, placeholder, opts) {
  await ctx.say(label, 'dim');
  return ctx.ask(Object.assign({ placeholder }, opts));
}
async function yn(ctx, label, dflt) {
  const v = await ask(ctx, label, 'Y / N', {});
  if (v === null) return null;
  if (v === '') return dflt;
  return v[0] === 'Y';
}
const cancelled = (ctx) => ctx.say('> CANCELLED', 'low').then(() => 'stay');

function cwdFolder(ctx) {
  const it = ctx.os.items[ctx.cwd];
  if (!it) return ctx.say('> OPEN THE ARCHIVE FIRST, E.G. [L1 ROOT], THEN RUN THIS FROM THE FOLDER YOU WANT.', 'warn').then(() => null);
  if (it.type !== 'folder') return ctx.say('> THIS PAGE IS NOT A FOLDER. GO UP WITH [BACK] AND TRY AGAIN.', 'warn').then(() => null);
  return Promise.resolve(it);
}

// An alias must not shadow a built-in, and hidden aliases are global so they must be unique everywhere;
// visible aliases only need to be unique within their folder. Programs may share an alias across tiers.
function aliasProblem(ctx, alias, { parentId, global, exceptId, program }) {
  if (RESERVED.has(alias) || /^\[OPEN\s/.test(alias)) return 'THAT IS A BUILT-IN COMMAND';
  if (/\[|\]/.test(alias.slice(1, -1)) || alias.length < 3) return 'ALIAS MUST BE ONE [BRACKETED] NAME';
  for (const o of all(ctx)) {
    if (o.id === exceptId || !o.alias || o.alias.toUpperCase() !== alias) continue;
    if (program && o.type === 'program') continue;
    if (global || o.hidden || isGlobalType(o) || o._parent === parentId) {
      return o.stub ? 'A STUB PLACEHOLDER ALREADY USES IT (EDIT OR REMOVE THE STUB)' : 'ALREADY USED BY ' + o.id;
    }
  }
  return null;
}
async function askAlias(ctx, name, opts, dflt) {
  for (;;) {
    const v = await ask(ctx, '> ALIAS' + (dflt ? ' (ENTER = KEEP ' + dflt + ')' : ' (ENTER = ' + bracket(name) + ')') + ':', '[ALIAS]');
    if (v === null) return null;
    const alias = v === '' ? (dflt || bracket(name)) : bracket(v);
    const prob = aliasProblem(ctx, alias, opts);
    if (!prob) return alias;
    ctx.denied(); await ctx.say('> ' + prob, 'denied');
  }
}

function findIn(folder, q) {
  const k = bare(q);
  return (folder.children || []).find((c) => c.id === q.trim().toUpperCase() || (c.alias && bare(c.alias) === k) || (c.name || '').toUpperCase() === k);
}
async function pick(ctx, folder, label) {
  const q = await ask(ctx, '> ' + label + ' (NAME OR ALIAS, [LS] SHOWS THEM):', 'name');
  if (q === null || q === '') return null;
  const it = findIn(folder, q);
  if (!it) { ctx.denied(); await ctx.say('> NOTHING HERE MATCHES "' + q + '"', 'denied'); return null; }
  return it;
}
function descendants(it) { return (it.children || []).flatMap((c) => [c, ...descendants(c)]); }
function findFolder(ctx, q, exclude) {
  const k = bare(q);
  const bad = new Set(exclude ? [exclude.id, ...descendants(exclude).map((d) => d.id)] : []);
  return all(ctx).filter((o) => o.type === 'folder' && !o.stub && !bad.has(o.id) && (o.id === q.trim().toUpperCase() || (o.alias && bare(o.alias) === k) || (o.name || '').toUpperCase() === k));
}
function parentOf(ctx, it) { return it._parent ? ctx.os.items[it._parent] : null; }
function parentList(ctx, it) { const p = parentOf(ctx, it); return p ? p.children : ctx.os.data.tree.children; }
function retier(it, tier) { it.tier = tier; (it.children || []).forEach((c) => retier(c, tier)); }

async function readBody(ctx, existing) {
  await ctx.say('> TYPE THE TEXT, ONE LINE PER ENTRY (BLANK ENTRY = BLANK LINE).', 'low');
  await ctx.say('> START A LINE WITH /DIM /LOW /WARN /DENIED FOR A STYLE. [DONE] FINISHES. ESC ABORTS.', 'low');
  const lines = [];
  for (;;) {
    const raw = await ctx.ask({ placeholder: 'text...   ([DONE] to finish)', mask: 'free', sticky: true });
    if (raw === null) { if (await yn(ctx, '> DISCARD THIS TEXT? (Y/N)', false)) return null; continue; }
    if (raw.trim().toUpperCase() === '[DONE]') break;
    ctx.echo(raw);
    const m = /^\/(dim|low|warn|denied|full)\s?(.*)$/i.exec(raw);
    const text = m ? m[2] : raw, cls = m ? m[1].toLowerCase() : 'full';
    lines.push(text === '' ? { type: 'text', text: '', cls: 'blank' } : { type: 'text', text, cls });
  }
  return lines;
}

async function nameHiddenAlias(ctx, folder, label, { forceHidden, program } = {}) {
  const name = await ask(ctx, '> ' + label + ' NAME:', 'NAME');
  if (name === null || name === '') return null;
  let hidden = true;
  if (!forceHidden) { hidden = await yn(ctx, '> HIDDEN? ONLY REACHABLE BY TYPING ITS ALIAS (Y/N, ENTER = N):', false); if (hidden === null) return null; }
  const alias = await askAlias(ctx, name, { parentId: folder.id, global: hidden, program });
  if (alias === null) return null;
  return { name, hidden, alias };
}
async function askTitle(ctx, name) {
  const t = await ask(ctx, '> PAGE TITLE (ENTER = ' + name + '):', name);
  return t === null ? null : (t || name);
}

async function add(ctx, folder, item, noun) {
  folder.children.push(item);
  ctx.os.commit();
  ctx.note('> CREATED ' + noun + ' ' + (item.alias || item.name) + (item.hidden ? '  (HIDDEN)' : ''));
  return 'redraw';
}

const handlers = {
  async '[AUTHOR HELP]'(ctx) {
    await ctx.lines([{ text: 'AUTHOR COMMANDS', cls: 'full' }, { text: ctx.sep, cls: 'low' },
      ...HELP.map(([a, d]) => ({ text: '  ' + a.padEnd(34) + '- ' + d, cls: 'dim' })), { text: ctx.sep, cls: 'low' },
      { text: '  Edits apply to the folder you are standing in. Esc cancels any prompt.', cls: 'low' }]);
    return 'stay';
  },

  async '[MKDIR]'(ctx) {
    const f = await cwdFolder(ctx); if (!f) return 'stay';
    const n = await nameHiddenAlias(ctx, f, 'FOLDER'); if (!n) return cancelled(ctx);
    const title = await askTitle(ctx, n.name); if (title === null) return cancelled(ctx);
    return add(ctx, f, make({ id: uid(ctx, 'L' + f.tier + 'A_', n.name), type: 'folder', name: n.name, alias: n.alias, tier: f.tier, hidden: n.hidden, title }), 'FOLDER');
  },

  async '[NEW DOC]'(ctx) {
    const f = await cwdFolder(ctx); if (!f) return 'stay';
    const n = await nameHiddenAlias(ctx, f, 'DOC'); if (!n) return cancelled(ctx);
    const title = await askTitle(ctx, n.name); if (title === null) return cancelled(ctx);
    const body = await readBody(ctx); if (body === null) return cancelled(ctx);
    return add(ctx, f, make({ id: uid(ctx, 'L' + f.tier + 'A_', n.name), type: 'doc', name: n.name, alias: n.alias, tier: f.tier, hidden: n.hidden, title, body }), 'DOC');
  },

  async '[NEW LOG]'(ctx) {
    const f = await cwdFolder(ctx); if (!f) return 'stay';
    const n = await nameHiddenAlias(ctx, f, 'LOG'); if (!n) return cancelled(ctx);
    const title = await askTitle(ctx, n.name); if (title === null) return cancelled(ctx);
    const src = await ask(ctx, '> SOURCE (LORE = lore.json, DEV = dev_logs.json):', 'LORE / DEV');
    if (src === null || !/^(LORE|DEV)$/.test(src)) { await ctx.say('> SOURCE MUST BE LORE OR DEV', 'denied'); return cancelled(ctx); }
    const code = await ask(ctx, '> ENTRY CODE:', 'XXXXX-XXXXX-XXXXX-XXXXX', { mask: 'code' });
    if (!code) return cancelled(ctx);
    const data = src === 'DEV' ? ctx.devLogs : ctx.lore;
    if (!data || !(data[code] || data[code.replace(/-/g, '')])) { ctx.denied(); await ctx.say('> NO ENTRY ' + code + ' IN ' + (src === 'DEV' ? 'dev_logs' : 'lore') + '.json', 'denied'); return cancelled(ctx); }
    const item = make({ id: uid(ctx, 'L' + f.tier + 'A_', n.name), type: 'log', name: n.name, alias: n.alias, tier: f.tier, hidden: n.hidden, title, log_ref: { source: src.toLowerCase(), code } });
    return add(ctx, f, item, 'LOG');
  },

  async '[NEW PROGRAM]'(ctx) {
    const f = await cwdFolder(ctx); if (!f) return 'stay';
    const pid = await ask(ctx, '> PROGRAM ID (FILE NAME IN terminal-data/programs, WITHOUT .js):', 'lore-entry', { mask: 'free' });
    if (!pid || !/^[a-z0-9-]+$/i.test(pid.trim())) return cancelled(ctx);
    const id = pid.trim().toLowerCase();
    if (!(await ctx.os.loadProgram(id))) { ctx.denied(); await ctx.say('> NO PROGRAM FILE terminal-data/programs/' + id + '.js (OR IT FAILS TO LOAD)', 'denied'); return cancelled(ctx); }
    const n = await nameHiddenAlias(ctx, f, 'PROGRAM', { forceHidden: true, program: true }); if (!n) return cancelled(ctx);
    const sc = await ask(ctx, '> SCOPE: TIER = ANY PAGE OF THIS TIER, FOLDER = ONLY THIS FOLDER (ENTER = TIER):', 'TIER / FOLDER');
    if (sc === null) return cancelled(ctx);
    const scope = sc === 'FOLDER' ? 'folder' : 'tier';
    return add(ctx, f, make({ id: uid(ctx, 'L' + f.tier + 'A_PROG_', n.name), type: 'program', program: id, scope, name: n.name, alias: n.alias, tier: f.tier, hidden: true }), 'PROGRAM');
  },

  async '[NEW GATEWAY]'(ctx) {
    const f = await cwdFolder(ctx); if (!f) return 'stay';
    const n = await nameHiddenAlias(ctx, f, 'GATEWAY', { forceHidden: true }); if (!n) return cancelled(ctx);
    const dest = await askDestination(ctx, null); if (!dest) return cancelled(ctx);
    return add(ctx, f, make({ id: uid(ctx, 'GW_', n.name), type: 'gateway', name: n.name, alias: n.alias, tier: f.tier, hidden: true, goto: dest.id }), 'GATEWAY -> ' + dest.id);
  },

  async '[EDIT]'(ctx) {
    const f = await cwdFolder(ctx); if (!f) return 'stay';
    const it = await pick(ctx, f, 'EDIT WHICH ITEM'); if (!it) return cancelled(ctx);
    await ctx.say('> ' + it.id + '  (' + it.type + ', T' + it.tier + (it.stub ? ', STUB' : '') + ')  ' + (it.alias || ''), 'low');
    if (it.stub) await ctx.say('> THIS IS A STUB PLACEHOLDER. EDITING IT TURNS IT INTO A REAL DOC.', 'warn');
    const name = await ask(ctx, '> NAME (ENTER = KEEP ' + it.name + '):', it.name); if (name === null) return cancelled(ctx);
    let hidden = it.hidden;
    if (!isGlobalType(it)) { const h = await yn(ctx, '> HIDDEN? (Y/N, ENTER = KEEP ' + (it.hidden ? 'Y' : 'N') + '):', it.hidden); if (h === null) return cancelled(ctx); hidden = h; }
    const alias = await askAlias(ctx, name || it.name, { parentId: it._parent, global: hidden || isGlobalType(it), exceptId: it.id, program: it.type === 'program' }, it.alias);
    if (alias === null) return cancelled(ctx);
    const title = await ask(ctx, '> TITLE (ENTER = KEEP "' + (it.title || it.name) + '"):', it.title || it.name); if (title === null) return cancelled(ctx);
    let body = null;
    if (it.type === 'doc' || it.stub) {
      const rb = it.stub ? true : await yn(ctx, '> RETYPE THE TEXT? (Y/N, ENTER = N):', false);
      if (rb === null) return cancelled(ctx);
      if (rb) { body = await readBody(ctx); if (body === null) return cancelled(ctx); }
    }
    if (it.type === 'gateway') { const d = await askDestination(ctx, it.goto); if (d === null) return cancelled(ctx); it.goto = d.id; }
    if (it.type === 'program') { const sc = await ask(ctx, '> SCOPE (TIER / FOLDER, ENTER = KEEP ' + it.scope.toUpperCase() + '):', 'TIER / FOLDER'); if (sc === null) return cancelled(ctx); if (sc) it.scope = sc === 'FOLDER' ? 'folder' : 'tier'; }
    if (name) it.name = name;
    it.alias = alias; it.hidden = hidden; if (title) it.title = title; if (body) it.body = body;
    if (it.stub) { it.stub = false; it.type = 'doc'; }
    ctx.os.commit();
    ctx.note('> UPDATED ' + it.alias);
    return 'redraw';
  },

  async '[HIDE]'(ctx) { return setHidden(ctx, true); },
  async '[SHOW]'(ctx) { return setHidden(ctx, false); },

  async '[ALIAS]'(ctx) {
    const f = await cwdFolder(ctx); if (!f) return 'stay';
    const it = await pick(ctx, f, 'CHANGE THE ALIAS OF'); if (!it) return cancelled(ctx);
    const alias = await askAlias(ctx, it.name, { parentId: it._parent, global: it.hidden || isGlobalType(it), exceptId: it.id, program: it.type === 'program' }, it.alias);
    if (alias === null) return cancelled(ctx);
    it.alias = alias; ctx.os.commit();
    ctx.note('> ALIAS IS NOW ' + alias);
    return 'redraw';
  },

  async '[MV]'(ctx) {
    const f = await cwdFolder(ctx); if (!f) return 'stay';
    const it = await pick(ctx, f, 'MOVE WHICH ITEM'); if (!it) return cancelled(ctx);
    const dest = await askDestination(ctx, null, it, '.. = PARENT FOLDER'); if (!dest) return cancelled(ctx);
    if ((dest.children || []).some((c) => c.id !== it.id && c.alias && it.alias && c.alias.toUpperCase() === it.alias.toUpperCase() && !it.hidden && !c.hidden && !isGlobalType(c))) {
      ctx.denied(); await ctx.say('> ' + dest.id + ' ALREADY HAS AN ITEM WITH THE ALIAS ' + it.alias, 'denied'); return cancelled(ctx);
    }
    if (dest.tier !== it.tier) {
      const ok = await yn(ctx, '> ' + dest.id + ' IS TIER ' + dest.tier + '; THIS MOVES ' + (1 + descendants(it).length) + ' ITEM(S) FROM TIER ' + it.tier + '. CONTINUE? (Y/N)', false);
      if (!ok) return cancelled(ctx);
    }
    const src = parentList(ctx, it);
    src.splice(src.indexOf(it), 1);
    dest.children.push(it);
    if (dest.tier !== it.tier) retier(it, dest.tier);
    ctx.os.commit();
    ctx.note('> MOVED ' + (it.alias || it.name) + ' -> ' + dest.id);
    return 'redraw';
  },

  async '[RM]'(ctx) {
    const f = await cwdFolder(ctx); if (!f) return 'stay';
    const it = await pick(ctx, f, 'DELETE WHICH ITEM'); if (!it) return cancelled(ctx);
    const doomed = [it, ...descendants(it)], ids = new Set(doomed.map((d) => d.id));
    const refs = all(ctx).filter((o) => !ids.has(o.id) && ((o.type === 'gateway' && ids.has(o.goto)) || (o.commands || []).some((c) => ids.has(c.goto))));
    if (refs.length) { ctx.denied(); await ctx.say('> CANNOT DELETE: ' + refs.map((r) => r.id).join(', ') + ' POINT(S) INTO IT. REMOVE OR REPOINT FIRST.', 'denied'); return cancelled(ctx); }
    const ok = await yn(ctx, '> DELETE ' + (it.alias || it.name) + (doomed.length > 1 ? ' AND ' + (doomed.length - 1) + ' ITEM(S) UNDER IT' : '') + '? (Y/N)', false);
    if (!ok) return cancelled(ctx);
    const list = parentList(ctx, it); list.splice(list.indexOf(it), 1);
    ctx.os.commit();
    ctx.note('> DELETED ' + doomed.length + ' ITEM(S)');
    return 'redraw';
  },

  async '[EXPORT]'(ctx) {
    const d = JSON.parse(ctx.os.snapshot());
    d.meta.last_saved = new Date().toISOString();
    ctx.os.download('echo-os.json', JSON.stringify(d, null, 2) + '\n');
    ctx.os.clearDraft();
    await ctx.say('> EXPORTED echo-os.json (' + all(ctx).length + ' ITEMS). HAND IT OVER TO COMMIT.', 'full');
    return 'stay';
  },

  async '[RESTORE DRAFT]'(ctx) {
    const raw = ctx.os.draft();
    if (!raw) { await ctx.say('> NO DRAFT TO RESTORE', 'warn'); return 'stay'; }
    ctx.os.replace(JSON.parse(raw));
    ctx.note('> DRAFT RESTORED: ' + all(ctx).length + ' ITEMS. [TREE] TO REVIEW, [EXPORT] TO SAVE.');
    return 'redraw';
  },

  async '[DISCARD DRAFT]'(ctx) {
    if (!ctx.os.draft()) { await ctx.say('> NO DRAFT TO DISCARD', 'warn'); return 'stay'; }
    ctx.os.clearDraft();
    await ctx.say('> DRAFT DISCARDED', 'full');
    return 'stay';
  },
};

async function setHidden(ctx, hidden) {
  const f = await cwdFolder(ctx); if (!f) return 'stay';
  const it = await pick(ctx, f, (hidden ? 'HIDE' : 'SHOW') + ' WHICH ITEM'); if (!it) return cancelled(ctx);
  if (isGlobalType(it)) { await ctx.say('> PROGRAMS AND GATEWAYS ARE ALWAYS HIDDEN', 'warn'); return 'stay'; }
  if (it.hidden === hidden) { await ctx.say('> ALREADY ' + (hidden ? 'HIDDEN' : 'LISTED'), 'low'); return 'stay'; }
  const prob = aliasProblem(ctx, (it.alias || bracket(it.name)).toUpperCase(), { parentId: it._parent, global: hidden, exceptId: it.id });
  if (hidden && prob) { ctx.denied(); await ctx.say('> CANNOT HIDE: ' + prob + ' (HIDDEN ALIASES MUST BE UNIQUE EVERYWHERE)', 'denied'); return 'stay'; }
  it.hidden = hidden; ctx.os.commit();
  ctx.note('> ' + (it.alias || it.name) + (hidden ? ' IS NOW HIDDEN (OPENS BY ITS ALIAS ONLY)' : ' IS NOW LISTED'));
  return 'redraw';
}

async function askDestination(ctx, current, moving, hint) {
  for (;;) {
    const q = await ask(ctx, '> DESTINATION FOLDER (NAME, ALIAS OR ID' + (hint ? '; ' + hint : '') + (current ? '; ENTER = KEEP ' + current : '') + '):', 'folder');
    if (q === null) return null;
    if (q === '' && current) return ctx.os.items[current];
    if (q === '') return null;
    if (q === '..') { const p = parentOf(ctx, ctx.os.items[ctx.cwd]); if (p) return p; await ctx.say('> THIS IS ALREADY A TIER ROOT', 'denied'); continue; }
    const hits = findFolder(ctx, q, moving);
    if (hits.length === 1) return hits[0];
    ctx.denied();
    await ctx.say(hits.length ? '> AMBIGUOUS, USE AN ID: ' + hits.map((h) => h.id).join(', ') : '> NO FOLDER MATCHES "' + q + '"', 'denied');
  }
}

export default {
  id: 'author',
  recognizes: (val) => COMMANDS.includes(val),
  handle: (val, ctx) => handlers[val](ctx),
};
