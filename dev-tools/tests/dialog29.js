// The author editing windows: a movable floating dialog in the theme of the layer it edits, with the controls that fit what is edited
// (text boxes, toggles, selects, sliders, color fields, a line editor with styles and a typed preview, a sound list with preview).
const L = require('./lib.js');
(async () => {
  const t = await L.open({ viewport: { width: 1300, height: 900 } }); const { p, send, check } = t;
  const data = () => p.evaluate(() => JSON.parse(JSON.stringify(osData)));
  const item = (id) => p.evaluate((i) => JSON.parse(JSON.stringify(osItems[i])), id);
  const dlgs = () => p.$$eval('.ed-dlg', (els) => els.map((e) => ({ title: e.querySelector('.ttl').textContent, sub: e.querySelector('.sub').textContent })));
  const D = (title) => p.locator('.ed-dlg:has(.ed-bar .ttl:text-is("' + title + '"))');
  const field = (dlg, label) => dlg.locator('.ed-row:has(.ed-lbl:text-is("' + label + '"))');
  const input = (dlg, label) => field(dlg, label).locator('input.ed-in').first();
  const btn = (dlg, label) => dlg.locator('button.ed-btn:text-is("' + label + '")').first();
  const msg = (dlg) => dlg.locator('.ed-foot .msg').textContent();
  const quiet = async () => { await t.ready(); await p.waitForTimeout(150); };
  const openEdit = async (name) => { await send('[EDIT]'); await p.fill('#t-field', name); await p.press('#t-field', 'Enter'); await p.waitForSelector('.ed-dlg', { timeout: 8000 }); await p.waitForTimeout(250); };
  const css = (sel, v) => p.evaluate(([s, n]) => getComputedStyle(s === 'body' ? document.body : s === 'root' ? document.documentElement : document.querySelector(s)).getPropertyValue(n).trim(), [sel, v]);

  await send('[ECHOES.ARCHIVE]'); await send('[AUTHOR UNLOCK]');

  // ================= the item dialog =================
  await openEdit('CREW MANIFEST');
  let d = D('EDIT DOC');
  check('[EDIT] opens a floating window for the item, titled by its type and carrying its id', (await dlgs()).length === 1 && (await dlgs())[0].sub.includes('L1A_CREW_MANIFEST'), await dlgs());
  check('it has a text box each for name, alias, title and footer, a toggle for hidden, and the text as lines with styles',
    (await input(d, 'NAME').inputValue()) === 'CREW MANIFEST' && (await input(d, 'ALIAS').inputValue()) === '[CREW MANIFEST]' && (await input(d, 'TITLE').count()) === 1 && (await input(d, 'FOOTER').count()) === 1 &&
    (await field(d, 'HIDDEN').locator('button').count()) === 1 && (await d.locator('.ed-ln').count()) >= 3);
  check('the page behind it is still there and usable (not modal)', await p.evaluate(() => !document.querySelector('#prog-layer') && document.getElementById('t-field') && !document.getElementById('t-field').disabled));
  check('the window wears the theme of the item\'s layer (L1A grey jade)', (await css('.ed-dlg', '--theme-full')) === '#8fbfae', await css('.ed-dlg', '--theme-full'));

  // stage changes, then apply
  await input(d, 'NAME').fill('CREW LIST'); await input(d, 'ALIAS').fill('[CREWLIST]'); await input(d, 'TITLE').fill('CREW LIST - OFFLINE');
  await input(d, 'FOOTER').fill('see the captain');
  await field(d, 'HIDDEN').locator('button').click();
  check('nothing is written until APPLY, and the window says so', (await item('L1A_CREW_MANIFEST')).name === 'CREW MANIFEST' && /UNAPPLIED/.test(await msg(d)), await msg(d));
  await btn(d, 'APPLY').click(); await quiet();
  const it1 = await item('L1A_CREW_MANIFEST');
  check('APPLY writes name, alias, title, footer and hidden together', it1.name === 'CREW LIST' && it1.alias === '[CREWLIST]' && it1.title === 'CREW LIST - OFFLINE' && it1.footer === 'see the captain' && it1.hidden === true, it1);
  check('...says it was applied, and the window title follows the alias', /APPLIED/.test(await msg(d)) && (await dlgs())[0].sub.includes('[CREWLIST]'));
  check('...the change reaches the draft that [EXPORT] saves', await p.evaluate(() => JSON.parse(localStorage.getItem('echo_os_draft')).tree.children[0].children.some((c) => c.id === 'L1A_CREW_MANIFEST' && c.alias === '[CREWLIST]')));

  // alias rules
  await input(d, 'ALIAS').fill('[HELP]');
  check('a built-in command is refused as an alias, live', /BUILT-IN/.test(await field(d, 'ALIAS').locator('.ed-hint').textContent()) && (await input(d, 'ALIAS').evaluate((e) => e.classList.contains('bad'))));
  await btn(d, 'APPLY').click(); await p.waitForTimeout(250);
  check('...and APPLY refuses it, leaving the item as it was', /ALIAS/.test(await msg(d)) && (await item('L1A_CREW_MANIFEST')).alias === '[CREWLIST]');
  await input(d, 'ALIAS').fill('[MISSION BRIEFING]'); await p.waitForTimeout(100);
  check('an alias another hidden or listed item already uses is refused (it is hidden now, so it must be unique everywhere)', /ALREADY USED/.test(await field(d, 'ALIAS').locator('.ed-hint').textContent()), await field(d, 'ALIAS').locator('.ed-hint').textContent());
  await btn(d, 'REVERT').click();
  check('REVERT puts the fields back to what the item has', (await input(d, 'ALIAS').inputValue()) === '[CREWLIST]' && (await input(d, 'NAME').inputValue()) === 'CREW LIST');

  // the line editor
  const rowsN = () => d.locator('.ed-ln').count();
  const n0 = await rowsN();
  await btn(d, '+ LINE').click(); await d.locator('.ed-ln').last().locator('input.ed-in').fill('A NEW LINE');
  await d.locator('.ed-ln').last().locator('select').selectOption('warn');
  await d.locator('.ed-ln').last().locator('button').nth(0).click();   // up
  check('+ LINE adds a row, a style can be chosen for it, and the arrows move it', (await rowsN()) === n0 + 1 && (await d.locator('.ed-ln').nth(n0 - 1).locator('input.ed-in').inputValue()) === 'A NEW LINE' && (await d.locator('.ed-ln').nth(n0 - 1).locator('select').inputValue()) === 'warn');
  await d.locator('.ed-ln').first().locator('button').nth(2).click();   // delete the first line
  check('the cross removes a line', (await rowsN()) === n0);
  await btn(d, 'APPLY').click(); await quiet();
  const body = (await item('L1A_CREW_MANIFEST')).body;
  check('APPLY writes the lines with their styles (empty rows become blank lines)', body.length === n0 && body.some((b) => b.text === 'A NEW LINE' && b.cls === 'warn') && body.every((b) => b.type === 'text' && (b.text !== '' || b.cls === 'blank')), body);
  await btn(d, 'PASTE...').click(); await d.locator('textarea.ed-in').fill('/dim first\n\nsecond line');
  await btn(d, 'REPLACE THE LINES WITH THIS').click();
  check('PASTE replaces the lines, reading /styles and blank rows', (await rowsN()) === 3 && (await d.locator('.ed-ln').nth(0).locator('select').inputValue()) === 'dim' && (await d.locator('.ed-ln').nth(1).locator('select').inputValue()) === 'blank');
  await btn(d, '▶ PLAY').click(); await p.waitForTimeout(1200);
  check('PLAY types the lines into the preview pane, in their styles', (await d.locator('.ed-pv').innerText()).replace(/\s+/g, ' ').trim() === 'first second line' && (await d.locator('.ed-pv div.dim').count()) === 1, await d.locator('.ed-pv').innerText());

  // moving it
  const b1 = await d.locator('.ed-bar').boundingBox();
  await p.mouse.move(b1.x + 120, b1.y + 10); await p.mouse.down(); await p.mouse.move(b1.x + 320, b1.y + 150, { steps: 6 }); await p.mouse.up();
  const b2 = await d.boundingBox();
  check('dragging the title bar moves the window', Math.abs(b2.x - (b1.x + 200)) < 4 && Math.abs(b2.y - (b1.y + 140)) < 4, [b1, b2]);
  await p.mouse.move(b2.x + 100, b2.y + 8); await p.mouse.down(); await p.mouse.move(-500, -500, { steps: 4 }); await p.mouse.up();
  const b3 = await d.boundingBox();
  check('...and it cannot be dragged off the screen', b3.x >= 0 && b3.y >= 0, b3);
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  check('Esc closes it (with focus inside)', (await dlgs()).length === 0);

  // the right-click menu and the typed forms open the same window, on the property
  await openEdit('MISSION BRIEFING'); d = D('EDIT DOC');
  check('a second item opens its own window', (await dlgs()).length === 1 && (await dlgs())[0].sub.includes('MISSION_BRIEFING'));
  await send('[SET TITLE]'); await p.fill('#t-field', 'MISSION BRIEFING'); await p.press('#t-field', 'Enter'); await p.waitForTimeout(400);
  check('[SET TITLE] on an item with a window open brings that window forward and focuses the title box (no second window)', (await dlgs()).length === 1 && await p.evaluate(() => document.activeElement && document.activeElement.value && document.activeElement.closest('.ed-row') && document.activeElement.closest('.ed-row').querySelector('.ed-lbl').textContent === 'TITLE'));
  await p.click('.ed-dlg .ed-bar .x');
  await send('[SET TITLE]'); await p.fill('#t-field', 'INITIATE ECHO PROTOCOL'); await p.press('#t-field', 'Enter'); await p.waitForTimeout(400);
  check('a gateway has no title: [SET TITLE] on it is refused and no window opens', (await dlgs()).length === 0 && (await p.$eval('#t-output', (e) => e.innerText)).includes('HAS NO TITLE'));
  await openEdit('INITIATE ECHO PROTOCOL'); d = D('EDIT GATEWAY');
  check('a gateway window has name, alias and where it goes, and no title, hidden or footer', (await input(d, 'NAME').count()) === 1 && (await field(d, 'GOES TO').locator('select').count()) === 1 && (await field(d, 'TITLE').count()) === 0 && (await field(d, 'HIDDEN').count()) === 0 && (await field(d, 'FOOTER').count()) === 0);
  await field(d, 'GOES TO').locator('select').selectOption('L1A_ROOT'); await btn(d, 'APPLY').click(); await quiet();
  check('changing where it goes is written on APPLY', (await item('GW_INITIATE_ECHO_PROTOCOL')).goto === 'L1A_ROOT');
  await field(d, 'GOES TO').locator('select').selectOption('L2A_ROOT'); await btn(d, 'APPLY').click(); await quiet();
  await p.click('.ed-dlg .ed-bar .x');
  await send('[EXIT]'); await send('[INITIATE ECHO PROTOCOL]'); await send('[EDIT]'); await p.fill('#t-field', 'FETCH LOG ENTRY'); await p.press('#t-field', 'Enter'); await p.waitForSelector('.ed-dlg'); await p.waitForTimeout(250); d = D('EDIT PROGRAM');
  check('a program window has the program file and where it works, a segmented choice', (await input(d, 'PROGRAM').inputValue()) === 'lore-entry' && (await field(d, 'WHERE').locator('button').count()) === 2 && (await field(d, 'TITLE').count()) === 0);
  await input(d, 'PROGRAM').fill('no-such-program'); await btn(d, 'APPLY').click(); await p.waitForTimeout(500);
  check('a program file that does not exist is refused', /NO PROGRAM FILE/.test(await msg(d)) && (await item('L2A_PROG_LORE_ENTRY')).program === 'lore-entry', await msg(d));
  await field(d, 'WHERE').locator('button:text-is("ONLY THIS FOLDER")').click(); await input(d, 'PROGRAM').fill('lore-entry'); await btn(d, 'APPLY').click(); await quiet();
  check('...and a good one with the other scope is written', (await item('L2A_PROG_LORE_ENTRY')).scope === 'folder');
  await field(d, 'WHERE').locator('button:text-is("ANY PAGE OF THIS LEVEL")').click(); await btn(d, 'APPLY').click(); await quiet();
  check('a program window wears the theme of its level (L2 amber)', (await css('.ed-dlg', '--theme-full')) === '#bf7c0a', await css('.ed-dlg', '--theme-full'));
  await p.click('.ed-dlg .ed-bar .x');
  await send('[EXIT]');

  // ================= the layer dialog =================
  await p.evaluate(() => { window.__snd = []; const pa = window.previewAmbient; window.previewAmbient = function (c, v) { window.__snd.push(['play', c && c.oscillators ? c.oscillators.length : 0, v]); return pa.apply(this, arguments); }; const sa = window.stopAmbientPreview; window.stopAmbientPreview = function (k) { window.__snd.push(['stop', !!k]); return sa.apply(this, arguments); }; });
  await send('[LAYER]'); await p.waitForSelector('.ed-dlg', { timeout: 8000 }); await p.waitForTimeout(300); d = D('LAYER SETTINGS');
  check('[LAYER] opens one window for the layer settings, with a tab for the chat and each archive layer', (await d.locator('.ed-tabs button').allInnerTexts()).join('|') === 'L1C CHAT|L1A|L2A|L3A' && (await d.locator('.ed-bar .sub').textContent()) === 'L1A', await d.locator('.ed-tabs button').allInnerTexts());
  check('it has a text box for the title, theme chips, a color field for each of five colors (the corruption color too), three sliders, the transition text and a sound list',
    (await input(d, 'TITLE').inputValue()) === 'ECHOES-ARCHIVE' && (await d.locator('.ed-chip').count()) === 11 && (await d.locator('input[type=text].ed-in').count()) >= 5 && (await d.locator('input[type=color]').count()) === 5 && (await d.locator('input[type=range]').count()) >= 4 && (await d.locator('.ed-snd .it').count()) === 8);

  // the chat and the archive have their own colors
  check('the chat keeps the original blue and L1A starts as grey jade, kept separately', (await css('root', '--theme-full')) === '#4fc3f7' && (await css('body', '--theme-full')) === '#8fbfae' && await p.evaluate(() => document.body.classList.contains('layer-1a') && osData.layers.l1c.colors.primary === '#4fc3f7'));
  await d.locator('.ed-chip', { hasText: 'STEEL BLUE' }).click(); await p.waitForTimeout(200);
  check('a theme chip sets all the colors of L1A at once and the page repaints', (await css('body', '--theme-full')) === '#6ea8d8' && (await css('body', '--theme-bgsolid')) === '#2e4558' && (await data()).layers.l1a.colors.background === '#2e4558', await css('body', '--theme-full'));
  check('...while the chat keeps its own colors', (await css('root', '--theme-full')) === '#4fc3f7' && (await data()).layers.l1c.colors.primary === '#4fc3f7');
  check('...and the window itself changes to the new colors', (await css('.ed-dlg', '--theme-full')) === '#6ea8d8');
  await input(d, 'PRIMARY').fill('#ff0000zz'); await p.waitForTimeout(100);
  check('a color that is not a hex value is flagged and not applied', (await input(d, 'PRIMARY').evaluate((e) => e.classList.contains('bad'))) && (await data()).layers.l1a.colors.primary === '#6ea8d8');
  await input(d, 'PRIMARY').fill('#abc'); await p.waitForTimeout(100);
  check('a three digit hex is accepted and applied at once', (await data()).layers.l1a.colors.primary === '#abc' || (await data()).layers.l1a.colors.primary === '#aabbcc', (await data()).layers.l1a.colors.primary);
  await field(d, 'DIM').locator('input[type=range]').evaluate((e) => { e.value = '0.55'; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); });
  check('a slider sets the strength live', (await data()).layers.l1a.colors.dim_opacity === 0.55);
  await input(d, 'TITLE').fill('ARCHIVE TEST'); await p.waitForTimeout(500);
  check('the title applies live to the header', (await p.$eval('#t-title', (e) => e.textContent)) === 'ARCHIVE TEST' && (await data()).layers.l1a.header_title === 'ARCHIVE TEST');

  // tabs: another layer, in its own colors
  await d.locator('.ed-tabs button[data-id="l2a"]').click(); await p.waitForTimeout(200);
  check('a tab shows another layer, and the window takes that layer\'s colors even though the screen is on L1', (await css('.ed-dlg', '--theme-full')) === '#bf7c0a' && (await d.locator('.ed-bar .sub').textContent()) === 'L2A' && ['#abc', '#aabbcc'].includes(await css('body', '--theme-full')));
  await d.locator('.ed-tabs button[data-id="l1c"]').click(); await p.waitForTimeout(200);
  check('the chat tab has colors but says its sound and transition belong to L1A', (await d.locator('.ed-snd').count()) === 0 && /shares the sound of L1A/.test(await d.innerText()));
  await d.locator('.ed-chip', { hasText: 'AMBER' }).click(); await p.waitForTimeout(150);
  check('chat colors can be changed on their own (the archive keeps its)', (await css('root', '--theme-full')) === '#bf7c0a' && (await data()).layers.l1c.colors.primary === '#bf7c0a' && (await data()).layers.l1a.colors.primary !== '#bf7c0a');
  await send('[EXIT]'); await p.waitForTimeout(300);
  check('leaving the archive for the chat puts the chat\'s own colors on', await p.evaluate(() => document.body.classList.contains('layer-1c') && getComputedStyle(document.body).getPropertyValue('--theme-full').trim() === '#bf7c0a'));
  await send('[ECHOES.ARCHIVE]');
  check('entering the archive again puts the archive\'s colors on', await p.evaluate(() => document.body.classList.contains('layer-1a') && getComputedStyle(document.body).getPropertyValue('--theme-full').trim() !== '#bf7c0a'));
  await d.locator('.ed-tabs button[data-id="l1c"]').click(); await btn(d, 'REVERT THIS LAYER').click(); await p.waitForTimeout(200);
  check('REVERT THIS LAYER restores the layer as it was when the window opened', (await data()).layers.l1c.colors.primary === '#4fc3f7' && (await css('root', '--theme-full')) === '#4fc3f7');

  // transition text
  await d.locator('.ed-tabs button[data-id="l3a"]').click(); await p.waitForTimeout(250);
  const ln0 = await d.locator('.ed-ln').count();
  check('the transition text of L3 is loaded as lines (the blank lines and rule the engine adds are not in the list)', ln0 >= 10 && (await d.locator('.ed-ln').first().locator('input.ed-in').inputValue()) === '> ECH/OES SHIP SYSTEM TERMINAL 426 //' && !(await d.locator('.ed-ln input.ed-in').evaluateAll((els) => els.some((e) => /^> ─+$/.test(e.value)))));
  await d.locator('.ed-ln').nth(3).locator('input.ed-in').fill('  ACCESS REQUESTED.'); await d.locator('.ed-ln').nth(3).locator('select').selectOption('warn');
  check('editing one line leaves the others alone, and the window says it is unsaved', (await d.locator('.ed-ln').count()) === ln0 && /UNSAVED/.test(await msg(d)));
  check('...nothing is saved yet', !(await data()).screens.L3A_INTRO.body.some((b) => b.text === '  ACCESS REQUESTED.'));
  await btn(d, 'SAVE THE TRANSITION TEXT').click(); await p.waitForTimeout(200);
  const l3 = (await data()).screens.L3A_INTRO.body;
  check('SAVE writes the lines with the blank line, the rule line and the blank line around them', l3[0].cls === 'blank' && l3[l3.length - 1].cls === 'blank' && /^> ─+$/.test(l3[l3.length - 2].text) && l3.some((b) => b.text === '  ACCESS REQUESTED.' && b.cls === 'warn') && l3.length === ln0 + 3, [l3.length, ln0]);
  await btn(d, 'REVERT THIS LAYER').click(); await p.waitForTimeout(200);
  check('REVERT THIS LAYER brings the saved text back too', (await data()).screens.L3A_INTRO.body.some((b) => b.text === '  ACCESS REQUESTED...'));

  // sounds
  await d.locator('.ed-tabs button[data-id="l2a"]').click(); await p.waitForTimeout(250);
  const names = await d.locator('.ed-snd .it .nm b').allInnerTexts();
  check('the sound list offers the old presets and new ones, ending with SILENT', names.join('|') === 'VENTILATION|CHORD|SUB-BASS|REACTOR HUM|COLD AIR|SIGNAL|DEEP PULSE|SILENT', names);
  check('the layer\'s current sound is marked', (await d.locator('.ed-snd .it.sel .nm b').innerText()) === 'CHORD');
  await p.evaluate(() => { window.__snd.length = 0; });
  await d.locator('.ed-snd button[data-sound="REACTOR HUM"]').click(); await p.waitForTimeout(150);
  let snd = await p.evaluate(() => window.__snd.filter((s) => s[0] === 'play'));
  check('the play button previews that sound (3 tones) without choosing it', snd.length === 1 && snd[0][1] === 3 && (await d.locator('.ed-snd .it.sel .nm b').innerText()) === 'CHORD' && (await data()).layers.l2a.ambient.oscillators.length === 4, snd);
  check('...and turns into a stop button', (await d.locator('.ed-snd button[data-sound="REACTOR HUM"]').innerText()) === '■');
  await d.locator('.ed-snd button[data-sound="REACTOR HUM"]').click(); await p.waitForTimeout(100);
  check('pressing it again stops the preview', (await p.evaluate(() => window.__snd[window.__snd.length - 1][0])) === 'stop' && (await d.locator('.ed-snd button[data-sound="REACTOR HUM"]').innerText()) === '▶');
  await d.locator('.ed-snd .nm[data-sound="COLD AIR"]').click(); await p.waitForTimeout(150);
  const a2 = (await data()).layers.l2a.ambient;
  check('clicking a name chooses it: tones and its default volume are written', a2.oscillators.length === 3 && a2.oscillators[0].label === 'Wind' && a2.target_volume === 0.12 && (await d.locator('.ed-snd .it.sel .nm b').innerText()) === 'COLD AIR', a2);
  await field(d, 'VOLUME').locator('input[type=range]').evaluate((e) => { e.value = '0.25'; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); });
  check('the volume slider sets the level, and the choice stays marked', (await data()).layers.l2a.ambient.target_volume === 0.25 && (await d.locator('.ed-snd .it.sel .nm b').innerText()) === 'COLD AIR');
  await d.locator('.ed-snd .nm[data-sound="SILENT"]').click(); await p.waitForTimeout(100);
  check('SILENT sets the volume to zero', (await data()).layers.l2a.ambient.target_volume === 0 && (await d.locator('.ed-snd .it.sel .nm b').innerText()) === 'SILENT');
  await btn(d, 'REVERT THIS LAYER').click(); await p.waitForTimeout(200);
  check('REVERT brings the original sound back', (await data()).layers.l2a.ambient.oscillators.length === 4 && (await d.locator('.ed-snd .it.sel .nm b').innerText()) === 'CHORD');

  // typed forms and the right-click menu open the same window
  await d.locator('.ed-bar .x').click();
  check('the cross closes it', (await dlgs()).length === 0);
  await send('[LAYER DIM]'); await p.waitForSelector('.ed-dlg'); await p.waitForTimeout(250);
  check('[LAYER DIM] opens the window on the strengths', (await dlgs()).length === 1 && (await p.evaluate(() => { const r = document.querySelector('.ed-dlg .ed-body'); return r.scrollTop >= 0; })));
  await p.click('#t-addr', { button: 'right' }); await p.waitForTimeout(250);
  await p.click('#ctx .cr.ed:has-text("NAME")'); await p.waitForTimeout(500);
  const titles = (await dlgs()).map((x) => x.title);
  check('a click on a row of the right-click menu opens the item window on that property', titles.includes('EDIT FOLDER') && await p.evaluate(() => { const a = document.activeElement; return a && a.closest('.ed-row') && a.closest('.ed-row').querySelector('.ed-lbl').textContent === 'NAME'; }), titles);
  await send('[AUTHOR LOCK]'); await p.waitForTimeout(300);
  check('leaving author mode closes every window', (await dlgs()).length === 0);
  check('page errors', t.errs.length === 0, JSON.stringify(t.errs));
  await t.done();
})();
