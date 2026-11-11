const { chromium, launchOptions, BASE } = require('./env.js');
(async () => {
  const b = await chromium.launch(launchOptions); let fails = 0;
  const check = (n, ok, x) => { console.log((ok ? 'PASS ' : 'FAIL ') + n + (!ok && x !== undefined ? '  ' + JSON.stringify(x) : '')); if (!ok) fails++; };
  for (const [name, vp] of [['desktop', { width: 1100, height: 760 }], ['phone', { width: 390, height: 780 }]]) {
    const p = await (await b.newContext({ viewport: vp })).newPage();
    await p.route('**/engine_config.json*', async (r) => { const x = await r.fetch(); const j = JSON.parse(await x.text()); j.typing = { base_ms: 1, slow_multiplier: 1, variance: 0 }; j.timing.fade_ms = 5; r.fulfill({ response: x, body: JSON.stringify(j) }); });
    await p.goto(BASE + '/terminal.html'); await p.waitForTimeout(1000);
    const pw = await p.evaluate(() => ({ vessel: (document.getElementById('power-vessel') || {}).textContent, sub: document.getElementById('power-sub').textContent, subW: document.getElementById('power-sub').getBoundingClientRect() }));
    check(name + ': the start screen shows DSCF CHARON', pw.vessel === 'DSCF CHARON', pw.vessel);
    check(name + ': ...and the sub line carries the full name', pw.sub.startsWith('DSCF CHARON - ECHOES SHIP SYSTEM TERMINAL 426'), pw.sub);
    check(name + ': ...inside the screen', pw.subW.left >= 0 && pw.subW.right <= vp.width, pw.subW);
    await p.click('#power-btn'); await p.waitForTimeout(2500);
    const hd = await p.evaluate(() => { const h = document.getElementById('t-header'); const c = document.getElementById('t-clock').getBoundingClientRect(); return { title: document.getElementById('t-title').textContent, over: h.scrollWidth > h.clientWidth, clockRight: c.right, clockLeft: c.left }; });
    check(name + ': the header reads DSCF CHARON - ECHOES SHIP SYSTEM TERMINAL 426', hd.title === 'DSCF CHARON - ECHOES SHIP SYSTEM TERMINAL 426', hd.title);
    check(name + ': ...and nothing in it is pushed off screen', !hd.over && hd.clockRight <= vp.width && hd.clockLeft >= 0, hd);
    if (name === 'phone') {
      const ly = await p.evaluate(() => { const t = document.getElementById('t-title').getBoundingClientRect(), c = document.getElementById('t-clock').getBoundingClientRect(); return { titleLeft: t.left, clockLeft: c.left, clockTop: c.top, titleBottom: t.bottom }; });
      check('phone: the stardate is on a second line, left-aligned with the title', ly.clockTop >= ly.titleBottom - 1 && Math.abs(ly.clockLeft - ly.titleLeft) < 2, ly);
    }
    await p.close();
  }
  console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); await b.close();
})();
