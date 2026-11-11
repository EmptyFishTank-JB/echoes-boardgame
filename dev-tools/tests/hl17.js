const L = require('./lib.js');
(async () => {
  const t = await L.open(); const { p, send, check } = t;
  const lit = async (txt) => { await p.fill('#t-field', txt); await p.waitForTimeout(60); return p.evaluate(() => document.getElementById('t-field').classList.contains('inverted')); };
  const clear = () => p.fill('#t-field', '');

  // ---- the chat ----
  check('chat: the hidden [ECHOES.ARCHIVE] lights the field', await lit('[ECHOES.ARCHIVE]'));
  check('...case does not matter', await lit('[echoes.archive]'));
  check('...a half-typed one does not', !(await lit('[ECHOES.ARCH')));
  check('...a command that does not exist does not', !(await lit('[NOT A COMMAND]')));
  check('...plain chat text does not', !(await lit('hello there')));
  check('chat: [SYSTEM OVERRIDE] lights the field', await lit('[SYSTEM OVERRIDE]'));
  check('chat: [INITIATE ECHO PROTOCOL] (hidden gateway) lights the field', await lit('[INITIATE ECHO PROTOCOL]'));
  check('chat: [HELP] [TREE] [CLEAR] light the field', (await lit('[HELP]')) && (await lit('[TREE]')) && (await lit('[CLEAR]')));
  check('chat: [OPEN ECHOES.ARCHIVE] lights it too', await lit('[OPEN ECHOES.ARCHIVE]'));
  check('chat: an archive-only command does not ([BACK], [LS])', !(await lit('[BACK]')) && !(await lit('[LS]')));
  check('chat: the hidden captain\'s private log lights the field', await lit("[CAPTAIN'S PRIVATE LOG]"));
  await p.evaluate(() => { const it = osItems.L1A_CAPTAINS_PRIVATE_LOG; it.stub = true; archData = buildArchFromOS(osData); });
  check('chat: turn it back into a stub (planned, empty) and it is not a command', !(await lit("[CAPTAIN'S PRIVATE LOG]")));
  await p.evaluate(() => { const it = osItems.L1A_CAPTAINS_PRIVATE_LOG; it.stub = false; archData = buildArchFromOS(osData); });
  check('chat: once written again, a hidden doc lights the field', await lit("[CAPTAIN'S PRIVATE LOG]"));
  check('chat: [AUTHOR UNLOCK] lights it while the file is unlocked', await lit('[AUTHOR UNLOCK]'));
  await clear();

  // submitting clears the highlight
  await send('[ECHOES.ARCHIVE]');
  check('after the hidden command runs, the field is not left highlighted', !(await p.evaluate(() => document.getElementById('t-field').classList.contains('inverted'))));

  // ---- the archive ----
  check('archive: a listed item still lights the field and its line', await (async () => { await p.fill('#t-field', '[CREW MANIFEST]'); await p.waitForTimeout(60); return p.evaluate(() => document.getElementById('t-field').classList.contains('inverted') && !!document.querySelector('#t-output .t-line.inverted')); })());
  check('archive: [BACK] [LS] [ROOT] [EXIT] light it', (await lit('[BACK]')) && (await lit('[LS]')) && (await lit('[ROOT]')) && (await lit('[EXIT]')));
  check('archive: a hidden doc on another page lights it', await lit("[CAPTAIN'S PRIVATE LOG]"));
  check('archive: a listed doc on another page does not light it (it is only valid on its own page)', !(await lit('[MEDICAL TRIAGE \u2014 DAY 34]')));
  check('archive: a tier 2 hidden program lights it even though it is unavailable here', await lit('[FETCH LOG ENTRY: //]'));
  check('archive: an unknown command does not', !(await lit('[NOT A COMMAND]')));
  check('archive: [SYSTEM OVERRIDE] lights it', await lit('[SYSTEM OVERRIDE]'));
  await clear();

  // ---- author mode ----
  await send('[AUTHOR UNLOCK]');
  check('author: an author command lights the field when typed in full', await lit('[MKDIR]'));
  check('author: a half-typed one does not', !(await lit('[MKDI')));
  check('author: [AUTHOR LOCK] lights it', await lit('[AUTHOR LOCK]'));
  await clear(); await send('[AUTHOR LOCK]');
  check('locked again: [MKDIR] no longer lights it', !(await lit('[MKDIR]')));
  await clear();
  await p.evaluate(() => { osData.meta.locked = true; });
  check('file locked: [AUTHOR UNLOCK] does not light it', !(await lit('[AUTHOR UNLOCK]')));
  await p.evaluate(() => { osData.meta.locked = false; }); await clear();

  // ---- the override ----
  await send('[SYSTEM OVERRIDE]'); await p.waitForTimeout(1200);
  check('override: its own commands light the field', (await lit('[STATUS]')) && (await lit('[LEGEND]')) && (await lit('[JUMP L2]')) && (await lit('[EXIT]')));
  check('override: nothing else does ([HELP], [ECHOES.ARCHIVE], [SYSTEM OVERRIDE])', !(await lit('[HELP]')) && !(await lit('[ECHOES.ARCHIVE]')) && !(await lit('[SYSTEM OVERRIDE]')));
  await clear();
  await t.done();
})();
