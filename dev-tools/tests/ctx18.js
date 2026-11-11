// Right-click info rows and editing a property from them.
const L = require('./lib.js');
(async () => {
  const t = await L.open(); const { p, send, out, check } = t;
  const sel = (label) => `#t-output .t-line.act:has(.lb:text-is("${label}"))`;
  const rows = () => p.evaluate(() => { const m = document.getElementById('ctx'); return m ? Array.from(m.querySelectorAll('.cr')).map((r) => ({ k: r.querySelector('.ck').textContent, v: r.querySelector('.cv').textContent, ed: r.classList.contains('ed') })) : null; });
  const prompt = async () => { for (let i = 0; i < 80; i++) { const ok = await p.evaluate(() => window.progWait ? true : false); if (ok) return; await p.waitForTimeout(100); } };
  const answer = async (v) => { await prompt(); await p.fill('#t-field', v); await p.press('#t-field', 'Enter'); await p.waitForTimeout(500); };
  const calm = async () => { for (let i = 0; i < 80; i++) { const ok = await p.evaluate(() => !window.isResponding && !window.progWait && (document.getElementById('t-output').lastElementChild || {}).textContent === '> AWAITING INPUT'); if (ok) { await p.waitForTimeout(300); return; } await p.waitForTimeout(150); } };

  await send('[ECHOES.ARCHIVE]'); await send('[AUTHOR UNLOCK]');
  await p.click(sel('[CREW MANIFEST]'), { button: 'right' }); await p.waitForTimeout(200);
  let r = await rows();
  const by = (k) => (r || []).find((x) => x.k === k);
  check('a doc\'s menu lists id, type, name, alias, title, hidden, footer and text', r && ['ID', 'TYPE', 'NAME', 'ALIAS', 'TITLE', 'HIDDEN', 'FOOTER', 'TEXT'].every((k) => by(k)), r && r.map((x) => x.k));
  check('...with the real values', by('ID').v === 'L1A_CREW_MANIFEST' && by('NAME').v === 'CREW MANIFEST' && by('ALIAS').v === '[CREW MANIFEST]' && /^doc, L1/.test(by('TYPE').v), r);
  check('id and type are read-only; name, alias, title, hidden, footer and text can be edited', !by('ID').ed && !by('TYPE').ed && ['NAME', 'ALIAS', 'TITLE', 'HIDDEN', 'FOOTER', 'TEXT'].every((k) => by(k).ed));
  await p.evaluate(() => { window.__title0 = osItems.L1A_CREW_MANIFEST.title; });
  await p.hover('#ctx .cr.ed:has-text("NAME")'); await p.waitForTimeout(80);
  check('hovering the name row shows [SET NAME] in the field', (await p.inputValue('#t-field')) === '[SET NAME]', await p.inputValue('#t-field'));

  await p.click('#ctx .cr.ed:has-text("NAME")'); await p.waitForSelector('.ed-dlg'); await p.waitForTimeout(250);
  let o;
  check('clicking the name row opens the item\'s window on the name box straight away (no "which item")', await p.evaluate(() => { const a = document.activeElement; return !!a && !!a.closest('.ed-row') && a.closest('.ed-row').querySelector('.ed-lbl').textContent === 'NAME' && a.value === 'CREW MANIFEST'; }));
  await p.fill('.ed-dlg .ed-row:has(.ed-lbl:text-is("NAME")) input', 'Ship Roster'); await p.click('.ed-dlg button:text-is("APPLY")'); await calm();
  const it = await p.evaluate(() => { const i = osItems.L1A_CREW_MANIFEST; return { name: i.name, alias: i.alias, title: i.title, title0: window.__title0 }; });
  check('the name changed (in capitals), the alias and title did not', it.name === 'SHIP ROSTER' && it.alias === '[CREW MANIFEST]' && it.title === it.title0, JSON.stringify(it));
  check('and the window says so', (await p.textContent('.ed-dlg .ed-foot .msg')).includes('APPLIED'), await p.textContent('.ed-dlg .ed-foot .msg'));
  await p.click('.ed-dlg .ed-bar .x');

  // typed form works the same way
  await send('[SET TITLE]'); await prompt(); o = await out();
  check('typed [SET TITLE] asks which item (no preset)', o.some((l) => l.includes('CHANGE A PROPERTY OF')), o.slice(-4));
  await p.press('#t-field', 'Escape'); await calm();

  // hidden row toggles
  await p.click(sel('[CREW MANIFEST]'), { button: 'right' }); await p.waitForTimeout(200);
  await p.click('#ctx .cr.ed:has-text("HIDDEN")'); await calm();
  check('clicking the hidden row toggles it', await p.evaluate(() => osItems.L1A_CREW_MANIFEST.hidden === true));

  // alias row
  const hid = await p.evaluate(() => { osItems.L1A_CREW_MANIFEST.hidden = false; archData = buildArchFromOS(osData); });
  await send('[LS]');
  await p.click(sel('[CREW MANIFEST]'), { button: 'right' }).catch(() => {}); await p.waitForTimeout(200);
  if (!(await rows())) { console.log('(menu not open; reopening from the tree view)'); }

  // gateway destination, shown by name and id
  await p.evaluate(() => { const g = Object.values(osItems).find((i) => i.type === 'gateway'); g.goto = 'L3A_ROOT'; });
  await send('[ROOT]');
  await p.evaluate(() => { const ln = document.querySelector('#t-output .t-line'); });
  await send('[TREE]'); o = await out();
  check('the author tree shows a gateway destination by name and id', o.some((l) => l.includes('gateway: L3 ROOT (L3A_ROOT)')), o.filter((l) => l.includes('gateway')));
  await p.evaluate(() => { const g = Object.values(osItems).find((i) => i.type === 'gateway'); window.__gw = g.id; });
  // open a gateway's menu through the page-level menu: the INITIATE gateway is listed in the author view of the root
  await send('[ROOT]');
  const gwLine = await p.$('#t-output .t-line.act:has(.lb:has-text("INITIATE ECHO PROTOCOL"))');
  if (gwLine) { await gwLine.click({ button: 'right' }); await p.waitForTimeout(200); r = await rows();
    check('a gateway\'s menu has a DESTINATION row with name and id', r && by('DESTINATION') && by('DESTINATION').v === 'L3 ROOT (L3A_ROOT)' && by('DESTINATION').ed, r && r.map((x) => x.k + '=' + x.v));
    await p.click('#ctx .cr.ed:has-text("DESTINATION")'); await p.waitForSelector('.ed-dlg'); await p.waitForTimeout(250);
    check('clicking it opens the gateway\'s window with where it goes chosen from a list, showing the current one', (await p.inputValue('.ed-dlg .ed-row:has(.ed-lbl:text-is("GOES TO")) select')) === 'L3A_ROOT' && (await p.$eval('.ed-dlg .ed-bar .ttl', (e) => e.textContent)) === 'EDIT GATEWAY');
    await p.selectOption('.ed-dlg .ed-row:has(.ed-lbl:text-is("GOES TO")) select', 'L2A_ROOT'); await p.click('.ed-dlg button:text-is("APPLY")'); await calm();
    check('and it can be repointed', await p.evaluate(() => osItems[window.__gw].goto === 'L2A_ROOT'));
    await p.click('.ed-dlg .ed-bar .x');
  } else check('the INITIATE gateway is listed in the author view', false);
  console.log('page errors:', JSON.stringify(t.errs)); await t.done();
})();
