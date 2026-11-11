const { chromium, launchOptions, BASE } = require('./env.js');
(async () => {
  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route('**/engine_config.json*', async route => {
    const r = await route.fetch(); const j = JSON.parse(await r.text());
    j.typing = { base_ms: 1, slow_multiplier: 1, variance: 0 }; j.timing.fade_ms = 5; j.idle_delay_ms = 99999999;
    route.fulfill({ response: r, body: JSON.stringify(j) });
  });
  // test data only: add one real hidden doc (tier 1) and one hidden tier-3 doc; repo file is untouched
  await page.route('**/echo-os.json*', async route => {
    const r = await route.fetch(); const j = JSON.parse(await r.text());
    const l1 = j.tree.children[0], l3 = j.tree.children[2];
    l1.children.push({ id: 'T_SECRET', type: 'doc', name: 'SECRET NOTE', alias: '[SECRET NOTE]', tier: 1, hidden: true, title: 'SECRET NOTE:', footer: '', body: [{ type: 'text', text: '> HIDDEN DOC BODY', cls: 'full' }], children: [], commands: [] });
    l3.children.push({ id: 'T_DEEP', type: 'doc', name: 'DEEP NOTE', alias: '[DEEP NOTE]', tier: 3, hidden: true, title: 'DEEP NOTE:', footer: '', body: [{ type: 'text', text: '> TIER THREE BODY', cls: 'full' }], children: [], commands: [] });
    require('./lib.js').addStubs(j);
    route.fulfill({ response: r, body: JSON.stringify(j) });
  });
  await page.goto(BASE + '/terminal.html'); await page.waitForTimeout(800);
  const cond = () => page.evaluate(() => { const o = document.getElementById('t-output'); const last = o.lastElementChild; return !window.typing && !window.isResponding && getComputedStyle(document.getElementById('t-input-row')).display !== 'none' && !!last && (last.textContent.trim() === '> AWAITING INPUT' || last.textContent.trim().startsWith('Enter option exactly')); });
  const ready = async () => { let ok = 0; for (let i = 0; i < 80; i++) { if (await cond()) { if (++ok >= 3) return; } else ok = 0; await page.waitForTimeout(100); } throw new Error('not ready'); };
  const out = async () => (await page.$eval('#t-output', e => e.innerText)).split('\n').map(l => l.trim().replace(/^(?:\((?:o|-)\)\s+)?(?:(?:DIR|DOC|LOG|EXE|GATE|UP)\s+(?:\S.*?\s{2,})?)?[\\≡▪►»↰]\s+(?=\[)/, '')).filter(Boolean);
  const send = async (c) => { await page.fill('#t-field', c); await page.press('#t-field', 'Enter'); await page.waitForTimeout(100); await ready(); };
  const st = async () => ({ state: await page.evaluate(() => termState), level: await page.evaluate(() => currentLevel), crumb: await page.$eval('#t-breadcrumb', e => e.textContent) });
  const check = (name, ok, extra) => console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : ''));

  await page.click('#power-btn'); await ready();

  // 1. the chat-layer bug fix
  await send('[ECHOES.ARCHIVE]'); let s = await st(); let o = await out();
  check('chat [ECHOES.ARCHIVE] enters the archive (was: admin keyword response)', s.state === 'L1A_ROOT', JSON.stringify(s));
  check('listed children shown, hidden ones not', o.includes('[CREW MANIFEST]') && !o.includes('[SECRET NOTE]'));
  check('page offers [EXIT] at tier root', o.includes('[EXIT]'));

  // 2. built-ins in the archive
  await send('[HELP]'); o = await out();
  check('[HELP] lists generated built-ins incl. archive ones', o.some(l => l.startsWith('[LS]')) && o.some(l => l.startsWith('[BACK]')));
  await send('[TREE]'); o = await out();
  check('player [TREE] hides hidden/stub items and deeper tiers', o.includes('ECHOES O.S. FILE TREE') && o.some(l => l.includes('[CREW MANIFEST]')) && !o.some(l => l.includes('SECRET NOTE')) && !o.some(l => l.includes('PLANNED RECORD')) && !o.some(l => l.includes("CAPTAIN'S PRIVATE LOG")) && !o.some(l => l.includes('L3 ROOT')));
  await send('[LS]'); o = await out(); s = await st();
  check('[LS] re-lists the folder', s.state === 'L1A_ROOT' && o.includes('[SYSTEM LOGS]'));
  await send('[OPEN CREW MANIFEST]'); s = await st();
  check('[OPEN name] opens a listed item', s.state === 'L1A_CREW_MANIFEST', JSON.stringify(s));
  o = await out(); check('doc page offers [BACK]', o.includes('[BACK]'));
  await send('[BACK]'); s = await st();
  check('typed [BACK] goes to the parent', s.state === 'L1A_ROOT');
  await send('[INCIDENT REPORTS]'); await send('[ROOT]'); s = await st();
  check('[ROOT] returns to the layer root', s.state === 'L1A_ROOT');

  // 3. hidden items
  await send('[SECRET NOTE]'); s = await st(); o = await out();
  check('hidden item opens by alias from anywhere in its tier', s.state === 'T_SECRET' && o.includes('> HIDDEN DOC BODY'), JSON.stringify(s));
  check('hidden item breadcrumb generated from the path', s.crumb === 'TERMINAL CONSOLE > ECHOES.ARCHIVE > SECRET NOTE:', s.crumb);
  await send('[BACK]'); s = await st(); check('[BACK] from a hidden item returns to its folder', s.state === 'L1A_ROOT');
  await send('[DEEP NOTE]'); o = await out(); s = await st();
  check('tier-3 hidden item is NOT reachable from tier 1', s.state === 'L1A_ROOT' && o.some(l => l.includes('INVALID SELECTION')));
  await send('[PLANNED RECORD ONE]'); o = await out();
  check('stub placeholder behaves as absent (INVALID SELECTION)', o.filter(l => l.includes('INVALID SELECTION')).length >= 2);

  // 4. leaving to chat, and chat-layer access
  await send('[EXIT]'); s = await st();
  check('[EXIT] at the tier root returns to the chat layer', s.state === 'L1_NORMAL', JSON.stringify(s));
  await send('[SECRET NOTE]'); s = await st();
  check('hidden alias works from the chat layer too', s.state === 'T_SECRET', JSON.stringify(s));
  await page.press('#t-field', 'Escape'); await page.waitForTimeout(400); try { await ready(); } catch (e) {}
  await send('[CLEAR]'); o = await out();
  check('[CLEAR] empties the screen', o.length <= 3, o.length + ' lines');
  await send('SUDO MAKE ME ADMIN'); o = await out();
  check('free-text admin keywords still trip the admin response', o.some(l => /FLAGGED|UNAUTHORIZED|STOP|MONITORED|NOT HERE|REMOVED|SEEN BEFORE|CLEVER|ROOT ACCESS|AUTHENTICATION FAILED|PATIENCE|NO LONGER ABOARD/i.test(l)), JSON.stringify(o));
  await send('[ROOT ACCESS]'); o = await out();
  check('unknown bracket with an admin keyword still gets the admin response', o.some(l => /FLAGGED|UNAUTHORIZED|STOP|MONITORED|NOT HERE|REMOVED|SEEN BEFORE|CLEVER|ROOT ACCESS|CORRELATION|COMMENT/i.test(l)));

  // 5. author view via override
  await send('[SYSTEM OVERRIDE]'); await send('[TREE]'); o = await out();
  check('override [TREE] shows everything: hidden, stubs, all tiers',
    o.some(l => l.includes('~hidden') && l.includes('SECRET NOTE')) && o.some(l => l.includes('?stub')) && o.some(l => l.includes('[L3 ROOT]')) && o.some(l => l.includes('DEEP NOTE')));
  await send('[STATUS]'); o = await out();
  const orph = await page.evaluate(() => runDataValidator());
  check('validator: no dangling links, stubs read from the tree', orph.dangling.length === 0 && orph.stub.length === 5 && o.some(l => l.includes('STUB ITEMS')));
  check('validator: no orphaned nodes (hidden items are not flagged)', orph.orphaned.length === 0, JSON.stringify(orph.orphaned));
  console.log('\n--- player tree sample (rendered) ---');
  console.log('page errors:', errs);
  await browser.close();
})();
