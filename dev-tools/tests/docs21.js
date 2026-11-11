const L = require('./lib.js');
(async () => {
  const t = await L.open({ viewport: { width: 390, height: 780 } }); const { p, send, out, check } = t;
  await send('[ECHOES.ARCHIVE]');
  const open = async (folder, alias) => { await send('[ROOT]'); await send(folder); await send(alias); return out(); };
  const sets = [['[INCIDENT REPORTS]', '[MEDICAL TRIAGE — DAY 34]'], ['[INCIDENT REPORTS]', '[EMERGENCY PROTOCOL — DAY 41]'], ['[RESTRICTED FILES]', "[CAPTAIN'S PRIVATE LOG]"], ['[RESTRICTED FILES]', '[RESEARCH NOTES — DR. OSEI]'], ['[RESTRICTED FILES]', '[COMMUNICATION INTERCEPTS]']];
  for (const [f, a] of sets) {
    const o = await open(f, a);
    const over = await p.evaluate(() => Array.from(document.querySelectorAll('#t-output .t-line')).filter((e) => e.scrollWidth > e.clientWidth + 2).length);
    check(a + ' opens, and its lines wrap or fit on a phone without sideways scroll', o.some((l) => /PARTIAL|LOG|NOTES|PROTOCOL|COMMUNICATIONS/.test(l)) && (await p.evaluate(() => document.getElementById('t-output').scrollWidth <= document.getElementById('t-output').clientWidth + 2)), over);
  }
  const o = await open('[RESTRICTED FILES]', '[RESEARCH NOTES — DR. OSEI]');
  console.log('page errors:', JSON.stringify(t.errs)); await t.done();
})();
