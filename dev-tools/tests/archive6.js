const L = require('./lib.js');
(async () => {
  const t = await L.open({ stubs: true });
  const { p, send, out, check } = t;
  const calm = async () => { await p.waitForFunction(() => uiLock === 0 && !isResponding, null, { timeout: 15000 }).catch(() => {}); await t.ready(); };
  const prompt = () => p.waitForFunction(() => termState === 'PROGRAM' && !!progWait && uiLock === 0, null, { timeout: 8000 }).then(() => p.waitForTimeout(80)).catch(() => {});
  const st = () => p.evaluate(() => termState);
  const sample = () => p.evaluate(() => { window.__s = []; clearInterval(window.__iv); window.__iv = setInterval(() => window.__s.push({ cls: [...document.body.classList].find(c => /^layer-/.test(c)), txt: document.getElementById('t-output').innerText, st: termState }), 20); });
  const stopSample = () => p.evaluate(() => { clearInterval(window.__iv); return window.__s; });
  const first = (arr, f) => arr.findIndex(f);

  // ---- mount line when entering the archive ---------------------------------
  await sample(); await send('[ECHOES.ARCHIVE]'); let s = await stopSample();
  check('entering the archive prints a mount line first', s.some(x => x.txt.includes('MOUNTING ECHOES:\\')), 'none of ' + s.length + ' samples');
  check('the mount line is not left in the archive page or in the chat history', !(await out()).some(l => l.includes('MOUNTING')));

  // ---- table listing ---------------------------------------------------------
  let o = await out();
  check('listing has a TYPE / SIZE / NAME header', o.some(l => /^TYPE\s+SIZE\s+NAME$/.test(l)));
  const cols = await p.evaluate(() => Array.from(document.querySelectorAll('#t-output .t-line.act .col')).map(e => e.textContent.replace(/\s+/g, ' ').trim()));
  check('row columns are TYPE then SIZE', JSON.stringify(cols) === JSON.stringify(['DOC 3 LINES', 'DOC 3 LINES', 'DIR 3 ITEMS', 'DIR 2 ITEMS', 'DOC 3 LINES', 'DIR 3 ITEMS', 'UP']), JSON.stringify(cols));
  check('status line under the list', o.some(l => l === '6 ITEMS   L1'), JSON.stringify(o.slice(-4)));

  // ---- archive frame and address bar ------------------------------------------
  const frame = () => p.evaluate(() => ({ arch: document.body.classList.contains('in-archive'), border: getComputedStyle(document.getElementById('terminal-box')).borderTopStyle, addr: getComputedStyle(document.getElementById('t-addr')).display, path: document.getElementById('t-addr').textContent, crumb: getComputedStyle(document.getElementById('t-breadcrumb')).opacity }));
  let f = await frame();
  check('archive: dashed frame, address bar shown, header breadcrumb hidden', f.arch && f.border === 'dashed' && f.addr === 'flex' && f.crumb === '0', JSON.stringify(f));
  check('address bar reads like a path', f.path.includes('ECHOES:') && f.path.includes('ECHOES.ARCHIVE') && f.path.endsWith('L1'), f.path);
  await p.click('#t-output .t-line.act:has(.lb:text-is("[INCIDENT REPORTS]"))'); await calm();
  f = await frame();
  check('address bar follows the folder', f.path.replace(/\s/g, '') === 'ECHOES:\\ECHOES.ARCHIVE\\INCIDENTREPORTSL1' || /INCIDENT REPORTS/.test(f.path), f.path);
  await p.click('#t-addr .seg.go'); await calm();
  check('clicking a path segment jumps there', (await st()) === 'L1A_ROOT', await st());
  await p.click('#t-output .t-line.act:has(.lb:text-is("[INCIDENT REPORTS]"))'); await calm();
  await p.click('#t-addr .up'); await calm();
  check('the up arrow in the address bar goes back one level', (await st()) === 'L1A_ROOT', await st());
  await p.click('#t-output .t-line.act:has(.lb:text-is("[CREW MANIFEST]"))'); await calm();
  o = await out();
  check('a doc page shows its status line', o.some(l => l === 'DOC   L1'), JSON.stringify(o.slice(-4)));
  await p.click('#t-addr .seg.go'); await calm();

  // ---- unmount line and plain chat frame ----------------------------------------
  await p.click('#t-addr .up'); await calm();
  f = await frame();
  o = await out();
  check('chat: no dashed frame, no address bar', !f.arch && f.border !== 'dashed' && f.addr === 'none', JSON.stringify(f));
  check('leaving prints an unmount line', o.some(l => l.includes('ECHOES:\\ UNMOUNTED')), JSON.stringify(o.slice(-4)));
  check('chat keeps one blinking cursor', (await p.evaluate(() => document.querySelectorAll('#t-output .t-cursor').length)) === 1);

  // ---- tier transition: theme changes after the flavor text, before the destination --------
  await send('[ECHOES.ARCHIVE]');
  await sample(); await send('[INITIATE ECHO PROTOCOL]'); s = await stopSample();
  const iLast = first(s, x => x.txt.includes('> ECHO PROTOCOL ACTIVE.'));
  const iFirstText = first(s, x => x.txt.includes('> INITIATING ECHO PROTOCOL'));
  const iTheme = first(s, x => x.cls === 'layer-2a');
  const iPage = first(s, x => x.st === 'L2A_ROOT');
  check('flavor text starts in the old theme', iFirstText >= 0 && s[iFirstText].cls === 'layer-1a', JSON.stringify([iFirstText, s[iFirstText] && s[iFirstText].cls]));
  check('every sample before the last flavor line is still layer 1', iLast > 0 && s.slice(0, iLast + 1).every(x => x.cls === 'layer-1a'), JSON.stringify({ iLast, firstL2: iTheme }));
  check('the theme switches after the last flavor line', iTheme > iLast, JSON.stringify({ iLast, iTheme }));
  check('the destination page is drawn after the theme switch', iPage > iTheme, JSON.stringify({ iTheme, iPage }));
  check('we end up on the L2 root in layer 2', (await st()) === 'L2A_ROOT' && (await p.evaluate(() => currentLevel)) === 2);

  // ---- program window ---------------------------------------------------------------
  await send('[FETCH LOG ENTRY: //]'); await p.waitForSelector('#prog-layer.open .le-code'); await p.waitForTimeout(300);
  const win = await p.evaluate(() => {
    const w = document.querySelector('.prog-win').getBoundingClientRect(), t = document.querySelector('.prog-tint').getBoundingClientRect(), bar = document.querySelector('.prog-bar');
    return { ww: w.width, wh: w.height, vw: innerWidth, vh: innerHeight, cx: Math.round(w.left + w.width / 2), cy: Math.round(w.top + w.height / 2), tint: [t.width, t.height], hit: !!document.elementFromPoint(10, 10).closest('#prog-layer'),
      barBg: getComputedStyle(bar).backgroundColor, theme: getComputedStyle(document.body).getPropertyValue('--theme-full').trim(), ttl: document.querySelector('.prog-bar .ttl').textContent, exe: document.querySelector('.prog-bar .exe').textContent, bodyCls: document.body.className };
  });
  check('a program opens in a window smaller than the screen, centered', win.ww < win.vw && win.wh < win.vh && Math.abs(win.cx - win.vw / 2) < 3 && Math.abs(win.cy - win.vh / 2) < 3, JSON.stringify(win));
  check('everything on screen sits under a tint (the header too)', win.tint[0] === win.vw && win.tint[1] === win.vh && win.hit, JSON.stringify(win));
  check('title bar is a solid filled strip with the title and .EXE name', win.barBg !== 'rgba(0, 0, 0, 0)' && /FETCH LOG/.test(win.ttl) && /FETCH LOG\.EXE/.test(win.exe), JSON.stringify([win.barBg, win.ttl, win.exe]));
  await p.mouse.click(300, 300); await p.waitForTimeout(120);
  check('the page behind is inert while the window is open', (await st()) === 'PROGRAM' && !!(await p.$('#prog-layer.open')));
  await p.click('#prog-layer .prog-bar .x'); await calm();
  const after = await p.evaluate(() => ({ open: !!document.getElementById('prog-layer'), st: termState }));
  check('[X] closes the window and the page comes back', !after.open && after.st === 'L2A_ROOT', JSON.stringify(after));
  check('closing is noted in the terminal', (await out()).some(l => l.includes('FETCH LOG.EXE CLOSED')), JSON.stringify((await out()).slice(-4)));

  // ---- author tree: click to jump -----------------------------------------------------
  await send('[AUTHOR UNLOCK]'); await send('[TREE]');
  const jl = await p.evaluate(() => Array.from(document.querySelectorAll('#t-output .t-line[data-jump]')).map(e => e.dataset.jump));
  check('author tree lines are clickable', jl.includes('L1A_INCIDENT') && jl.includes('L3A_ROOT') && jl.includes('GW_INITIATE_ECHO_PROTOCOL'), JSON.stringify(jl));
  check('the current page is marked', (await out()).some(l => l.includes('◄ HERE')));
  await p.hover('#t-output .t-line[data-jump="L1A_INCIDENT"]');
  check('hovering a tree line highlights it', await p.evaluate(() => document.querySelector('#t-output .t-line.inverted') && document.querySelector('#t-output .t-line.inverted').dataset.jump === 'L1A_INCIDENT'));
  await p.click('#t-output .t-line[data-jump="L1A_INCIDENT"]'); await calm();
  let lv = await p.evaluate(() => ({ st: termState, lvl: currentLevel, cls: [...document.body.classList].find(c => /^layer-/.test(c)) }));
  check('click a tree item: jumps straight to it, across tiers', lv.st === 'L1A_INCIDENT' && lv.lvl === 1, JSON.stringify(lv));
  await send('[TREE]'); await p.click('#t-output .t-line[data-jump="L3A_ROOT"]'); await calm();
  lv = await p.evaluate(() => ({ st: termState, lvl: currentLevel, cls: [...document.body.classList].find(c => /^layer-/.test(c)), path: document.getElementById('t-addr').textContent }));
  check('jumping to L3 switches the theme and level', lv.st === 'L3A_ROOT' && lv.lvl === 3 && lv.cls === 'layer-3a', JSON.stringify(lv));
  await send('[TREE]'); await p.click('#t-output .t-line[data-jump="L1A_INCIDENT__STUB_ONE"]'); await calm();
  check('a stub (no page of its own) lands on its folder, with a note', (await st()) === 'L1A_INCIDENT' && (await out()).some(l => l.includes('PLACEHOLDER IN THIS FOLDER')), await st());
  await send('[AUTHOR LOCK]'); await send('[TREE]');
  check('players get no jump links', (await p.evaluate(() => document.querySelectorAll('#t-output .t-line[data-jump]').length)) === 0);
  await t.done();
})();
