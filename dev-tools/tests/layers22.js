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
  check('the engine paints each layer from its own colors', (await css('--theme-full')) === d0.layers.l1a.colors.primary && (await p.evaluate(() => document.getElementById('theme-overrides').textContent.includes('body.layer-3a{--theme-full:#e05050'))));

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

  // ---- colors, live ----
  await p.click('#ctx .cr.ed:has-text("PRIMARY")'); await prompt();
  let o = await out();
  check('clicking PRIMARY asks for the color straight away', o.some((l) => l.includes('> PRIMARY COLOR AS HEX (ENTER = KEEP ' + d0.layers.l1a.colors.primary + ')')) && !o.some((l) => /WHICH (LAYER|SETTING)/.test(l)), o.slice(-4));
  await answer('red');
  for (let i = 0; i < 40; i++) { o = await out(); if (o.some((l) => l.includes('NOT A HEX COLOR')) && await p.evaluate(() => !!window.progWait)) break; await p.waitForTimeout(100); }
  check('a bad color is refused and asked again', o.some((l) => l.includes('NOT A HEX COLOR')) && await p.evaluate(() => !!window.progWait));
  await answer('#F0a'); await calm();
  check('a three digit color is accepted and normalized, and shows at once', (await css('--theme-full')) === '#ff00aa' && (await data()).layers.l1a.colors.primary === '#ff00aa', await css('--theme-full'));
  await send('[LAYER DIM]'); await answer('55%'); await calm();
  check('a strength accepts a percentage', (await data()).layers.l1a.colors.dim_opacity === 0.55);

  // ---- title ----
  await send('[LAYER TITLE]'); await answer('TEST ARCHIVE'); await calm();
  check('the header title changes on the page that is showing', (await p.evaluate(() => document.getElementById('t-title').textContent)) === 'TEST ARCHIVE' && (await data()).layers.l1a.header_title === 'TEST ARCHIVE');

  // ---- sound ----
  await send('[LAYER SOUND]'); await answer('rumble');
  for (let i = 0; i < 40; i++) { o = await out(); if (o.some((l) => l.includes('NO SOUND NAMED'))) break; await p.waitForTimeout(100); }
  check('an unknown sound is refused', o.some((l) => l.includes('NO SOUND NAMED')));
  await answer('sub-bass'); await calm();
  let a = (await data()).layers.l1a.ambient;
  check('a preset sets the tones and its volume', a.oscillators.length === 1 && a.oscillators[0].freq === 38 && a.target_volume === 0.05, a);
  await send('[LAYER VOLUME]'); await answer('0.5'); await calm();
  check('volume is set and the engine reads it', (await data()).layers.l1a.ambient.target_volume === 0.5 && (await p.evaluate(() => ambientCfg('l1a').target_volume)) === 0.5);
  await send('[LAYER SOUND]'); await answer('silent'); await calm();
  check('silent sets the volume to zero', (await data()).layers.l1a.ambient.target_volume === 0);

  // ---- intro text ----
  await send('[LAYER INTRO]'); await prompt(); o = await out();
  check('INTRO shows the current text first', o.some((l) => l.includes('ECHOES-ARCHIVE ACCESS GRANTED')), o.slice(-6));
  await answer('[CLEAR]'); await answer('Y'); await answer('FLAVOR ONE'); await answer('/dim flavor two'); await answer('[DONE]'); await calm();
  const sc = (await data()).screens.L1A_INTRO.body;
  check('the intro text is replaced, with the blank lines and rule kept around it', sc.length === 5 && sc[0].cls === 'blank' && sc[1].text === 'FLAVOR ONE' && sc[2].text === 'flavor two' && sc[2].cls === 'dim' && /^> ─+$/.test(sc[3].text) && sc[4].cls === 'blank', sc.map((b) => b.text));

  // ---- another layer, by typing ----
  await send('[INITIATE ECHO PROTOCOL]');
  check('now in layer 2', (await p.evaluate(() => currentLevel)) === 2);
  await send('[LAYER]'); await prompt(); o = await out();
  check('[LAYER] lists the layer you are standing in', o.some((l) => l.includes('L2A SETTINGS')) && o.some((l) => l.includes('SOUND') && l.includes('CHORD')), o.slice(-16));
  await answer('primary'); await answer('#00ff88'); await calm();
  check('layer 2 repaints with its own color, layer 1 keeps its', (await css('--theme-full', true)) === '#00ff88' && (await data()).layers.l1a.colors.primary === '#ff00aa');
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
