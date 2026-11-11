// ECHOES O.S. author tools. Loaded on first [AUTHOR UNLOCK]; the engine holds the tree and
// the prompt plumbing (terminal.html), this file is the editing commands.
// Every command works on the folder the author is standing in (ctx.cwd). Edits change the
// in-memory tree and a localStorage draft; [EXPORT] downloads the file to commit.

const COMMANDS = ['[AUTHOR HELP]', '[MKDIR]', '[NEW DOC]', '[NEW LOG]', '[NEW PROGRAM]', '[NEW GATEWAY]', '[EDIT]',
  '[SET]', '[LAYER]', '[HIDE]', '[SHOW]', '[ALIAS]', '[MV]', '[RM]', '[EXPORT]', '[RESTORE DRAFT]', '[DISCARD DRAFT]'];
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
  ['[SET] [SET NAME]', 'change one property of an item (right-click an item to see them all)'],
  ['[LAYER] [LAYER PRIMARY]', 'colors, title, intro text and sound of a layer (right-click a tier root)'],
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
// A destination is stored as the folder's id (L3A_ROOT: tier 3, Archive root). Show the name beside it.
const destLabel = (items, id) => { const d = items[id]; return d ? d.name + ' (' + id + ')' : id + ' (NOT FOUND)'; };

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
const canceled = (ctx) => ctx.say('> CANCELED', 'low').then(() => 'stay');

function cwdFolder(ctx) {
  const it = ctx.os.items[ctx.cwd];
  if (!it) return ctx.say('> OPEN THE ARCHIVE FIRST, E.G. [ECHOES.ARCHIVE], THEN RUN THIS FROM THE FOLDER YOU WANT.', 'warn').then(() => null);
  if (it.type !== 'folder') return ctx.say('> THIS PAGE IS NOT A FOLDER. GO UP WITH [BACK] AND TRY AGAIN.', 'warn').then(() => null);
  return Promise.resolve(it);
}

