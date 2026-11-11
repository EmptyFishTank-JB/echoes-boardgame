// ECHOES O.S. author dialogs: the floating, movable windows that edit an item or a whole layer. author.js loads this on first use and
// hands over its helpers (H). The window frame, dragging and theming live in terminal.html (ctx.dialog); this file builds what is
// inside: text boxes, toggles, sliders, color pickers, selects, a line editor with styles and a typed preview, and a sound list
// you can listen to before choosing.
//
// Item dialog: edits are staged and written together by APPLY (aliases are checked first). Layer dialog: colors, strengths and
// sound apply as you change them, so you see and hear the result; the transition text has its own SAVE.

const CSS = `
.ed-sec{display:flex;flex-direction:column;gap:8px;}
.ed-sec>.st{color:var(--theme-lo);font-size:10.5px;letter-spacing:0.16em;border-bottom:1px solid var(--theme-border);padding-bottom:3px;}
.ed-row{display:grid;grid-template-columns:92px 1fr;gap:4px 10px;align-items:center;}
.ed-row.top{align-items:start;}
.ed-lbl{color:var(--theme-lo);font-size:11px;letter-spacing:0.1em;}
.ed-hint{grid-column:2;color:var(--theme-lo);font-size:10.5px;line-height:1.5;}
.ed-hint.bad{color:var(--theme-denied);}
.ed-in{background:transparent;border:1px solid var(--theme-bc);color:var(--theme-full);font:inherit;padding:5px 8px;width:100%;box-sizing:border-box;caret-color:var(--theme-full);min-width:0;}
.ed-in:focus{outline:none;border-color:var(--theme-full);box-shadow:0 0 10px var(--theme-glow-a);}
.ed-in.bad{border-color:var(--theme-denied);}
.ed-in[readonly]{color:var(--theme-lo);}
select.ed-in option{background:#02070c;color:var(--theme-full);}
.ed-btn{background:transparent;border:1px solid var(--theme-bc);color:var(--theme-full);font:inherit;font-size:11.5px;letter-spacing:0.1em;padding:5px 11px;text-transform:uppercase;cursor:var(--cur-act,pointer);white-space:nowrap;}
.ed-btn:hover,.ed-btn:focus-visible{background:var(--theme-full);color:#02070c;outline:none;}
.ed-btn.sm{padding:2px 7px;font-size:11px;}
.ed-btn.on{background:var(--theme-full);color:#02070c;}
.ed-btn[disabled]{opacity:0.35;pointer-events:none;}
.ed-seg{display:inline-flex;flex-wrap:wrap;}
.ed-seg .ed-btn{margin-left:-1px;}
.ed-seg .ed-btn:first-child{margin-left:0;}
.ed-rng{width:100%;accent-color:var(--theme-full);cursor:var(--cur-act,pointer);}
.ed-val{color:var(--theme-dim);font-size:11px;min-width:3.2em;text-align:right;}
.ed-line{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;}
.ed-col{display:grid;grid-template-columns:34px 1fr;gap:8px;align-items:center;}
.ed-sw{width:34px;height:26px;padding:0;border:1px solid var(--theme-bc);background:transparent;cursor:var(--cur-act,pointer);}
.ed-chips{display:flex;flex-wrap:wrap;gap:6px;}
.ed-chip{display:inline-flex;align-items:center;gap:6px;padding:3px 9px 3px 4px;border:1px solid var(--theme-bc);color:var(--theme-dim);font-size:11px;letter-spacing:0.06em;background:transparent;font-family:inherit;cursor:var(--cur-act,pointer);}
.ed-chip:hover,.ed-chip:focus-visible{border-color:var(--theme-full);color:var(--theme-full);outline:none;}
.ed-chip i{width:15px;height:15px;display:inline-block;border:1px solid rgba(255,255,255,0.22);}
.ed-chip i+i{margin-left:-8px;}
.ed-tabs{display:flex;flex-wrap:wrap;}
.ed-tabs .ed-btn{margin-left:-1px;}
.ed-tabs .ed-btn:first-child{margin-left:0;}
.ed-lines{display:flex;flex-direction:column;gap:4px;}
.ed-ln{display:grid;grid-template-columns:24px 78px minmax(0,1fr) auto auto auto;gap:4px;align-items:center;}
.ed-ln .n{color:var(--theme-lo);text-align:right;font-size:11px;}
.ed-ln .ed-in.s-dim{color:var(--theme-dim);} .ed-ln .ed-in.s-low{color:var(--theme-lo);} .ed-ln .ed-in.s-warn{color:var(--theme-warn);} .ed-ln .ed-in.s-denied{color:var(--theme-denied);}
.ed-pv{border:1px dashed var(--theme-border);padding:8px 10px;min-height:4.5em;overflow:auto;max-height:230px;background:rgba(0,0,0,0.4);line-height:1.6;font-size:12px;}
.ed-pv div{white-space:pre;min-height:1.6em;} .ed-pv .full{color:var(--theme-full);} .ed-pv .dim{color:var(--theme-dim);} .ed-pv .low{color:var(--theme-lo);}
.ed-pv .warn{color:var(--theme-warn);} .ed-pv .denied{color:var(--theme-denied);}
.ed-snd{display:flex;flex-direction:column;gap:2px;}
.ed-snd .it{display:grid;grid-template-columns:26px 1fr;gap:8px;align-items:center;padding:4px 6px;border:1px solid transparent;}
.ed-snd .it.sel{border-color:var(--theme-full);}
.ed-snd .it .nm{display:flex;flex-direction:column;gap:1px;cursor:var(--cur-act,pointer);}
.ed-snd .it .nm b{font-weight:normal;letter-spacing:0.1em;}
.ed-snd .it .nm span{color:var(--theme-lo);font-size:10.5px;}
.ed-snd .it.sel .nm b::before{content:'\\25CF  ';} .ed-snd .it:not(.sel) .nm b::before{content:'\\25CB  ';color:var(--theme-lo);}
.ed-flow{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
`;

