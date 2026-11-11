// Author mode output and text entry: tool lines land whole, a preview of player text still types, and a text can be edited a line
// at a time ([BACK], [LIST], [PREVIEW], [EDIT n], [INS n], [DEL n], [CLEAR], [LOAD]) for the transition text and for documents.
const L = require('./lib.js');
(async () => {
  const t = await L.open(); const { p, send, out, check } = t;
  const prompt = async () => { for (let i = 0; i < 100; i++) { if (await p.evaluate(() => !!window.progWait)) return; await p.waitForTimeout(100); } };
  const answer = async (v) => { await prompt(); await p.fill('#t-field', v); await p.press('#t-field', 'Enter'); await p.waitForTimeout(450); };
  // quiet = nothing waiting for an answer and the page after a command fully drawn (input sent during a redraw is ignored on purpose)
  const calm = async () => { for (let i = 0; i < 100; i++) { if (await p.evaluate(() => !window.isResponding && !window.progWait)) break; await p.waitForTimeout(100); } await t.ready(); };
  const data = () => p.evaluate(() => JSON.parse(JSON.stringify(osData)));
  const rec = () => p.evaluate(() => window.__rec.slice());
  const clearRec = () => p.evaluate(() => { window.__rec.length = 0; });
  const lastLines = async (n) => (await out()).slice(-n);

  await send('[ECHOES.ARCHIVE]'); await send('[AUTHOR UNLOCK]');
  // record how each line is rendered (put is the one entry point the engine renders through)
  await p.evaluate(() => { window.__rec = []; const o = window.put; window.put = function (el, text, kind) { window.__rec.push([text, kind || 'status']); return o.apply(this, arguments); }; });

  // ---- the transition text opens with its lines, typed as a player sees them ----
  await send('[LAYER INTRO]'); await prompt();
  let r = await rec();
  const kindOf = (frag) => (r.find(([t]) => t.includes(frag)) || [])[1];
  check('author prompts and info lines land whole', kindOf('THE TEXT SHOWN WHILE') === 'list' && kindOf('[BACK] REMOVES THE LAST LINE') === 'list' && kindOf('LINE(S) LOADED') === 'list', r.map((x) => x.join(':')).slice(0, 8));
  check('the transition lines themselves are previewed typed (flavor), as the player gets them', kindOf('ECHOES-ARCHIVE ACCESS GRANTED') === 'flavor' && kindOf('> ─────') === 'flavor', r.filter((x) => x[1] === 'flavor').map((x) => x[0]));
  check('nothing in author mode used the typed status kind', !r.some((x) => x[1] === 'status'), r.filter((x) => x[1] === 'status'));
  let o = await out();
  check('the current text is loaded, not blank', o.some((l) => l.includes('1 LINE(S) LOADED')), o.slice(-8));

  // ---- one line at a time ----
  await answer('[LIST]'); o = await lastLines(3);
  check('[LIST] numbers the lines', o.some((l) => l.includes('1  > ECHOES-ARCHIVE ACCESS GRANTED.')), o);
  await answer('SECOND LINE'); await answer('/dim third line'); await answer('[LIST]'); o = await lastLines(5);
  check('typed lines are added at the end, with their style kept in the list', o.some((l) => l.includes('2  SECOND LINE')) && o.some((l) => l.includes('3  /dim third line')), o);
  await answer('[BACK]'); o = await lastLines(2);
  check('[BACK] takes the last line away and says which', o.some((l) => l.includes('REMOVED LINE 3: /dim third line')), o);
  await answer('[LIST]'); o = await lastLines(3);
  check('...so the list is back to two lines', o.some((l) => l.includes('2  SECOND LINE')) && !o.some((l) => l.includes('third line')), o);
  await answer('[EDIT 2]'); await answer('REPLACED'); o = await lastLines(4);
  check('[EDIT 2] shows the line, asks for a new one and changes only that line', o.some((l) => l.includes('LINE 2 IS: SECOND LINE')) && o.some((l) => l.includes('LINE 2 IS NOW: REPLACED')), o);
  await answer('[EDIT 1]'); await answer(''); o = await lastLines(2);
  check('ENTER keeps the line as it is', o.some((l) => l.includes('LINE 1 KEPT')), o);
  await answer('[INS 1]'); await answer('TOP'); await answer('[LIST]'); o = await lastLines(4);
  check('[INS 1] puts a new line before line 1', o.some((l) => l.includes('1  TOP')) && o.some((l) => l.includes('2  > ECHOES-ARCHIVE ACCESS GRANTED.')) && o.some((l) => l.includes('3  REPLACED')), o);
  await answer('[DEL 2]'); await answer('[LIST]'); o = await lastLines(3);
  check('[DEL 2] removes that line', o.some((l) => l.includes('1  TOP')) && o.some((l) => l.includes('2  REPLACED')) && !o.some((l) => l.includes('ACCESS GRANTED')), o);
  await answer('[EDIT 9]'); o = await lastLines(2);
  check('a line number that does not exist is refused and the editor carries on', o.some((l) => l.includes('EDIT NEEDS A LINE NUMBER FROM 1 TO 2')) && await p.evaluate(() => !!window.progWait), o);
  await answer('[BLANK TEST]'); await answer('[BACK]');

  // ---- preview types the text the way the transition does ----
  await clearRec(); await answer('[PREVIEW]'); await p.waitForTimeout(500); r = await rec();
  const typed = r.filter((x) => x[1] === 'flavor').map((x) => x[0]);
  check('[PREVIEW] plays the lines typed, then the rule line the transition adds', typed.join('|') === 'TOP|REPLACED|> ─────────────────────────────────', typed);
  check('...and says where it ends, whole', r.some((x) => x[0].includes('END OF PREVIEW') && x[1] === 'list'));

  // ---- saving ----
  await answer('[DONE]'); await calm();
  let b = (await data()).screens.L1A_INTRO.body;
  check('[DONE] saves the lines with the blank lines and the rule around them', b.length === 5 && b[0].cls === 'blank' && b[1].text === 'TOP' && b[2].text === 'REPLACED' && /^> ─+$/.test(b[3].text) && b[4].cls === 'blank', b.map((x) => x.text));
  await send('[LAYER INTRO]'); await prompt(); await answer('[DONE]'); await calm();
  const b2 = (await data()).screens.L1A_INTRO.body;
  check('opening it again and finishing changes nothing', JSON.stringify(b2) === JSON.stringify(b));
  await send('[LAYER INTRO]'); await prompt(); await answer('[CLEAR]'); await answer('Y'); await answer('[LIST]'); o = await lastLines(2);
  check('[CLEAR] empties the text on request', o.some((l) => l.includes('NO LINES YET')), o);
  await p.keyboard.press('Escape'); await prompt(); await answer('Y'); await calm();
  b = (await data()).screens.L1A_INTRO.body;
  check('Esc and Y discard the whole edit and keep what was saved', b.length === 5 && b[1].text === 'TOP', b.map((x) => x.text));

  // ---- a document: starts empty to retype, [LOAD] brings the saved lines in to edit ----
  for (const a of ['[NEW DOC]', 'TE DOC', '', '', '', 'LINE A', 'LINE B', 'LINE C', '[DONE]']) { if (a === '[NEW DOC]') await send(a); else await answer(a); }
  await calm();
  const doc = () => p.evaluate(() => { const it = Object.values(osItems).find((i) => i.name === 'TE DOC'); return it && it.body.map((x) => x.text); });
  check('a new document is typed line by line as before', JSON.stringify(await doc()) === JSON.stringify(['LINE A', 'LINE B', 'LINE C']), await doc());
  await send('[SET TEXT]'); await answer('TE DOC'); await prompt(); o = await lastLines(5);
  check('editing a document starts empty, and offers [LOAD]', o.some((l) => l.includes('[LOAD] BRINGS IN THE SAVED TEXT')) && !o.some((l) => l.includes('LINE(S) LOADED')), o);
  await answer('[LOAD]'); await answer('[EDIT 2]'); await answer('LINE B CHANGED'); await clearRec(); await answer('[PREVIEW]'); await p.waitForTimeout(500);
  r = await rec();
  check('a document preview lands whole (page), not typed', r.filter((x) => x[0].startsWith('LINE')).every((x) => x[1] === 'page') && r.filter((x) => x[0].startsWith('LINE')).length === 3, r.map((x) => x.join(':')));
  await answer('[DONE]'); await calm();
  check('only the line that was edited changed', JSON.stringify(await doc()) === JSON.stringify(['LINE A', 'LINE B CHANGED', 'LINE C']), await doc());
  check('page errors', t.errs.length === 0, JSON.stringify(t.errs));
  await t.done();
})();
