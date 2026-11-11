// Layer transitions: command accepted (typed line) > screen clears > transition text > then theme, header and sound switch > root page.
// The same for the chat to the archive (L1C to L1A), L1A to L2 and L2 to L3.
const L = require('./lib.js');
(async () => {
  const t = await L.open(); const { p, send, check } = t;
  await p.evaluate(() => {
    window.__ev = []; const log = (e) => window.__ev.push(e);
    const wrap = (name, f) => { const o = window[name]; window[name] = function () { log(f.apply(null, arguments)); return o.apply(this, arguments); }; };
    wrap('put', (el, text, kind) => ['put', text, kind || 'status', document.querySelectorAll('#t-output .t-line').length]);
    wrap('applyLayerClass', (n) => ['theme', n]);
    wrap('setHeaderTitle', (x) => ['header', x]);
    wrap('crossfadeAmbient', (n) => ['sound', n]);
  });
  const take = async () => { const e = await p.evaluate(() => { const x = window.__ev.slice(); window.__ev.length = 0; return x; }); return e; };
  const idx = (ev, pred) => ev.findIndex(pred);
  const typed = (ev) => ev.filter((e) => e[0] === 'put' && e[2] === 'flavor');
  const RULE = '> ' + '─'.repeat(33);

  const sequence = async (label, cmd, accepted, firstText, lastText, level, sound) => {
    await take(); await send(cmd); const ev = await take();
    const iAcc = idx(ev, (e) => e[0] === 'put' && e[1] === accepted);
    const iFirst = idx(ev, (e) => e[0] === 'put' && e[1] === firstText);
    const iLast = idx(ev, (e) => e[0] === 'put' && e[1] === lastText);
    const iTheme = idx(ev, (e) => e[0] === 'theme' && e[1] === level);
    const iHead = idx(ev, (e) => e[0] === 'header');
    const iSound = idx(ev, (e) => e[0] === 'sound' && e[1] === level);
    check(label + ': the command is accepted first, with a typed line (' + accepted + ')', iAcc >= 0 && iAcc < iFirst && ev[iAcc][2] === 'flavor', ev.map((e) => e.slice(0, 3).join(':')).slice(0, 4));
    check(label + ': the screen is cleared before the transition text (only its own lines are on screen)', iFirst > 0 && ev[iFirst][3] <= 3 && ev[iAcc][3] > ev[iFirst][3], [ev[iAcc] && ev[iAcc][3], ev[iFirst] && ev[iFirst][3]]);
    check(label + ': the transition text types in full, in order', typed(ev).filter((e) => e[1] !== accepted).length >= 1 && iLast >= iFirst, typed(ev).map((e) => e[1]));
    check(label + ': the theme and header switch only after the last transition line' + (sound ? ', then the sound' : ''), iTheme > iLast && iHead > iLast && (!sound || iSound > iLast), [iLast, iTheme, iHead, iSound]);
    return ev;
  };

  // chat to archive
  let ev = await sequence('chat to L1A', '[ECHOES.ARCHIVE]', '> MOUNTING ECHOES:\\ . . .', '> ECHOES-ARCHIVE ACCESS GRANTED.', '> ECHOES-ARCHIVE ACCESS GRANTED.', 1, false);
  check('chat to L1A: the screen ends on the L1 archive root, in the L1 theme', (await p.evaluate(() => termState + '|' + currentLevel)) === 'L1A_ROOT|1');
  // L1A to L2
  ev = await sequence('L1A to L2', '[INITIATE ECHO PROTOCOL]', '> GATEWAY COMMAND ACCEPTED . . .', '> INITIATING ECHO PROTOCOL...', '> ECHO PROTOCOL ACTIVE.', 2, true);
  check('L1A to L2: ends on the L2 root with the L2 theme', (await p.evaluate(() => termState + '|' + currentLevel + '|' + document.body.className)).startsWith('L2A_ROOT|2|') && (await p.evaluate(() => document.body.classList.contains('layer-2a'))));
  // L2 to L3
  ev = await sequence('L2 to L3', '[INITIATE CHRONO-ZERO PROTOCOL]', '> GATEWAY COMMAND ACCEPTED . . .', '> ECH/OES SHIP SYSTEM TERMINAL 426 //', RULE, 3, true);
  check('L2 to L3: ends on the L3 root with the L3 theme and header', (await p.evaluate(() => termState + '|' + currentLevel)) === 'L3A_ROOT|3' && (await p.$eval('#t-title', (e) => e.textContent)).includes('DEEP ARCHIVE'));
  check('moving back up still clears and switches, with no transition text', await (async () => { await take(); await send('[EXIT]'); const e = await take(); return !e.some((x) => x[0] === 'put' && x[2] === 'flavor') && e.some((x) => x[0] === 'theme' && x[1] === 2); })());
  const strs = await p.evaluate(() => [CFG_STRINGS.layer_mount, CFG_STRINGS.layer_entry_l2, CFG_STRINGS.layer_entry_l3]);
  check('the three accepted lines are separate strings (so each can be changed)', strs.length === 3 && strs[0] !== strs[1] && strs[1] === strs[2], strs);
  check('page errors', t.errs.length === 0, JSON.stringify(t.errs));
  await t.done();
})();
