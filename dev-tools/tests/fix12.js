const L = require('./lib.js');
(async () => {
  for (const [name, vp] of [['desktop', { width: 1100, height: 760 }], ['phone-width', { width: 420, height: 700 }]]) {
    const t = await L.open({ viewport: vp }); const { p, send, check } = t;
    const calm = async () => { await p.waitForFunction(() => uiLock === 0 && !isResponding && !document.getElementById('prog-layer'), null, { timeout: 15000 }).catch(() => {}); await t.ready(); };
    const art = () => p.evaluate(() => { const o = document.getElementById('t-output'); return Array.from(o.querySelectorAll('.t-line.art')).map(e => ({ h: Math.round(e.getBoundingClientRect().height), top: Math.round(e.offsetTop) })); });
    const ok = (rows) => rows.length >= 4 && rows.every(r => r.h >= 12) && rows.every((r, i) => i === 0 || r.top - rows[i - 1].top >= 12);
    check(name + ': title art rows intact at boot', ok(await art()), JSON.stringify(await art()));
    for (let i = 0; i < 16; i++) await send('hello ' + i);
    check(name + ': ...and after a long chat overflows the screen', ok(await art()), JSON.stringify(await art()));
    await send('[ECHOES.ARCHIVE]'); await send('[EXIT]');
    for (let i = 0; i < 4; i++) await send('again ' + i);
    check(name + ': ...and after leaving the archive and chatting more', ok(await art()), JSON.stringify(await art()));
    check(name + ': normal lines never shrink either', await p.evaluate(() => Array.from(document.querySelectorAll('#t-output .t-line')).every(e => getComputedStyle(e).flexShrink === '0')));
    if (name === 'desktop') {
      // ---- override menu is interactive ----
      await send('[SYSTEM OVERRIDE]');
      const menu = await p.evaluate(() => Array.from(document.querySelectorAll('#t-output .t-line.act')).map(e => e.dataset.cmd));
      check('override: all seven menu commands are clickable lines', JSON.stringify(menu) === JSON.stringify(['[STATUS]', '[LEGEND]', '[JUMP L1]', '[JUMP L2]', '[JUMP L3]', '[TREE]', '[EXIT]']), JSON.stringify(menu));
      await p.fill('#t-field', 'abc');
      await p.hover('#t-output .t-line.act[data-cmd="[STATUS]"]');
      check('override: hovering shows the command in the field and highlights the line', (await p.inputValue('#t-field')) === '[STATUS]' && await p.evaluate(() => !!document.querySelector('#t-output .t-line.inverted[data-cmd="[STATUS]"]')));
      const cur = await p.evaluate(() => ({ line: getComputedStyle(document.querySelector('#t-output .t-line.act')).cursor, act: document.documentElement.style.getPropertyValue('--cur-act') }));
      check('override: the reticle pointer is used over a command, drawn in the override green', cur.line.startsWith('url(') && decodeURIComponent(cur.act).includes('#00ff41'), cur.line.slice(0, 50));
      await p.mouse.move(5, 5);
      check('override: leaving restores what was typed', (await p.inputValue('#t-field')).toLowerCase() === 'abc');
      await p.fill('#t-field', '');
      await p.click('#t-output .t-line.act[data-cmd="[LEGEND]"]'); await calm();
      check('override: clicking [LEGEND] runs it', (await p.evaluate(() => document.getElementById('t-output').innerText)).includes('BOOT CHECK LEGEND'));
      await p.click('#t-output .t-line.act[data-cmd="[STATUS]"]'); await calm();
      check('override: clicking [STATUS] runs it', (await p.evaluate(() => document.getElementById('t-output').innerText)).includes('RUNNING FULL DATA VALIDATION'));
      await p.click('#t-output .t-line.act[data-cmd="[JUMP L2]"]'); await calm();
      check('override: clicking [JUMP L2] jumps', (await p.evaluate(() => ({ s: termState, l: currentLevel, o: document.body.classList.contains('override-mode') }))).s === 'L2A_ROOT');
      // exit path, from a fresh override
      await send('[SYSTEM OVERRIDE]'); await p.click('#t-output .t-line.act[data-cmd="[EXIT]"]'); await calm();
      check('override: clicking [EXIT] leaves the override', !(await p.evaluate(() => document.body.classList.contains('override-mode'))));
      check('...and the pointer goes back to the layer color', !decodeURIComponent(await p.evaluate(() => document.documentElement.style.getPropertyValue('--cur-act'))).includes('#00ff41'));
      // author jump links stay out of the override screen
      await send('[AUTHOR UNLOCK]'); await send('[SYSTEM OVERRIDE]'); await send('[TREE]');
      check('override: [TREE] has no author jump links', (await p.evaluate(() => document.querySelectorAll('#t-output .t-line[data-jump]').length)) === 0);
    }
    await t.done();
  }
})();