// An alias must not shadow a built-in, and hidden aliases are global so they must be unique everywhere;
// visible aliases only need to be unique within their folder. Programs may share an alias across tiers.
function aliasProblem(ctx, alias, { parentId, global, exceptId, program }) {
  if (RESERVED.has(alias) || /^\[(OPEN|SET|LAYER)\s/.test(alias)) return 'THAT IS A BUILT-IN COMMAND';
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
// The item a command acts on: the one a click or context menu named (ctx.preset), else ask by name.
async function target(ctx, label) {
  const pre = ctx.preset && ctx.preset.target;
  if (pre) { ctx.preset.target = null; const it = ctx.os.items[pre]; if (it) return it; }
  const f = await cwdFolder(ctx); if (!f) return null;
  return pick(ctx, f, label);
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
      { text: '  Edits apply to the folder you are standing in. Esc cancels any prompt.', cls: 'low' },
      { text: '  Right-click an item for its menu, empty space for the create commands.', cls: 'low' },
      { text: '  The (o) / (-) eye beside an item lists / unlists it. Click it to toggle.', cls: 'low' }]);
    return 'stay';
  },

  async '[MKDIR]'(ctx) {
    const f = await cwdFolder(ctx); if (!f) return 'stay';
    const n = await nameHiddenAlias(ctx, f, 'FOLDER'); if (!n) return canceled(ctx);
    const title = await askTitle(ctx, n.name); if (title === null) return canceled(ctx);
    return add(ctx, f, make({ id: uid(ctx, 'L' + f.tier + 'A_', n.name), type: 'folder', name: n.name, alias: n.alias, tier: f.tier, hidden: n.hidden, title }), 'FOLDER');
  },

  async '[NEW DOC]'(ctx) {
    const f = await cwdFolder(ctx); if (!f) return 'stay';
    const n = await nameHiddenAlias(ctx, f, 'DOC'); if (!n) return canceled(ctx);
    const title = await askTitle(ctx, n.name); if (title === null) return canceled(ctx);
    const body = await readBody(ctx); if (body === null) return canceled(ctx);
    return add(ctx, f, make({ id: uid(ctx, 'L' + f.tier + 'A_', n.name), type: 'doc', name: n.name, alias: n.alias, tier: f.tier, hidden: n.hidden, title, body }), 'DOC');
  },

  async '[NEW LOG]'(ctx) {
    const f = await cwdFolder(ctx); if (!f) return 'stay';
    const n = await nameHiddenAlias(ctx, f, 'LOG'); if (!n) return canceled(ctx);
    const title = await askTitle(ctx, n.name); if (title === null) return canceled(ctx);
    const src = await ask(ctx, '> SOURCE (LORE = lore.json, DEV = dev_logs.json):', 'LORE / DEV');
    if (src === null || !/^(LORE|DEV)$/.test(src)) { await ctx.say('> SOURCE MUST BE LORE OR DEV', 'denied'); return canceled(ctx); }
    const code = await ask(ctx, '> ENTRY CODE:', 'XXXXX-XXXXX-XXXXX-XXXXX', { mask: 'code' });
    if (!code) return canceled(ctx);
    const data = src === 'DEV' ? ctx.devLogs : ctx.lore;
    if (!data || !(data[code] || data[code.replace(/-/g, '')])) { ctx.denied(); await ctx.say('> NO ENTRY ' + code + ' IN ' + (src === 'DEV' ? 'dev_logs' : 'lore') + '.json', 'denied'); return canceled(ctx); }
    const item = make({ id: uid(ctx, 'L' + f.tier + 'A_', n.name), type: 'log', name: n.name, alias: n.alias, tier: f.tier, hidden: n.hidden, title, log_ref: { source: src.toLowerCase(), code } });
    return add(ctx, f, item, 'LOG');
  },

  async '[NEW PROGRAM]'(ctx) {
    const f = await cwdFolder(ctx); if (!f) return 'stay';
    const pid = await ask(ctx, '> PROGRAM ID (FILE NAME IN terminal-data/programs, WITHOUT .js):', 'lore-entry', { mask: 'free' });
    if (!pid || !/^[a-z0-9-]+$/i.test(pid.trim())) return canceled(ctx);
    const id = pid.trim().toLowerCase();
    if (!(await ctx.os.loadProgram(id))) { ctx.denied(); await ctx.say('> NO PROGRAM FILE terminal-data/programs/' + id + '.js (OR IT FAILS TO LOAD)', 'denied'); return canceled(ctx); }
    const n = await nameHiddenAlias(ctx, f, 'PROGRAM', { forceHidden: true, program: true }); if (!n) return canceled(ctx);
    const sc = await ask(ctx, '> SCOPE: TIER = ANY PAGE OF THIS TIER, FOLDER = ONLY THIS FOLDER (ENTER = TIER):', 'TIER / FOLDER');
    if (sc === null) return canceled(ctx);
    const scope = sc === 'FOLDER' ? 'folder' : 'tier';
    return add(ctx, f, make({ id: uid(ctx, 'L' + f.tier + 'A_PROG_', n.name), type: 'program', program: id, scope, name: n.name, alias: n.alias, tier: f.tier, hidden: true }), 'PROGRAM');
  },

  async '[NEW GATEWAY]'(ctx) {
    const f = await cwdFolder(ctx); if (!f) return 'stay';
    const n = await nameHiddenAlias(ctx, f, 'GATEWAY', { forceHidden: true }); if (!n) return canceled(ctx);
    const dest = await askDestination(ctx, null); if (!dest) return canceled(ctx);
    return add(ctx, f, make({ id: uid(ctx, 'GW_', n.name), type: 'gateway', name: n.name, alias: n.alias, tier: f.tier, hidden: true, goto: dest.id }), 'GATEWAY -> ' + destLabel(ctx.os.items, dest.id));
  },

  async '[EDIT]'(ctx) {
    const it = await target(ctx, 'EDIT WHICH ITEM'); if (!it) return canceled(ctx);
    await ctx.say('> ' + it.id + '  (' + it.type + ', T' + it.tier + (it.stub ? ', STUB' : '') + ')  ' + (it.alias || ''), 'low');
    if (it.stub) await ctx.say('> THIS IS A STUB PLACEHOLDER. EDITING IT TURNS IT INTO A REAL DOC.', 'warn');
    const name = await ask(ctx, '> NAME (ENTER = KEEP ' + it.name + '):', it.name); if (name === null) return canceled(ctx);
    let hidden = it.hidden;
    if (!isGlobalType(it)) { const h = await yn(ctx, '> HIDDEN? (Y/N, ENTER = KEEP ' + (it.hidden ? 'Y' : 'N') + '):', it.hidden); if (h === null) return canceled(ctx); hidden = h; }
    const alias = await askAlias(ctx, name || it.name, { parentId: it._parent, global: hidden || isGlobalType(it), exceptId: it.id, program: it.type === 'program' }, it.alias);
    if (alias === null) return canceled(ctx);
    const title = await ask(ctx, '> TITLE (ENTER = KEEP "' + (it.title || it.name) + '"):', it.title || it.name); if (title === null) return canceled(ctx);
    let body = null;
    if (it.type === 'doc' || it.stub) {
      const rb = it.stub ? true : await yn(ctx, '> RETYPE THE TEXT? (Y/N, ENTER = N):', false);
      if (rb === null) return canceled(ctx);
      if (rb) { body = await readBody(ctx); if (body === null) return canceled(ctx); }
    }
    if (it.type === 'gateway') { const d = await askDestination(ctx, it.goto); if (d === null) return canceled(ctx); it.goto = d.id; }
    if (it.type === 'program') { const sc = await ask(ctx, '> SCOPE (TIER / FOLDER, ENTER = KEEP ' + it.scope.toUpperCase() + '):', 'TIER / FOLDER'); if (sc === null) return canceled(ctx); if (sc) it.scope = sc === 'FOLDER' ? 'folder' : 'tier'; }
    if (name) it.name = name;
    it.alias = alias; it.hidden = hidden; if (title) it.title = title; if (body) it.body = body;
    if (it.stub) { it.stub = false; it.type = 'doc'; }
    ctx.os.commit();
    ctx.note('> UPDATED ' + it.alias);
    return 'redraw';
  },

  // One property at a time. [SET NAME] names it; plain [SET] asks. The right-click menu sends [SET <PROPERTY>] with the item.
  async '[SET]'(ctx, key) {
    const it = await target(ctx, 'CHANGE A PROPERTY OF'); if (!it) return canceled(ctx);
    const keys = fieldKeys(it);
    if (!key) {
      await ctx.say('> PROPERTIES: ' + keys.join(', '), 'low');
      const q = await ask(ctx, '> WHICH PROPERTY?', keys[0] + ' / ...'); if (!q) return canceled(ctx);
      key = q.trim();
    }
    return setField(ctx, it, key.toUpperCase());
  },

  // Settings that belong to a whole layer: colors, header title, intro text, ambient sound. [LAYER] lists them;
  // [LAYER PRIMARY] goes straight to one. The layer is the tier you are standing in (or the one a right-click named).
  async '[LAYER]'(ctx, prop) {
    let id = ctx.preset && ctx.preset.layer; if (ctx.preset) ctx.preset.layer = null;
    if (!id) { const cur = ctx.os.items[ctx.cwd]; id = cur ? 'l' + cur.tier + 'a' : null; }
    if (!id) {
      const q = await ask(ctx, '> WHICH LAYER? (L1A, L2A, L3A):', 'L1A / L2A / L3A'); if (!q) return canceled(ctx);
      id = q.trim().toLowerCase();
    }
    if (!LAYER_IDS.includes(id)) { ctx.denied(); await ctx.say('> NO SUCH LAYER. THE LAYERS ARE L1A, L2A AND L3A.', 'denied'); return canceled(ctx); }
    const keys = layerKeys(id);
    if (!prop) {
      await ctx.lines(layerSummary(ctx, id));
      const q = await ask(ctx, '> WHICH SETTING?', keys[0] + ' / ...'); if (!q) return canceled(ctx);
      prop = q.trim();
    }
    return setLayerProp(ctx, id, prop.toUpperCase());
  },

  async '[HIDE]'(ctx) { return setHidden(ctx, true); },
  async '[SHOW]'(ctx) { return setHidden(ctx, false); },

  async '[ALIAS]'(ctx) {
    const it = await target(ctx, 'CHANGE THE ALIAS OF'); if (!it) return canceled(ctx);
    const alias = await askAlias(ctx, it.name, { parentId: it._parent, global: it.hidden || isGlobalType(it), exceptId: it.id, program: it.type === 'program' }, it.alias);
    if (alias === null) return canceled(ctx);
    it.alias = alias; ctx.os.commit();
    ctx.note('> ALIAS IS NOW ' + alias);
    return 'redraw';
  },

  async '[MV]'(ctx) {
    const it = await target(ctx, 'MOVE WHICH ITEM'); if (!it) return canceled(ctx);
    const dest = await askDestination(ctx, null, it, '.. = PARENT FOLDER'); if (!dest) return canceled(ctx);
    if ((dest.children || []).some((c) => c.id !== it.id && c.alias && it.alias && c.alias.toUpperCase() === it.alias.toUpperCase() && !it.hidden && !c.hidden && !isGlobalType(c))) {
      ctx.denied(); await ctx.say('> ' + dest.id + ' ALREADY HAS AN ITEM WITH THE ALIAS ' + it.alias, 'denied'); return canceled(ctx);
    }
    if (dest.tier !== it.tier) {
      const ok = await yn(ctx, '> ' + dest.id + ' IS TIER ' + dest.tier + '; THIS MOVES ' + (1 + descendants(it).length) + ' ITEM(S) FROM TIER ' + it.tier + '. CONTINUE? (Y/N)', false);
      if (!ok) return canceled(ctx);
    }
    const src = parentList(ctx, it);
    src.splice(src.indexOf(it), 1);
    dest.children.push(it);
    if (dest.tier !== it.tier) retier(it, dest.tier);
    ctx.os.commit();
    ctx.note('> MOVED ' + (it.alias || it.name) + ' -> ' + destLabel(ctx.os.items, dest.id));
    return 'redraw';
  },

  async '[RM]'(ctx) {
    const it = await target(ctx, 'DELETE WHICH ITEM'); if (!it) return canceled(ctx);
    const doomed = [it, ...descendants(it)], ids = new Set(doomed.map((d) => d.id));
    const refs = all(ctx).filter((o) => !ids.has(o.id) && ((o.type === 'gateway' && ids.has(o.goto)) || (o.commands || []).some((c) => ids.has(c.goto))));
    if (refs.length) { ctx.denied(); await ctx.say('> CANNOT DELETE: ' + refs.map((r) => r.id).join(', ') + ' POINT(S) INTO IT. REMOVE OR REPOINT FIRST.', 'denied'); return canceled(ctx); }
    const ok = await yn(ctx, '> DELETE ' + (it.alias || it.name) + (doomed.length > 1 ? ' AND ' + (doomed.length - 1) + ' ITEM(S) UNDER IT' : '') + '? (Y/N)', false);
    if (!ok) return canceled(ctx);
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
  const it = await target(ctx, (hidden ? 'HIDE' : 'SHOW') + ' WHICH ITEM'); if (!it) return canceled(ctx);
  if (it.stub) { await ctx.say('> THIS IS A STUB PLACEHOLDER. [EDIT] IT TO MAKE IT A REAL DOC FIRST.', 'warn'); return 'stay'; }
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
    const q = await ask(ctx, '> DESTINATION FOLDER (NAME, ALIAS OR ID' + (hint ? '; ' + hint : '') + (current ? '; ENTER = KEEP ' + destLabel(ctx.os.items, current) : '') + '):', 'folder');
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

// The properties [SET] can change for an item, in the order the right-click menu lists them.
function fieldKeys(it) {
  const k = ['NAME', 'ALIAS', 'TITLE'];
  if (!isGlobalType(it) && !it.stub) k.push('HIDDEN');
  if (!isGlobalType(it)) k.push('FOOTER');
  if (it.type === 'doc' || it.stub) k.push('TEXT');
  if (it.type === 'log') k.push('LOG');
  if (it.type === 'gateway') k.push('DESTINATION');
  if (it.type === 'program') k.push('PROGRAM', 'SCOPE');
  return k;
}

async function setField(ctx, it, key) {
  const keys = fieldKeys(it);
  if (!keys.includes(key)) { ctx.denied(); await ctx.say('> ' + it.id + ' HAS NO ' + key + '. IT HAS: ' + keys.join(', '), 'denied'); return canceled(ctx); }
  const done = (msg) => { ctx.os.commit(); ctx.note('> ' + msg); return 'redraw'; };
  const keep = (what, cur) => '> ' + what + ' (ENTER = KEEP ' + cur + '):';
  switch (key) {
    case 'NAME': {
      const v = await ask(ctx, keep('NAME', it.name), it.name); if (v === null) return canceled(ctx);
      if (v) it.name = v;
      return done('NAME IS NOW ' + it.name);
    }
    case 'ALIAS': ctx.preset.target = it.id; return handlers['[ALIAS]'](ctx);
    case 'HIDDEN': ctx.preset.target = it.id; return setHidden(ctx, !it.hidden);
    case 'TITLE': {
      const v = await ask(ctx, keep('TITLE', '"' + (it.title || it.name) + '"'), it.title || it.name); if (v === null) return canceled(ctx);
      if (v) it.title = v;
      return done('TITLE IS NOW ' + (it.title || it.name));
    }
    case 'FOOTER': {
      const v = await ask(ctx, '> FOOTER LINE (ENTER = KEEP ' + (it.footer ? '"' + it.footer + '"' : 'NONE') + ', - = CLEAR):', 'footer', { mask: 'free' }); if (v === null) return canceled(ctx);
      if (v === '-') it.footer = ''; else if (v) it.footer = v;
      return done(it.footer ? 'FOOTER IS NOW ' + it.footer : 'FOOTER CLEARED');
    }
    case 'TEXT': {
      const body = await readBody(ctx); if (body === null) return canceled(ctx);
      it.body = body;
      if (it.stub) { it.stub = false; it.type = 'doc'; }
      return done('TEXT UPDATED (' + body.length + ' LINES)');
    }
    case 'LOG': {
      const cur = it.log_ref || {};
      const src = await ask(ctx, keep('SOURCE (LORE = lore.json, DEV = dev_logs.json)', (cur.source || 'LORE').toUpperCase()), 'LORE / DEV'); if (src === null) return canceled(ctx);
      const source = (src || cur.source || 'lore').toLowerCase();
      if (!/^(lore|dev)$/.test(source)) { ctx.denied(); await ctx.say('> SOURCE MUST BE LORE OR DEV', 'denied'); return canceled(ctx); }
      const code = await ask(ctx, keep('ENTRY CODE', cur.code || 'NONE'), 'XXXXX-XXXXX-XXXXX-XXXXX', { mask: 'code' }); if (code === null) return canceled(ctx);
      const c = code || cur.code;
      const data = source === 'dev' ? ctx.devLogs : ctx.lore;
      if (!c || !data || !(data[c] || data[c.replace(/-/g, '')])) { ctx.denied(); await ctx.say('> NO ENTRY ' + c + ' IN ' + (source === 'dev' ? 'dev_logs' : 'lore') + '.json', 'denied'); return canceled(ctx); }
      it.log_ref = { source, code: c };
      return done('LOG IS NOW ' + source.toUpperCase() + ' ' + c);
    }
    case 'DESTINATION': {
      const d = await askDestination(ctx, it.goto); if (d === null) return canceled(ctx);
      it.goto = d.id;
      return done('DESTINATION IS NOW ' + destLabel(ctx.os.items, d.id));
    }
    case 'SCOPE': {
      const sc = await ask(ctx, keep('SCOPE (TIER = ANY PAGE OF THIS TIER, FOLDER = ONLY THE FOLDER IT SITS IN)', (it.scope || 'tier').toUpperCase()), 'TIER / FOLDER'); if (sc === null) return canceled(ctx);
      if (sc) it.scope = sc === 'FOLDER' ? 'folder' : 'tier';
      return done('SCOPE IS NOW ' + it.scope.toUpperCase());
    }
    case 'PROGRAM': {
      const pid = await ask(ctx, keep('PROGRAM ID', it.program), it.program, { mask: 'free' }); if (pid === null) return canceled(ctx);
      const id = (pid || it.program).trim().toLowerCase();
      if (!/^[a-z0-9-]+$/.test(id) || !(await ctx.os.loadProgram(id))) { ctx.denied(); await ctx.say('> NO PROGRAM FILE terminal-data/programs/' + id + '.js (OR IT FAILS TO LOAD)', 'denied'); return canceled(ctx); }
      it.program = id;
      return done('PROGRAM IS NOW ' + id);
    }
  }
  return canceled(ctx);
}

// What the right-click menu shows about an item. A row with a command can be clicked to change that property.
function infoRows(it, items) {
  const set = (k) => ({ cmd: '[SET ' + k + ']', preset: { target: it.id } });
  const lines = (it.body || []).filter((b) => b.type === 'text');
  const first = (lines.find((b) => b.text) || {}).text || '';
  const rows = [
    { k: 'ID', v: it.id },
    { k: 'TYPE', v: it.type + (it.stub ? ' (stub)' : '') + ', tier ' + it.tier },
    { k: 'NAME', v: it.name, ...set('NAME') },
    { k: 'ALIAS', v: it.alias || '(none)', cmd: '[ALIAS]', preset: { target: it.id } },
    { k: 'TITLE', v: it.title || it.name, ...set('TITLE') },
  ];
  if (isGlobalType(it)) rows.push({ k: 'HIDDEN', v: 'always (reached by its alias)' });
  else if (!it.stub) rows.push({ k: 'HIDDEN', v: it.hidden ? 'yes (opens by alias only)' : 'no', cmd: it.hidden ? '[SHOW]' : '[HIDE]', preset: { target: it.id } });
  if (!isGlobalType(it)) rows.push({ k: 'FOOTER', v: it.footer || '(none)', ...set('FOOTER') });
  if (it.type === 'folder') rows.push({ k: 'CONTAINS', v: (it.children || []).length + ' item(s)' });
  if (it.type === 'doc' || it.stub) rows.push({ k: 'TEXT', v: it.stub ? '(empty: write it to make a real doc)' : lines.length + ' line(s)' + (first ? ': ' + first : ''), ...set('TEXT') });
  if (it.type === 'log') rows.push({ k: 'LOG ENTRY', v: it.log_ref ? it.log_ref.source.toUpperCase() + ' ' + it.log_ref.code : '(none)', ...set('LOG') });
  if (it.type === 'gateway') rows.push({ k: 'DESTINATION', v: destLabel(items, it.goto), ...set('DESTINATION') });
  if (it.type === 'program') {
    rows.push({ k: 'PROGRAM', v: it.program, ...set('PROGRAM') });
    rows.push({ k: 'SCOPE', v: it.scope === 'folder' ? 'folder (only where it sits)' : 'tier (any page of tier ' + it.tier + ')', ...set('SCOPE') });
  }
  return rows;
}

// ---- layers ---------------------------------------------------------------------------------------------------
// layers.<id> in echo-os.json: header_title, colors {primary, warn, denied, background, dim_opacity, lo_opacity,
// border_opacity} and ambient {target_volume, oscillators[]}. The chat (l1c) shares the colors and sound of l1a.
const LAYER_IDS = ['l1a', 'l2a', 'l3a'];
const COLOR_KEYS = { PRIMARY: 'primary', WARN: 'warn', DENIED: 'denied', BACKGROUND: 'background' };
const OPACITY_KEYS = { DIM: 'dim_opacity', LO: 'lo_opacity', BORDER: 'border_opacity' };
const layerKeys = () => ['TITLE', ...Object.keys(COLOR_KEYS), ...Object.keys(OPACITY_KEYS), 'INTRO', 'VOLUME', 'SOUND'];

// Ready-made ambient sounds. Choosing one sets the oscillators and its default volume (VOLUME changes it afterward).
const SOUND_PRESETS = {
  VENTILATION: { volume: 0.18, oscillators: [
    { label: 'Ventilation hum', type: 'sine', freq: 110, volume: 0.06, lfo_rate: 0, lfo_depth: 0, filter_type: 'none', filter_freq: 0 },
    { label: 'Engine drone', type: 'sawtooth', freq: 90, volume: 0.045, lfo_rate: 0.12, lfo_depth: 0.015, filter_type: 'lowpass', filter_freq: 180 },
    { label: 'Noise bed', type: 'noise', freq: 0, volume: 0.04, lfo_rate: 0, lfo_depth: 0, filter_type: 'lowpass', filter_freq: 500 }] },
  CHORD: { volume: 0.12, oscillators: [
    { label: 'Tone A', type: 'sine', freq: 80, volume: 0.025, lfo_rate: 0.02, lfo_depth: 0.012, filter_type: 'none', filter_freq: 0 },
    { label: 'Tone B', type: 'sine', freq: 121, volume: 0.025, lfo_rate: 0.035, lfo_depth: 0.012, filter_type: 'none', filter_freq: 0 },
    { label: 'Tone C', type: 'sine', freq: 160, volume: 0.025, lfo_rate: 0.05, lfo_depth: 0.012, filter_type: 'none', filter_freq: 0 },
    { label: 'Tone D', type: 'sine', freq: 203, volume: 0.025, lfo_rate: 0.06, lfo_depth: 0.012, filter_type: 'none', filter_freq: 0 }] },
  'SUB-BASS': { volume: 0.05, oscillators: [
    { label: 'Sub-bass', type: 'sine', freq: 38, volume: 0.5, lfo_rate: 0, lfo_depth: 0, filter_type: 'none', filter_freq: 0 }] },
  SILENT: { volume: 0, oscillators: null },
};
const soundName = (amb) => {
  if (!amb) return 'BUILT-IN';
  if (!amb.target_volume) return 'SILENT';
  const hit = Object.keys(SOUND_PRESETS).find((n) => SOUND_PRESETS[n].oscillators && JSON.stringify(SOUND_PRESETS[n].oscillators) === JSON.stringify(amb.oscillators));
  return hit || 'CUSTOM (' + (amb.oscillators || []).length + ' tones)';
};
const introId = (id) => 'L' + id[1] + 'A_INTRO';
const introLines = (ctx, id) => ((ctx.os.data.screens || {})[introId(id)] || { body: [] }).body.filter((b) => b.type === 'text' && b.text && b.cls !== 'blank' && !/^> ─+$/.test(b.text));
const layerOf = (data, id) => { data.layers = data.layers || {}; return (data.layers[id] = data.layers[id] || {}); };

function layerSummary(ctx, id) {
  const L = layerOf(ctx.os.data, id), c = L.colors || {}, a = L.ambient;
  const row = (k, v) => ({ text: '  ' + k.padEnd(12) + v, cls: 'dim' });
  return [{ text: id.toUpperCase() + ' SETTINGS', cls: 'full' }, { text: ctx.sep, cls: 'low' },
    row('TITLE', L.header_title || '(none)'),
    ...Object.keys(COLOR_KEYS).map((k) => row(k, c[COLOR_KEYS[k]] || '(built-in)')),
    ...Object.keys(OPACITY_KEYS).map((k) => row(k, c[OPACITY_KEYS[k]] != null ? String(c[OPACITY_KEYS[k]]) : '(built-in)')),
    row('INTRO', introLines(ctx, id).length + ' line(s)'),
    row('VOLUME', a && a.target_volume != null ? String(a.target_volume) : '(built-in)'),
    row('SOUND', soundName(a)), { text: ctx.sep, cls: 'low' }];
}

const parseHex = (v) => { const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v.trim()); if (!m) return null; let h = m[1].toLowerCase(); if (h.length === 3) h = h.replace(/./g, '$&$&'); return '#' + h; };
const parseUnit = (v) => { let n = parseFloat(v); if (!isFinite(n)) return null; if (n > 1 && n <= 100) n /= 100; return n >= 0 && n <= 1 ? Math.round(n * 1000) / 1000 : null; };

