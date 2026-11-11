const L = require('./lib.js');
(async () => {
  const t = await L.open(); const { p, send, out, check } = t;
  await p.evaluate(() => {
    window.__batches = [];
    new MutationObserver((ms) => {
      const added = []; for (const m of ms) m.addedNodes.forEach((n) => { if (n.nodeType === 1 && n.classList.contains('t-line')) added.push(n); });
      if (added.length > 3) window.__batches.push(added.map((n) => ({ text: n.textContent.slice(0, 24), anim: getComputedStyle(n).animationName, phos: n.classList.contains('phos'), kids: Array.from(n.querySelectorAll('*')).filter((k) => getComputedStyle(k).animationName !== 'none').length })));
    }).observe(document.getElementById('t-output'), { childList: true });
  });
  const take = () => p.evaluate(() => { const b = window.__batches; window.__batches = []; return b; });
  let before = new Set();
  const bad = (bs) => bs.flat().filter((x) => before.has(x.text.trim().slice(0, 24)) && x.text.trim().length > 2 && (x.anim !== 'none' || x.phos || x.kids));
  const snapTexts = () => p.evaluate(() => Array.from(document.querySelectorAll('#t-output .t-line')).map((e) => e.textContent.trim().slice(0, 24)));
  await send('hello'); await send('what is this place');
  await send('[ECHOES.ARCHIVE]'); await take();
  before = new Set(await snapTexts()); await send('[EXIT]'); let bs = await take();
  check('returning to the chat restores lines without replaying the glow', bs.length >= 1 && bad(bs).length === 0, JSON.stringify(bad(bs)).slice(0, 400));
  await send('[ECHOES.ARCHIVE]'); await take();
  before = new Set(await snapTexts()); await send('[SYSTEM OVERRIDE]'); await take();
  await send('[EXIT]'); bs = await take();
  check('leaving the override restores the screen without replaying the glow', bs.length >= 1 && bad(bs).length === 0, JSON.stringify(bad(bs)).slice(0, 400));
  // a line whose animation never ends (animationend does not fire): the timer still clears the class
  await p.evaluate(() => { const l = addLine('full'); l.textContent = 'STUCK PROBE'; l.style.animation = 'none'; });
  await p.waitForTimeout(900);
  const stuck = await p.evaluate(() => document.querySelectorAll('#t-output .t-line.phos').length);
  check('a glow class never outlives the glow (timer backstop, even without animationend)', stuck === 0, stuck);
  const now = await p.evaluate(() => Array.from(document.querySelectorAll('#t-output .t-line')).filter((e) => getComputedStyle(e).animationName !== 'none').map((e) => e.textContent.slice(0, 30)));
  console.log('lines animating once settled:', JSON.stringify(now));
  await t.done();
})();
