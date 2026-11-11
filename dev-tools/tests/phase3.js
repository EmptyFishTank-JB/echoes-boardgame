const { chromium, launchOptions, BASE } = require('./env.js');
const URL = BASE + '/terminal.html';
let fails = 0;
const check = (name, ok, extra) => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); };
const LORE = '6IYRR-MMDG9-MD13K-M1X0M', DEV = 'LLMTA-DWP3N-4WPJY-CDD0O';

async function session(browser, patch = {}) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route('**/engine_config.json*', async r => { const x = await r.fetch(); const j = JSON.parse(await x.text()); j.typing = { base_ms: 1, slow_multiplier: 1, variance: 0 }; j.timing.fade_ms = 5; j.idle_delay_ms = 99999999; r.fulfill({ response: x, body: JSON.stringify(j) }); });
  for (const [pat, fn] of Object.entries(patch)) await page.route(pat, async r => { if (fn === 'abort') return r.abort(); const x = await r.fetch(); const j = JSON.parse(await x.text()); fn(j); r.fulfill({ response: x, body: JSON.stringify(j) }); });
  await page.goto(URL); await page.waitForTimeout(800);
  const cond = () => page.evaluate(() => { const o = document.getElementById('t-output'); const l = o.lastElementChild; const t = l ? l.textContent.trim() : ''; return !window.typing && !window.isResponding && getComputedStyle(document.getElementById('t-input-row')).display !== 'none' && (t === '> AWAITING INPUT' || t.startsWith('Enter option exactly')); });
  const ready = async () => { let ok = 0; for (let i = 0; i < 100; i++) { if (await cond()) { if (++ok >= 3) return; } else ok = 0; await page.waitForTimeout(100); } throw new Error('not ready'); };
  const s = {
    page, errs, ready,
    out: async () => (await page.$eval('#t-output', e => e.innerText)).split('\n').map(l => l.trim().replace(/^(?:\((?:o|-)\)\s+)?(?:(?:DIR|DOC|LOG|EXE|GATE|UP)\s+(?:\S.*?\s{2,})?)?[\\≡▪►»↰]\s+(?=\[)/, '')).filter(Boolean),
    send: async c => { await page.fill('#t-field', c); await page.press('#t-field', 'Enter'); await page.waitForTimeout(100); await ready(); },
    st: async () => ({ state: await page.evaluate(() => termState), level: await page.evaluate(() => currentLevel), crumb: await page.$eval('#t-breadcrumb', e => e.textContent), cls: await page.evaluate(() => document.body.className) }),
    prog: async () => { await page.fill('#t-field', '[FETCH LOG ENTRY: //]'); await page.press('#t-field', 'Enter'); await page.waitForSelector('#prog-layer.open .le-code', { timeout: 10000 }).catch(() => {}); await page.waitForTimeout(150); },
    code: async (c) => { await page.fill('.le-code', c); await page.press('.le-code', 'Enter'); await page.waitForTimeout(150); },
    view: () => page.$eval('.le-view', e => e.innerText),
    msg: () => page.$eval('.le-msg', e => e.textContent),
    winOpen: () => page.evaluate(() => !!document.querySelector('#prog-layer.open')),
    settle: async () => { await page.waitForFunction(() => { const l = document.getElementById('t-output').lastElementChild; const t = l ? l.textContent.trim() : ''; return uiLock === 0 && !isResponding && ((progWait && termState === 'PROGRAM') || !!progWin || (termState !== 'PROGRAM' && t === '> AWAITING INPUT')); }, null, { timeout: 15000 }); await page.waitForTimeout(200); },
    jump: async n => { await s.send('[SYSTEM OVERRIDE]'); await s.send('[JUMP L' + n + ']'); },
  };
  await page.click('#power-btn'); await ready();
  return s;
}

