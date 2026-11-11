const L = require('./lib.js');
(async () => {
  const t = await L.open();
  const n = () => t.p.evaluate(() => document.querySelectorAll('#t-output .t-cursor').length);
  await t.send('hello'); await t.send('[HELP]');
  t.check('chat: one cursor after a few commands', (await n()) === 1, await n());
  await t.send('[ECHOES.ARCHIVE]'); await t.send('[CREW MANIFEST]'); await t.send('[BACK]');
  t.check('archive: one cursor', (await n()) === 1, await n());
  await t.send('[EXIT]');
  t.check('back in chat: still one cursor (restored history has none blinking)', (await n()) === 1, await n());
  await t.done();
})();
