const { chromium, launchOptions, BASE } = require('./env.js');
const LORE1 = '6IYRR-MMDG9-MD13K-M1X0M', LORE2 = '6TD6R-E9HO6-N2MFR-W0G04', DEV = 'LAWTA-PAEGW-4Q2R2-91S09';
let fails = 0; const check = (n, ok, x) => { console.log((ok ? 'PASS ' : 'FAIL ') + n + (ok ? '' : '  ' + x)); if (!ok) fails++; };
(async () => {
  const browser = await chromium.launch(launchOptions);
  async function open(patch = {}, vp = { width: 1200, height: 860 }, ls = null) {
    const p = await browser.newPage({ viewport: vp });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    if (ls) await p.addInitScript(v => { try { localStorage.setItem('echo_disc', v); } catch (e) {} }, ls);
    await p.route('**/engine_config.json*', async r => { const x = await r.fetch(); const j = JSON.parse(await x.text()); j.typing = { base_ms: 1, slow_multiplier: 1, variance: 0 }; j.timing.fade_ms = 5; j.idle_delay_ms = 99999999; r.fulfill({ response: x, body: JSON.stringify(j) }); });
    for (const [pat, fn] of Object.entries(patch)) await p.route(pat, async r => { const x = await r.fetch(); const j = JSON.parse(await x.text()); fn(j); r.fulfill({ response: x, body: JSON.stringify(j) }); });
    await p.goto(BASE + '/terminal.html'); await p.waitForTimeout(800);
    const cond = () => p.evaluate(() => { const l = document.getElementById('t-output').lastElementChild; const t = l ? l.textContent.trim() : ''; return !window.typing && !window.isResponding && !window.progWin && getComputedStyle(document.getElementById('t-input-row')).display !== 'none' && t === '> AWAITING INPUT'; });
    const ready = async () => { let ok = 0; for (let i = 0; i < 120; i++) { if (await cond()) { if (++ok >= 3) return; } else ok = 0; await p.waitForTimeout(100); } };
    const send = async c => { await p.fill('#t-field', c); await p.press('#t-field', 'Enter'); await p.waitForTimeout(120); await ready(); };
    await p.click('#power-btn'); await ready();
    const s = { p, errs, send, ready,
      jump: async n => { await send('[SYSTEM OVERRIDE]'); await send('[JUMP L' + n + ']'); },
      openProg: async (alias = '[FETCH LOG ENTRY: //]') => { await p.fill('#t-field', alias); await p.press('#t-field', 'Enter'); await p.waitForSelector('#prog-layer.open .le-code', { timeout: 10000 }); await p.waitForTimeout(200); },
      code: async c => { await p.fill('.le-code', c); await p.press('.le-code', 'Enter'); await p.waitForTimeout(150); },
      view: () => p.$eval('.le-view', e => e.innerText), msg: () => p.$eval('.le-msg', e => e.textContent),
      rows: () => p.$$eval('.le-row', rs => rs.map(r => Array.from(r.querySelectorAll('span')).map(x => x.textContent))),
    };
    return s;
  }

  // ===== A. default data, desktop =====
  { const s = await open(); const { p } = s;
    await s.jump(2); await s.openProg();
    check('window sits inside the screen and is not full size', await p.evaluate(() => { const w = document.querySelector('.prog-win').getBoundingClientRect(); return w.width <= 880 && w.width < innerWidth && w.height < innerHeight; }));
    check('layout order: code field above the log pane above the two options', await p.evaluate(() => { const y = q => document.querySelector(q).getBoundingClientRect().top; return y('.le-code') < y('.le-view') && y('.le-view') < y('.le-actions'); }));
    check('the two options are FETCH NEW LOG and RECOVERED LOGS', (await p.$$eval('.le-actions button', b => b.map(x => x.textContent))).join('|') === 'FETCH NEW LOG|RECOVERED LOGS');
    check('the code field shows a full code without clipping', await (async () => { await p.fill('.le-code', LORE2); return p.$eval('.le-code', e => e.scrollWidth <= e.clientWidth + 1); })(), 'clipped');
    await s.code(LORE1.replace(/-/g, '')); await s.code(LORE2);
    await p.click('.le-actions >> text=RECOVERED LOGS'); await p.waitForTimeout(200);
    const rows = await s.rows();
    check('list has one row per entered code, oldest first', rows.length === 2 && rows[0][1] === LORE1 && rows[1][1] === LORE2, JSON.stringify(rows));
    check('row = [Log header] // code // health // type', rows[0][0] === '[Log A-014 | Stardate 2143.119.1719]' && rows[0][2] === 'INTACT' && rows[0][3] === "CAPTAIN'S LOG", JSON.stringify(rows[0]));
    const fit = await p.evaluate(() => Array.from(document.querySelectorAll('.le-head, .le-row')).map(r => ({ h: Math.round(r.getBoundingClientRect().height), over: r.scrollWidth > r.clientWidth + 1, cells: Array.from(r.children).map(c => c.scrollWidth > c.clientWidth + 1) })));
    check('list rows fit without wrapping or clipping (one line each)', fit.every(f => f.h < 34 && !f.over && f.cells.every(c => !c)), JSON.stringify(fit));
    await p.fill('.le-code', 'KEEP'); await p.hover('.le-row >> nth=1');
    check('hovering a row shows its code in the field', (await p.inputValue('.le-code')) === LORE2);
    await p.mouse.move(5, 5);
    check('leaving restores what was typed', (await p.inputValue('.le-code')) === 'KEEP', await p.inputValue('.le-code'));
    await p.click('.le-row >> nth=0'); await p.waitForTimeout(150);
    check('clicking a row reopens that log and fills the field', (await s.view()).includes('Day one of the new research phase') && (await p.inputValue('.le-code')) === LORE1);
    await p.click('.le-actions >> text=FETCH NEW LOG'); await p.waitForTimeout(100);
    check('FETCH NEW LOG clears the field and the log pane', (await p.inputValue('.le-code')) === '' && !(await s.view()).includes('research phase'));
    check('...and the cursor is back in the code field', await p.evaluate(() => document.activeElement && document.activeElement.classList.contains('le-code')));
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    await s.ready();
    // dev logs: the longest line must fit the window without wrapping or sideways scrolling
    await s.jump(3); await s.openProg(); await s.code(DEV);
    const dv = await p.evaluate(() => { const v = document.querySelector('.le-view'); return { over: v.scrollWidth > v.clientWidth + 1, wrap: getComputedStyle(v).whiteSpace, lines: v.children.length }; });
    check('L3 dev log (92 character lines) fits without wrapping or sideways scroll', !dv.over && dv.wrap === 'pre', JSON.stringify(dv));
    await p.click('.le-actions >> text=RECOVERED LOGS'); await p.waitForTimeout(150);
    const r3 = await s.rows();
    check('recovered list at L3 shows both the lore and dev logs entered so far, with creator log types', r3.length === 3 && r3.some(r => r[3] === "CREATOR'S LOG" && r[0] === '[Log D-001 | Stardate 2026.146.1217]'), JSON.stringify(r3));
    await p.click('.le-row >> nth=0'); await p.waitForTimeout(150);
    check('a recovered lore log can be reopened at L3 (you already hold it)', (await s.view()).includes('Day one of the new research phase'));
    check('page errors', s.errs.length === 0, JSON.stringify(s.errs));
    await p.close(); }

  // ===== B. empty list and a stale code =====
  { const s = await open({}, undefined, JSON.stringify({ 'AAAAA-AAAAA-AAAAA-AAAAA': { sd: 'x', ts: 5 } })); const { p } = s;
    await s.jump(2); await s.openProg(); await p.click('.le-actions >> text=RECOVERED LOGS'); await p.waitForTimeout(150);
    const rows = await s.rows();
    check('a stored code that no longer exists is listed as lost', rows.length === 1 && rows[0][0] === '[UNKNOWN ENTRY]' && rows[0][2] === 'LOST' && rows[0][3] === '--', JSON.stringify(rows));
    await p.click('.le-row'); await p.waitForTimeout(100);
    check('...and says so when selected', (await s.msg()).includes('NO LONGER IN THE ARCHIVE'));
    await p.close(); }
  { const s = await open(); const { p } = s;
    await s.jump(2); await s.openProg(); await p.click('.le-actions >> text=RECOVERED LOGS'); await p.waitForTimeout(150);
    check('empty list: says nothing is recovered yet', (await s.view()).includes('NO LOGS RECOVERED YET.') && (await p.$$('.le-row')).length === 0);
    await p.close(); }

  // ===== C. health and type from the data (patched files; a tier 1 test program) =====
  { const patchOS = j => { const l1 = j.tree.children[0]; l1.children.push({ id: 'T_PROG', type: 'program', program: 'lore-entry', scope: 'tier', name: 'TESTPROG', alias: '[TESTPROG]', tier: 1, hidden: true, title: '', footer: '', body: [], children: [], commands: [] }); };
    const patchLore = j => {
      j['CCCCC-CCCCC-CCCCC-CCCCC'] = { label: 'MEDICAL LOG M-03 | Stardate 2143.130.0800', type: 'classified', clearance: 2, l1_preview: 'PATIENT RECORD\nPARTIAL', text: '[Log M-03 | Stardate 2143.130.0800]\nMEDICAL LOG\n\nFull text here.' };
      j['DDDDD-DDDDD-DDDDD-DDDDD'] = { label: 'INTERCEPT I-02 | Stardate 2143.141.0001', type: 'full', clearance: 1, text: '[Log I-02 | Stardate 2143.141.0001]\nINTERCEPT\n\nSignal [CORRUPTED] begins.' };
      j['FFFFF-FFFFF-FFFFF-FFFFF'] = { label: 'RESEARCH LOG R-114 | Stardate 2143.133.0341', type: 'full', clearance: 2, health: 'PARTIAL', text: '[Log R-114 | Stardate 2143.133.0341]\nRESEARCH LOG\n\nA clean text with no markers.' };
      j['GGGGG-GGGGG-GGGGG-GGGGG'] = { label: 'SECURITY LOG S-087 | Stardate 2143.149.0712', type: 'full', clearance: 2, health: 'CORRUPTED', text: '[Log S-087 | Stardate 2143.149.0712]\nSECURITY LOG\n\nMostly gone.' };
      j['HHHHH-HHHHH-HHHHH-HHHHH'] = { label: 'ENGINEERING LOG E-143 | Stardate 2143.150.2352', type: 'partial', clearance: 2, text: '[Log E-143 | Stardate 2143.150.2352]\nENGINEERING LOG\n\nOlder data saved the condition as the type.' };
      j['EEEEE-EEEEE-EEEEE-EEEEE'] = { label: 'CAPTAIN\'S LOG A-30 | Stardate 2143.150.0100', type: 'full', clearance: 1, health: 'degraded', text: '[Log A-30 | Stardate 2143.150.0100]\nCAPTAIN\'S LOG\n\nShort.' };
    };
    const s = await open({ '**/echo-os.json*': patchOS, '**/lore.json*': patchLore }); const { p } = s;
    await s.openProg('[TESTPROG]');
    await s.code('CCCCC-CCCCC-CCCCC-CCCCC');
    check('classified entry at tier 1: restricted message and preview only', (await s.msg()).includes('ACCESS RESTRICTED') && (await s.view()).includes('PATIENT RECORD') && (await s.view()).includes('elevated access') && !(await s.view()).includes('Full text here'));
    await s.code('DDDDD-DDDDD-DDDDD-DDDDD'); await s.code('EEEEE-EEEEE-EEEEE-EEEEE');
    await s.code('FFFFF-FFFFF-FFFFF-FFFFF'); const msgF = await s.msg(); await s.code('GGGGG-GGGGG-GGGGG-GGGGG'); const msgG = await s.msg(); await s.code('HHHHH-HHHHH-HHHHH-HHHHH');
    await p.click('.le-actions >> text=RECOVERED LOGS'); await p.waitForTimeout(150);
    const rows = await s.rows(); const by = Object.fromEntries(rows.map(r => [r[1][0], r]));
    check('classified entry: health RESTRICTED, type MEDICAL LOG', by.C && by.C[2] === 'RESTRICTED' && by.C[3] === 'MEDICAL LOG', JSON.stringify(by.C));
    check('entry containing [CORRUPTED]: health PARTIAL, type INTERCEPT', by.D && by.D[2] === 'PARTIAL' && by.D[3] === 'INTERCEPT', JSON.stringify(by.D));
    check('an entry-level "health" field overrides the derived value', by.E && by.E[2] === 'DEGRADED', JSON.stringify(by.E));
    check('health PARTIAL set on a clean text shows PARTIAL', by.F && by.F[2] === 'PARTIAL' && by.F[3] === 'RESEARCH LOG', JSON.stringify(by.F));
    check('health CORRUPTED shows CORRUPTED', by.G && by.G[2] === 'CORRUPTED', JSON.stringify(by.G));
    check('data that saved the condition as the type (partial) still reads as that health', by.H && by.H[2] === 'PARTIAL', JSON.stringify(by.H));
    check('the status line names a condition that is not intact', msgF.includes('ENTRY RECOVERED: PARTIAL') && msgG.includes('ENTRY RECOVERED: CORRUPTED'), [msgF, msgG]);
    const colors = await p.evaluate(() => Array.from(document.querySelectorAll('.le-row')).map(r => [r.dataset.h, getComputedStyle(r.querySelectorAll('span')[2]).color]));
    const col = (h) => (colors.find(c => c[0] === h) || [])[1];
    check('non-intact rows are colored: partial and degraded differ from intact, corrupted differs from partial', col('PARTIAL') !== col('RESTRICTED') && col('CORRUPTED') !== col('PARTIAL'), colors);
    await p.close(); }

  // ===== E. level 3 also reads lore.json; clearance 3 opens only at level 3 =====
  { const patchLore = j => { j['3AAAA-AAAAA-AAAAA-AAAAA'] = { label: 'SYSTEM RECORD X-001 | Stardate 2143.150.0001', type: 'full', clearance: 3, text: '[Log X-001 | Stardate 2143.150.0001]\nSYSTEM RECORD\n\nThe cells were moved.\n[END OF LOG]' }; };
    const s = await open({ '**/lore.json*': patchLore }); const { p } = s;
    await s.jump(2); await s.openProg(); await s.code('3AAAA-AAAAA-AAAAA-AAAAA');
    check('at L2 a lore entry marked clearance 3 answers ACCESS RESTRICTED and does not show its text', (await s.view()).includes('ACCESS RESTRICTED') && (await s.view()).includes('level 3') && !(await s.view()).includes('The cells were moved'), await s.view());
    await p.click('.le-actions >> text=RECOVERED LOGS'); await p.waitForTimeout(120);
    check('...and a restricted code is not added to the recovered list', (await s.rows()).length === 0, JSON.stringify(await s.rows()));
    await s.code(LORE1);
    check('at L2 an ordinary lore entry still opens', (await s.view()).includes('Day one of the new research phase'));
    await p.keyboard.press('Escape'); await p.waitForTimeout(250); await s.ready();
    await s.jump(3); await s.openProg(); await s.code('3AAAA-AAAAA-AAAAA-AAAAA');
    const l3 = await s.view();
    check('at L3 the same entry opens, as a lore log (no decrypting lines)', l3.includes('The cells were moved') && !l3.includes('> DECRYPTING ENTRY...') && (await s.msg()).includes('ENTRY RECOVERED'), l3.slice(0, 90));
    await s.code(LORE1);
    check('at L3 an ordinary lore entry opens too', (await s.view()).includes('Day one of the new research phase'));
    await s.code(DEV);
    check('...and a dev log still opens with its decrypting lines', (await s.view()).includes('> DECRYPTING ENTRY...'));
    await p.click('.le-actions >> text=RECOVERED LOGS'); await p.waitForTimeout(150);
    const r = await s.rows();
    check('the list at L3 holds all three, the system record typed as a SYSTEM RECORD', r.length === 3 && r.some(x => x[3] === 'SYSTEM RECORD' && x[2] === 'INTACT'), JSON.stringify(r));
    check('page errors', s.errs.length === 0, JSON.stringify(s.errs));
    await p.close(); }

  // ===== F. a log with damaged ID information: corruption glyphs, drawn in each layer's own corruption color =====
  { const CLUE = '6PILH-UYMCX-YY3XY-WDR17', G = '[▒░▓╳¤¦¿]';
    const s = await open(); const { p } = s;
    const bad = () => p.$$eval('.le-view .bad', es => ({ n: es.length, color: es.length ? getComputedStyle(es[0]).color : '', text: es.map(e => e.textContent).join('') }));
    await s.jump(2); await s.openProg(); await s.code(CLUE);
    const t2 = await s.view();
    check('the clue log opens at L2 with its designation damaged (a glyph for the letter, 094 kept)', new RegExp('^\\[Log ' + G + '-094 \\| Stardate 2143\\.147\\.0312\\]').test(t2) && (await s.msg()) === '> ENTRY RECOVERED', t2.slice(0, 50));
    check('...and it carries the clue: the echo protocol pattern, with Chrono and Zero in the middle', /echo protocol/.test(t2) && /same word at the\s*\nfront/.test(t2) && /Chrono\. Zero\./.test(t2) && !/INITIATE CHRONO/i.test(t2), t2.slice(0, 80));
    const c2 = await bad();
    check('the damaged characters (the ID letter and the sign-off) are only symbols, never letters or digits', c2.n >= 2 && /^[▒░▓╳¤¦¿]+$/.test(c2.text), JSON.stringify(c2));
    check('...and are drawn in the L2 corruption color', c2.color === 'rgb(200, 64, 64)', c2.color);
    check('the sign-off keeps its readable letters', /—— Dr\. T\. L[▒░▓╳¤¦¿]+d[▒░▓╳¤¦¿]+/.test(t2), t2.split('\n').filter(l => /——/.test(l)).join('|'));
    await p.click('.le-actions >> text=RECOVERED LOGS'); await p.waitForTimeout(150);
    const rr = await p.$$eval('.le-row', rs => rs.map(r => Array.from(r.children).map(x => x.textContent)));
    check('the recovered list shows the damaged header, health INTACT and the type HABITAT LOG', rr.length === 1 && new RegExp('^\\[Log ' + G + '-094 ').test(rr[0][0]) && rr[0][2] === 'INTACT' && rr[0][3] === 'HABITAT LOG', JSON.stringify(rr));
    check('...with its glyphs drawn in the corruption color there too', await p.$$eval('.le-row .bad', es => es.length >= 1 && getComputedStyle(es[0]).color === 'rgb(200, 64, 64)'));
    await p.keyboard.press('Escape'); await p.waitForTimeout(250); await s.ready();
    await s.jump(3); await s.openProg(); await s.code(CLUE);
    const c3 = await bad();
    check('at L3 the same glyphs use the L3 corruption color, not the red of that layer', c3.n >= 2 && c3.color === 'rgb(111, 227, 255)' && c3.color !== await p.evaluate(() => getComputedStyle(document.body).getPropertyValue('--theme-denied')), c3.color);
    check('every layer has a corruption color of its own', await p.evaluate(() => ['l1c', 'l1a', 'l2a', 'l3a'].every(k => /^#[0-9a-f]{6}$/i.test((osData.layers[k].colors || {}).glitch || ''))));
    check('page errors', s.errs.length === 0, JSON.stringify(s.errs));
    await p.close(); }

  // ===== D. phone width =====
  { const s = await open({}, { width: 390, height: 800 }); const { p } = s;
    await s.jump(2); await s.openProg(); await s.code(LORE1); await p.click('.le-actions >> text=RECOVERED LOGS'); await p.waitForTimeout(150);
    const m = await p.evaluate(() => { const w = document.querySelector('.prog-win').getBoundingClientRect(); const r = document.querySelector('.le-row'); return { winW: w.width, vw: innerWidth, rowOver: r.scrollWidth > r.clientWidth + 1, cols: getComputedStyle(r).gridTemplateColumns.split(' ').length, head: getComputedStyle(document.querySelector('.le-head')).display }; });
    check('phone: window stays on screen and list rows stack instead of overflowing', m.winW <= m.vw && !m.rowOver && m.cols === 1 && m.head === 'none', JSON.stringify(m));
    await p.close(); }

  console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASSED');
  await browser.close();
})();