(async () => {
  const browser = await chromium.launch(launchOptions);

  // ---- A. input lock ----
  { const s = await session(browser); const p = s.page;
    await p.fill('#t-field', '[ECHOES.ARCHIVE]'); await p.press('#t-field', 'Enter');
    await p.fill('#t-field', '[TREE]'); await p.press('#t-field', 'Enter');      // submitted while the page is still printing
    await p.waitForTimeout(60);
    check('Enter while rendering is ignored (nothing submitted yet)', (await p.inputValue('#t-field')) === '[TREE]' && (await s.out()).every(l => l !== '> [TREE]'), JSON.stringify(await p.inputValue('#t-field')));
    await s.ready(); let o = await s.out();
    check('no interleaving: page printed whole, second command never ran', !o.includes('ECHOES O.S. FILE TREE') && o.indexOf('[CREW MANIFEST]') > 0 && o.indexOf('[SYSTEM LOGS]') > o.indexOf('[CREW MANIFEST]') && o.filter(l => l === '[TREE]' || l === '> [TREE]').length === 0);
    await s.send('[TREE]'); o = await s.out();
    check('the same command submits fine once rendering is done', o.includes('ECHOES O.S. FILE TREE'));
    // Escape/ArrowLeft are locked too: fire back-navigation mid-render
    await s.send('[INCIDENT REPORTS]'); await p.fill('#t-field', '[CONTAINMENT BREACH — DAY 31]'); await p.press('#t-field', 'Enter');
    await p.press('#t-field', 'Escape'); await s.ready();
    check('Escape during render does nothing', (await s.st()).state === 'L1A_BREACH', JSON.stringify(await s.st()));
    console.log('   page errors:', s.errs); }

  // ---- B. gateway (now leads to the L2 root) ----
  { const s = await session(browser);
    await s.send('[ECHOES.ARCHIVE]'); await s.send('[INCIDENT REPORTS]'); await s.send('[CONTAINMENT BREACH — DAY 31]');
    let o = await s.out();
    check('breach page does not list [INITIATE ECHO PROTOCOL]', !o.includes('[INITIATE ECHO PROTOCOL]'));
    await s.send('[INITIATE ECHO PROTOCOL]'); let st = await s.st(); o = await s.out();
    check('typed from the breach page: lands on the L2 root', st.state === 'L2A_ROOT' && st.level === 2, JSON.stringify(st));
    check('...with the full transition (amber theme, L2 header)', st.cls.includes('layer-2a'), st.cls);
    await s.send('[EXIT]'); st = await s.st(); check('[EXIT] from L2 steps down to L1', st.state === 'L1A_ROOT' && st.level === 1, JSON.stringify(st));
    await s.send('[EXIT]'); st = await s.st(); o = await s.out();
    check('[EXIT] again returns to the chat layer with the chat restored', st.state === 'L1_NORMAL' && o.some(l => l.includes('TERMINAL ACTIVATED')), JSON.stringify(st));
    await s.send('[INITIATE ECHO PROTOCOL]'); st = await s.st();
    check('also works straight from the chat layer', st.state === 'L2A_ROOT', JSON.stringify(st));
    await s.send('[EXIT]'); await s.send('[EXIT]'); st = await s.st(); o = await s.out();
    check('...and exiting from there still restores the chat', st.state === 'L1_NORMAL' && o.some(l => l.includes('TERMINAL ACTIVATED')), JSON.stringify(st));
    await s.send('[TREE]'); o = (await s.out()); o = o.slice(o.lastIndexOf('ECHOES O.S. FILE TREE')); check('player [TREE] never shows the gateway', o.length > 3 && !o.some(l => /INITIATE|GW_|gateway:/i.test(l)));
    await s.send('[SYSTEM OVERRIDE]'); await s.send('[TREE]'); o = await s.out();
    check('author [TREE] shows it, marked hidden with its destination', o.some(l => l.includes('[INITIATE ECHO PROTOCOL]') && l.includes('~hidden') && l.includes('gateway: L2 ROOT (L2A_ROOT)')));
    await s.send('[STATUS]'); o = await s.out(); check('validator: gateway target resolves (no dangling)', o.some(l => /DANGLING TARGETS: 0/.test(l)));
    console.log('   page errors:', s.errs); }

  // ---- C. lore-entry program ----
  { const s = await session(browser);
    await s.send('[FETCH LOG ENTRY: //]'); let o = await s.out();
    check('from the chat layer: unavailable', o.some(l => l.includes('FETCH UNAVAILABLE FROM THIS NODE')) && (await s.st()).state === 'L1_NORMAL');
    await s.jump(1); await s.send('[FETCH LOG ENTRY: //]'); o = await s.out();
    check('from the L1 archive: unavailable', o.some(l => l.includes('FETCH UNAVAILABLE FROM THIS NODE')) && (await s.st()).state === 'L1A_ROOT');

    await s.jump(2); await s.prog();
    check('L2 archive root: opens the FETCH LOG window asking for a code', (await s.st()).state === 'PROGRAM' && await s.winOpen() && (await s.msg()).includes('ENTER ENTRY CODE'), await s.msg());
    await s.page.fill('.le-code', 'abcde1'); check('code mask hyphenates and uppercases', (await s.page.inputValue('.le-code')) === 'ABCDE-1', await s.page.inputValue('.le-code'));
    await s.code('ABC');
    check('bad format: error, and the window stays open', (await s.msg()).includes('INVALID FORMAT') && await s.winOpen());
    await s.code(LORE.replace(/-/g, ''));
    let v = await s.view(); let st = await s.st();
    check('valid lore code at L2: entry shown in the window', v.includes('[Log A-014 | Stardate 2143.119.1719]') && v.includes('We have everything we need.') && (await s.msg()).includes('ENTRY RECOVERED'), v.slice(0, 80));
    check('...not the dev-log variant, and no "decrypting" header', !v.includes('DECRYPTING'));
    check('discovery recorded', await s.page.evaluate(c => !!JSON.parse(localStorage.getItem('echo_disc') || '{}')[c], LORE));
    await s.page.keyboard.press('Escape'); await s.settle(); st = await s.st(); o = await s.out();
    check('Esc closes the window, returns to the page the player was on, and says so', st.state === 'L2A_ROOT' && !(await s.winOpen()) && o.some(l => l.includes('FETCH LOG.EXE CLOSED')), JSON.stringify(st));
    await s.prog(); await s.code('ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ');
    v = await s.view(); check('unknown code: not-found message in the window', v.includes('NO MATCHING ENTRY FOUND.') && (await s.msg()).includes('ENTRY: ZZZZZ'));
    await s.page.click('#prog-layer .prog-bar .x'); await s.settle(); check('...and [X] closes it back to the L2 root', (await s.st()).state === 'L2A_ROOT' && !(await s.winOpen()));
    await s.prog(); await s.page.keyboard.press('Escape'); await s.settle();
    check('Esc closes an untouched window too', (await s.st()).state === 'L2A_ROOT' && !(await s.winOpen()));

    await s.jump(3); await s.prog(); await s.code(DEV);
    v = await s.view(); check('L3 archive: dev logs, with the decrypting header', v.includes('> DECRYPTING ENTRY...') && v.includes('CREATOR'), v.slice(0, 100));
    await s.page.keyboard.press('Escape'); await s.settle();
    await s.prog(); await s.code(LORE);
    v = await s.view(); check('L3 reads lore.json as well: a lore code opens, without the dev log decrypting lines', v.includes('Day one of the new research phase') && !v.includes('> DECRYPTING ENTRY...'), v.slice(0, 100));
    await s.page.keyboard.press('Escape'); await s.settle();
    console.log('   page errors:', s.errs); }

  // ---- D. scope: 'folder' means only the folder the item sits in ----
  { const patchOS = j => { const l2 = j.tree.children[1]; l2.children.find(c => c.type === 'program').scope = 'folder';
      l2.children.push({ id: 'L2A_SUB', type: 'folder', name: 'SUB', alias: '[SUB]', tier: 2, hidden: false, title: 'SUB FOLDER', footer: '', body: [], children: [], commands: [] }); };
    const s = await session(browser, { '**/echo-os.json*': patchOS });
    await s.jump(2); await s.prog(); check("scope 'folder': works on the folder it sits in", (await s.st()).state === 'PROGRAM' && await s.winOpen());
    await s.page.keyboard.press('Escape'); await s.settle();
    await s.send('[SUB]'); await s.send('[FETCH LOG ENTRY: //]'); const o = await s.out();
    check("scope 'folder': refused in a different folder of the same tier", o.some(l => l.includes('FETCH UNAVAILABLE FROM THIS NODE')) && (await s.st()).state === 'L2A_SUB');
    await s.page.close(); }

  // ---- E. virus entry resets the terminal; missing program file fails cleanly ----
  { const s = await session(browser, { '**/lore.json*': j => { j['VVVVV-VVVVV-VVVVV-VVVVV'] = { label: 'x', type: 'virus', clearance: 1, text: 'LINE ONE\nLINE TWO\nLINE THREE\nLINE FOUR' }; } });
    await s.jump(2); await s.prog(); await s.code('VVVVV-VVVVV-VVVVV-VVVVV');
    await s.page.waitForFunction(() => !document.getElementById('power-overlay').classList.contains('hidden'), null, { timeout: 15000 }).catch(() => {});
    const shown = await s.page.evaluate(() => !document.getElementById('power-overlay').classList.contains('hidden'));
    const st = await s.page.evaluate(() => ({ state: termState, locked: uiLock, resp: isResponding }));
    check('virus entry runs the sequence and returns to the power-on screen', shown && st.state === 'L1_NORMAL', JSON.stringify(st));
    check('...and the render lock is released afterwards', st.locked === 0 && st.resp === false, JSON.stringify(st));
    console.log('   page errors:', s.errs); }
  { const s = await session(browser, { '**/programs/lore-entry.js*': 'abort' });
    await s.jump(2); await s.send('[FETCH LOG ENTRY: //]'); const o = await s.out();
    check('program file missing: clean "PROGRAM UNAVAILABLE", terminal still usable', o.some(l => l.includes('PROGRAM UNAVAILABLE')) && (await s.st()).state === 'L2A_ROOT');
    await s.send('[LS]'); check('...and still responds afterwards', (await s.st()).state === 'L2A_ROOT'); }

  console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASSED');
  await browser.close();
})();
