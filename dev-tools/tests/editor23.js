// The engine editor no longer offers theme or per-layer sound (those are per layer in echo-os.json now).
const { chromium, launchOptions, BASE } = require('./env.js');
(async () => {
  const b = await chromium.launch(launchOptions); const p = await (await b.newContext({ viewport: { width: 1300, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  let fails = 0; const check = (n, ok, x) => { console.log((ok ? 'PASS ' : 'FAIL ') + n + (!ok && x !== undefined ? '  ' + JSON.stringify(x) : '')); if (!ok) fails++; };
  await p.goto(BASE + '/dev-tools/terminal-engine-editor.html'); await p.waitForTimeout(600);
  const raw = await (await fetch(BASE + '/terminal-data/engine_config.json')).text();
  await p.evaluate((r) => loadCfg(JSON.parse(r), 'engine_config.json', 'ro'), raw); await p.waitForTimeout(300);
  const secs = await p.evaluate(() => SECTIONS.map((s) => s.id));
  check('there is no colors section any more', !secs.includes('colors') && secs.includes('audio') && secs.includes('typing'), secs);
  await p.evaluate(() => selectSection('audio')); await p.waitForTimeout(300);
  check('the audio section is just the master volume', await p.evaluate(() => !!document.getElementById('a-vol') && !document.querySelector('[id^="tv-"]') && !document.querySelector('[id^="osc-cont-"]')));
  await p.evaluate(() => saveSection()); await p.waitForTimeout(200);
  const out = await p.evaluate(() => JSON.parse(buildJSON()));
  check('saving does not bring back theme or ambient sound', !out.theme && !(out.audio && out.audio.ambient) && out.audio.master_volume > 0, Object.keys(out));
  for (const id of secs) { await p.evaluate((i) => selectSection(i), id); await p.waitForTimeout(80); }
  check('every remaining section opens without an error', errs.length === 0, errs);
  console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
