// INBOX.EXE: the mail of the account on Terminal 426, in its own window.
// Everything it shows comes from terminal-data/mail.json (see the notes in that file). Layout: tabs (INBOX, SENT, COMPOSE) and the
// account on top, the list on the left, the open message on the right.
//   - A message or a draft with "requires": ["flag", "!other"] only exists while those game flags are on (ctx.state).
//   - Opening a message for the first time marks it read (the flag read:<id>) and sets every flag in its "sets".
//   - A message can carry "attach": ["CODE"], a log from lore.json (or dev_logs.json at L3). RECOVER puts the code in the
//     recovered list of FETCH LOG.EXE and shows the log.
//   - COMPOSE lists the drafts that are available. Sending one sets the flag sent:<id> (and its "sets"), files it under SENT and
//     lets any message that requires sent:<id> arrive.
// Items in the tree that require one of these flags appear when the window closes (the terminal prints > RECEIVED: ...).

// Damaged characters (an ID or name that was corrupted) are corruption glyphs, drawn in the layer's corruption color.
const GLITCH_RE = /[▒░▓╳¤¦¿█]+/g;

const CSS = `
.mb-top{display:flex;align-items:center;gap:8px;flex-shrink:0;flex-wrap:wrap;}
.mb-tab{background:transparent;border:1px solid var(--theme-bc);border-bottom:none;color:var(--theme-dim);font:inherit;letter-spacing:0.14em;
  padding:7px 14px;text-transform:uppercase;cursor:var(--cur-act,pointer);}
.mb-tab:hover,.mb-tab:focus-visible{background:var(--theme-full);color:#02070c;outline:none;}
.mb-tab.on{color:var(--theme-full);border-color:var(--theme-full);background:rgba(255,255,255,0.03);}
.mb-tab .n{color:var(--theme-warn);margin-left:6px;}
.mb-acct{margin-left:auto;color:var(--theme-dim);letter-spacing:0.12em;font-size:12px;white-space:nowrap;}
.mb-acct b{font-weight:normal;color:var(--theme-full);}
.bad{color:var(--theme-glitch,var(--theme-denied));}
.mb-main{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,38%) minmax(0,1fr);border-top:1px solid var(--theme-full);margin-top:-1px;}
.mb-list{min-height:0;overflow:auto;border-right:1px dashed var(--theme-bc);padding:6px 0;scrollbar-width:thin;scrollbar-color:var(--theme-lo) transparent;}
.mb-row{display:grid;grid-template-columns:2ch minmax(0,1fr);gap:0 6px;width:100%;text-align:left;background:transparent;border:none;color:var(--theme-dim);
  font:inherit;padding:7px 10px;cursor:var(--cur-act,pointer);border-bottom:1px solid var(--theme-border);}
.mb-row .mk{color:var(--theme-warn);}
.mb-row .who{grid-column:2;color:var(--theme-full);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mb-row .sub{grid-column:2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mb-row .dt{grid-column:2;color:var(--theme-lo);font-size:11px;letter-spacing:0.1em;}
.mb-row:hover,.mb-row:focus-visible,.mb-row.on{background:var(--theme-full);color:#02070c;outline:none;}
.mb-row:hover .who,.mb-row:focus-visible .who,.mb-row.on .who,.mb-row:hover .dt,.mb-row.on .dt,.mb-row:hover .mk,.mb-row.on .mk,
.mb-row:hover .bad,.mb-row.on .bad{color:#02070c;}
.mb-read{min-height:0;overflow:auto;padding:12px 16px;scrollbar-width:thin;scrollbar-color:var(--theme-lo) transparent;}
.mb-hd{display:grid;grid-template-columns:9ch minmax(0,1fr);gap:2px 10px;margin-bottom:12px;padding-bottom:10px;border-bottom:1px dashed var(--theme-bc);}
.mb-hd span:nth-child(odd){color:var(--theme-lo);letter-spacing:0.14em;}
.mb-hd span:nth-child(even){color:var(--theme-full);overflow-wrap:anywhere;}
.mb-body{white-space:pre-wrap;line-height:1.7;color:var(--theme-full);}
.mb-none{color:var(--theme-lo);padding:14px 16px;}
.mb-att{margin-top:16px;border:1px solid var(--theme-bc);padding:10px 12px;}
.mb-att .h{color:var(--theme-lo);letter-spacing:0.14em;margin-bottom:6px;}
.mb-att .r{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
.mb-att .r span{color:var(--theme-dim);}
.mb-att pre{margin:10px 0 0;padding-top:10px;border-top:1px dashed var(--theme-bc);white-space:pre-wrap;font:inherit;line-height:1.7;color:var(--theme-full);}
.mb-act{margin-top:16px;display:flex;gap:10px;flex-wrap:wrap;}
.mb-foot{flex-shrink:0;display:flex;align-items:center;gap:14px;margin-top:10px;color:var(--theme-lo);font-size:12px;letter-spacing:0.1em;min-height:1.6em;}
.mb-foot .msg{color:var(--theme-full);}
.mb-foot .msg.warn{color:var(--theme-warn);}
@media(max-width:768px){
  .mb-main{grid-template-columns:1fr;grid-template-rows:minmax(0,38%) minmax(0,1fr);}
  .mb-list{border-right:none;border-bottom:1px dashed var(--theme-bc);}
  .mb-acct{margin-left:0;width:100%;white-space:normal;overflow-wrap:anywhere;}
  .mb-tab{padding:7px 10px;letter-spacing:0.08em;}
}
`;

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
// Text with corruption glyphs drawn in the corruption color.
const withGlitch = (node, text) => {
  let last = 0, m; GLITCH_RE.lastIndex = 0;
  while ((m = GLITCH_RE.exec(text))) { if (m.index > last) node.append(text.slice(last, m.index)); node.append(el('span', 'bad', m[0])); last = m.index + m[0].length; }
  if (last < text.length) node.append(text.slice(last));
  return node;
};

