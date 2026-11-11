// Log codes (dev-tools/log-codes.js): the existing codes still decode and regenerate exactly, and department codes round trip.
const fs = require('fs'), path = require('path');
const LC = require('../log-codes.js');
const root = path.resolve(__dirname, '..', '..', 'terminal-data');
let fails = 0; const check = (n, ok, x) => { console.log((ok ? 'PASS ' : 'FAIL ') + n + (!ok && x !== undefined ? '  ' + JSON.stringify(x).slice(0, 300) : '')); if (!ok) fails++; };
const SALT = LC.DEFAULT_SALT;

// every code made before sections existed: decodes, says no section, and regenerates to the same code
const old = [];
for (const f of ['lore.json', 'dev_logs.json']) for (const code of Object.keys(JSON.parse(fs.readFileSync(path.join(root, f), 'utf8')))) if (!/^TEMP0/.test(code)) old.push([f, code]);
const legacy = old.filter(([, c]) => { const d = LC.decodeEntry(c, SALT); return d.valid && d.section === null; });
check('existing codes decode with the project salt', old.length > 0 && old.every(([, c]) => LC.decodeEntry(c, SALT).valid || LC.decodeEntry(c, SALT).section), old.filter(([, c]) => !LC.decodeEntry(c, SALT).valid));
check('...and a code with no section regenerates to exactly the same code', legacy.length > 0 && legacy.every(([, c]) => { const d = LC.decodeEntry(c, SALT); return LC.generateCode(d.year, d.month, d.day, d.hour, d.minute, d.number, SALT).code === c; }), legacy.length);
const a01 = LC.decodeEntry('1GOXN-58Y5R-VNCUE-MUB0F', SALT);
check('Captain\'s Log A-01 decodes to 2143.119.1719, number 1, no section', a01.valid && a01.stardate === '2143.119.1719' && a01.number === 1 && a01.section === null, a01);

// department codes
const g = LC.generateCode(2143, 5, 6, 6, 14, 114, SALT, 'R'); const d = LC.decodeEntry(g.code, SALT);
check('a code with a department round trips (R, 114, 2143.126.0614)', d.valid && d.section === 'R' && d.number === 114 && d.stardate === '2143.126.0614' && d.month === 5 && d.day === 6, [g, d]);
check('the department is part of the code: R-114 and M-114 at the same minute differ', LC.generateCode(2143, 5, 6, 6, 14, 114, SALT, 'M').code !== g.code);
check('the number is part of the code', LC.generateCode(2143, 5, 6, 6, 14, 115, SALT, 'R').code !== g.code);
check('a code with a department differs from the same moment without one', LC.generateCode(2143, 5, 6, 6, 14, 114, SALT).code !== g.code);
let allOk = true; const seen = new Set();
for (const sec of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') for (const [y, num] of [[1900, 0], [2026, 1], [2143, 999], [2500, 500]]) {
  const r = LC.generateCode(y, 12, 31, 23, 59, num, SALT, sec), x = LC.decodeEntry(r.code, SALT);
  if (!(x.valid && x.section === sec && x.number === num && x.year === y && x.month === 12 && x.day === 31 && x.hour === 23 && x.minute === 59)) allOk = false;
  seen.add(r.code);
}
check('every section letter and digit round trips at the edges of the year and number ranges', allOk && seen.size === 36 * 4, seen.size);
check('a wrong salt does not decode', !LC.decodeEntry(g.code, SALT + 1).valid);
check('bad input is refused', LC.generateCode(2143, 5, 6, 6, 14, 1000, SALT, 'R').error && LC.generateCode(2143, 5, 6, 6, 14, 5, SALT, 'RR').error && LC.generateCode(1800, 5, 6, 6, 14, 5, SALT).error);
const sd = LC.parseSD('2143.126.0614');
check('parseSD reads a stardate back into a date', sd && sd.year === 2143 && sd.month === 5 && sd.day === 6 && sd.hour === 6 && sd.minute === 14 && !LC.parseSD('2143.400.0000') && !LC.parseSD('nope'), sd);
console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); process.exit(fails ? 1 : 0);
