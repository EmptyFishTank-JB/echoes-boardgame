// The navigation pip: a short soft tone when arrowing through a menu, the command history and the inbox list. Higher going up, lower going
// down, a dull tick where the history ends. It does nothing while the terminal is busy and it uses the master volume.
const L = require('./lib.js');
(async () => {
  const t = await L.open(); const { p, send, check } = t;
  await p.evaluate(() => { window.__pips = []; const o = window.playNavPip; window.playNavPip = function (d, e) { window.__pips.push([d, !!e]); return o.apply(this, arguments); }; });
  const take = () => p.evaluate(() => { const x = window.__pips.slice(); window.__pips.length = 0; return x; });
  const key = async (k) => { await p.press('#t-field', k); await p.waitForTimeout(60); };
  const field = () => p.inputValue('#t-field');

  // ---- command history in the chat ----
  await send('[HELP]'); await send('[TREE]'); await take();
  await key('ArrowUp');
  check('ArrowUp in the chat history brings back the last command with a high pip', (await field()) === '[TREE]' && JSON.stringify(await take()) === '[[-1,false]]');
  await key('ArrowUp');
  check('...the one before it with another high pip', (await field()) === '[HELP]' && JSON.stringify(await take()) === '[[-1,false]]');
  await key('ArrowUp');
  check('...and at the oldest command a dull tick (edge) instead, with nothing changing', (await field()) === '[HELP]' && JSON.stringify(await take()) === '[[-1,true]]');
  await key('ArrowDown'); await key('ArrowDown');
  check('ArrowDown goes back toward the present with low pips and ends on an empty field', (await field()) === '' && JSON.stringify(await take()) === '[[1,false],[1,false]]');
  await key('ArrowDown');
  check('...and a dull tick at the empty end', (await field()) === '' && JSON.stringify(await take()) === '[[1,true]]');

  // ---- a menu ----
  await send('[ECHOES.ARCHIVE]'); await take();
  check('the archive page is a menu', await p.evaluate(() => currentMenuOpts.length > 1));
  await key('ArrowDown');
  const m1 = await field();
  check('ArrowDown moves down the menu with a low pip', m1 !== '' && JSON.stringify(await take()) === '[[1,false]]', m1);
  await key('ArrowUp');
  check('ArrowUp moves up with a high pip', JSON.stringify(await take()) === '[[-1,false]]');
  await key('Tab');
  check('Tab moves down like ArrowDown, with the low pip', JSON.stringify(await take()) === '[[1,false]]');
  await p.evaluate(() => { uiLock++; });
  await key('ArrowDown'); await key('ArrowUp');
  check('nothing sounds while the terminal is busy', JSON.stringify(await take()) === '[]');
  await p.evaluate(() => { uiLock--; });

  // ---- the sound itself, with a stand-in audio context ----
  const snd = await p.evaluate(async () => {
    const real = window.audioCtx, made = [];
    window.audioCtx = { currentTime: 1, destination: {},
      createOscillator() { const o = { type: '', frequency: { value: 0 }, connect() {}, start(x) { o.t0 = x; }, stop(x) { o.t1 = x; } }; made.push(o); return o; },
      createGain() { const g = { gain: { setValueAtTime(v) { g.v = v; }, exponentialRampToValueAtTime() {} }, connect() {} }; g.gain.owner = g; made.push(g); return g; } };
    for (const [d, e] of [[-1, false], [1, false], [1, true]]) { window.playNavPip(d, e); await new Promise((r) => setTimeout(r, 45)); }
    const oscs = made.filter((x) => 'frequency' in x), gains = made.filter((x) => !('frequency' in x));
    window.playNavPip(1); window.playNavPip(1);   // two within a few milliseconds
    await new Promise((r) => setTimeout(r, 45));
    const burst = made.filter((x) => 'frequency' in x).length - oscs.length;
    window.audioCtx = real;
    return { f: oscs.map((x) => x.frequency.value), type: oscs.map((x) => x.type), dur: oscs.map((x) => +(x.t1 - x.t0).toFixed(3)), vol: gains.map((g) => g.v), master: VOL, burst };
  });
  check('going up is higher than going down, and the end of the history is the lowest', snd.f[0] > snd.f[1] && snd.f[2] < snd.f[1], snd.f);
  check('each pip is short (under 60 ms) and the dull tick is a different waveform', snd.dur.every((d) => d > 0 && d <= 0.06) && snd.type[2] === 'triangle' && snd.type[0] === 'sine', [snd.dur, snd.type]);
  check('it is quiet and follows the master volume', snd.vol.every((v) => v > 0 && v <= snd.master * 0.5 + 1e-9), [snd.vol, snd.master]);
  check('a held key is thinned: two pips a few milliseconds apart make one sound', snd.burst === 1, snd.burst);

  // ---- the inbox list ----
  await send('[SYSTEM OVERRIDE]'); await send('[JUMP L3]'); await take();
  await send('[INBOX]'); await p.waitForSelector('#prog-layer.open .mb-list .mb-row', { timeout: 10000 }); await p.waitForTimeout(200);
  await take();
  await p.keyboard.press('ArrowDown'); await p.waitForTimeout(80);
  check('ArrowDown in the inbox list moves to the next message with the low pip', JSON.stringify(await take()) === '[[1,false]]' && (await p.evaluate(() => document.activeElement.classList.contains('mb-row'))));
  await p.keyboard.press('ArrowDown'); await p.waitForTimeout(80); await take();
  await p.keyboard.press('ArrowDown'); await p.waitForTimeout(80);
  check('...and at the last message a dull tick', JSON.stringify(await take()) === '[[1,true]]');
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  check('page errors', t.errs.length === 0, JSON.stringify(t.errs));
  await t.done();
})();
