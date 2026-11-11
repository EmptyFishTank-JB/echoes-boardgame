const L = require('./lib.js');
(async () => {
  const t = await L.open({ stubs: true });
  const { p, send, out, check } = t;
  const prompt = () => p.waitForFunction(() => termState === 'PROGRAM' && !!progWait && uiLock === 0, null, { timeout: 8000 }).then(() => p.waitForTimeout(80)).catch(() => {});
  const calm = async () => { await p.waitForFunction(() => uiLock === 0 && !isResponding, null, { timeout: 8000 }).catch(() => {}); await t.ready(); };
  const itemSel = (name) => `#t-output .t-line.act:has(.lb:text-is("${name}"))`;
  const st = () => p.evaluate(() => termState);
  const val = () => p.inputValue('#t-field');

  // ---- glyphs --------------------------------------------------------------
  let g = await p.evaluate(() => { const e = Array.from(document.querySelectorAll('#t-output .t-line.act')).map(x => ({ g: x.querySelector('.gl') && x.querySelector('.gl').textContent.trim(), c: x.dataset.cmd })); return e; });
  check('chat landing does not list [ECHOES.ARCHIVE] (it is a hidden command)', g.length === 0 && !(await out()).some(l => l.includes('[ECHOES.ARCHIVE]')), JSON.stringify(g));
  await send('[ECHOES.ARCHIVE]');
  g = await p.evaluate(() => Object.fromEntries(Array.from(document.querySelectorAll('#t-output .t-line.act')).map(x => [x.dataset.cmd, x.querySelector('.gl').textContent.trim()])));
  check('archive listing: folder, doc and up glyphs', g['[INCIDENT REPORTS]'] === '\\' && g['[CREW MANIFEST]'] === '≡' && g['[EXIT]'] === '↰', JSON.stringify(g));
  const o0 = await out(); check('typed text is still the bare [COMMAND] (glyph normalizes away)', o0.includes('[CREW MANIFEST]'));

  // ---- hover populates the field, leaving restores it ----------------------
  await p.fill('#t-field', 'abc');
  await p.hover(itemSel('[CREW MANIFEST]'));
  check('hover puts the command in the field', (await val()) === '[CREW MANIFEST]', await val());
  check('hover highlights the item and the field', await p.evaluate(() => document.querySelector('#t-output .t-line.inverted .lb').textContent === '[CREW MANIFEST]' && document.getElementById('t-field').classList.contains('inverted')));
  await p.mouse.move(5, 5);
  check('leaving restores what was typed', (await val()).toLowerCase() === 'abc', await val());
  await p.fill('#t-field', '');
  await p.hover(itemSel('[CREW MANIFEST]')); await p.hover(itemSel('[MISSION BRIEFING]'));
  check('moving item to item swaps the command', (await val()) === '[MISSION BRIEFING]', await val());
  await p.mouse.move(5, 5);
  check('and an empty field comes back empty', (await val()) === '', JSON.stringify(await val()));

  // ---- click runs it -------------------------------------------------------
  await p.click(itemSel('[CREW MANIFEST]')); await calm();
  check('click opens the item', (await st()) === 'L1A_CREW_MANIFEST', await st());
  check('field is empty after a click', (await val()) === '');
  await p.click(itemSel('[BACK]')); await calm();
  check('click [BACK] goes up', (await st()) === 'L1A_ROOT', await st());
  await p.click(itemSel('[EXIT]')); await calm();
  check('click [EXIT] returns to the chat', (await st()) === 'L1_NORMAL', await st());
  await send('[ECHOES.ARCHIVE]');
  check('the hidden command still enters the archive when typed', (await st()) === 'L1A_ROOT', await st());

  // ---- locked while drawing: clicks do nothing -----------------------------
  await p.evaluate(() => { window.__busy = true; uiLock++; });
  await p.click(itemSel('[CREW MANIFEST]')); await p.waitForTimeout(150);
  check('a click while the engine is busy is ignored', (await st()) === 'L1A_ROOT', await st());
  await p.evaluate(() => { uiLock--; });

  // ---- pointer -------------------------------------------------------------
  let cur = await p.evaluate(() => ({ d: getComputedStyle(document.body).cursor, a: getComputedStyle(document.querySelector('#t-output .t-line.act')).cursor, t: getComputedStyle(document.getElementById('t-field')).cursor, v: document.documentElement.style.getPropertyValue('--cur-act') }));
  check('custom pointers are applied', cur.d.startsWith('url(') && cur.a.startsWith('url(') && cur.t.startsWith('url('), JSON.stringify(cur).slice(0, 200));
  check('layer 1 pointer uses the layer-1 color', decodeURIComponent(cur.v).includes('#4fc3f7'), decodeURIComponent(cur.v).slice(0, 160));
  await send('[INITIATE ECHO PROTOCOL]'); await calm();
  cur = await p.evaluate(() => ({ v: document.documentElement.style.getPropertyValue('--cur-act') }));
  check('entering layer 2 recolors the pointer', decodeURIComponent(cur.v).includes('#bf7c0a'), decodeURIComponent(cur.v).slice(0, 160));
  await send('[EXIT]'); await send('[EXIT]'); await send('[ECHOES.ARCHIVE]');

  // ---- author mode: hidden items shown dimmed with an eye ------------------
  await send('[AUTHOR UNLOCK]');
  const plan = await p.evaluate(() => Array.from(document.querySelectorAll('#t-output .t-line[data-id]')).map(x => ({ id: x.dataset.id, off: !!x.querySelector('.eye.off'), dim: x.classList.contains('lo'), act: x.classList.contains('act'), g: x.querySelector('.gl') && x.querySelector('.gl').textContent.trim() })));
  const gw = plan.find(x => x.id === 'GW_INITIATE_ECHO_PROTOCOL');
  check('author listing includes the hidden gateway, dimmed, closed eye, » glyph, still clickable', gw && gw.off && gw.dim && gw.g === '»' && gw.act, JSON.stringify(plan));
  check('visible items have an open eye', plan.filter(x => !x.off).length === 6 && plan.filter(x => !x.off).every(x => x.g), JSON.stringify(plan.filter(x => !x.off).map(x => x.id)));
  await send('[INCIDENT REPORTS]');
  const stubs = await p.evaluate(() => Array.from(document.querySelectorAll('#t-output .t-line[data-id*="STUB"]')).map(x => ({ off: !!x.querySelector('.eye.off'), dim: x.classList.contains('lo'), act: x.classList.contains('act') })));
  check('stubs are listed dimmed and not openable', stubs.length === 2 && stubs.every(s => s.off && s.dim && !s.act), JSON.stringify(stubs));
  await p.click(itemSel('[BACK]')); await calm();

  // ---- eye click toggles ---------------------------------------------------
  await p.click('#t-output .t-line[data-id="L1A_SYSTEM_LOGS"] .eye'); await calm();
  let hid = await p.evaluate(() => ({ h: osItems.L1A_SYSTEM_LOGS.hidden, off: !!document.querySelector('#t-output .t-line[data-id="L1A_SYSTEM_LOGS"] .eye.off') }));
  check('clicking the eye hides the item (still shown, dimmed, closed eye)', hid.h === true && hid.off, JSON.stringify(hid));
  await p.click('#t-output .t-line[data-id="L1A_SYSTEM_LOGS"] .eye'); await calm();
  hid = await p.evaluate(() => ({ h: osItems.L1A_SYSTEM_LOGS.hidden, off: !!document.querySelector('#t-output .t-line[data-id="L1A_SYSTEM_LOGS"] .eye.off') }));
  check('clicking again lists it', hid.h === false && !hid.off, JSON.stringify(hid));
  await p.click('#t-output .t-line[data-id="GW_INITIATE_ECHO_PROTOCOL"] .eye'); await calm();
  check('a gateway eye does not toggle (always hidden)', (await p.evaluate(() => osItems.GW_INITIATE_ECHO_PROTOCOL.hidden)) === true && (await out()).some(l => l.includes('ALWAYS HIDDEN')));

  // ---- context menu: item --------------------------------------------------
  await p.click(itemSel('[CREW MANIFEST]'), { button: 'right' });
  let menu = await p.evaluate(() => { const m = document.getElementById('ctx'); return m ? Array.from(m.querySelectorAll('.ci')).map(x => x.textContent) : null; });
  check('right-click on an item opens its menu', menu && menu.some(x => x.startsWith('OPEN')) && menu.some(x => x.startsWith('EDIT')) && menu.some(x => x.includes('[RM]')), JSON.stringify(menu));
  check('right-click did not also open the item', (await st()) === 'L1A_ROOT');
  await p.hover('#ctx .cr.ed:has-text("ALIAS")');
  check('hovering an info row shows its command in the field', (await val()) === '[ALIAS]', await val());
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  await p.mouse.move(5, 5); await p.waitForTimeout(100);
  check('Escape closes the menu and does not leave the folder', !(await p.$('#ctx')) && (await st()) === 'L1A_ROOT' && (await val()) === '', await val());
  await p.click(itemSel('[CREW MANIFEST]'), { button: 'right' });
  await p.click('#ctx .ci:has-text("[EDIT]")'); await prompt();
  let all = await out();
  check('EDIT from the menu skips the "which item" question', all.some(l => l.includes('L1A_CREW_MANIFEST') && l.includes('doc')) && all.some(l => l.includes('> NAME (ENTER = KEEP')) && !all.some(l => l.includes('EDIT WHICH ITEM')), JSON.stringify(all.slice(-6)));
  await p.press('#t-field', 'Escape'); await calm();

  // ---- context menu: empty space -------------------------------------------
  const box = await p.evaluate(() => { const r = document.getElementById('t-output').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await p.mouse.click(box.x + box.w - 60, box.y + 40, { button: 'right' });
  menu = await p.evaluate(() => { const m = document.getElementById('ctx'); return m ? Array.from(m.querySelectorAll('.ci')).map(x => x.textContent) : null; });
  check('right-click on empty space opens the create menu', menu && ['[MKDIR]', '[NEW DOC]', '[NEW LOG]', '[NEW PROGRAM]', '[NEW GATEWAY]', '[EXPORT]', '[TREE]'].every(c => menu.some(x => x.includes(c))), JSON.stringify(menu));
  await p.click('#ctx .ci:has-text("[MKDIR]")'); await prompt();
  all = await out();
  check('NEW FOLDER from the menu starts the [MKDIR] prompts', all.some(l => l.includes('> FOLDER NAME:')), JSON.stringify(all.slice(-4)));
  await p.fill('#t-field', 'MENU MADE'); await p.press('#t-field', 'Enter'); await prompt();
  for (const a of ['', '', '']) { await p.fill('#t-field', a); await p.press('#t-field', 'Enter'); await prompt().catch(() => {}); await p.waitForTimeout(100); }
  await calm();
  check('the folder made through the menu exists and is listed', (await out()).includes('[MENU MADE]') && (await p.evaluate(() => !!osItems.L1A_MENU_MADE)));

  // ---- delete from the menu --------------------------------------------------
  await p.click(itemSel('[MENU MADE]'), { button: 'right' });
  await p.click('#ctx .ci:has-text("[RM]")'); await prompt();
  await p.fill('#t-field', 'Y'); await p.press('#t-field', 'Enter'); await calm();
  check('DELETE from the menu removes it after a Y', !(await p.evaluate(() => !!osItems.L1A_MENU_MADE)) && (await out()).some(l => l.includes('DELETED 1 ITEM')));

  // ---- the current page's own menu (a doc page) -------------------------------
  await p.click(itemSel('[MISSION BRIEFING]')); await calm();
  const dm = await p.mouse.click(box.x + box.w - 60, box.y + 40, { button: 'right' });
  menu = await p.evaluate(() => { const m = document.getElementById('ctx'); return m ? { h: m.querySelector('.ch').textContent, e: Array.from(m.querySelectorAll('.ci')).map(x => x.textContent) } : null; });
  check('a doc page offers its own edit/move/delete, not the create commands', menu && menu.h.startsWith('THIS PAGE') && menu.e.some(x => x.includes('[EDIT]')) && !menu.e.some(x => x.includes('[MKDIR]')), JSON.stringify(menu));
  await p.click('#ctx .ci:has-text("[RM]")'); await prompt();
  await p.fill('#t-field', 'N'); await p.press('#t-field', 'Enter'); await calm();
  check('declining the delete keeps the doc', await p.evaluate(() => !!osItems.L1A_MISSION_BRIEFING));
  await p.click('#t-output .t-line.act:has(.lb:text-is("[BACK]"))'); await calm();

  // ---- player view: no eyes, no menu ------------------------------------------
  await send('[AUTHOR LOCK]');
  const pl = await p.evaluate(() => ({ eyes: document.querySelectorAll('#t-output .eye').length, ids: Array.from(document.querySelectorAll('#t-output .t-line[data-id]')).map(x => x.dataset.id) }));
  check('locking author mode redraws the player view: no eyes, no hidden items', pl.eyes === 0 && !pl.ids.includes('GW_INITIATE_ECHO_PROTOCOL'), JSON.stringify(pl));
  await p.click(itemSel('[CREW MANIFEST]'), { button: 'right' });
  check('no context menu for players', !(await p.$('#ctx')));
  await t.done();
})();