async function setLayerProp(ctx, id, prop) {
  if (!layerKeys(id).includes(prop)) { ctx.denied(); await ctx.say('> ' + id.toUpperCase() + ' HAS NO ' + prop + '. IT HAS: ' + layerKeys(id).join(', '), 'denied'); return canceled(ctx); }
  const L = layerOf(ctx.os.data, id);
  const done = (msg, audio) => { ctx.os.commit(); if (audio && ctx.os.audioChanged) ctx.os.audioChanged(id); ctx.note('> ' + id.toUpperCase() + ' ' + msg); return 'redraw'; };
  if (prop === 'TITLE') {
    const v = await ask(ctx, '> HEADER TITLE (ENTER = KEEP ' + (L.header_title || 'NONE') + '):', L.header_title || 'TITLE'); if (v === null) return canceled(ctx);
    if (v) L.header_title = v;
    return done('TITLE IS NOW ' + L.header_title);
  }
  if (COLOR_KEYS[prop]) {
    const key = COLOR_KEYS[prop]; L.colors = L.colors || {};
    for (;;) {
      const v = await ask(ctx, '> ' + prop + ' COLOR AS HEX (ENTER = KEEP ' + (L.colors[key] || 'BUILT-IN') + '):', '#4fc3f7', { mask: 'free' }); if (v === null) return canceled(ctx);
      if (v === '') return done(prop + ' COLOR UNCHANGED');
      const hex = parseHex(v);
      if (hex) { L.colors[key] = hex; return done(prop + ' COLOR IS NOW ' + hex); }
      ctx.denied(); await ctx.say('> THAT IS NOT A HEX COLOR. USE #RGB OR #RRGGBB, FOR EXAMPLE #4FC3F7.', 'denied');
    }
  }
  if (OPACITY_KEYS[prop]) {
    const key = OPACITY_KEYS[prop]; L.colors = L.colors || {};
    for (;;) {
      const v = await ask(ctx, '> ' + prop + ' STRENGTH, 0 TO 1 (ENTER = KEEP ' + (L.colors[key] != null ? L.colors[key] : 'BUILT-IN') + '):', '0.70'); if (v === null) return canceled(ctx);
      if (v === '') return done(prop + ' STRENGTH UNCHANGED');
      const n = parseUnit(v);
      if (n !== null) { L.colors[key] = n; return done(prop + ' STRENGTH IS NOW ' + n); }
      ctx.denied(); await ctx.say('> USE A NUMBER FROM 0 TO 1, FOR EXAMPLE 0.7.', 'denied');
    }
  }
  if (prop === 'INTRO') {
    const cur = introLines(ctx, id);
    await ctx.say('> THE TEXT SHOWN WHILE THE TERMINAL MOVES INTO ' + id.toUpperCase() + '. CURRENT TEXT:', 'low');
    for (const b of cur) await ctx.say('  ' + b.text, 'dim');
    await ctx.say('> RETYPE IT BELOW. THE RULE LINE AFTER IT IS ADDED FOR YOU.', 'low');
    const body = await readBody(ctx); if (body === null) return canceled(ctx);
    const screens = ctx.os.data.screens = ctx.os.data.screens || {};
    const blank = { type: 'text', text: '', cls: 'blank' };
    screens[introId(id)] = Object.assign(screens[introId(id)] || { layer: id, node_type: 'intro', is_root: false, title: '', breadcrumb: introId(id), footer: '' },
      { body: [blank, ...body, { type: 'text', text: '> ' + '─'.repeat(33), cls: 'low' }, blank] });
    return done('INTRO TEXT UPDATED (' + body.length + ' LINES)');
  }
  if (prop === 'VOLUME') {
    L.ambient = L.ambient || { target_volume: 0.12, oscillators: [] };
    for (;;) {
      const v = await ask(ctx, '> AMBIENT VOLUME, 0 TO 1 (ENTER = KEEP ' + L.ambient.target_volume + '):', '0.18'); if (v === null) return canceled(ctx);
      if (v === '') return done('VOLUME UNCHANGED');
      const n = parseUnit(v);
      if (n !== null) { L.ambient.target_volume = n; return done('VOLUME IS NOW ' + n, true); }
      ctx.denied(); await ctx.say('> USE A NUMBER FROM 0 TO 1, FOR EXAMPLE 0.18.', 'denied');
    }
  }
  if (prop === 'SOUND') {
    await ctx.say('> SOUNDS: ' + Object.keys(SOUND_PRESETS).join(', ') + '. NOW: ' + soundName(L.ambient), 'low');
    for (;;) {
      const v = await ask(ctx, '> WHICH SOUND?', Object.keys(SOUND_PRESETS)[0] + ' / ...'); if (!v) return canceled(ctx);
      const pre = SOUND_PRESETS[v.trim().toUpperCase()];
      if (pre) {
        const a = L.ambient = L.ambient || {};
        if (pre.oscillators) a.oscillators = JSON.parse(JSON.stringify(pre.oscillators));
        a.target_volume = pre.volume;
        return done('SOUND IS NOW ' + v.trim().toUpperCase(), true);
      }
      ctx.denied(); await ctx.say('> NO SOUND NAMED "' + v + '". CHOOSE FROM: ' + Object.keys(SOUND_PRESETS).join(', '), 'denied');
    }
  }
  return canceled(ctx);
}

