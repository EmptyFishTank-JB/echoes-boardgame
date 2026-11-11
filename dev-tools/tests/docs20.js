const L = require('./lib.js');
(async () => {
  const t = await L.open(); const { p, send, out, check } = t;
  const v = await p.evaluate(() => { const r = runDataValidator(); return { orphaned: r.orphaned, stub: r.stub, dangling: r.dangling, fileProblems: r.fileProblems }; });
  check('the validator finds no orphaned nodes and no stubs', v.orphaned.length === 0 && v.stub.length === 0 && v.dangling.length === 0, v);
  await send('[ECHOES.ARCHIVE]'); await send('[INCIDENT REPORTS]'); let o = await out();
  check('INCIDENT REPORTS now lists the triage record and the protocol', o.some((l) => l.includes('[MEDICAL TRIAGE')) && o.some((l) => l.includes('[EMERGENCY PROTOCOL')), o.slice(-12));
  await send('[MEDICAL TRIAGE — DAY 34]'); o = await out();
  check('the triage record opens', o.some((l) => l.includes('MEDICAL BAY TRIAGE LOG')) && o.some((l) => l.includes('Day thirty-four')), o.slice(-8));
  await send('[BACK]'); await send('[EMERGENCY PROTOCOL — DAY 41]'); o = await out();
  check('the protocol opens', o.some((l) => l.includes('REVIEW DATE: DAY 41')), o.slice(-6));
  await send('[ROOT]'); await send('[RESTRICTED FILES]'); o = await out();
  check('RESTRICTED FILES lists research notes and intercepts but not the captain\'s private log', o.some((l) => l.includes('[RESEARCH NOTES')) && o.some((l) => l.includes('[COMMUNICATION INTERCEPTS]')) && !o.slice(-14).some((l) => l.includes("[CAPTAIN'S PRIVATE LOG]")), o.slice(-12));
  await send("[CAPTAIN'S PRIVATE LOG]"); o = await out();
  check('the private log opens by typing its name', o.some((l) => l.includes("CAPTAIN'S LOG, PRIVATE")), o.slice(-6));
  const widths = await p.evaluate(() => Array.from(document.querySelectorAll('#t-output .t-line')).map((e) => e.scrollWidth > e.clientWidth + 2 ? e.textContent.slice(0, 40) : null).filter(Boolean));
  check('no line overflows the screen', widths.length === 0, widths);
  console.log('page errors:', JSON.stringify(t.errs)); await t.done();
})();
