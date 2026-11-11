const L = require('./lib.js');
(async () => {
  // power page title (before power on)
  const { chromium, launchOptions, BASE } = require('./env.js');
  const b = await chromium.launch(launchOptions);
  const pg = await b.newPage({ viewport: { width: 1000, height: 700 } });
  await pg.goto(BASE + '/terminal.html'); await pg.waitForTimeout(600);
  const pw = await pg.evaluate(() => { const t = document.getElementById('power-title'), btn = document.getElementById('power-btn'); return { txt: t.textContent, above: t.getBoundingClientRect().bottom <= btn.getBoundingClientRect().top, vis: getComputedStyle(document.getElementById('power-overlay')).display !== 'none' }; });
  let fails = 0; const chk = (n, ok, x) => { console.log((ok ? 'PASS ' : 'FAIL ') + n + (ok ? '' : '  ' + x)); if (!ok) fails++; };
  chk('power page: expansion sits above the power button', pw.txt === 'Expedition Control Hub for Operations & Environmental Systems' && pw.above && pw.vis, JSON.stringify(pw));
  await b.close();

  const t = await L.open(); const { p, send, out, check } = t;
  const calm = async () => { await p.waitForFunction(() => uiLock === 0 && !isResponding, null, { timeout: 15000 }).catch(() => {}); await t.ready(); };
  // landing: expansion line between the art and the subtitle
  const order = await p.evaluate(() => Array.from(document.querySelectorAll('#t-output .t-line')).map(e => e.textContent.trim()));
  const iArt = order.findIndex(l => /O\.S\.$/.test(l)), iExp = order.indexOf('EXPEDITION CONTROL HUB FOR OPERATIONS & ENVIRONMENTAL SYSTEMS'), iSub = order.findIndex(l => l.startsWith('ECHOES') && l.includes('TERMINAL 426'));
  check('landing: expansion line is after the art and before the subtitle', iArt >= 0 && iExp > iArt && iSub > iExp, JSON.stringify({ iArt, iExp, iSub }));

  // L1 folder and its three documents
  await send('[ECHOES.ARCHIVE]');
  check('L1 root lists [VESSEL SYSTEMS]', (await out()).includes('[VESSEL SYSTEMS]'));
  await send('[VESSEL SYSTEMS]');
  let o = await out();
  check('folder lists the three documents', ['[COMMISSIONING NOTICE]', '[PRE-LAUNCH SELF-CHECK]', '[CREW BULLETIN]'].every(x => o.includes(x)), JSON.stringify(o.slice(-14)));
  await send('[COMMISSIONING NOTICE]'); o = await out();
  check('notice: dotted formal form, expansion, and the ECH/OES technical-forms line', o.includes('E.C.H.O.E.S.') && o.includes('OPERATIONS & ENVIRONMENTAL SYSTEMS') && o.some(l => l.includes('ECH/OES on technical forms.')) && o.includes('STARDATE 2093.072'));
  await send('[BACK]'); await send('[PRE-LAUNCH SELF-CHECK]'); o = await out();
  check('self-check: ECH/OES header, file path and designators', o.includes('ECH/OES SELF-CHECK') && o.includes('FILE: ECH/OES/SELFCHECK/2093.082') && o.some(l => l.startsWith('ECH/OES.CORRESPONDENCE') && l.includes('QUEUE OPEN')) && o.some(l => l.includes('REVIEWER: MARS STATION')));
  await send('[BACK]'); await send('[CREW BULLETIN]'); o = await out();
  check('bulletin: written form vs spoken form', o.some(l => l.includes('written with')) && o.some(l => l.includes('called Echoes aloud')));
  // long documents open at the top
  await send('[BACK]'); await send('[COMMISSIONING NOTICE]');
  const sc = await p.evaluate(() => ({ top: document.getElementById('t-output').scrollTop, tall: document.getElementById('t-output').scrollHeight > document.getElementById('t-output').clientHeight }));
  check('a long document opens scrolled to its first line', sc.tall && sc.top === 0, JSON.stringify(sc));
  // L2 event log
  await send('[BACK]'); await send('[BACK]'); await send('[INITIATE ECHO PROTOCOL]'); await calm();
  o = await out();
  check('L2 root lists the event log', o.includes('[EVENT LOG EXCERPT]'), JSON.stringify(o.slice(-8)));
  await send('[EVENT LOG EXCERPT]'); o = await out();
  check('event log: ECH/OES path, the cant entry from Terminal 426, reviewer now none', o.includes('FILE: ECH/OES/EVENT/2143') && o.some(l => l.includes('SOURCE: TERMINAL 426')) && o.some(l => l.includes('REVIEWER: NONE ASSIGNED')));
  // prose rules for the new documents: no em/en dashes
  const bad = await p.evaluate(() => { const ids = ['L1A_COMMISSIONING_NOTICE', 'L1A_PRE_LAUNCH_SELF_CHECK', 'L1A_CREW_BULLETIN', 'L2A_EVENT_LOG_EXCERPT']; return ids.flatMap(id => (osItems[id].body || []).map(b => b.text || '').filter(t => /[–—]/.test(t))); });
  check('no em or en dashes in the new in-world documents', bad.length === 0, JSON.stringify(bad));
  await t.done();
  if (fails) process.exitCode = 1;
})();