// What the right-click menu shows for a tier root: the layer's settings, one row each. Click a row to change it.
function layerRows(id, ctx) {
  const L = layerOf(ctx.os.data, id), c = L.colors || {}, a = L.ambient;
  const set = (k) => ({ cmd: '[LAYER ' + k + ']', preset: { layer: id } });
  const rows = [{ k: 'LAYER', v: id.toUpperCase() + '  (the whole layer, not this folder)' },
    { k: 'TITLE', v: L.header_title || '(none)', ...set('TITLE') }];
  Object.keys(COLOR_KEYS).forEach((k) => rows.push({ k, v: c[COLOR_KEYS[k]] || '(built-in)', swatch: c[COLOR_KEYS[k]], ...set(k) }));
  Object.keys(OPACITY_KEYS).forEach((k) => rows.push({ k, v: c[OPACITY_KEYS[k]] != null ? String(c[OPACITY_KEYS[k]]) : '(built-in)', ...set(k) }));
  rows.push({ k: 'INTRO', v: (introLines(ctx, id)[0] || { text: '(none)' }).text, ...set('INTRO') });
  rows.push({ k: 'VOLUME', v: a && a.target_volume != null ? String(a.target_volume) : '(built-in)', ...set('VOLUME') });
  rows.push({ k: 'SOUND', v: soundName(a), ...set('SOUND') });
  return rows;
}

const SET_RE = /^\[SET\s+([A-Z ]+?)\s*\]$/;
const LAYER_RE = /^\[LAYER\s+([A-Z ]+?)\s*\]$/;
export default {
  id: 'author',
  recognizes: (val) => COMMANDS.includes(val) || SET_RE.test(val) || LAYER_RE.test(val),
  handle: (val, ctx) => { let m = SET_RE.exec(val); if (m) return handlers['[SET]'](ctx, m[1]); m = LAYER_RE.exec(val); return m ? handlers['[LAYER]'](ctx, m[1]) : handlers[val](ctx); },
  infoRows,
  layerRows,
  destLabel,
};
