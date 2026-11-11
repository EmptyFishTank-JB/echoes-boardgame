// FETCH LOG.EXE: lore code entry, in its own window.
// Layout: code field on top, the fetched log in the middle, then FETCH NEW LOG and RECOVERED LOGS.
// A typed code is looked up in lore.json, and at level 3 in dev_logs.json first. An entry with "clearance": 3 (a developer log,
// or a lore log such as one the creature writes through Terminal 426) only opens at level 3; at level 2 its code answers
// ACCESS RESTRICTED. Every other entry opens wherever the program runs. Where the program can run is set in echo-os.json
// (the program items' tier and scope), not here.
// RECOVERED LOGS lists every code entered so far (kept in the browser by the engine), oldest first, as
//   [Log header]  //  CODE  //  HEALTH  //  TYPE
// Health is the entry's condition: INTACT, PARTIAL, DEGRADED or CORRUPTED, from the entry's own "health" field in
// lore.json / dev_logs.json (the log editor writes it). With no field, text containing [CORRUPTED] reads PARTIAL, a
// classified entry viewed at level 1 reads RESTRICTED, and anything else is INTACT.
const CODE_RE = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;

// Sized in character cells so a full log line (the longest is 92 characters) and a full list row fit without wrapping.
const CSS = `
.le-top{display:flex;align-items:center;gap:12px;flex-shrink:0;}
.le-top label{color:var(--theme-dim);letter-spacing:0.16em;font-size:12px;white-space:nowrap;}
.le-code{width:calc(23ch + 3.4em + 26px);font-size:15px;letter-spacing:0.14em;}   /* 23 characters plus their letter spacing and the padding */
.le-msg{min-height:1.9em;margin-top:9px;color:var(--theme-dim);flex-shrink:0;}
.le-msg.denied{color:var(--theme-denied);}
.le-msg.warn{color:var(--theme-warn);}
.le-view{flex:1;min-height:0;overflow:auto;border-top:1px dashed var(--theme-bc);border-bottom:1px dashed var(--theme-bc);
  padding:12px 4px;margin:6px 0 12px;white-space:pre;line-height:1.7;scrollbar-width:thin;scrollbar-color:var(--theme-lo) transparent;}
.le-view .dim{color:var(--theme-dim);} .le-view .low{color:var(--theme-lo);}
.le-view .warn{color:var(--theme-warn);} .le-view .denied{color:var(--theme-denied);}
.le-actions{display:flex;align-items:center;gap:12px;flex-shrink:0;}
.le-actions .n{margin-left:auto;color:var(--theme-lo);font-size:12px;letter-spacing:0.12em;}
.le-head,.le-row{display:grid;grid-template-columns:36ch 27ch 15ch 1fr;white-space:nowrap;letter-spacing:0;}
.le-head{color:var(--theme-lo);margin-bottom:6px;}
.le-head span+span::before,.le-row span+span::before{content:'// ';color:var(--theme-lo);}
.le-row{width:100%;text-align:left;background:transparent;border:none;color:var(--theme-dim);font:inherit;padding:3px 6px;margin-left:-6px;
  cursor:var(--cur-act,pointer);}
.le-row:hover,.le-row:focus-visible{background:var(--theme-full);color:#02070c;outline:none;}
.le-row:hover span::before,.le-row:focus-visible span::before{color:#02070c;}
.le-row.gone{color:var(--theme-lo);}
.le-row[data-h="PARTIAL"] span:nth-child(3),.le-row[data-h="DEGRADED"] span:nth-child(3){color:var(--theme-warn);}
.le-row[data-h="CORRUPTED"] span:nth-child(3){color:var(--theme-denied);}
.le-row:hover[data-h] span:nth-child(3){color:#02070c;}
@media(max-width:768px){
  .le-view{white-space:pre-wrap;}
  .le-head{display:none;}
  .le-row{grid-template-columns:1fr;white-space:normal;padding:5px 6px;}
  .le-row span+span::before{content:'';}
}
`;

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