export default {
  id: 'inbox',
  title: 'INBOX',
  exe: 'INBOX.EXE',
  async run(ctx) {
    const snd = ctx.sound, st = ctx.state;
    let mail = null;
    try { const r = await fetch('terminal-data/mail.json?v=' + Date.now()); if (r.ok) mail = await r.json(); } catch (e) { mail = null; }
    if (!mail || !Array.isArray(mail.messages)) { ctx.denied(); await ctx.say('> MAIL SERVER OFFLINE', 'denied'); return 'stay'; }
    const acct = mail.account || {};
    const drafts = Array.isArray(mail.drafts) ? mail.drafts : [];

    const win = ctx.window({ width: 'min(96vw, 1000px)', height: 'min(90vh, 700px)' });
    win.style(CSS);

    // ---- what exists right now ----
    const met = (list) => !list || !list.length || list.every((f) => { f = String(f).trim(); return f[0] === '!' ? !st.has(f.slice(1)) : st.has(f); });
    const isRead = (m) => st.has('read:' + m.id);
    const inbox = () => mail.messages.filter((m) => m.box !== 'out' && met(m.requires)).sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const sentDrafts = () => drafts.filter((d) => st.has('sent:' + d.id)).map((d) => ({ id: d.id, box: 'out', from: acct.label || 'THIS TERMINAL', to: d.to, date: String(st.get('sent:' + d.id)) === 'true' ? '' : String(st.get('sent:' + d.id)), subject: d.subject, text: d.text }));
    const sent = () => mail.messages.filter((m) => m.box === 'out' && met(m.requires)).concat(sentDrafts()).sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const available = () => drafts.filter((d) => !st.has('sent:' + d.id) && met(d.requires));
    const unread = () => inbox().filter((m) => !isRead(m)).length;

    // ---- layout ----
    const top = el('div', 'mb-top'), tabs = {};
    const main = el('div', 'mb-main'), list = el('div', 'mb-list'), read = el('div', 'mb-read');
    main.append(list, read);
    const foot = el('div', 'mb-foot'), hint = el('span', '', 'ARROWS MOVE   ENTER OPENS   ESC CLOSES'), msg = el('span', 'msg');
    foot.append(hint, msg);
    const say = (t, cls) => { msg.className = 'msg' + (cls ? ' ' + cls : ''); msg.textContent = t || ''; };
    let tab = 'in', sel = null;
    ['in:INBOX', 'out:SENT', 'new:COMPOSE'].forEach((t) => {
      const [k, label] = t.split(':'); const b = el('button', 'mb-tab', label); b.type = 'button'; b.append(el('span', 'n'));
      b.addEventListener('click', () => { snd.enter(); go(k); }); tabs[k] = b; top.appendChild(b);
    });
    const acc = el('div', 'mb-acct');
    withGlitch(acc, 'ACCOUNT ' + (acct.id || '╳-███') + '   ' + (acct.status || 'UNVERIFIED') + (acct.label ? '   //   ' + acct.label : ''));
    top.appendChild(acc);
    win.body.append(top, main, foot);

    const refreshTabs = () => {
      const n = unread(); tabs.in.querySelector('.n').textContent = n ? '(' + n + ')' : '';
      tabs.new.querySelector('.n').textContent = available().length ? '(' + available().length + ')' : '';
      Object.entries(tabs).forEach(([k, b]) => b.classList.toggle('on', k === tab));
      win.setSub(n ? n + ' NEW' : '');
    };

    // ---- the open message ----
    const header = (rows) => { const h = el('div', 'mb-hd'); rows.forEach(([k, v]) => { h.append(el('span', '', k), withGlitch(el('span', ''), v || '')); }); return h; };
    const attachments = (m) => {
      const codes = (m.attach || []).filter(Boolean); if (!codes.length) return null;
      const box = el('div', 'mb-att'); box.appendChild(el('div', 'h', codes.length > 1 ? 'ATTACHMENTS' : 'ATTACHMENT'));
      codes.forEach((code) => {
        const e = (ctx.level === 3 && ctx.devLogs && (ctx.devLogs[code] || ctx.devLogs[code.replace(/-/g, '')])) || (ctx.lore && (ctx.lore[code] || ctx.lore[code.replace(/-/g, '')]));
        const r = el('div', 'r'), btn = el('button', 'pg-btn', 'RECOVER'); btn.type = 'button';
        const what = el('span', '', e ? (e.text || '').split('\n')[0] : code);
        const recovered = () => ctx.recovered().some((x) => x.code === code);
        let shown = null;
        const show = () => {
          if (shown) return; shown = el('pre', ''); withGlitch(shown, e.text || ''); box.appendChild(shown);
        };
        if (!e) { btn.disabled = true; btn.textContent = 'NOT FOUND'; }
        else if (e.clearance >= 3 && ctx.level < 3) { btn.disabled = true; btn.textContent = 'LOCKED (L3)'; }
        else {
          if (recovered()) { btn.textContent = 'RECOVERED'; btn.disabled = true; show(); }
          btn.addEventListener('click', () => { snd.enter(); if (!recovered()) ctx.discovered(code); btn.textContent = 'RECOVERED'; btn.disabled = true; show(); say('> LOG RECOVERED: ' + code); });
        }
        withGlitch(what, what.textContent); r.append(what, el('span', '', code), btn); box.appendChild(r);
      });
      return box;
    };
    const open = (m, boxKind) => {
      // Reading it marks it read and sets its flags first, so what depends on having read it (a reply to write) is already there.
      const firstTime = boxKind === 'in' && !isRead(m);
      if (firstTime) { st.set('read:' + m.id, true); (m.sets || []).forEach((f) => st.set(f, true)); }
      sel = m.id;
      read.replaceChildren(header([['FROM', m.from], ['TO', m.to], ['DATE', m.date], ['SUBJECT', m.subject]]));
      withGlitch(read.appendChild(el('div', 'mb-body')), m.text || '');
      const att = attachments(m); if (att) read.appendChild(att);
      if (boxKind === 'in') {
        const reply = drafts.find((d) => d.reply_to === m.id && !st.has('sent:' + d.id) && met(d.requires));
        if (reply) { const a = el('div', 'mb-act'), b = el('button', 'pg-btn', 'REPLY'); b.type = 'button'; b.addEventListener('click', () => { snd.enter(); go('new', reply.id); }); a.appendChild(b); read.appendChild(a); }
      }
      if (firstTime) { const before = list.scrollTop; render(); list.scrollTop = before; }
      markRows(); read.scrollTop = 0;
    };
    const openDraft = (d) => {
      sel = d.id; markRows();
      read.replaceChildren(header([['FROM', acct.label || 'THIS TERMINAL'], ['TO', d.to], ['SUBJECT', d.subject]]));
      withGlitch(read.appendChild(el('div', 'mb-body')), d.text || '');
      const a = el('div', 'mb-act'), b = el('button', 'pg-btn', 'SEND'); b.type = 'button';
      b.addEventListener('click', () => {
        snd.enter(); st.set('sent:' + d.id, ctx.stardate()); (d.sets || []).forEach((f) => st.set(f, true));
        sel = null; go('out');
        const n = unread(); say('> MESSAGE SENT' + (n ? '   ' + n + ' NEW IN THE INBOX' : ''));
      });
      a.appendChild(b); read.appendChild(a);
    };

    // ---- the list ----
    const markRows = () => list.querySelectorAll('.mb-row').forEach((r) => r.classList.toggle('on', r.dataset.id === sel));
    function render() {
      refreshTabs(); list.replaceChildren();
      const rows = tab === 'in' ? inbox() : tab === 'out' ? sent() : available();
      if (!rows.length) {
        list.appendChild(el('div', 'mb-none', tab === 'in' ? 'NO MESSAGES.' : tab === 'out' ? 'NOTHING SENT.' : 'NO DRAFTS. THIS ACCOUNT HAS NOTHING TO SEND.'));
        return;
      }
      rows.forEach((m) => {
        const r = el('button', 'mb-row'); r.type = 'button'; r.dataset.id = m.id;
        const isNew = tab === 'in' && !isRead(m);
        r.appendChild(el('span', 'mk', isNew ? '*' : ' '));
        r.appendChild(withGlitch(el('span', 'who'), tab === 'in' ? (m.from || '') : 'TO ' + (m.to || '')));
        r.appendChild(withGlitch(el('span', 'sub'), m.subject || ''));
        if (m.date) { r.appendChild(el('span', 'mk', ' ')); r.appendChild(el('span', 'dt', m.date)); }
        r.addEventListener('click', () => { snd.enter(); if (tab === 'new') openDraft(m); else open(m, tab); });
        list.appendChild(r);
      });
      markRows();
    }
    function go(k, draftId) {
      tab = k; sel = null; say(''); render();
      read.replaceChildren(el('div', 'mb-none', k === 'new' ? 'PICK A DRAFT TO READ IT, THEN SEND IT.' : 'PICK A MESSAGE TO READ IT.'));
      if (draftId) { const d = drafts.find((x) => x.id === draftId); if (d) openDraft(d); }
    }
    list.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const rows = Array.from(list.querySelectorAll('.mb-row')); const i = rows.indexOf(document.activeElement);
      if (i < 0) return; e.preventDefault(); snd.click(' '); (rows[i + (e.key === 'ArrowDown' ? 1 : -1)] || rows[i]).focus();
    });

    // ---- start ----
    go('in');
    const first = list.querySelector('.mb-row'); if (first) win.focus(first);
    await win.closed;
    return 'stay';
  },
};
