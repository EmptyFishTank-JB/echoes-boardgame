// Author mode output and typing a text: the author tools talk to the author with whole lines (nothing types), and a text is typed a line
// at a time with [BACK], [LIST], [PREVIEW], [EDIT n], [INS n], [DEL n], [CLEAR] and [DONE] (used by [NEW DOC]; existing texts are edited
// in the floating window, see dialog29).
const L = require('./lib.js');
(async () => {
  const t = await L.open(); const { p, send, out, check } = t;
  const prompt = async () => { for (let i = 0; i < 100; i++) { if (await p.evaluate(() => !!window.progWait)) return; await p.waitForTimeout(100); } };
  const answer = async (v) => { await prompt(); await p.fill('#t-field', v); await p.press('#t-field', 'Enter'); await p.waitForTimeout(450); };
  // quiet = nothing waiting for an answer and the page after a command fully drawn (input sent during a redraw is ignored on purpose)
  const calm = async () => { for (let i = 0; i < 100; i++) { if (await p.evaluate(() => !window.isResponding && !window.progWait)) break; await p.waitForTimeout(100); } await t.ready(); };
  const rec = () => p.evaluate(() => window.__rec.slice());
  const clearRec = () => p.evaluate(() => { window.__rec.length = 0; });
  const lastLines = async (n) => (await out()).slice(-n);

  await send('[ECHOES.ARCHIVE]'); await send('[AUTHOR UNLOCK]');
  // record how each line is rendered (put is the one entry point the engine renders through)
  await p.evaluate(() => { window.__rec = []; const o = window.put; window.put = function (el, text, kind) { window.__rec.push([text, kind || 'status']); return o.apply(this, arguments); }; });

  // ---- [NEW DOC]: the prompts land whole ----
  await send('[NEW DOC]');
  for (const a of ['TE DOC', '', '', '']) await answer(a);
  await prompt();
  let r = await rec();
  const kindOf = (frag) => (r.find(([x]) => x.includes(frag)) || [])[1];
  check('author prompts and info lines land whole', kindOf('> DOC NAME') === 'list' && kindOf('TYPE A LINE TO ADD IT AT THE END') === 'list' && kindOf('[BACK] REMOVES THE LAST LINE') === 'list', r.map((x) => x.join(':')).slice(0, 8));
  check('nothing in author mode used the typed status kind', !r.some((x) => x[1] === 'status'), r.filter((x) => x[1] === 'status'));
  let o;

  // ---- one line at a time ----
  await answer('FIRST LINE'); await answer('SECOND LINE'); await answer('/dim third line'); await answer('[LIST]'); o = await lastLines(5);
  check('[LIST] numbers the lines, with their style kept', o.some((l) => l.includes('1  FIRST LINE')) && o.some((l) => l.includes('2  SECOND LINE')) && o.some((l) => l.includes('3  /dim third line')), o);
  await answer('[BACK]'); o = await lastLines(2);
  check('[BACK] takes the last line away and says which', o.some((l) => l.includes('REMOVED LINE 3: /dim third line')), o);
  await answer('[EDIT 2]'); await answer('REPLACED'); o = await lastLines(4);
  check('[EDIT 2] shows the line, asks for a new one and changes only that line', o.some((l) => l.includes('LINE 2 IS: SECOND LINE')) && o.some((l) => l.includes('LINE 2 IS NOW: REPLACED')), o);
  await answer('[EDIT 1]'); await answer(''); o = await lastLines(2);
  check('ENTER keeps the line as it is', o.some((l) => l.includes('LINE 1 KEPT')), o);
  await answer('[INS 1]'); await answer('TOP'); await answer('[LIST]'); o = await lastLines(4);
  check('[INS 1] puts a new line before line 1', o.some((l) => l.includes('1  TOP')) && o.some((l) => l.includes('2  FIRST LINE')) && o.some((l) => l.includes('3  REPLACED')), o);
  await answer('[DEL 2]'); await answer('[LIST]'); o = await lastLines(3);
  check('[DEL 2] removes that line', o.some((l) => l.includes('1  TOP')) && o.some((l) => l.includes('2  REPLACED')) && !o.some((l) => l.includes('FIRST LINE')), o);
  await answer('[EDIT 9]'); o = await lastLines(2);
  check('a line number that does not exist is refused and the editor carries on', o.some((l) => l.includes('EDIT NEEDS A LINE NUMBER FROM 1 TO 2')) && await p.evaluate(() => !!window.progWait), o);
  await answer('[BLANK TEST]'); await answer('[BACK]');

  // ---- preview: a page lands whole ----
  await clearRec(); await answer('[PREVIEW]'); await p.waitForTimeout(500); r = await rec();
  check('[PREVIEW] plays a page text whole (page), and says where it ends', r.filter((x) => x[0] === 'TOP' || x[0] === 'REPLACED').every((x) => x[1] === 'page') && r.some((x) => x[0].includes('END OF PREVIEW') && x[1] === 'list'), r.map((x) => x.join(':')));

  // ---- clearing, saving ----
  await answer('[CLEAR]'); await answer('Y'); await answer('[LIST]'); o = await lastLines(2);
  check('[CLEAR] empties the text on request', o.some((l) => l.includes('NO LINES YET')), o);
  await answer('ONE'); await answer(''); await answer('TWO'); await answer('[DONE]'); await calm();
  const doc = () => p.evaluate(() => { const it = Object.values(osItems).find((i) => i.name === 'TE DOC'); return it && it.body.map((x) => x.cls + ':' + x.text); });
  check('[DONE] saves the document with a blank entry as a blank line', JSON.stringify(await doc()) === JSON.stringify(['full:ONE', 'blank:', 'full:TWO']), await doc());

  // ---- Esc discards on request ----
  await send('[NEW DOC]');
  for (const a of ['TE DOC TWO', '', '', '', 'ABORTED LINE']) await answer(a);
  await p.keyboard.press('Escape'); await prompt(); await answer('Y'); await calm();
  check('Esc and Y discard the whole text and create nothing', !(await p.evaluate(() => Object.values(osItems).some((i) => i.name === 'TE DOC TWO'))));
  check('page errors', t.errs.length === 0, JSON.stringify(t.errs));
  await t.done();
})();