const STYLES = ['full', 'dim', 'low', 'warn', 'denied', 'blank'];

function mk(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function btn(label, onClick, cls) { const b = mk('button', 'ed-btn' + (cls ? ' ' + cls : ''), label); b.type = 'button'; b.addEventListener('click', onClick); return b; }
function sec(title, ...kids) { const s = mk('div', 'ed-sec'); if (title) s.appendChild(mk('div', 'st', title)); kids.forEach((k) => k && s.appendChild(k)); return s; }
function row(label, control, hint, top) {
  const r = mk('div', 'ed-row' + (top ? ' top' : ''));
  r.appendChild(mk('div', 'ed-lbl', label)); r.appendChild(control);
  let h = null;
  if (hint !== undefined) { h = mk('div', 'ed-hint', hint); r.appendChild(h); }
  r.hint = (t, bad) => { if (!h) { h = mk('div', 'ed-hint'); r.appendChild(h); } h.textContent = t || ''; h.classList.toggle('bad', !!bad); h.style.display = t ? '' : 'none'; };
  return r;
}
function text(value, o = {}) {
  const i = mk('input', 'ed-in'); i.type = 'text'; i.value = value == null ? '' : value; i.spellcheck = false; i.autocomplete = 'off';
  if (o.placeholder) i.placeholder = o.placeholder; if (o.readOnly) i.readOnly = true;
  if (o.onInput) i.addEventListener('input', () => o.onInput(i.value));
  if (o.onEnter) i.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); o.onEnter(i.value); } });
  return i;
}
// A row of buttons of which one is chosen. options: [[value, label], ...]
function segmented(options, value, onChange) {
  const box = mk('div', 'ed-seg'); let cur = value;
  const paint = () => box.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === String(cur)));
  options.forEach(([v, l]) => { const b = btn(l, () => { cur = v; paint(); onChange(v); }); b.dataset.v = String(v); box.appendChild(b); });
  paint(); box.set = (v) => { cur = v; paint(); }; box.get = () => cur;
  return box;
}
function toggle(on, onLabel, offLabel, onChange) {
  const b = btn('', () => { b.set(!state); onChange(state); }); let state = !!on;
  b.set = (v) => { state = !!v; b.textContent = state ? onLabel : offLabel; b.classList.toggle('on', state); b.setAttribute('aria-pressed', String(state)); };
  b.get = () => state; b.set(on);
  return b;
}
function select(options, value, onChange) {
  const s = mk('select', 'ed-in');
  options.forEach(([v, l, g]) => { const o = mk('option', '', l); o.value = v; s.appendChild(o); });
  s.value = value; s.addEventListener('change', () => onChange(s.value));
  return s;
}
function slider(min, max, step, value, onInput, onChange) {
  const wrap = mk('div', 'ed-line'); const r = mk('input', 'ed-rng'); r.type = 'range'; Object.assign(r, { min, max, step }); r.value = value;
  const out = mk('div', 'ed-val', String(value));
  r.addEventListener('input', () => { out.textContent = r.value; onInput(parseFloat(r.value)); });
  if (onChange) r.addEventListener('change', () => onChange(parseFloat(r.value)));
  wrap.append(r, out); wrap.set = (v) => { r.value = v; out.textContent = String(v); }; wrap.input = r;
  return wrap;
}

