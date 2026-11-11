// Log codes (dev-tools/log-codes.js): the existing codes still decode and regenerate exactly, and department codes round trip.
const fs = require('fs'), path = require('path');
const LC = require('../log-codes.js');
const root = path.resolve(__dirname, '..', '..', 'terminal-data');
let fails = 0; const check = (n, ok, x) => { console.log((ok ? 'PASS ' : 'FAIL ') + n + (!ok && x !== undefined ? '  ' + JSON.stringify(x).slice(0, 300) : '')); if (!ok) fails++; };
const SALT = LC.DEFAULT_SALT;

// Every code made before sections existed. The data files now carry department codes, so the old ones are listed here: they must
// still decode, say no section and regenerate to exactly the same code.
const OLD = { '1GOXN-58Y5R-VNCUE-MUB0F': '2143.119.1719', '1Q3CN-XVPCP-WGX6M-VTV0X': '2143.136.2132', '0DKPV-X47UZ-310W7-6JR03': '2026.135.1429',
  '0SKDV-LTA3B-3TFYX-RXJ0D': '2026.136.0226', '0YLGV-HS6UQ-384SD-FPN01': '2026.136.2143', '0WLVV-57R9K-3UTR6-KXO02': '2026.137.1719',
  '02TOV-9H188-3CD4C-3870P': '2026.146.1217', '0FXBV-1AFQH-3098O-G3Y0P': '2026.151.0103', '0UVOV-58FNO-79J1X-EAF04': '2026.315.0004' };
const dec = Object.entries(OLD).map(([c, sd]) => [c, sd, LC.decodeEntry(c, SALT)]);
check('the nine codes made before departments existed still decode with the project salt, to their stardates', dec.every(([, sd, d]) => d.valid && d.stardate === sd), dec.filter(([, sd, d]) => !(d.valid && d.stardate === sd)).map((x) => x[0]));
check('...they carry no section and read as number 1', dec.every(([, , d]) => d.section === null && d.number === 1));
check('...and each regenerates to exactly the same code', dec.every(([c, , d]) => LC.generateCode(d.year, d.month, d.day, d.hour, d.minute, d.number, SALT).code === c));
// the codes now in the data files
let inFiles = 0, bad = [];
for (const f of ['lore.json', 'dev_logs.json']) for (const code of Object.keys(JSON.parse(fs.readFileSync(path.join(root, f), 'utf8')))) { inFiles++; const d = LC.decodeEntry(code, SALT); if (!(d.valid && d.section)) bad.push(code); }
check('every code in lore.json and dev_logs.json is a real department code', inFiles > 0 && !bad.length, bad);

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
