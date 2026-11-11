// shared harness for new test files
const { chromium, launchOptions, BASE } = require('./env.js');
// Test data: five planned-but-empty stub docs, two in INCIDENT REPORTS and three in RESTRICTED FILES (the repo data has none).
exports.addStubs = function (j) {
  const find = (n, id) => { for (const c of n.children || []) { if (c.id === id) return c; const r = find(c, id); if (r) return r; } return null; };
  const mk = (folder, key, name) => ({ id: folder + '__STUB_' + key, type: 'doc', name, alias: '[' + name + ']', tier: 1, hidden: true, stub: true, title: name, children: [], commands: [] });
  const inc = find(j.tree, 'L1A_INCIDENT'), res = find(j.tree, 'L1A_RESTRICTED');
  inc.children.push(mk('L1A_INCIDENT', 'ONE', 'PLANNED RECORD ONE'), mk('L1A_INCIDENT', 'TWO', 'PLANNED RECORD TWO'));
  res.children.push(mk('L1A_RESTRICTED', 'THREE', 'PLANNED RECORD THREE'), mk('L1A_RESTRICTED', 'FOUR', 'PLANNED RECORD FOUR'), mk('L1A_RESTRICTED', 'FIVE', 'PLANNED RECORD FIVE'));
};
exports.open = async function (opts = {}) {
  const b = await chromium.launch(launchOptions);
  const ctx = await b.newContext({ viewport: opts.viewport || { width: 1100, height: 760 }, acceptDownloads: true, deviceScaleFactor: opts.dsf || 1 });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.route('**/engine_config.json*', async r => { const x = await r.fetch(); const j = JSON.parse(await x.text()); j.typing = { base_ms: 1, slow_multiplier: 1, variance: 0 }; j.timing.fade_ms = 5; r.fulfill({ response: x, body: JSON.stringify(j) }); });
  if (opts.stubs) await p.route('**/echo-os.json*', async r => { const x = await r.fetch(); const j = JSON.parse(await x.text()); exports.addStubs(j); r.fulfill({ response: x, body: JSON.stringify(j) }); });
  await p.goto(BASE + '/terminal.html' + (opts.q || '')); await p.waitForTimeout(800);
  const ready = async () => { for (let i = 0; i < 120; i++) { const ok = await p.evaluate(() => { const l = document.getElementById('t-output').lastElementChild; return !window.typing && !window.isResponding && getComputedStyle(document.getElementById('t-input-row')).display !== 'none' && !!l && l.textContent.trim() === '> AWAITING INPUT'; }); if (ok) { await p.waitForTimeout(350); return true; } await p.waitForTimeout(100); } return false; };
  const send = async c => { await p.fill('#t-field', c); await p.press('#t-field', 'Enter'); await p.waitForTimeout(350); await ready(); };
  const out = () => p.evaluate(() => Array.from(document.querySelectorAll('#t-output .t-line')).map(e => e.textContent.trim().replace(/^(?:\((?:o|-)\)\s+)?(?:(?:DIR|DOC|LOG|EXE|GATE|UP)\s+(?:\S.*?\s{2,})?)?[\\≡▪►»↰]\s+(?=\[)/, '')));
  const results = []; let fails = 0;
  const check = (name, ok, extra) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra !== undefined && !ok ? '  ' + extra : '')); if (!ok) fails++; };
  await p.click('#power-btn'); await ready();
  return { b, p, ready, send, out, check, errs, done: async () => { console.log('page errors:', JSON.stringify(errs)); console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); await b.close(); } };
};
