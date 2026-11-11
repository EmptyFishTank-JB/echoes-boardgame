// What types and what lands whole, per the RENDER table in terminal.html.
const { chromium, launchOptions, BASE } = require('./env.js');
(async () => {
  const b = await chromium.launch(launchOptions);
  const p = await (await b.newContext({ viewport: { width: 1100, height: 760 } })).newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.route('**/engine_config.json*', async (r) => { const x = await r.fetch(); const j = JSON.parse(await x.text()); j.typing = { base_ms: 40, slow_multiplier: 1, variance: 0.6 }; j.timing.fade_ms = 5; r.fulfill({ response: x, body: JSON.stringify(j) }); });
  await p.goto(BASE + '/terminal.html'); await p.waitForTimeout(800);
  let fails = 0; const check = (n, ok, x) => { console.log((ok ? 'PASS ' : 'FAIL ') + n + (!ok && x !== undefined ? '  ' + JSON.stringify(x).slice(0, 300) : '')); if (!ok) fails++; };
  const ready = async () => { for (let i = 0; i < 400; i++) { const ok = await p.evaluate(() => { const l = document.getElementById('t-output').lastElementChild; return !window.typing && !window.isResponding && getComputedStyle(document.getElementById('t-input-row')).display !== 'none' && !!l && l.textContent.trim() === '> AWAITING INPUT'; }); if (ok) { await p.waitForTimeout(700); return true; } await p.waitForTimeout(100); } return false; };
  const send = async (c) => { await p.fill('#t-field', c); await p.press('#t-field', 'Enter'); await p.waitForTimeout(350); await ready(); };
  await p.evaluate(() => {
    window.__rec = []; const map = new WeakMap();
    new MutationObserver((ms) => { for (const m of ms) m.addedNodes.forEach((n) => {
      if (n.nodeType !== 1) return;
      if (n.classList.contains('t-line')) { const r = { el: n, t: performance.now(), chars: [], phos: n.classList.contains('phos'), whole: n.textContent.length > 0 }; map.set(n, r); window.__rec.push(r); }
      else if (n.classList.contains('ch') && n.closest('.t-line') && map.has(n.closest('.t-line'))) map.get(n.closest('.t-line')).chars.push(performance.now());
    }); }).observe(document.getElementById('t-output'), { childList: true, subtree: true });
  });
  await p.evaluate(() => { window.__clicks = []; const o = window.playClick; window.playClick = function () { window.__clicks.push(performance.now()); return o.apply(this, arguments); }; });
  await p.click('#power-btn'); await ready();
  const grab = () => p.evaluate(() => { const r = window.__rec.map((x) => ({ text: x.el.textContent, t: x.t, chars: x.chars, phos: x.phos, whole: x.whole })); window.__rec.length = 0; return r; });
  const gaps = (a) => a.slice(1).map((v, i) => v - a[i]);
  const range = (a) => Math.max(...a) - Math.min(...a);
  // the boot check lines render like every other line: typed, uniform speed, with the click sounds
  const bootRecs = await grab();
  const clicks = await p.evaluate(() => window.__clicks.slice());
  const checkLines = bootRecs.filter((x) => /-{3,} \[(OK|WARN|INVALID|BROKEN|MISSING)\]/.test(x.text));
  check('all five boot check lines are there', checkLines.length === 5, bootRecs.map((x) => x.text).filter((x) => /\[/.test(x)));
  check('...each one lands whole (no per-character typing)', checkLines.every((x) => x.chars.length === 0), checkLines.map((x) => [x.text.length, x.chars.length]));
  check('...with the whole-line glow', checkLines.every((x) => x.phos), checkLines.map((x) => x.phos));
  const cgaps = gaps(checkLines.map((x) => x.t));
  check('...a steady beat apart (visible, not a flash)', cgaps.every((g) => g >= 60 && g < 400), cgaps.map(Math.round));
  const staticAt = (x) => true;
  const verify = bootRecs.find((x) => x.text.startsWith('> VERIFYING SUBSYSTEM CONNECTIONS'));
  check('"> VERIFYING SUBSYSTEM CONNECTIONS..." stays typed', verify && verify.chars.length >= verify.text.length * 0.9, verify && [verify.text, verify.chars.length]);
  const accessLine = bootRecs.find((x) => /^> (FULL ACCESS|DEGRADED)/.test(x.text));
  check('the FULL ACCESS / DEGRADED status line is typed too', accessLine && accessLine.chars.length >= accessLine.text.length * 0.9, accessLine && accessLine.text);

  // typed system line, uniform
  await send('[NOPE]'); let r = await grab();
  const err = r.find((x) => /NOT RECOGNIZED|INVALID/i.test(x.text));
  check('an error line is typed character by character', !!err && err.chars.length >= err.text.length * 0.9, err && [err.text, err.chars.length]);
  const eg = gaps(err.chars);
  check('...at a uniform speed (every gap about 40 ms)', range(eg) < 22 && eg.every((g) => g > 30), { range: range(eg), min: Math.min(...eg), max: Math.max(...eg) });
  const prompt = r.filter((x) => x.text === '> AWAITING INPUT').pop();
  check('the prompt is typed too', prompt && prompt.chars.length >= 14, prompt && prompt.chars.length);
  check('typed lines glow per character, not as a whole line', err.chars.length > 0 && !err.phos && !prompt.phos);

  // chat reply, varied
  await send('hello'); r = await grab();
  const reply = r.filter((x) => x.text.length > 14 && !x.text.startsWith('> HELLO') && !x.text.startsWith('> AWAITING')).sort((a, b) => b.text.length - a.text.length)[0];
  const rg = gaps(reply.chars);
  check('a chat reply is typed with varying speed', reply.chars.length >= reply.text.length * 0.9 && range(rg) > 14, { range: range(rg), n: reply.chars.length });

  // whole lines: [HELP] entries and a page
  await send('[HELP]'); r = await grab();
  const help = r.filter((x) => /^\s{2}\[/.test(x.text));
  check('[HELP] entries land whole (no per-character typing)', help.length >= 3 && help.every((x) => x.chars.length === 0 && x.phos), help.map((x) => [x.text.slice(0, 20), x.chars.length]));
  const hg = gaps(help.map((x) => x.t));
  check('...with a steady pause of about 40 ms between them', hg.every((g) => g >= 30 && g < 120), hg.map(Math.round));
  check('the echo of what you typed is whole too', r.find((x) => x.text === '> [HELP]') && r.find((x) => x.text === '> [HELP]').chars.length === 0);
  await send('[ECHOES.ARCHIVE]'); r = await grab();
  const pageLines = r.filter((x) => x.text.length > 3 && x.whole && x.chars.length === 0);
  const pg = gaps(pageLines.map((x) => x.t)).filter((g) => g < 200);
  check('archive pages land whole, line by line', pageLines.length >= 5, pageLines.length);
  check('...about 22 ms apart', pg.length >= 3 && pg.reduce((s, v) => s + v, 0) / pg.length < 45, pg.map(Math.round));
  const mount = r.find((x) => x.text.includes('ECHOES:'));
  check('the mount line is typed', mount && mount.chars.length >= 8, mount && [mount.text, mount.chars.length]);

  // transition flavor typed
  await send('[INITIATE ECHO PROTOCOL]'); r = await grab();
  const flav = r.filter((x) => x.text.length > 10 && !x.text.startsWith('> [') && !x.text.startsWith('> AWAIT'));
  check('transition flavor text is typed, not whole', flav.length >= 2 && flav.filter((x) => x.chars.length >= x.text.length * 0.9).length >= 2, flav.map((x) => [x.text.slice(0, 30), x.chars.length]));

  await p.waitForTimeout(900);
  const left = await p.evaluate(() => [document.querySelectorAll('#t-output .t-line.phos').length, document.querySelectorAll('#t-output .ch').length]);
  check('nothing is left holding a glow class or character spans', left[0] === 0 && left[1] === 0, left);
  console.log('page errors:', JSON.stringify(errs)); console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); await b.close();
})();
