// Per-layer settings: colors, header title, intro text, ambient sound. Data in echo-os.json (layers), edited in author mode.
const L = require('./lib.js');
(async () => {
  const t = await L.open(); const { p, send, out, check } = t;
  const prompt = async () => { for (let i = 0; i < 100; i++) { if (await p.evaluate(() => !!window.progWait)) return; await p.waitForTimeout(100); } };
  const answer = async (v) => { await prompt(); await p.fill('#t-field', v); await p.press('#t-field', 'Enter'); await p.waitForTimeout(500); };
  const calm = async () => { for (let i = 0; i < 100; i++) { if (await p.evaluate(() => !window.isResponding && !window.progWait && (document.getElementById('t-output').lastElementChild || {}).textContent === '> AWAITING INPUT')) { await p.waitForTimeout(300); return; } await p.waitForTimeout(150); } };
  const css = (name, onBody) => p.evaluate(([n, b]) => getComputedStyle(b ? document.body : document.documentElement).getPropertyValue(n).trim(), [name, !!onBody]);
  const data = () => p.evaluate(() => JSON.parse(JSON.stringify(osData)));

  // ---- the data ----
  const d0 = await data();
  check('layers are l1c, l1a, l2a and l3a only', JSON.stringify(Object.keys(d0.layers)) === JSON.stringify(['l1c', 'l1a', 'l2a', 'l3a']), Object.keys(d0.layers));
  check('each archive layer carries its colors and ambient sound', ['l1a', 'l2a', 'l3a'].every((k) => d0.layers[k].colors && d0.layers[k].colors.primary && d0.layers[k].ambient && d0.layers[k].ambient.oscillators.length), Object.keys(d0.layers.l2a));
  check('the unreachable layer 2 and 3 chat screens are gone', !d0.screens.L2C_ROOT && !d0.screens.L3C_ROOT, Object.keys(d0.screens));
  const eng = await (await fetch(process.env.ECHOES_URL ? process.env.ECHOES_URL + '/terminal-data/engine_config.json' : 'http://localhost:8803/terminal-data/engine_config.json')).json();
  check('engine_config.json no longer holds theme or ambient sound', !eng.theme && !(eng.audio && eng.audio.ambient) && eng.audio.master_volume > 0, Object.keys(eng));
  check('the engine paints each layer from its own colors (the chat on the page, the archive layers by body class)', (await css('--theme-full')) === d0.layers.l1c.colors.primary && (await p.evaluate((c) => document.getElementById('theme-overrides').textContent.includes('body.layer-1a{--theme-full:' + c), d0.layers.l1a.colors.primary)) && (await p.evaluate(() => document.getElementById('theme-overrides').textContent.includes('body.layer-3a{--theme-full:#e05050'))));
  check('every layer has its own corruption color, and the engine paints it', ['l1c', 'l1a', 'l2a', 'l3a'].every((k) => /^#[0-9a-f]{6}$/i.test(d0.layers[k].colors.glitch)) && (await p.evaluate(() => document.getElementById('theme-overrides').textContent.includes('body.layer-3a{') && /body\.layer-3a\{[^}]*--theme-glitch:#6fe3ff/.test(document.getElementById('theme-overrides').textContent))));

  // ---- the right-click menu on the address bar ----
  await send('[ECHOES.ARCHIVE]'); await send('[AUTHOR UNLOCK]');
  await p.click('#t-addr', { button: 'right' }); await p.waitForTimeout(250);
  const rows = () => p.evaluate(() => { const m = document.getElementById('ctx'); return m ? Array.from(m.querySelectorAll('.cr')).map((r) => ({ k: r.querySelector('.ck').textContent, v: r.querySelector('.cv').textContent, ed: r.classList.contains('ed'), sw: !!r.querySelector('.sw') })) : null; });
  let r = await rows(); const by = (k) => (r || []).find((x) => x.k === k);
  check('right-clicking the address bar at a level root lists the page and its layer', r && ['ID', 'NAME', 'LAYER', 'TITLE', 'PRIMARY', 'WARN', 'DENIED', 'BACKGROUND', 'DIM', 'LO', 'BORDER', 'INTRO', 'VOLUME', 'SOUND'].every((k) => by(k)), r && r.map((x) => x.k));
  check('colors show a swatch; every layer row except the heading can be edited', ['PRIMARY', 'WARN', 'DENIED', 'BACKGROUND'].every((k) => by(k).sw) && ['TITLE', 'PRIMARY', 'DIM', 'INTRO', 'VOLUME', 'SOUND'].every((k) => by(k).ed) && !by('LAYER').ed, r);
  check('values are the real ones', by('PRIMARY').v === d0.layers.l1a.colors.primary && by('SOUND').v === 'VENTILATION' && by('VOLUME').v === String(d0.layers.l1a.ambient.target_volume), r);
  await p.hover('#ctx .cr.ed:has-text("PRIMARY")'); await p.waitForTimeout(80);
  check('hovering a layer row shows its command in the field', (await p.inputValue('#t-field')) === '[LAYER PRIMARY]', await p.inputValue('#t-field'));

  // ---- colors, live: one window for the layer, opened by clicking a row ----
  await p.click('#ctx .cr.ed:has-text("PRIMARY")'); await p.waitForSelector('.ed-dlg'); await p.waitForTimeout(300);
  const dlgF = (l) => p.locator('.ed-dlg .ed-row:has(.ed-lbl:text-is("' + l + '"))');
  const bodyCss = () => css('--theme-full', true);
  check('clicking PRIMARY opens the layer window on L1A, on the primary color box straight away (no "which layer" or "which setting")', (await p.$eval('.ed-dlg .ed-bar .sub', (e) => e.textContent)) === 'L1A' && await p.evaluate(() => { const a = document.activeElement; return !!a; }), await p.$eval('.ed-dlg .ed-bar .sub', (e) => e.textContent));
  await dlgF('PRIMARY').locator('input[type=text]').fill('red'); await p.waitForTimeout(100);
  check('a bad color is flagged and not applied', (await dlgF('PRIMARY').locator('input[type=text]').evaluate((e) => e.classList.contains('bad'))) && (await data()).layers.l1a.colors.primary === d0.layers.l1a.colors.primary);
  await dlgF('PRIMARY').locator('input[type=text]').fill('#F0a'); await p.waitForTimeout(150);
  check('a three digit color is accepted and normalized, and shows at once on the archive', (await bodyCss()) === '#ff00aa' && (await data()).layers.l1a.colors.primary === '#ff00aa', await bodyCss());
  check('...and the chat keeps its own colors', (await css('--theme-full')) === d0.layers.l1c.colors.primary);
  await dlgF('DIM').locator('input[type=range]').evaluate((e) => { e.value = '0.55'; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); });
  check('a strength is a slider', (await data()).layers.l1a.colors.dim_opacity === 0.55);

  // ---- title ----
  await dlgF('TITLE').locator('input').fill('TEST ARCHIVE'); await p.waitForTimeout(500);
  check('the header title changes on the page that is showing', (await p.evaluate(() => document.getElementById('t-title').textContent)) === 'TEST ARCHIVE' && (await data()).layers.l1a.header_title === 'TEST ARCHIVE');

  // ---- sound: a list to listen to and choose from ----
  await p.click('.ed-dlg .ed-snd .nm[data-sound="SUB-BASS"]'); await p.waitForTimeout(150);
  let a = (await data()).layers.l1a.ambient;
  check('choosing a sound from the list sets the tones and its volume', a.oscillators.length === 1 && a.oscillators[0].freq === 38 && a.target_volume === 0.05, a);
  await dlgF('VOLUME').locator('input[type=range]').evaluate((e) => { e.value = '0.5'; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); });
  check('volume is set and the engine reads it', (await data()).layers.l1a.ambient.target_volume === 0.5 && (await p.evaluate(() => ambientCfg('l1a').target_volume)) === 0.5);
  await p.click('.ed-dlg .ed-snd .nm[data-sound="SILENT"]'); await p.waitForTimeout(100);
  check('silent sets the volume to zero', (await data()).layers.l1a.ambient.target_volume === 0);

  // ---- transition text ----
  check('the transition text shows the current lines first', (await p.$$eval('.ed-dlg .ed-ln input.ed-in', (e) => e.map((x) => x.value))).includes('> ECHOES-ARCHIVE ACCESS GRANTED.'));
  await p.click('.ed-dlg button:text-is("PASTE...")'); await p.fill('.ed-dlg textarea.ed-in', 'FLAVOR ONE\n/dim flavor two'); await p.click('.ed-dlg button:text-is("REPLACE THE LINES WITH THIS")');
  await p.click('.ed-dlg button:text-is("SAVE THE TRANSITION TEXT")'); await p.waitForTimeout(200);
  const sc = (await data()).screens.L1A_INTRO.body;
  check('the intro text is replaced, with the blank lines and rule kept around it', sc.length === 5 && sc[0].cls === 'blank' && sc[1].text === 'FLAVOR ONE' && sc[2].text === 'flavor two' && sc[2].cls === 'dim' && /^> ─+$/.test(sc[3].text) && sc[4].cls === 'blank', sc.map((b) => b.text));
  await p.click('.ed-dlg .ed-bar .x');

  // ---- another layer, by typing ----
  await send('[INITIATE ECHO PROTOCOL]');
  check('now in layer 2', (await p.evaluate(() => currentLevel)) === 2);
  await send('[LAYER]'); await p.waitForSelector('.ed-dlg'); await p.waitForTimeout(300);
  check('[LAYER] opens the window on the layer you are standing in, showing its sound', (await p.$eval('.ed-dlg .ed-bar .sub', (e) => e.textContent)) === 'L2A' && (await p.$eval('.ed-dlg .ed-snd .it.sel .nm b', (e) => e.textContent)) === 'CHORD');
  await dlgF('PRIMARY').locator('input[type=text]').fill('#00ff88'); await p.waitForTimeout(150);
  check('layer 2 repaints with its own color, layer 1 keeps its', (await css('--theme-full', true)) === '#00ff88' && (await data()).layers.l1a.colors.primary === '#ff00aa');
  await p.click('.ed-dlg .ed-bar .x');
  await p.fill('#t-field', '[LAYER PRIMARY]'); await p.waitForTimeout(80);
  check('the input lights for a layer command typed in full', await p.evaluate(() => document.getElementById('t-field').classList.contains('inverted')));
  await p.fill('#t-field', '');

  // ---- keeping it ----
  check('the draft autosaves the changes as a draft', await p.evaluate(() => JSON.parse(localStorage.getItem('echo_os_draft')).layers.l2a.colors.primary === '#00ff88'));
  const [dl] = await Promise.all([p.waitForEvent('download'), send('[EXPORT]')]);
  const path = await dl.path(); const exp = JSON.parse(require('fs').readFileSync(path, 'utf8'));
  check('[EXPORT] carries the layer settings', exp.layers.l2a.colors.primary === '#00ff88' && exp.layers.l1a.header_title === 'TEST ARCHIVE' && exp.screens.L1A_INTRO.body[1].text === 'FLAVOR ONE');
  console.log('page errors:', JSON.stringify(t.errs)); await t.done();
})();
