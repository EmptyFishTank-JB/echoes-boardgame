// Game state and INBOX.EXE: flags, items that exist only while flags are on, programs listed like apps, the inbox (reading, replying,
// attachments, mail that arrives because of a flag), the author commands that test them, and the removed log item type.
const L = require('./lib.js');
(async () => {
  const t = await L.open(); const { p, send, out, check } = t;
  const prompt = async () => { for (let i = 0; i < 100; i++) { if (await p.evaluate(() => !!window.progWait)) return; await p.waitForTimeout(100); } };
  const answer = async (v) => { await prompt(); await p.fill('#t-field', v); await p.press('#t-field', 'Enter'); await p.waitForTimeout(450); };
  const calm = async () => { for (let i = 0; i < 100; i++) { if (await p.evaluate(() => !window.isResponding && !window.progWait && !window.progWin)) break; await p.waitForTimeout(100); } await t.ready(); };
  const flags = () => p.evaluate(() => JSON.parse(JSON.stringify(gameState.flags)));
  const rawLines = () => p.evaluate(() => Array.from(document.querySelectorAll('#t-output .t-line')).map((e) => e.textContent.trim()));
  const waitMail = () => p.waitForSelector('#prog-layer.open .mb-list .mb-row', { timeout: 10000 });
  const row = (subject) => p.locator('.mb-row').filter({ has: p.locator('.sub', { hasText: new RegExp('^' + subject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') }) }).first();
  const subjects = () => p.$$eval('.mb-row .sub', (es) => es.map((e) => e.textContent));
  const openInbox = async () => { await send('[INBOX]'); await waitMail(); await p.waitForTimeout(150); };
  const closeInbox = async () => { await p.keyboard.press('Escape'); await p.waitForTimeout(350); await calm(); };

  await send('[SYSTEM OVERRIDE]'); await send('[JUMP L3]');

  // ---- a program listed like an app ----
  const root = await rawLines();
  const ln = root.find((l) => l.includes('[INBOX]'));
  check('the L3 root lists INBOX like an app: the program glyph and EXE in the type column', !!ln && ln.includes('►') && /EXE/.test(ln), ln);
  check('...and the hidden FETCH LOG program stays unlisted', !root.some((l) => l.includes('[FETCH LOG ENTRY')));
  await send('[TREE]');
  const tree = await rawLines();
  check('the tree legend no longer has a log type, and the listed program shows in the player tree', tree.some((l) => /folder\s+.*doc\s+.*program\s+.*gateway/.test(l) && !/log/.test(l.split('program')[0])) && tree.some((l) => l.includes('[INBOX]')), tree.slice(-4));
  check('the log item type is gone from the engine', await p.evaluate(() => !('log' in glyphSet()) && !document.documentElement.innerHTML.includes('log_ref')));

  // ---- INBOX.EXE ----
  await openInbox();
  const acct = await p.$eval('.mb-acct', (e) => ({ text: e.textContent, bad: e.querySelectorAll('.bad').length, color: e.querySelector('.bad') ? getComputedStyle(e.querySelector('.bad')).color : '' }));
  check('the account is unknown on purpose: glyphs in the corruption color and UNVERIFIED', acct.bad >= 1 && /UNVERIFIED/.test(acct.text) && /TERMINAL 426/.test(acct.text) && acct.color === 'rgb(111, 227, 255)', acct);
  let subs = await subjects();
  check('at the start the inbox holds only the two messages with no requirements, newest first', subs.length === 2 && subs[0] === 'COPY OF THE SUPPLEMENTAL REPORT' && subs[1] === 'PHASE START: WING PROCEDURE', subs);
  check('both are unread: marked, counted on the tab and in the window bar', (await p.$$eval('.mb-row .mk', (es) => es.filter((e) => e.textContent === '*').length)) === 2 && /\(2\)/.test(await p.$eval('.mb-tab', (e) => e.textContent)) && /2 NEW/.test(await p.$eval('.prog-bar .sub', (e) => e.textContent)));
  await row('COPY OF THE SUPPLEMENTAL REPORT').click(); await p.waitForTimeout(200);
  check('opening a message shows its header and text', /Osei/.test(await p.$eval('.mb-hd', (e) => e.textContent)) && /belongs to nobody/.test(await p.$eval('.mb-body', (e) => e.textContent)));
  const f1 = await flags();
  check('...marks it read (a flag) and a message that needs it arrives', f1['read:m_osei_report'] === true && (await subjects()).includes('NOTICE: DRIVE ARRAY COMMAND ACCEPTED'), f1);
  check('...the unread count drops by one and rises by the new arrival', /\(2\)/.test(await p.$eval('.mb-tab', (e) => e.textContent)), await p.$eval('.mb-tab', (e) => e.textContent));
  check('a draft is now available to compose, and the message offers REPLY', /\(1\)/.test(await p.$$eval('.mb-tab', (e) => e[2].textContent).then((a) => a)) && (await p.locator('.mb-act .pg-btn', { hasText: 'REPLY' }).count()) === 1);
  await p.locator('.mb-act .pg-btn', { hasText: 'REPLY' }).click(); await p.waitForTimeout(200);
  check('REPLY opens the draft with a SEND button', /It is open now/.test(await p.$eval('.mb-body', (e) => e.textContent)) && (await p.locator('.mb-act .pg-btn', { hasText: 'SEND' }).count()) === 1);
  await p.locator('.mb-act .pg-btn', { hasText: 'SEND' }).click(); await p.waitForTimeout(250);
  const f2 = await flags();
  check('SEND sets sent:<id>, files the message under SENT and says so', !!f2['sent:d_osei_reply'] && /MESSAGE SENT/.test(await p.$eval('.mb-foot .msg', (e) => e.textContent)) && (await subjects()).includes('RE: COPY OF THE SUPPLEMENTAL REPORT') && (await subjects()).length === 2, [f2, await subjects()]);
  await p.locator('.mb-tab', { hasText: 'INBOX' }).click(); await p.waitForTimeout(200);
  check('the reply it triggered has arrived in the inbox', (await subjects()).filter((s) => /^RE: COPY/.test(s)).length === 1, await subjects());
  await row('RE: COPY OF THE SUPPLEMENTAL REPORT').click(); await p.waitForTimeout(200);
  const LOGC = 'LN5QJ-X2M7G-JKS6E-4X02I';
  check('it carries an attachment, a log code with its first line, not yet recovered', (await p.locator('.mb-att .pg-btn', { hasText: 'RECOVER' }).count()) === 1 && /Log R-157/.test(await p.$eval('.mb-att', (e) => e.textContent)) && !(await p.evaluate((c) => !!discovered[c], LOGC)));
  await p.locator('.mb-att .pg-btn').click(); await p.waitForTimeout(200);
  check('RECOVER adds the code to the recovered list and shows the log', await p.evaluate((c) => !!discovered[c], LOGC) && /Day twenty-seven/.test(await p.$eval('.mb-att pre', (e) => e.textContent)));
  await row('NOTICE: DRIVE ARRAY COMMAND ACCEPTED').click(); await p.waitForTimeout(200);
  check('reading the system notice brings the next message, whose sender has a damaged ID', (await subjects()).includes('WING AIR, YOUR SIDE') && (await p.$$eval('.mb-row .who .bad', (e) => e.length)) >= 1);
  await closeInbox();
  const o1 = await rawLines();
  check('closing it prints the CLOSED line and gives the prompt back', o1.some((l) => l.includes('> INBOX.EXE CLOSED')) && o1[o1.length - 1].includes('AWAITING INPUT'), o1.slice(-3));
  const persisted = await p.evaluate(() => JSON.parse(localStorage.getItem('echo_state') || '{}').flags || {});
  check('the flags are kept in the browser', persisted['read:m_osei_report'] === true && !!persisted['sent:d_osei_reply'], persisted);

  // ---- items that exist only while flags are on, and the RECEIVED notice ----
  await p.route('**/mail.json*', async (r) => { const x = await r.fetch(); const j = JSON.parse(await x.text()); j.messages.push({ id: 'm_test_door', box: 'in', from: 'TEST', to: 'OPERATOR', date: '2143.150.0001', subject: 'DOOR', text: 'The door is open.', sets: ['door_open'] }); r.fulfill({ response: x, body: JSON.stringify(j) }); });
  await p.evaluate(() => { osItems.L3A_ROOT.children.push({ id: 'L3A_TEST_DOC', type: 'doc', name: 'DOOR LOG', alias: '[DOOR LOG]', tier: 3, hidden: false, footer: '', title: 'DOOR LOG', body: [{ type: 'text', text: 'The door log.', cls: 'full' }], children: [], commands: [], requires: ['door_open'] }); archData = buildArchFromOS(osData); });
  await send('[DOOR LOG]');
  check('a gated item does not exist yet: its alias is refused', (await rawLines()).some((l) => /INVALID SELECTION/.test(l)));
  check('...and it is not in the player tree', await p.evaluate(() => !treeLines(false).some((l) => /DOOR LOG/.test(l.text))));
  await openInbox(); await row('DOOR').click(); await p.waitForTimeout(200); await closeInbox();
  const o2 = await rawLines();
  check('reading the message that sets the flag announces the item when the window closes', o2.some((l) => l.includes('> RECEIVED: [DOOR LOG]')), o2.slice(-4));
  await send('[DOOR LOG]');
  check('...and now it opens', (await rawLines()).some((l) => l.includes('The door log.')));
  await send('[BACK]');

  // ---- author commands ----
  await send('[AUTHOR UNLOCK]');
  await send('[FLAGS]');
  const fl = await rawLines();
  check('[FLAGS] lists what is on and the items it gates', fl.some((l) => /door_open = true/.test(l)) && fl.some((l) => /\[DOOR LOG\]\s+REQUIRES door_open/.test(l)), fl.slice(-8));
  await send('[FLAG]'); await answer('wing_open'); await answer('');
  check('[FLAG] turns a flag on', (await flags()).wing_open === true && (await rawLines()).some((l) => l.includes('wing_open IS NOW ON')));
  await send('[FLAG]'); await answer('wing_open'); await answer('off');
  check('...and off', !('wing_open' in (await flags())));
  // a program is listed or unlisted with [SHOW] and [HIDE]
  await send('[SHOW]'); await answer('L3A_PROG_LORE_ENTRY'); await calm();
  check('[SHOW] lists a program (hidden: false) and the folder now shows it', await p.evaluate(() => osItems.L3A_PROG_LORE_ENTRY.hidden === false) && (await rawLines()).some((l) => l.includes('[FETCH LOG ENTRY: //]') && l.includes('►')), (await rawLines()).slice(-8));
  await send('[HIDE]'); await answer('L3A_PROG_LORE_ENTRY'); await calm();
  check('[HIDE] unlists it again', await p.evaluate(() => osItems.L3A_PROG_LORE_ENTRY.hidden === true));
  // the item window has the program listing toggle and the requires field
  await send('[EDIT]'); await p.fill('#t-field', 'L3A_PROG_INBOX'); await p.press('#t-field', 'Enter'); await p.waitForSelector('.ed-dlg', { timeout: 8000 }); await p.waitForTimeout(300);
  const dtext = await p.$eval('.ed-dlg', (e) => e.innerText);
  check('the program window has HIDDEN (listed like an app or by alias only) and REQUIRES, and no title or footer', /HIDDEN/.test(dtext) && /LISTED IN ITS FOLDER LIKE AN APP/.test(dtext) && /REQUIRES/.test(dtext) && !/\nTITLE\n/.test(dtext) && !/FOOTER/.test(dtext), dtext.slice(0, 300));
  await p.locator('.ed-dlg input[placeholder*="always there"]').fill('wing_open'); await p.locator('.ed-dlg .pg-btn, .ed-dlg button', { hasText: /^APPLY$/ }).first().click(); await p.waitForTimeout(400);
  check('APPLY stores requires as a list', JSON.stringify(await p.evaluate(() => osItems.L3A_PROG_INBOX.requires)) === '["wing_open"]');
  await p.keyboard.press('Escape'); await send('[AUTHOR LOCK]');
  await send('[INBOX]');
  check('with the flag off INBOX does not exist for the player: its alias is refused and no window opens', (await rawLines()).some((l) => /INVALID SELECTION|NOT RECOGNIZED/.test(l)) && !(await p.evaluate(() => !!window.progWin)));
  await p.evaluate(() => { setFlag('wing_open'); });
  await send('[INBOX]'); await waitMail(); await closeInbox();
  check('with the flag on it runs again', (await rawLines()).some((l) => l.includes('> INBOX.EXE CLOSED')));
  await send('[AUTHOR UNLOCK]');
  await send('[RESET STATE]'); await answer('Y'); await calm();
  check('[RESET STATE] clears the flags, the recovered codes and the unlocks', JSON.stringify(await flags()) === '{}' && await p.evaluate(() => Object.keys(discovered).length === 0 && Object.keys(miscUnlocks).length === 0));
  check('page errors', t.errs.length === 0, JSON.stringify(t.errs));
  await t.done();

  // ---- a phone ----
  const m = await L.open({ viewport: { width: 390, height: 800 } });
  await m.send('[SYSTEM OVERRIDE]'); await m.send('[JUMP L3]'); await m.send('[INBOX]');
  await m.p.waitForSelector('#prog-layer.open .mb-list .mb-row', { timeout: 10000 }); await m.p.waitForTimeout(250);
  const ph = await m.p.evaluate(() => { const w = document.querySelector('.prog-win').getBoundingClientRect(), g = getComputedStyle(document.querySelector('.mb-main')); return { winW: w.width, vw: innerWidth, cols: g.gridTemplateColumns.split(' ').length, over: document.querySelector('.prog-body').scrollWidth > document.querySelector('.prog-body').clientWidth + 1 }; });
  m.check('phone: the inbox window stays on screen and the list stacks above the message', ph.winW <= ph.vw && ph.cols === 1 && !ph.over, JSON.stringify(ph));
  await m.done();
})();
