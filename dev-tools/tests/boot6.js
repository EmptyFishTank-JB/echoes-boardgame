const { chromium, launchOptions, BASE } = require('./env.js');
const LABELS = ['CREW BEHAVIORAL MATRIX', 'ARCHIVE LOG DATABASE', 'DEVELOPMENT RECORDS', 'NAVIGATION ARCHITECTURE', 'CORE ENGINE PARAMETERS'];
let fails = 0;
const json = body => r => r.fulfill({ status: 200, contentType: 'application/json', body });
const patch = fn => async r => { const x = await r.fetch(); const j = JSON.parse(await x.text()); const out = fn(j); r.fulfill({ response: x, body: JSON.stringify(out || j) }); };
(async () => {
  const b = await chromium.launch(launchOptions);
  async function boot(routes, after) {
    const p = await b.newPage({ viewport: { width: 1000, height: 700 } });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    const speed = (j) => { j.typing = { base_ms: 1, slow_multiplier: 1, variance: 0 }; j.timing = j.timing || {}; j.timing.fade_ms = 5; };
    let engineHandled = false;
    const fast = h => r => h({ fetch: (...a) => r.fetch(...a), request: () => r.request(), continue: (...a) => r.continue(...a), abort: (...a) => r.abort(...a),
      fulfill: (o) => { try { if (o && typeof o.body === 'string') { const x = JSON.parse(o.body); speed(x); o = { ...o, body: JSON.stringify(x) }; } else if (o && o.response) { /* handled by body */ } } catch (e) { /* not JSON: leave it */ } return r.fulfill(o); } });
    for (const [pat, h] of Object.entries(routes)) { if (pat.includes('engine_config')) { engineHandled = true; await p.route(pat, fast(h)); } else await p.route(pat, h); }
    if (!engineHandled) await p.route('**/engine_config.json*', patch(j => { speed(j); }));
    await p.goto(BASE + '/terminal.html'); await p.waitForTimeout(700); await p.click('#power-btn');
    await p.waitForFunction(() => Array.from(document.querySelectorAll('#t-output .t-line')).some(e => e.textContent.trim() === '> AWAITING INPUT'), null, { timeout: 30000 }).catch(() => {});
    await p.waitForTimeout(350);
    const lines = await p.evaluate(() => Array.from(document.querySelectorAll('#t-output .t-line')).map(e => e.textContent.trim().replace(/ [0-9a-f]{7}$/, '').replace(/ —$/, '')));
    const states = {}; lines.forEach(l => { const m = /^> (.*?) -+ \[(.*?)\]$/.exec(l); if (m) states[m[1]] = m[2]; });
    const status = lines.find(l => /^> (FULL ACCESS|DEGRADED)/.test(l));
    const extra = after ? await after(p) : null;
    await p.close(); return { states, status, errs, extra };
  }
  const check = (name, ok, x) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : '  ' + JSON.stringify(x))); if (!ok) fails++; };
  async function expect(name, routes, want, status, after) {
    const r = await boot(routes, after);
    const exp = Object.fromEntries(LABELS.map(l => [l, 'OK'])); Object.assign(exp, want);
    check(name, JSON.stringify(r.states) === JSON.stringify(exp) && (!status || status.test(r.status || '')) && r.errs.length === 0, { got: r.states, status: r.status, errs: r.errs });
    return r;
  }

  await expect('all files present: five OK and FULL ACCESS', {}, {}, /^> FULL ACCESS$/);
  // MISSING: could not be fetched
  await expect('lore.json: network failure is MISSING', { '**/lore.json*': r => r.abort() }, { 'ARCHIVE LOG DATABASE': 'MISSING' }, /DEGRADED — 1 SUBSYSTEM OFFLINE/);
  await expect('echo-os.json: 404 is MISSING, and the five checks still draw from code', { '**/echo-os.json*': r => r.fulfill({ status: 404, body: 'nope' }) }, { 'NAVIGATION ARCHITECTURE': 'MISSING' }, /DEGRADED/);
  // BROKEN: fetched but not JSON
  await expect('dev_logs.json: not JSON is BROKEN', { '**/dev_logs.json*': r => r.fulfill({ status: 200, body: '{ broken' }) }, { 'DEVELOPMENT RECORDS': 'BROKEN' }, /DEGRADED/);
  await expect('personality.json: truncated file is BROKEN', { '**/personality.json*': r => r.fulfill({ status: 200, body: '{"easter_eggs": [' }) }, { 'CREW BEHAVIORAL MATRIX': 'BROKEN' }, /DEGRADED/);
  // INVALID: valid JSON, wrong contents (these all passed as OK before)
  await expect('personality.json with easter_eggs as text and admin_triggers as 7 is INVALID', { '**/personality.json*': json('{"easter_eggs": "this should be a list", "admin_triggers": 7}') }, { 'CREW BEHAVIORAL MATRIX': 'INVALID' }, /DEGRADED/);
  await expect('lore.json as a plain list is INVALID', { '**/lore.json*': json('["not", "an", "object"]') }, { 'ARCHIVE LOG DATABASE': 'INVALID' }, /DEGRADED/);
  await expect('dev_logs.json {"hello": "world"} is INVALID', { '**/dev_logs.json*': json('{"hello": "world"}') }, { 'DEVELOPMENT RECORDS': 'INVALID' }, /DEGRADED/);
  await expect('echo-os.json with no tree ({}) is INVALID', { '**/echo-os.json*': json('{}') }, { 'NAVIGATION ARCHITECTURE': 'INVALID' }, /DEGRADED/);
  await expect('echo-os.json with no tier 1 root is INVALID', { '**/echo-os.json*': patch(j => { j.tree.children = j.tree.children.filter(c => c.tier !== 1); }) }, { 'NAVIGATION ARCHITECTURE': 'INVALID' }, /DEGRADED/);
  await expect('engine_config.json that is not an object ([]) is INVALID', { '**/engine_config.json*': json('[]') }, { 'CORE ENGINE PARAMETERS': 'INVALID' }, /DEGRADED/);
  // WARN: usable, but something inside is off
  await expect('lore.json with one malformed entry is WARN (and the status line says so)', { '**/lore.json*': patch(j => { j['ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ'] = { text: 5 }; }) }, { 'ARCHIVE LOG DATABASE': 'WARN' }, /^> FULL ACCESS — 1 WARNING$/);
  await expect('echo-os.json with a gateway pointing nowhere is WARN', { '**/echo-os.json*': patch(j => { j.tree.children[0].children.find(c => c.type === 'gateway').goto = 'NOWHERE'; }) }, { 'NAVIGATION ARCHITECTURE': 'WARN' }, /FULL ACCESS — 1 WARNING/);
  await expect('echo-os.json missing the layer 3 colors is WARN (built-in colors used)', { '**/echo-os.json*': patch(j => { delete j.layers.l3a.colors; }) }, { 'NAVIGATION ARCHITECTURE': 'WARN' }, /FULL ACCESS — 1 WARNING/);
  await expect('two problems at once: one WARN and one INVALID', { '**/lore.json*': patch(j => { j['ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ'] = { text: 5 }; }), '**/dev_logs.json*': json('[]') }, { 'ARCHIVE LOG DATABASE': 'WARN', 'DEVELOPMENT RECORDS': 'INVALID' }, /DEGRADED — 1 SUBSYSTEM OFFLINE/);

  // a malformed easter egg no longer crashes the chat
  const r = await boot({ '**/personality.json*': patch(j => { j.easter_eggs.unshift({ group: 'BAD' }); }) }, async p => {
    await p.fill('#t-field', 'hello there'); await p.press('#t-field', 'Enter'); await p.waitForTimeout(1500); return 'typed';
  });
  check('personality with a malformed easter egg is WARN and the chat keeps working', r.states['CREW BEHAVIORAL MATRIX'] === 'WARN' && r.errs.length === 0, { s: r.states, e: r.errs });

  // [SYSTEM OVERRIDE] [STATUS] explains each problem
  const rs = await boot({ '**/lore.json*': json('["not", "an", "object"]') }, async p => {
    await p.fill('#t-field', '[SYSTEM OVERRIDE]'); await p.press('#t-field', 'Enter'); await p.waitForTimeout(2500);
    await p.fill('#t-field', '[STATUS]'); await p.press('#t-field', 'Enter'); await p.waitForTimeout(2500);
    return p.evaluate(() => Array.from(document.querySelectorAll('#t-output .t-line')).map(e => e.textContent.trim()));
  });
  check('[STATUS] shows the state and the reason for a bad file', rs.extra.some(l => /ARCHIVE LOG DATABASE -+ \[INVALID\]/.test(l)) && rs.extra.some(l => l.includes('lore.json [INVALID]: MUST BE AN OBJECT OF ENTRIES KEYED BY CODE')) && rs.extra.some(l => /DATA FILE PROBLEMS: 1/.test(l)), rs.extra.filter(l => /LOG DATABASE|PROBLEMS|lore.json/.test(l)));

  // [LEGEND]: hardcoded, so it works even when echo-os.json is missing, and it follows renamed labels
  const ov = async (routes) => (await boot(routes, async p => {
    await p.fill('#t-field', '[SYSTEM OVERRIDE]'); await p.press('#t-field', 'Enter'); await p.waitForTimeout(2500);
    const menu = await p.evaluate(() => Array.from(document.querySelectorAll('#t-output .t-line')).map(e => e.textContent.trim()));
    await p.fill('#t-field', '[LEGEND]'); await p.press('#t-field', 'Enter'); await p.waitForTimeout(2500);
    const all = await p.evaluate(() => Array.from(document.querySelectorAll('#t-output .t-line')).map(e => e.textContent.trim()));
    return { menu, all };
  })).extra;
  const lg = await ov({});
  check('the override menu lists [LEGEND]', lg.menu.some(l => l.startsWith('[LEGEND]')), lg.menu.slice(-8));
  const row = (all, label) => all.find(l => l.startsWith(label));
  check('[LEGEND] explains all five labels', ['[OK]', '[WARN]', '[INVALID]', '[BROKEN]', '[MISSING]'].every(x => row(lg.all, x)), lg.all.slice(-22));
  check('[LEGEND] explains the status line and names the five files', row(lg.all, 'FULL ACCESS ') && row(lg.all, 'DEGRADED') && ['personality.json', 'lore.json', 'dev_logs.json', 'echo-os.json', 'engine_config.json'].every(f => lg.all.some(l => l.endsWith(f))));
  const lg2 = await ov({ '**/echo-os.json*': r => r.fulfill({ status: 404, body: 'x' }) });
  check('[LEGEND] still works when echo-os.json is missing (hardcoded)', ['[OK]', '[MISSING]'].every(x => row(lg2.all, x)));
  const lg3 = await ov({ '**/engine_config.json*': patch(j => { j.typing = { base_ms: 1, slow_multiplier: 1, variance: 0 }; j.timing.fade_ms = 5; j.terminal_strings = Object.assign(j.terminal_strings || {}, { status_broken: 'CORRUPT' }); }) });
  check('[LEGEND] follows a renamed label', row(lg3.all, '[CORRUPT]') && !row(lg3.all, '[BROKEN]'), lg3.all.slice(-20));

  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
})();
