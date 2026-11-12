// ECHOES O.S. author tools. Loaded on first [AUTHOR UNLOCK]; the engine holds the tree and
// the prompt plumbing (terminal.html), this file is the editing commands.
// Every command works on the folder the author is standing in (ctx.cwd). Edits change the
// in-memory tree and a localStorage draft; [EXPORT] downloads the file to commit.

const COMMANDS = ['[AUTHOR HELP]', '[MKDIR]', '[NEW DOC]', '[NEW PROGRAM]', '[NEW GATEWAY]', '[EDIT]',
  '[SET]', '[LAYER]', '[HIDE]', '[SHOW]', '[ALIAS]', '[MV]', '[RM]', '[FLAGS]', '[FLAG]', '[RESET STATE]', '[EXPORT]', '[RESTORE DRAFT]', '[DISCARD DRAFT]'];
// Typed commands an alias must never shadow.
const RESERVED = new Set(['[HELP]', '[TREE]', '[LS]', '[BACK]', '[ROOT]', '[EXIT]', '[CLEAR]', '[SYSTEM OVERRIDE]',
  '[AUTHOR UNLOCK]', '[AUTHOR LOCK]', '[STATUS]', '[SCAN]', ...COMMANDS]);

const HELP = [
  ['[MKDIR]', 'new folder in this folder'],
  ['[NEW DOC]', 'new page with its own text'],
  ['[NEW PROGRAM]', 'register a program from terminal-data/programs'],
  ['[NEW GATEWAY]', 'hidden command that jumps to another folder or level'],
  ['[EDIT]', 'change an item: name, alias, title, hidden, requires, text'],
  ['[SET] [SET NAME]', 'change one property of an item (right-click an item to see them all)'],
  ['[LAYER] [LAYER PRIMARY]', 'colors, title, intro text and sound of a layer (right-click a level root)'],
  ['[HIDE] [SHOW]', 'unlist an item (still opens by alias) / list it again (a program is listed like an app)'],
  ['[FLAGS] [FLAG]', 'show the game flags and the items they gate / turn one flag on or off to test it'],
  ['[RESET STATE]', 'clear every flag, recovered code and unlock (a fresh game)'],
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
// A program's scope is stored as 'tier' or 'folder'; people see LEVEL or FOLDER.
const scopeWord = (s) => (s === 'folder' ? 'FOLDER' : 'LEVEL');
const isGlobalType = (it) => it.type === 'program' || it.type === 'gateway';
// A destination is stored as the folder's id (L3A_ROOT: tier 3, Archive root). Show the name beside it.
const destLabel = (items, id) => { const d = items[id]; return d ? d.name + ' (' + id + ')' : id + ' (NOT FOUND)'; };

function uid(ctx, prefix, name) {
  const base = prefix + slug(name);
  let id = base, n = 2;
  while (ctx.os.items[id]) id = base + '_' + n++;
  return id;
}
// Programs and gateways never draw a page, so they have no title (see isGlobalType).
function make(o) {
  const base = { hidden: false, footer: '', body: [], children: [], commands: [] };
  if (o.type !== 'program' && o.type !== 'gateway') base.title = o.name;
  return Object.assign(base, o);
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

// Line by line text entry, shared by [NEW DOC], [EDIT], [SET TEXT] and [LAYER INTRO]. Type a line to add it at the end. Commands, each
// typed alone on a line: [BACK] takes the last line away, [LIST] numbers the lines, [PREVIEW] plays them as a player sees them,
// [EDIT n] [INS n] [DEL n] change one line, [CLEAR] starts over, [LOAD] brings in the text that is saved now, [DONE] finishes.
//   opts.lines     lines to start with (the transition text opens with its current lines)
//   opts.existing  the saved text, for [LOAD] (a document starts empty so it can be retyped, and [LOAD] edits it instead)
//   opts.kind      how [PREVIEW] renders: 'flavor' types the lines (a transition), 'page' lands them whole (a page)
//   opts.wrap      turns the lines into the whole body for [PREVIEW] (the transition adds blank lines and a rule around its text)
const BLANK = () => ({ type: 'text', text: '', cls: 'blank' });
const lineOf = (raw) => {
  const m = /^\/(dim|low|warn|denied|full)\s?(.*)$/i.exec(raw);
  const text = m ? m[2] : raw, cls = m ? m[1].toLowerCase() : 'full';
  return text === '' ? BLANK() : { type: 'text', text, cls };
};
const lineText = (l) => (l.cls === 'blank' ? '' : (l.cls && l.cls !== 'full' ? '/' + l.cls + ' ' : '') + l.text);
const textBody = (it) => (it.body || []).filter((b) => b.type === 'text').map((b) => Object.assign({}, b));
const BODY_CMD = /^\[(DONE|BACK|LIST|PREVIEW|CLEAR|LOAD|EDIT|INS|DEL)(?:\s+(\d+))?\]$/;

async function readBody(ctx, opts = {}) {
  const lines = (opts.lines || []).map((l) => Object.assign({}, l));
  const list = () => ctx.lines(lines.length ? lines.map((l, i) => ({ text: String(i + 1).padStart(3) + '  ' + (lineText(l) || '(blank)'), cls: 'dim' })) : [{ text: '  (NO LINES YET)', cls: 'low' }]);
  const preview = async () => { if (!lines.length) return ctx.say('> NOTHING TO PREVIEW YET', 'warn'); await ctx.preview(opts.wrap ? opts.wrap(lines) : lines, opts.kind); await ctx.say('> END OF PREVIEW', 'low'); };
  const bad = async (msg) => { ctx.denied(); await ctx.say('> ' + msg, 'denied'); };
  await ctx.say('> TYPE A LINE TO ADD IT AT THE END (BLANK ENTRY = BLANK LINE). START A LINE WITH /DIM /LOW /WARN /DENIED FOR A STYLE.', 'low');
  await ctx.say('> [BACK] REMOVES THE LAST LINE. [LIST] NUMBERS THE LINES. [PREVIEW] PLAYS THEM. [EDIT 3] [INS 3] [DEL 3] CHANGE ONE LINE.', 'low');
  await ctx.say('> [CLEAR] STARTS OVER.' + (opts.existing ? ' [LOAD] BRINGS IN THE SAVED TEXT TO EDIT.' : '') + ' [DONE] SAVES. ESC ABORTS.', 'low');
  if (lines.length) { await ctx.say('> ' + lines.length + ' LINE(S) LOADED. HERE THEY ARE AS A PLAYER SEES THEM:', 'low'); await preview(); }
  for (;;) {
    const raw = await ctx.ask({ placeholder: 'text...   ([DONE] saves, [BACK] undoes a line)', mask: 'free', sticky: true });
    if (raw === null) { if (await yn(ctx, '> DISCARD THIS TEXT? (Y/N)', false)) return null; continue; }
    const cm = BODY_CMD.exec(raw.trim().toUpperCase());
    if (!cm) {
      ctx.echo(raw); lines.push(lineOf(raw));
      continue;
    }
    const cmd = cm[1], n = cm[2] ? parseInt(cm[2], 10) : 0;
    if (cmd === 'DONE') break;
    ctx.echo(raw.trim());
    if (cmd === 'BACK') {
      if (!lines.length) { await ctx.say('> NOTHING TO GO BACK TO', 'warn'); continue; }
      const gone = lines.pop();
      await ctx.say('> REMOVED LINE ' + (lines.length + 1) + ': ' + (lineText(gone) || '(blank)'), 'dim');
    } else if (cmd === 'LIST') await list();
    else if (cmd === 'PREVIEW') await preview();
    else if (cmd === 'CLEAR') { if (await yn(ctx, '> REMOVE ALL ' + lines.length + ' LINE(S)? (Y/N)', false)) { lines.length = 0; await ctx.say('> CLEARED', 'dim'); } }
    else if (cmd === 'LOAD') {
      if (!opts.existing || !opts.existing.length) { await ctx.say('> NOTHING SAVED TO LOAD', 'warn'); continue; }
      if (lines.length && !(await yn(ctx, '> THIS REPLACES THE ' + lines.length + ' LINE(S) YOU HAVE. CONTINUE? (Y/N)', false))) continue;
      lines.length = 0; opts.existing.forEach((l) => lines.push(Object.assign({}, l)));
      await ctx.say('> LOADED ' + lines.length + ' LINE(S)', 'dim'); await list();
    } else if (!n || n > lines.length + (cmd === 'INS' ? 1 : 0)) {
      await bad(cmd + ' NEEDS A LINE NUMBER FROM 1 TO ' + (lines.length + (cmd === 'INS' ? 1 : 0)) + ', FOR EXAMPLE [' + cmd + ' ' + Math.max(1, Math.min(2, lines.length)) + ']. [LIST] SHOWS THEM.');
    } else if (cmd === 'DEL') {
      const gone = lines.splice(n - 1, 1)[0];
      await ctx.say('> REMOVED LINE ' + n + ': ' + (lineText(gone) || '(blank)'), 'dim');
    } else if (cmd === 'EDIT') {
      await ctx.say('> LINE ' + n + ' IS: ' + (lineText(lines[n - 1]) || '(blank)'), 'dim');
      await ctx.say('> TYPE THE NEW LINE (ENTER = KEEP, [BLANK] = BLANK LINE, ESC = CANCEL):', 'low');
      const v = await ctx.ask({ placeholder: 'new line ' + n, mask: 'free' });
      if (v === null || v === '') { await ctx.say('> LINE ' + n + ' KEPT', 'low'); continue; }
      lines[n - 1] = v.trim().toUpperCase() === '[BLANK]' ? BLANK() : lineOf(v);
      await ctx.say('> LINE ' + n + ' IS NOW: ' + (lineText(lines[n - 1]) || '(blank)'), 'dim');
    } else if (cmd === 'INS') {
      await ctx.say('> TYPE THE LINE TO INSERT BEFORE LINE ' + n + (n > lines.length ? ' (AT THE END)' : '') + ' (BLANK ENTRY = BLANK LINE, ESC = CANCEL):', 'low');
      const v = await ctx.ask({ placeholder: 'line to insert at ' + n, mask: 'free' });
      if (v === null) { await ctx.say('> NOTHING INSERTED', 'low'); continue; }
      lines.splice(n - 1, 0, lineOf(v));
      await ctx.say('> INSERTED AS LINE ' + n + ': ' + (lineText(lines[n - 1]) || '(blank)'), 'dim');
    }
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
      { text: '  Typing a text: [BACK] [LIST] [PREVIEW] [EDIT n] [INS n] [DEL n] [CLEAR] [LOAD] [DONE].', cls: 'low' },
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
    const body = await readBody(ctx, { kind: 'page' }); if (body === null) return canceled(ctx);
    return add(ctx, f, make({ id: uid(ctx, 'L' + f.tier + 'A_', n.name), type: 'doc', name: n.name, alias: n.alias, tier: f.tier, hidden: n.hidden, title, body }), 'DOC');
  },

  async '[NEW PROGRAM]'(ctx) {
    const f = await cwdFolder(ctx); if (!f) return 'stay';
    const pid = await ask(ctx, '> PROGRAM ID (FILE NAME IN terminal-data/programs, WITHOUT .js):', 'lore-entry', { mask: 'free' });
    if (!pid || !/^[a-z0-9-]+$/i.test(pid.trim())) return canceled(ctx);
    const id = pid.trim().toLowerCase();
    if (!(await ctx.os.loadProgram(id))) { ctx.denied(); await ctx.say('> NO PROGRAM FILE terminal-data/programs/' + id + '.js (OR IT FAILS TO LOAD)', 'denied'); return canceled(ctx); }
    const n = await nameHiddenAlias(ctx, f, 'PROGRAM', { forceHidden: true, program: true }); if (!n) return canceled(ctx);
    const sc = await ask(ctx, '> SCOPE: LEVEL = ANY PAGE OF THIS LEVEL, FOLDER = ONLY THIS FOLDER (ENTER = LEVEL):', 'LEVEL / FOLDER');
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

  // Editing opens a floating window (author-dialog.js): every property of the item at once, with the controls that fit it.
  // [EDIT] opens it on the name, [SET <PROPERTY>] and [ALIAS] open it on that property (a click on a row of the right-click menu sends these).
  async '[EDIT]'(ctx) {
    const it = await target(ctx, 'EDIT WHICH ITEM'); if (!it) return canceled(ctx);
    (await dialogs()).openItem(ctx, it, 'NAME');
    return 'stay';
  },

  async '[SET]'(ctx, key) {
    const it = await target(ctx, 'CHANGE A PROPERTY OF'); if (!it) return canceled(ctx);
    const keys = fieldKeys(it);
    key = (key || 'NAME').toUpperCase();
    if (!keys.includes(key)) { ctx.denied(); await ctx.say('> ' + it.id + ' HAS NO ' + key + '. IT HAS: ' + keys.join(', '), 'denied'); return canceled(ctx); }
    (await dialogs()).openItem(ctx, it, key);
    return 'stay';
  },

  // Settings that belong to a whole layer: colors, header title, transition text, ambient sound. They open in one window with a tab
  // per layer (the chat, L1A, L2A, L3A). The layer is the one you are standing in, or the one a right-click named.
  async '[LAYER]'(ctx, prop) {
    let id = ctx.preset && ctx.preset.layer; if (ctx.preset) ctx.preset.layer = null;
    if (!id) { const cur = ctx.os.items[ctx.cwd]; id = cur ? 'l' + cur.tier + 'a' : 'l1a'; }
    prop = prop ? prop.toUpperCase() : null;
    if (prop && !layerKeys().includes(prop)) { ctx.denied(); await ctx.say('> THE LAYER SETTINGS ARE: ' + layerKeys().join(', '), 'denied'); return canceled(ctx); }
    (await dialogs()).openLayer(ctx, LAYER_IDS.includes(id) ? id : 'l1a', prop);
    return 'stay';
  },

  async '[FLAGS]'(ctx) {
    const f = ctx.state.all(), keys = Object.keys(f).sort();
    await ctx.say(keys.length ? '> FLAGS ON: ' + keys.length : '> NO FLAGS ARE ON', 'full');
    for (const k of keys) await ctx.say('  ' + k + ' = ' + JSON.stringify(f[k]), 'dim');
    const gated = all(ctx).filter((o) => o.requires && o.requires.length);
    if (gated.length) { await ctx.say('> GATED ITEMS:', 'full'); for (const o of gated) await ctx.say('  ' + (o.alias || '[' + o.name + ']') + '  REQUIRES ' + o.requires.join(', '), 'dim'); }
    return 'stay';
  },
  async '[FLAG]'(ctx) {
    const name = await ask(ctx, '> FLAG NAME (CASE MATTERS, E.G. wing_door_open):', 'name', { mask: 'free' });
    if (!name || !name.trim()) return canceled(ctx);
    const v = await ask(ctx, '> ON OR OFF (ENTER = ON):', 'ON / OFF');
    if (v === null) return canceled(ctx);
    const on = !/^(OFF|N|NO|0|FALSE)$/.test(v.trim());
    const changed = ctx.state.set(name.trim(), on);
    ctx.note('> ' + name.trim() + (changed ? (on ? ' IS NOW ON' : ' IS NOW OFF') : (on ? ' WAS ALREADY ON' : ' WAS ALREADY OFF')), changed ? 'full' : 'low');
    return 'redraw';
  },
  async '[RESET STATE]'(ctx) {
    const ok = await yn(ctx, '> CLEAR EVERY FLAG, RECOVERED CODE AND UNLOCK? (Y/N, ENTER = N):', false);
    if (!ok) return canceled(ctx);
    ctx.os.resetState();
    ctx.note('> STATE CLEARED. THE TERMINAL IS BACK TO A FRESH GAME.', 'full');
    return 'redraw';
  },
  async '[HIDE]'(ctx) { return setHidden(ctx, true); },
  async '[SHOW]'(ctx) { return setHidden(ctx, false); },

  async '[ALIAS]'(ctx) {
    const it = await target(ctx, 'CHANGE THE ALIAS OF'); if (!it) return canceled(ctx);
    (await dialogs()).openItem(ctx, it, 'ALIAS');
    return 'stay';
  },

  async '[MV]'(ctx) {
    const it = await target(ctx, 'MOVE WHICH ITEM'); if (!it) return canceled(ctx);
    const dest = await askDestination(ctx, null, it, '.. = PARENT FOLDER'); if (!dest) return canceled(ctx);
    if ((dest.children || []).some((c) => c.id !== it.id && c.alias && it.alias && c.alias.toUpperCase() === it.alias.toUpperCase() && !it.hidden && !c.hidden && !isGlobalType(c))) {
      ctx.denied(); await ctx.say('> ' + dest.id + ' ALREADY HAS AN ITEM WITH THE ALIAS ' + it.alias, 'denied'); return canceled(ctx);
    }
    if (dest.tier !== it.tier) {
      const ok = await yn(ctx, '> ' + dest.id + ' IS L' + dest.tier + '; THIS MOVES ' + (1 + descendants(it).length) + ' ITEM(S) FROM L' + it.tier + '. CONTINUE? (Y/N)', false);
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
  if (it.type === 'gateway') { await ctx.say('> GATEWAYS ARE ALWAYS HIDDEN', 'warn'); return 'stay'; }
  if (it.type === 'program') {
    if ((it.hidden !== false) === hidden) { await ctx.say('> ALREADY ' + (hidden ? 'HIDDEN' : 'LISTED'), 'low'); return 'stay'; }
    it.hidden = hidden; ctx.os.commit();
    ctx.note('> ' + (it.alias || it.name) + (hidden ? ' IS NOW HIDDEN (RUNS BY ITS ALIAS ONLY)' : ' IS NOW LISTED IN ITS FOLDER'));
    return 'redraw';
  }
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
    if (q === '..') { const p = parentOf(ctx, ctx.os.items[ctx.cwd]); if (p) return p; await ctx.say('> THIS IS ALREADY A LEVEL ROOT', 'denied'); continue; }
    const hits = findFolder(ctx, q, moving);
    if (hits.length === 1) return hits[0];
    ctx.denied();
    await ctx.say(hits.length ? '> AMBIGUOUS, USE AN ID: ' + hits.map((h) => h.id).join(', ') : '> NO FOLDER MATCHES "' + q + '"', 'denied');
  }
}

// The properties [SET] can change for an item, in the order the right-click menu lists them.
function fieldKeys(it) {
  const k = ['NAME', 'ALIAS'];
  if (!isGlobalType(it)) k.push('TITLE');
  if ((!isGlobalType(it) && !it.stub) || it.type === 'program') k.push('HIDDEN');
  if (!it.stub) k.push('REQUIRES');
  if (!isGlobalType(it)) k.push('FOOTER');
  if (it.type === 'doc' || it.stub) k.push('TEXT');
  if (it.type === 'gateway') k.push('DESTINATION');
  if (it.type === 'program') k.push('PROGRAM', 'SCOPE');
  return k;
}

// What the right-click menu shows about an item. A row with a command can be clicked to change that property.
function infoRows(it, items) {
  const set = (k) => ({ cmd: '[SET ' + k + ']', preset: { target: it.id } });
  const lines = (it.body || []).filter((b) => b.type === 'text');
  const first = (lines.find((b) => b.text) || {}).text || '';
  const rows = [
    { k: 'ID', v: it.id },
    { k: 'TYPE', v: it.type + (it.stub ? ' (stub)' : '') + ', L' + it.tier },
    { k: 'NAME', v: it.name, ...set('NAME') },
    { k: 'ALIAS', v: it.alias || '(none)', cmd: '[ALIAS]', preset: { target: it.id } },
  ];
  if (!isGlobalType(it)) rows.push({ k: 'TITLE', v: it.title || it.name, ...set('TITLE') });
  if (it.type === 'gateway') rows.push({ k: 'HIDDEN', v: 'always (reached by its alias)' });
  else if (it.type === 'program') rows.push({ k: 'HIDDEN', v: it.hidden === false ? 'no (listed in its folder)' : 'yes (runs by its alias only)', cmd: it.hidden === false ? '[HIDE]' : '[SHOW]', preset: { target: it.id } });
  else if (!it.stub) rows.push({ k: 'HIDDEN', v: it.hidden ? 'yes (opens by alias only)' : 'no', cmd: it.hidden ? '[SHOW]' : '[HIDE]', preset: { target: it.id } });
  if (!it.stub) rows.push({ k: 'REQUIRES', v: (it.requires || []).length ? it.requires.join(', ') : '(none: always there)', ...set('REQUIRES') });
  if (!isGlobalType(it)) rows.push({ k: 'FOOTER', v: it.footer || '(none)', ...set('FOOTER') });
  if (it.type === 'folder') rows.push({ k: 'CONTAINS', v: (it.children || []).length + ' item(s)' });
  if (it.type === 'doc' || it.stub) rows.push({ k: 'TEXT', v: it.stub ? '(empty: write it to make a real doc)' : lines.length + ' line(s)' + (first ? ': ' + first : ''), ...set('TEXT') });
  if (it.type === 'gateway') rows.push({ k: 'DESTINATION', v: destLabel(items, it.goto), ...set('DESTINATION') });
  if (it.type === 'program') {
    rows.push({ k: 'PROGRAM', v: it.program, ...set('PROGRAM') });
    rows.push({ k: 'SCOPE', v: it.scope === 'folder' ? 'folder (only where it sits)' : 'level (any page of L' + it.tier + ')', ...set('SCOPE') });
  }
  return rows;
}

// ---- layers ---------------------------------------------------------------------------------------------------
// layers.<id> in echo-os.json: header_title, colors {primary, warn, denied, glitch (damaged characters in a log), background, dim_opacity, lo_opacity,
// border_opacity} and ambient {target_volume, oscillators[]}. The chat (l1c) shares the colors and sound of l1a.
const LAYER_IDS = ['l1c', 'l1a', 'l2a', 'l3a'];   // the chat, then the three archive layers
const COLOR_KEYS = { PRIMARY: 'primary', WARN: 'warn', DENIED: 'denied', GLITCH: 'glitch', BACKGROUND: 'background' };
const OPACITY_KEYS = { DIM: 'dim_opacity', LO: 'lo_opacity', BORDER: 'border_opacity' };
const layerKeys = () => ['TITLE', ...Object.keys(COLOR_KEYS), ...Object.keys(OPACITY_KEYS), 'INTRO', 'VOLUME', 'SOUND'];

// Ready-made ambient sounds, listed in the layer window to listen to and choose. Choosing one sets the tones and its default volume
// (the volume slider changes it afterward). Each tone: type (sine, sawtooth, square, triangle or noise), freq, volume, lfo_rate and
// lfo_depth (a slow wobble), filter_type (none, lowpass, highpass, bandpass) and filter_freq.
const tone = (label, type, freq, volume, lfo_rate = 0, lfo_depth = 0, filter_type = 'none', filter_freq = 0) => ({ label, type, freq, volume, lfo_rate, lfo_depth, filter_type, filter_freq });
const SOUNDS = [
  { name: 'VENTILATION', desc: 'air handlers and a faint engine drone (the layer 1 sound)', volume: 0.18, oscillators: [
    tone('Ventilation hum', 'sine', 110, 0.06), tone('Engine drone', 'sawtooth', 90, 0.045, 0.12, 0.015, 'lowpass', 180), tone('Noise bed', 'noise', 0, 0.04, 0, 0, 'lowpass', 500)] },
  { name: 'CHORD', desc: 'four slow sine tones drifting against each other (layer 2)', volume: 0.12, oscillators: [
    tone('Tone A', 'sine', 80, 0.025, 0.02, 0.012), tone('Tone B', 'sine', 121, 0.025, 0.035, 0.012), tone('Tone C', 'sine', 160, 0.025, 0.05, 0.012), tone('Tone D', 'sine', 203, 0.025, 0.06, 0.012)] },
  { name: 'SUB-BASS', desc: 'one very low tone you feel more than hear (layer 3)', volume: 0.05, oscillators: [tone('Sub-bass', 'sine', 38, 0.5)] },
  { name: 'REACTOR HUM', desc: 'a low buzz with a warm hum above it', volume: 0.14, oscillators: [
    tone('Reactor buzz', 'sawtooth', 55, 0.05, 0.08, 0.012, 'lowpass', 140), tone('Hum', 'sine', 110, 0.035), tone('Rumble', 'noise', 0, 0.03, 0, 0, 'lowpass', 220)] },
  { name: 'COLD AIR', desc: 'filtered wind through empty corridors', volume: 0.12, oscillators: [
    tone('Wind', 'noise', 0, 0.06, 0.07, 0.02, 'lowpass', 1100), tone('Thin tone', 'sine', 330, 0.008, 0.05, 0.005), tone('Hiss', 'noise', 0, 0.02, 0.11, 0.01, 'highpass', 2500)] },
  { name: 'SIGNAL', desc: 'two close tones beating slowly, with a whisper of static', volume: 0.1, oscillators: [
    tone('Carrier A', 'sine', 196, 0.03), tone('Carrier B', 'sine', 197.3, 0.03), tone('Static', 'noise', 0, 0.012, 0, 0, 'bandpass', 1800)] },
  { name: 'DEEP PULSE', desc: 'a slow heartbeat in the floor', volume: 0.07, oscillators: [
    tone('Pulse', 'sine', 42, 0.6, 0.4, 0.35), tone('Overtone', 'sine', 84, 0.08, 0.4, 0.05)] },
  { name: 'SILENT', desc: 'no ambient sound', volume: 0, oscillators: null },
];
const soundName = (amb) => {
  if (!amb) return 'BUILT-IN';
  if (!amb.target_volume) return 'SILENT';
  const hit = SOUNDS.find((s) => s.oscillators && JSON.stringify(s.oscillators) === JSON.stringify(amb.oscillators));
  return hit ? hit.name : 'CUSTOM (' + (amb.oscillators || []).length + ' tones)';
};
function setSound(ctx, id, s) {
  const a = layerOf(ctx.os.data, id).ambient = layerOf(ctx.os.data, id).ambient || {};
  if (s.oscillators) a.oscillators = JSON.parse(JSON.stringify(s.oscillators));
  a.target_volume = s.volume;
}
// Ready-made color sets for a layer: primary, warn, denied and the background glow. CYAN is the original blue and AMBER and RED are
// layers 2 and 3 as they were, so any layer can be set back. The numbered ones are the L1 archive candidates, in the order of the
// comparison sheet (2, 3, 4, 5 and 8 were the favorites).
const THEMES = [
  { name: 'CYAN', primary: '#4fc3f7', warn: '#E8732A', denied: '#ff003c', background: '#005799' },
  { name: 'STEEL', primary: '#7fb0cc', warn: '#E8732A', denied: '#ff003c', background: '#3a566b' },
  { name: 'CYAN ON STEEL', primary: '#4fc3f7', warn: '#E8732A', denied: '#ff003c', background: '#3d5566' },
  { name: 'PEWTER', primary: '#a9bcc9', warn: '#E8732A', denied: '#ff003c', background: '#4a5963' },
  { name: 'COBALT', primary: '#4a90ff', warn: '#E8732A', denied: '#ff003c', background: '#34495e' },
  { name: 'STEEL BLUE', primary: '#6ea8d8', warn: '#E8732A', denied: '#ff003c', background: '#2e4558' },
  { name: 'PERIWINKLE', primary: '#9aa8ff', warn: '#E8732A', denied: '#ff003c', background: '#3a3f73' },
  { name: 'SILVER', primary: '#c9d3da', warn: '#E8732A', denied: '#ff003c', background: '#4d5359' },
  { name: 'GREY JADE', primary: '#8fbfae', warn: '#E8732A', denied: '#ff003c', background: '#33524a' },
  { name: 'AMBER', primary: '#bf7c0a', warn: '#c8a020', denied: '#c84040', background: '#805900' },
  { name: 'RED', primary: '#e05050', warn: '#ff8800', denied: '#ff0000', glitch: '#6fe3ff', background: '#850000' },
];
const introId = (id) => 'L' + id[1] + 'A_INTRO';
const introLines = (ctx, id) => ((ctx.os.data.screens || {})[introId(id)] || { body: [] }).body.filter((b) => b.type === 'text' && b.text && b.cls !== 'blank' && !/^> ─+$/.test(b.text));
// The lines a player sees, without the blank line before, the rule after and the blank line after, which are added on save.
function introEditLines(ctx, id) {
  const cur = ((ctx.os.data.screens || {})[introId(id)] || { body: [] }).body.filter((b) => b.type === 'text').map((b) => Object.assign({}, b));
  if (cur.length && cur[0].cls === 'blank') cur.shift();
  if (cur.length && cur[cur.length - 1].cls === 'blank') cur.pop();
  if (cur.length && /^> ─+$/.test(cur[cur.length - 1].text)) cur.pop();
  return cur;
}
const RULE = () => ({ type: 'text', text: '> ' + '─'.repeat(33), cls: 'low' });
const introWrap = (ls) => [BLANK(), ...ls, RULE(), BLANK()];
function saveIntro(ctx, id, lines) {
  const screens = ctx.os.data.screens = ctx.os.data.screens || {};
  screens[introId(id)] = Object.assign(screens[introId(id)] || { layer: id, node_type: 'intro', is_root: false, title: '', breadcrumb: introId(id), footer: '' }, { body: introWrap(lines) });
}
const layerOf = (data, id) => { data.layers = data.layers || {}; return (data.layers[id] = data.layers[id] || {}); };

const parseHex = (v) => { const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v.trim()); if (!m) return null; let h = m[1].toLowerCase(); if (h.length === 3) h = h.replace(/./g, '$&$&'); return '#' + h; };

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

// The editing windows live in author-dialog.js, loaded the first time one is opened. H is what they borrow from here.
const H = { bracket, isGlobalType, aliasProblem, layerOf, introId, introLines: introEditLines, introWrap, saveIntro, parseHex, soundName, setSound, SOUNDS, THEMES };
let dialogsP = null;
function dialogs() { if (!dialogsP) dialogsP = import('./author-dialog.js?v=' + Date.now()).then((m) => m.default(H)); return dialogsP; }

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