export default function makeDialogs(H) {
  let cssDone = false;
  const prep = (dlg) => { dlg.style(CSS); cssDone = true; };

  // ---- typed preview: lines type into a pane the way a transition types on screen ----
  function previewPane(ctx) {
    const pane = mk('div', 'ed-pv'); let run = 0;
    const api = {
      el: pane,
      clear() { run++; pane.replaceChildren(); },
      async play(body) {
        const my = ++run; pane.replaceChildren(); const ms = Math.max(1, ctx.typeMs ? ctx.typeMs() : 38);
        for (const b of body) {
          if (my !== run) return;
          const line = mk('div', b.cls || 'full'); pane.appendChild(line);
          for (const ch of (b.text || '')) {
            if (my !== run) return;
            line.textContent += ch; if (ch !== ' ' && ch !== '─') ctx.sound.click(ch);
            pane.scrollTop = pane.scrollHeight; await new Promise((r) => setTimeout(r, ms));
          }
          await new Promise((r) => setTimeout(r, 100));
        }
      },
    };
    return api;
  }

  // ---- the line editor: one row per line, a style for each, move and delete, paste, and a typed preview ----
  function lineEditor(ctx, o) {
    const root = mk('div', 'ed-sec'); const list = mk('div', 'ed-lines'); const pv = previewPane(ctx);
    let lines = (o.lines || []).map((l) => ({ text: l.cls === 'blank' ? '' : l.text, cls: l.cls || 'full' }));
    const changed = () => { if (o.onChange) o.onChange(); };
    const render = () => {
      list.replaceChildren();
      lines.forEach((l, i) => {
        const r = mk('div', 'ed-ln'); r.appendChild(mk('div', 'n', String(i + 1)));
        const st = select(STYLES.map((s) => [s, s]), l.cls, (v) => { l.cls = v; if (v === 'blank') l.text = ''; render(); changed(); });
        const inp = text(l.text, { placeholder: l.cls === 'blank' ? '(blank line)' : 'text', readOnly: l.cls === 'blank', onInput: (v) => { l.text = v; changed(); } });
        inp.className += ' s-' + l.cls; inp.dataset.i = String(i);
        r.append(st, inp,
          btn('↑', () => { if (i > 0) { [lines[i - 1], lines[i]] = [lines[i], lines[i - 1]]; render(); changed(); } }, 'sm'),
          btn('↓', () => { if (i < lines.length - 1) { [lines[i + 1], lines[i]] = [lines[i], lines[i + 1]]; render(); changed(); } }, 'sm'),
          btn('×', () => { lines.splice(i, 1); render(); changed(); }, 'sm'));
        r.children[2].title = 'Move up'; r.children[3].title = 'Move down'; r.children[4].title = 'Delete the line';
        list.appendChild(r);
      });
      if (!lines.length) list.appendChild(mk('div', 'ed-hint', '(no lines yet: add one below)'));
    };
    const add = (cls, at) => { lines.splice(at == null ? lines.length : at, 0, { text: '', cls }); render(); changed(); const ins = list.querySelectorAll('.ed-ln input.ed-in'); const last = ins[(at == null ? lines.length - 1 : at)]; if (last && cls !== 'blank') last.focus(); };
    const paste = mk('textarea', 'ed-in'); paste.rows = 5; paste.style.display = 'none'; paste.placeholder = 'One line per row. Start a line with /dim /low /warn /denied for a style. A blank row is a blank line.';
    const pasteBar = mk('div', 'ed-flow'); pasteBar.style.display = 'none';
    pasteBar.append(btn('REPLACE THE LINES WITH THIS', () => {
      lines = paste.value.split('\n').map((raw) => { const m = /^\/(dim|low|warn|denied|full)\s?(.*)$/i.exec(raw); const t = m ? m[2] : raw, cls = m ? m[1].toLowerCase() : 'full'; return t === '' ? { text: '', cls: 'blank' } : { text: t, cls }; });
      paste.style.display = pasteBar.style.display = 'none'; render(); changed();
    }), btn('CANCEL', () => { paste.style.display = pasteBar.style.display = 'none'; }));
    const bar = mk('div', 'ed-flow');
    bar.append(btn('+ LINE', () => add('full')), btn('+ BLANK', () => add('blank')),
      btn('PASTE...', () => { paste.value = lines.map((l) => (l.cls === 'blank' ? '' : (l.cls === 'full' ? '' : '/' + l.cls + ' ') + l.text)).join('\n'); paste.style.display = pasteBar.style.display = ''; paste.focus(); }),
      btn('▶ PLAY', () => pv.play(o.wrap ? o.wrap(get()) : get())), btn('STOP', () => pv.clear()));
    const get = () => lines.map((l) => (l.cls === 'blank' || l.text === '' ? { type: 'text', text: '', cls: 'blank' } : { type: 'text', text: l.text, cls: l.cls }));
    root.append(list, bar, paste, pasteBar, pv.el);
    render();
    return { el: root, get, set(ls) { lines = ls.map((l) => ({ text: l.cls === 'blank' ? '' : l.text, cls: l.cls || 'full' })); render(); }, stop: () => pv.clear(), focus() { const i = list.querySelector('input.ed-in'); if (i) i.focus(); } };
  }

  // =====================================================================================================================
  // ITEM DIALOG
  // =====================================================================================================================
  function openItem(ctx, it, focusKey) {
    const global = H.isGlobalType(it);
    const key = 'item:' + it.id;
    const dlg = ctx.dialog({ key, title: 'EDIT ' + it.type.toUpperCase(), sub: it.id, theme: 'l' + it.tier + 'a' });
    dlg.raise();
    if (dlg.el.dataset.built === '1') { dlg.focusLater(() => dlg.el.__focus(focusKey)); return dlg; }   // already open: just go to the field
    dlg.el.dataset.built = '1'; prep(dlg);

    const srcText = () => (it.body || []).filter((b) => b.type === 'text').map((b) => ({ text: b.cls === 'blank' ? '' : b.text, cls: b.cls || 'full' }));
    const initial = () => ({ name: it.name, alias: it.alias || '', title: it.title || it.name, hidden: !!it.hidden, footer: it.footer || '',
      source: (it.log_ref && it.log_ref.source) || 'lore', code: (it.log_ref && it.log_ref.code) || '', goto: it.goto || '', program: it.program || '', scope: it.scope || 'tier' });
    let d = initial(), fields = {}, msg = mk('div', 'msg');
    const note = (t, cls) => { msg.textContent = t || ''; msg.className = 'msg' + (cls ? ' ' + cls : ''); };
    const isDirty = () => JSON.stringify(d) !== JSON.stringify(initial()) || (fields.lines && JSON.stringify(fields.lines.get()) !== JSON.stringify(srcText().map((l) => (l.cls === 'blank' ? { type: 'text', text: '', cls: 'blank' } : { type: 'text', text: l.text, cls: l.cls }))));
    const touch = () => note(isDirty() ? 'UNAPPLIED CHANGES' : '');

    // header facts
    const facts = mk('div', 'ed-hint');
    facts.textContent = it.type + (it.stub ? ' (stub placeholder)' : '') + '  ·  L' + it.tier + (it.type === 'folder' ? '  ·  ' + (it.children || []).length + ' item(s)' : '') + (global ? '  ·  always hidden, opens by its alias' : '');
    facts.style.gridColumn = 'auto';

    // name, alias, title, hidden, footer
    fields.name = text(d.name, { onInput: (v) => { d.name = v; touch(); } });
    fields.alias = text(d.alias, { placeholder: '[COMMAND]', onInput: (v) => { d.alias = v; checkAlias(); touch(); } });
    const aliasRow = row('ALIAS', fields.alias, '');
    const checkAlias = () => {
      const a = H.bracket(d.alias || ''); if (!d.alias) { aliasRow.hint('', false); fields.alias.classList.remove('bad'); return null; }
      const prob = H.aliasProblem(ctx, a, { parentId: it._parent, global: d.hidden || global, exceptId: it.id, program: it.type === 'program' });
      fields.alias.classList.toggle('bad', !!prob); aliasRow.hint(prob ? prob : 'typed as ' + a, !!prob); return prob;
    };
    const rows = [row('NAME', fields.name, global ? 'only the author sees it' : 'also the default alias and the address bar label'), aliasRow];
    if (!global) {
      fields.title = text(d.title, { onInput: (v) => { d.title = v; touch(); } });
      const tr = mk('div', 'ed-line'); tr.append(fields.title, btn('= NAME', () => { d.title = d.name; fields.title.value = d.name; touch(); }, 'sm'));
      rows.push(row('TITLE', tr, 'the heading at the top of the page and in the breadcrumb'));
      if (!it.stub) {
        fields.hidden = toggle(d.hidden, 'HIDDEN: OPENS BY ALIAS ONLY', 'LISTED IN ITS FOLDER', (v) => { d.hidden = v; checkAlias(); touch(); });
        rows.push(row('HIDDEN', fields.hidden));
      }
      fields.footer = text(d.footer, { placeholder: '(none)', onInput: (v) => { d.footer = v; touch(); } });
      rows.push(row('FOOTER', fields.footer, 'a line under the page'));
    }
    const body = [sec('', facts, ...rows)];

    // type specific
    if (it.type === 'doc' || it.stub) {
      fields.lines = lineEditor(ctx, { lines: srcText(), kind: 'page', onChange: touch });
      const info = mk('div', 'ed-hint', it.stub ? 'This is a stub placeholder. Writing text and applying turns it into a real doc.' : 'The text players read. A style is set per line.');
      body.push(sec('TEXT', info, fields.lines.el));
    }
    if (it.type === 'log') {
      const found = mk('div', 'ed-hint');
      const lookup = () => {
        const data = d.source === 'dev' ? ctx.devLogs : ctx.lore; const c = d.code, e = data && (data[c] || data[c.replace(/-/g, '')]);
        fields.code.classList.toggle('bad', !!c && !e);
        found.classList.toggle('bad', !!c && !e);
        found.textContent = !c ? 'enter the entry code' : e ? 'found: ' + (e.label || '(no label)') + '  ·  clearance ' + (e.clearance || '?') + (e.health ? '  ·  ' + e.health : '') : 'no entry ' + c + ' in ' + (d.source === 'dev' ? 'dev_logs' : 'lore') + '.json';
        return !!e;
      };
      fields.source = segmented([['lore', 'LORE'], ['dev', 'DEV']], d.source, (v) => { d.source = v; lookup(); touch(); });
      fields.code = text(d.code, { placeholder: 'XXXXX-XXXXX-XXXXX-XXXXX', onInput: (v) => {
        const raw = v.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 20); let out = ''; for (let i = 0; i < raw.length; i++) { if (i && i % 5 === 0) out += '-'; out += raw[i]; }
        fields.code.value = out; d.code = out; lookup(); touch(); } });
      body.push(sec('LOG ENTRY', row('SOURCE', fields.source, 'lore.json or dev_logs.json'), row('CODE', fields.code), found)); lookup();
      fields.lookup = lookup;
    }
    if (it.type === 'gateway') {
      const dests = Object.values(ctx.os.items).filter((o) => o.type === 'folder' && !o.stub).sort((a, b) => a.tier - b.tier || a.id.localeCompare(b.id));
      fields.goto = select(dests.map((o) => [o.id, 'L' + o.tier + '  ' + o.name + '  (' + o.id + ')']), d.goto, (v) => { d.goto = v; touch(); });
      body.push(sec('GATEWAY', row('GOES TO', fields.goto, 'the folder it opens. Another level plays that level\'s transition.')));
    }
    if (it.type === 'program') {
      fields.program = text(d.program, { placeholder: 'lore-entry', onInput: (v) => { d.program = v.trim().toLowerCase(); touch(); } });
      fields.scope = segmented([['tier', 'ANY PAGE OF THIS LEVEL'], ['folder', 'ONLY THIS FOLDER']], d.scope, (v) => { d.scope = v; touch(); });
      body.push(sec('PROGRAM', row('PROGRAM', fields.program, 'a file in terminal-data/programs (without .js)'), row('WHERE', fields.scope, 'the folder it sits in, or any page of L' + it.tier)));
    }
    // actions
    const act = mk('div', 'ed-flow');
    if (!it.stub && !global) act.appendChild(btn('OPEN', () => ctx.os.submit(it.alias || '[' + it.name + ']')));
    act.appendChild(btn('MOVE...', () => ctx.os.submit('[MV]', { target: it.id }))); act.appendChild(btn('DELETE...', () => ctx.os.submit('[RM]', { target: it.id })));
    body.push(sec('', act));
    dlg.body.append(...body);

    // apply / revert / close
    async function doApply() {
      const name = d.name.trim().toUpperCase(); if (!name) {   // names and titles are kept in capitals, as every prompt used to
         note('THE NAME CANNOT BE EMPTY', 'bad'); fields.name.focus(); return; }
      const alias = H.bracket(d.alias || name);
      const prob = H.aliasProblem(ctx, alias, { parentId: it._parent, global: d.hidden || global, exceptId: it.id, program: it.type === 'program' });
      if (prob) { note('ALIAS: ' + prob, 'bad'); fields.alias.focus(); return; }
      if (it.type === 'log') { if (!fields.lookup()) { note('THAT LOG ENTRY DOES NOT EXIST', 'bad'); fields.code.focus(); return; } }
      if (it.type === 'program') {
        if (!/^[a-z0-9-]+$/.test(d.program) || !(await ctx.os.loadProgram(d.program))) { note('NO PROGRAM FILE terminal-data/programs/' + (d.program || '?') + '.js (OR IT FAILS TO LOAD)', 'bad'); fields.program.focus(); return; }
      }
      it.name = name; it.alias = alias;
      if (!global) { it.title = d.title.trim().toUpperCase() || name; it.footer = d.footer; if (!it.stub) it.hidden = d.hidden; }
      if (fields.lines) {
        const ls = fields.lines.get(); it.body = ls;
        if (it.stub && ls.some((l) => l.text)) { it.stub = false; it.type = 'doc'; }
      }
      if (it.type === 'log') it.log_ref = { source: d.source, code: d.code };
      if (it.type === 'gateway') it.goto = d.goto;
      if (it.type === 'program') { it.program = d.program; it.scope = d.scope; }
      ctx.os.commit(); d = initial(); fields.name.value = d.name; fields.alias.value = d.alias; if (fields.title) fields.title.value = d.title;
      dlg.setSub(it.id + '  ·  ' + it.alias); note('APPLIED', 'ok'); checkAlias();
      await ctx.os.redraw();
    }
    const apply = btn('APPLY', doApply);
    dlg.foot.append(apply, btn('REVERT', () => { d = initial(); if (fields.name) fields.name.value = d.name; fields.alias.value = d.alias; if (fields.title) fields.title.value = d.title; if (fields.hidden) fields.hidden.set(d.hidden);
      if (fields.footer) fields.footer.value = d.footer; if (fields.lines) fields.lines.set(srcText()); checkAlias(); note('REVERTED'); }), btn('CLOSE', () => dlg.close()), msg);
    Object.values(fields).forEach((f) => { if (f && f.addEventListener) f.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); doApply(); } }); });
    dlg.el.__apply = doApply; dlg.el.__fields = fields; dlg.el.__data = () => d;
    checkAlias();
    function focusField(fk) {
      const map = { NAME: fields.name, ALIAS: fields.alias, TITLE: fields.title, HIDDEN: fields.hidden, FOOTER: fields.footer, TEXT: fields.lines && { focus: fields.lines.focus }, LOG: fields.code, DESTINATION: fields.goto, PROGRAM: fields.program, SCOPE: fields.scope };
      const f = map[(fk || '').toUpperCase()] || fields.name; try { (f.focus || (() => {})).call(f); if (f.scrollIntoView) f.scrollIntoView({ block: 'nearest' }); } catch (e) { /* nothing to focus */ }
    }
    dlg.el.__focus = focusField;
    dlg.focusLater(() => focusField(focusKey));
    return dlg;
  }

  // =====================================================================================================================
  // LAYER DIALOG
  // =====================================================================================================================
  function openLayer(ctx, startId, focusKey) {
    const dlg = ctx.dialog({ key: 'layer', title: 'LAYER SETTINGS', sub: '', theme: startId });
    if (dlg.el.dataset.built === '1') { dlg.raise(); if (startId && dlg.el.__show) dlg.el.__show(startId, focusKey); return dlg; }
    dlg.el.dataset.built = '1'; prep(dlg);
    const msg = mk('div', 'msg'); const note = (t, cls) => { msg.textContent = t || ''; msg.className = 'msg' + (cls ? ' ' + cls : ''); };
    const tabs = mk('div', 'ed-tabs'); const holder = mk('div', 'ed-sec'); dlg.body.append(tabs, holder);
    const snaps = {};                       // each layer as it was when first opened here, for REVERT
    let cur = null, intro = null, live = null;
    const names = { l1c: 'L1C  CHAT', l1a: 'L1A', l2a: 'L2A', l3a: 'L3A' };
    const L = () => H.layerOf(ctx.os.data, cur);
    const commit = () => { ctx.os.commit(); };
    const styles = () => { ctx.os.refreshStyles(); dlg.setTheme(cur); };

    function show(id, focus) {
      if (cur && intro) intro.stop();
      ctx.os.stopSound();
      cur = id; dlg.setTheme(id); dlg.setSub(names[id] || id.toUpperCase());
      if (!snaps[id]) snaps[id] = { layer: JSON.stringify(H.layerOf(ctx.os.data, id)), intro: JSON.stringify((ctx.os.data.screens || {})[H.introId(id)] || null) };
      tabs.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.id === id));
      holder.replaceChildren(); intro = null; live = {};
      const l = L(); l.colors = l.colors || {}; const c = l.colors; const hasText = id !== 'l1c';

      // title
      const tt = text(l.header_title || '', { onInput: (v) => { l.header_title = v; clearTimeout(tt._t); tt._t = setTimeout(commit, 250); } });
      live.title = tt;
      holder.appendChild(sec('HEADER', row('TITLE', tt, id === 'l1c' ? 'the header while you are in the chat' : 'the header while you are in this layer')));

      // theme presets and colors
      const chips = mk('div', 'ed-chips');
      H.THEMES.forEach((t) => {
        const b = mk('button', 'ed-chip'); b.type = 'button'; b.title = t.primary + ' on ' + t.background;
        const i1 = mk('i'); i1.style.background = t.primary; const i2 = mk('i'); i2.style.background = t.background; b.append(i1, i2, document.createTextNode(t.name));
        b.addEventListener('click', () => { ['primary', 'warn', 'denied', 'background'].forEach((k) => { c[k] = t[k]; live['c_' + k].set(t[k]); }); styles(); commit(); note('THEME: ' + t.name, 'ok'); });
        chips.appendChild(b);
      });
      const colorRow = (key, label) => {
        const wrap = mk('div', 'ed-col'); const sw = mk('input', 'ed-sw'); sw.type = 'color'; const hx = text(c[key] || '', { placeholder: '#RRGGBB' });
        const set = (v) => { const h = H.parseHex(v); if (h) { sw.value = h; hx.value = h; hx.classList.remove('bad'); return h; } return null; };
        sw.addEventListener('input', () => { const h = set(sw.value); if (h) { c[key] = h; styles(); } });
        sw.addEventListener('change', () => commit());
        hx.addEventListener('input', () => { const h = H.parseHex(hx.value); hx.classList.toggle('bad', !h); if (h) { sw.value = h; c[key] = h; styles(); } });
        hx.addEventListener('change', () => commit());
        live['hex_' + key] = hx; wrap.append(sw, hx); live['c_' + key] = { set: (v) => { sw.value = H.parseHex(v) || '#000000'; hx.value = v; hx.classList.remove('bad'); } };
        if (c[key]) live['c_' + key].set(c[key]); else sw.value = '#000000';
        return row(label, wrap);
      };
      holder.appendChild(sec('COLORS', row('THEMES', chips, 'one click sets all four colors'), colorRow('primary', 'PRIMARY'), colorRow('warn', 'WARN'), colorRow('denied', 'DENIED'), colorRow('background', 'BACKGROUND')));
      const strength = (key, label, dflt, hint) => { const sl = slider(0, 1, 0.01, c[key] != null ? c[key] : dflt, (v) => { c[key] = v; styles(); }, () => commit()); return row(label, sl, hint); };
      holder.appendChild(sec('STRENGTH', strength('dim_opacity', 'DIM', 0.7, 'secondary text'), strength('lo_opacity', 'LO', 0.4, 'faint text and rules'), strength('border_opacity', 'BORDER', 0.12, 'frames and lines')));

      if (hasText) {
        // transition text
        intro = lineEditor(ctx, { lines: H.introLines(ctx, id), wrap: H.introWrap, onChange: () => note('UNSAVED TRANSITION TEXT') });
        const saveIntro = btn('SAVE THE TRANSITION TEXT', () => { H.saveIntro(ctx, id, intro.get()); commit(); note('TRANSITION TEXT SAVED (' + intro.get().length + ' LINES)', 'ok'); });
        holder.appendChild(sec('TRANSITION TEXT', mk('div', 'ed-hint', 'Types while the terminal moves into this layer. The blank lines and the rule line around it are added for you.'), intro.el, saveIntro));
        live.intro = intro;

        // sound
        const amb = () => { l.ambient = l.ambient || { target_volume: 0.12, oscillators: [] }; return l.ambient; };
        const list = mk('div', 'ed-snd'); const vol = slider(0, 0.5, 0.01, l.ambient && l.ambient.target_volume != null ? l.ambient.target_volume : 0.12, (v) => { amb().target_volume = v; if (playing) ctx.os.previewSound(playing.oscillators ? { oscillators: playing.oscillators } : null, v); }, () => { commit(); ctx.os.audioChanged && ctx.os.audioChanged(id); });
        let playing = null;
        const paint = () => {
          list.replaceChildren(); const curName = H.soundName(l.ambient);
          H.SOUNDS.forEach((s) => {
            const it = mk('div', 'it' + (curName === s.name ? ' sel' : ''));
            const pb = btn(playing === s ? '■' : '▶', () => { if (playing === s) { playing = null; ctx.os.stopSound(); } else { playing = s; ctx.os.previewSound(s.oscillators ? { oscillators: s.oscillators } : null, s.name === 'SILENT' ? 0 : amb().target_volume || s.volume); } paint(); }, 'sm');
            pb.title = 'Listen to ' + s.name + ' (it stops by itself)'; pb.dataset.sound = s.name;
            const nm = mk('div', 'nm'); nm.append(mk('b', '', s.name), mk('span', '', s.desc)); nm.dataset.sound = s.name;
            nm.addEventListener('click', () => { H.setSound(ctx, id, s); vol.set(amb().target_volume); commit(); ctx.os.audioChanged && ctx.os.audioChanged(id); note(id.toUpperCase() + ' SOUND: ' + s.name, 'ok'); paint(); });
            it.append(pb, nm); list.appendChild(it);
          });
        };
        paint(); live.sounds = { paint, vol };
        holder.appendChild(sec('SOUND', mk('div', 'ed-hint', 'Press ▶ to listen (the layer\'s own sound ducks meanwhile). Click a name to choose it.'), list, row('VOLUME', vol)));
      } else {
        holder.appendChild(sec('SOUND AND TRANSITION TEXT', mk('div', 'ed-hint', 'The chat shares the sound of L1A, and its transition is L1A\'s. Edit those on the L1A tab.')));
      }
      note('');
      if (focus) { const f = { TITLE: live.title, INTRO: live.intro && { focus: live.intro.focus }, PRIMARY: live.hex_primary, WARN: live.hex_warn, DENIED: live.hex_denied, BACKGROUND: live.hex_background }[String(focus).toUpperCase()]; if (f && f.focus) dlg.focusLater(() => f.focus()); const sec2 = { INTRO: 'TRANSITION TEXT', SOUND: 'SOUND', PRIMARY: 'COLORS', WARN: 'COLORS', DENIED: 'COLORS', BACKGROUND: 'COLORS', DIM: 'STRENGTH', LO: 'STRENGTH', BORDER: 'STRENGTH', VOLUME: 'SOUND' }[String(focus).toUpperCase()]; if (sec2) { const t = [...holder.querySelectorAll('.st')].find((e) => e.textContent === sec2); if (t) t.scrollIntoView({ block: 'start' }); } }
    }
    Object.keys(names).forEach((id) => { const b = btn(names[id], () => show(id)); b.dataset.id = id; tabs.appendChild(b); });
    dlg.el.__show = show;
    const revert = btn('REVERT THIS LAYER', () => {
      const s = snaps[cur]; if (!s) return;
      ctx.os.stopSound(); ctx.os.data.layers[cur] = JSON.parse(s.layer);
      if (cur !== 'l1c') { const sc = ctx.os.data.screens = ctx.os.data.screens || {}; if (s.intro === 'null') delete sc[H.introId(cur)]; else sc[H.introId(cur)] = JSON.parse(s.intro); }
      commit(); ctx.os.refreshStyles(); ctx.os.audioChanged && ctx.os.audioChanged(cur); show(cur); note('REVERTED TO HOW IT WAS WHEN THIS WINDOW OPENED', 'ok');
    });
    dlg.foot.append(revert, btn('CLOSE', () => dlg.close()), msg);
    dlg.el.__layer = () => cur;
    show(startId, focusKey);
    return dlg;
  }

  return { openItem, openLayer };
}