// The condition of one entry. Older data saved the condition as the entry type (partial, degraded, corrupted); it still reads.
function healthOf(ctx, entry) {
  const t = String(entry.type || '').toLowerCase();
  if (entry.health) return String(entry.health).toUpperCase();
  if (t === 'partial' || t === 'degraded' || t === 'corrupted') return t.toUpperCase();
  if (/\[CORRUPTED\]/.test(entry.text || '')) return 'PARTIAL';
  return entry.type === 'classified' && ctx.level === 1 ? 'RESTRICTED' : 'INTACT';
}

// Everything the list needs about one code, from whichever file holds it.
function describe(ctx, code) {
  const key = code.replace(/-/g, '');
  const hit = [['lore', ctx.lore], ['dev', ctx.devLogs]].find(([, d]) => d && (d[code] || d[key]));
  if (!hit) return null;
  const entry = hit[1][code] || hit[1][key];
  const lines = (entry.text || '').split('\n');
  const header = /^\[Log .*\]$/.test((lines[0] || '').trim()) ? lines[0].trim() : '[' + (entry.label || 'UNKNOWN ENTRY') + ']';
  let type = (/^(.*?)\s+[A-Z]-\d+\b/.exec(entry.label || '') || [])[1];
  if (!type && lines[1]) type = lines[1].split(/\s+(?:--|—)\s+/)[0];
  return { src: hit[0], entry, header, type: (type || 'LOG').toUpperCase(), health: healthOf(ctx, entry) };
}

