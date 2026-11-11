const L = require('./lib.js');
(async () => {
  for (const [name, vp] of [['desktop', { width: 1100, height: 760 }], ['phone', { width: 390, height: 780 }]]) {
    const t = await L.open({ viewport: vp }); const { p, check } = t;
    const info = await p.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('#t-output .t-line.art'));
      const last = rows[rows.length - 1];
      const o = document.getElementById('t-output');
      return { n: rows.length, lastSegs: last ? Array.from(last.querySelectorAll('span')).map(s => [s.className, s.textContent.trim()]) : [], head: rows[0] ? rows[0].textContent : '', firstSegs: rows[2] ? Array.from(rows[2].querySelectorAll('span')).map(s => s.className) : [], overflow: o.scrollWidth > o.clientWidth + 1, maxW: Math.max(...rows.map(r => r.scrollWidth)), avail: o.clientWidth, title: Array.from(document.querySelectorAll('#t-output .t-line')).map(e => e.textContent).find(t => t.includes('SHIP SYSTEM TERMINAL 426')) };
    });
    check(name + ': art rows drawn (heading, spacer and ' + (name === 'desktop' ? 5 : 4) + ' of art)', info.n === (name === 'desktop' ? 7 : 6), JSON.stringify(info.n));
    check(name + ': the DSCF CHARON heading sits above the art', /^DSCF CHARON \u2500+$/.test(info.head.trim()), info.head);
    check(name + ': ECH bright, OES dimmer', info.firstSegs[0] === 'seg-full' && info.firstSegs[1] === 'seg-lo', JSON.stringify(info.firstSegs));
    check(name + ': O.S. sits to the right of the art on the last row', info.lastSegs.length === 3 && info.lastSegs[2][1] === 'O.S.' && info.lastSegs[2][0] === 'seg-dim', JSON.stringify(info.lastSegs));
    check(name + ': fits the screen, no sideways scroll', !info.overflow && info.maxW <= info.avail, JSON.stringify({ maxW: info.maxW, avail: info.avail }));
    check(name + ': the subtitle line follows the art', !!info.title, String(info.title));
    await t.done();
  }
})();