export default {
  id: 'lore-entry',
  title: 'FETCH LOG',
  exe: 'FETCH LOG.EXE',
  async run(ctx) {
    const S = ctx.strings, snd = ctx.sound;
    const win = ctx.window({ width: 'min(96vw, 880px)', height: 'min(90vh, 680px)' });
    win.style(CSS);

    // ---- layout ----
    const input = el('input', 'pg-input le-code');
    Object.assign(input, { type: 'text', autocomplete: 'off', spellcheck: false, placeholder: 'XXXXX-XXXXX-XXXXX-XXXXX', maxLength: 23 });
    const goBtn = el('button', 'pg-btn', 'FETCH');
    const top = el('div', 'le-top'); top.append(el('label', '', 'ENTRY CODE'), input, goBtn);
    const msg = el('div', 'le-msg'), view = el('div', 'le-view');
    const newBtn = el('button', 'pg-btn', 'FETCH NEW LOG'), listBtn = el('button', 'pg-btn', 'RECOVERED LOGS'), count = el('span', 'n');
    const actions = el('div', 'le-actions'); actions.append(newBtn, listBtn, count);
    win.body.append(top, msg, view, actions);

    const say = (text, cls) => { msg.className = 'le-msg' + (cls ? ' ' + cls : ''); msg.textContent = text; };
    const setView = (lines) => { view.replaceChildren(...lines.map((l) => el('div', l.cls || '', l.text === '' ? ' ' : l.text))); view.scrollTop = 0; };
    const refreshCount = () => { count.textContent = ctx.recovered().length + ' RECOVERED'; };
    let pendingVirus = null;

    // ---- showing an entry ----
    // Entries are shown by where they came from: a developer log gets the decrypting lines, a lore log does not, at any level.
    const showEntry = (code, entry, isDev) => {
      input.value = code;
      if (!isDev && entry.type === 'classified' && ctx.level === 1) {
        say('> CLASSIFICATION: ACCESS RESTRICTED', 'warn');
        setView([...(entry.l1_preview || '[CONTENT REDACTED]').split('\n').map((t) => ({ text: t, cls: 'dim' })), { text: '' },
          { text: '> Full entry requires elevated access.', cls: 'low' }]);
        return;
      }
      const h = healthOf(ctx, entry);
      say(h === 'INTACT' ? '> ENTRY RECOVERED' : '> ENTRY RECOVERED: ' + h, h === 'CORRUPTED' ? 'denied' : h === 'INTACT' ? '' : 'warn');
      const head = isDev ? [{ text: '> DECRYPTING ENTRY...', cls: 'dim' }, { text: '> STATUS: PARTIAL RESTORATION', cls: 'dim' }, { text: '' }] : [];
      setView([...head, ...(entry.text || '').split('\n').map((t) => ({ text: t }))]);
    };

    // ---- typed code ----
    const fetchCode = (raw) => {
      const code = raw.trim();
      if (!CODE_RE.test(code)) { snd.denied(); say(S.error_fetch_format, 'denied'); input.focus(); return; }
      const sources = (ctx.level === 3 ? [['dev', ctx.devLogs], ['lore', ctx.lore]] : [['lore', ctx.lore]]).filter(([, d]) => d);
      if (!sources.length) { snd.denied(); say(S.error_nav_offline, 'denied'); return; }
      const key = code.replace(/-/g, '');
      const hit = sources.find(([, d]) => d[code] || d[key]);
      const entry = hit && (hit[1][code] || hit[1][key]), isDev = !!hit && hit[0] === 'dev';
      if (!entry) {
        snd.denied(); say('> ENTRY: ' + code, 'denied');
        setView([{ text: 'NO MATCHING ENTRY FOUND.', cls: 'denied' }, { text: 'Verify code and try again.', cls: 'low' }]);
        return;
      }
      if (entry.clearance >= 3 && ctx.level < 3) {
        snd.denied(); say('> ENTRY: ' + code, 'denied');
        setView([{ text: 'ACCESS RESTRICTED.', cls: 'denied' }, { text: 'This entry needs level 3 clearance.', cls: 'low' }]);
        return;
      }
      if (!isDev && entry.type === 'virus') { pendingVirus = entry; win.close(); return; }
      ctx.discovered(code);
      showEntry(code, entry, isDev);
      refreshCount();
    };
    input.addEventListener('input', () => {
      const raw = input.value.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 20);
      let out = ''; for (let i = 0; i < raw.length; i++) { if (i === 5 || i === 10 || i === 15) out += '-'; out += raw[i]; }
      input.value = out;
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); snd.enter(); fetchCode(input.value); }
      else if (e.key === 'Backspace') snd.backspace();
      else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) snd.click(e.key);
    });
    goBtn.addEventListener('click', () => { snd.enter(); fetchCode(input.value); });

    // ---- the two options ----
    newBtn.addEventListener('click', () => {
      input.value = ''; say('> ENTER ENTRY CODE:');
      setView([{ text: 'Enter a 20 character code, then press Enter.', cls: 'low' }, { text: 'RECOVERED LOGS lists every code you have entered.', cls: 'low' }]);
      input.focus();
    });
    const showList = () => {
      const recs = ctx.recovered();
      refreshCount();
      if (!recs.length) {
        say('> RECOVERED LOGS: NONE YET');
        setView([{ text: 'NO LOGS RECOVERED YET.', cls: 'low' }, { text: 'Enter a code above to recover one.', cls: 'low' }]);
        return;
      }
      say('> RECOVERED LOGS: ' + recs.length + '. SELECT ONE TO REOPEN IT.');
      const head = el('div', 'le-head'); ['LOG', 'CODE', 'HEALTH', 'TYPE'].forEach((t) => head.appendChild(el('span', '', t)));
      const rows = recs.map((r) => {
        const info = describe(ctx, r.code);
        const row = el('button', 'le-row' + (info ? '' : ' gone'));
        if (info) row.dataset.h = info.health;
        [info ? info.header : '[UNKNOWN ENTRY]', r.code, info ? info.health : 'LOST', info ? info.type : '--'].forEach((t) => row.appendChild(el('span', '', t)));
        let stash = null;   // hovering a row shows its code in the field, like hovering a command in the terminal
        row.addEventListener('mouseenter', () => { stash = input.value; input.value = r.code; });
        row.addEventListener('mouseleave', () => { if (stash !== null) input.value = stash; stash = null; });
        row.addEventListener('click', () => {
          stash = null; snd.enter();
          if (!info) { snd.denied(); say('> THAT ENTRY IS NO LONGER IN THE ARCHIVE', 'denied'); return; }
          showEntry(r.code, info.entry, info.src === 'dev');
        });
        return row;
      });
      view.replaceChildren(head, ...rows); view.scrollTop = 0;
    };
    listBtn.addEventListener('click', () => { snd.enter(); showList(); });

    // ---- start ----
    newBtn.click();
    win.focus(input);
    await win.closed;
    if (pendingVirus) { await ctx.virus(pendingVirus); return 'reset'; }
    return 'stay';
  },
};
