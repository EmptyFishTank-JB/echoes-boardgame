// Log entry codes: the 20-character XXXXX-XXXXX-XXXXX-XXXXX a player types into FETCH LOG.EXE.
// Shared by the log editor (dev-tools/lore-devlog-editor.html) and the tests. The terminal itself only looks codes up as
// text and never decodes them; the editor decodes them to fill its fields.
//
// A code packs, and then scrambles with the project salt:
//   year (1900 to 2500), month, day, hour, minute          the moment the log was filed
//   number (0 to 999)                                       the crew number of the person who filed it
//   section (a letter A to Z or a digit 0 to 9, optional)   the department letter of that person
// Old codes carry no section and the number 1. They decode as before and report section null.
//
// How the section fits: the original packing is a number below 4e11. A section adds (index * 4e11), so a code with a section is
// always above that line and a code without one is always below it. Nothing about an existing code changes.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LogCodes = factory();
})(this, function () {
  'use strict';
  var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var BASE = 36, M = 2147483647, LCG_A = 1664525, LCG_C = 1013904223;
  var BASE_YEAR = 1900;                 // year range 1900 to 2500
  var SECTION_STEP = 4e11;              // above the largest packing without a section (about 3.2e11)
  var DATA_LIMIT = Math.pow(36, 9);     // the data segment is nine base 36 characters
  var DEFAULT_SALT = 106473093;         // fixed project wide; changing it makes every existing code unreadable

  function lcgStep(s) { return (LCG_A * s + LCG_C) % M; }
  function lcgInt(s, max) { var ns = lcgStep(s); return { val: Math.floor((ns / M) * max), seed: ns }; }

  function encodeB36(n, w) {
    if (n < 0) n = 0;
    var r = '', v = Math.floor(n);
    if (!v) { r = '0'; } else { while (v > 0) { r = CHARS[v % BASE] + r; v = Math.floor(v / BASE); } }
    while (r.length < w) r = '0' + r;
    return r;
  }
  function decodeB36(s) {
    var r = 0;
    for (var i = 0; i < s.length; i++) { var c = CHARS.indexOf(s[i]); if (c < 0) return -1; r = r * BASE + c; }
    return r;
  }

  // Day of year (Jan 1 is day 1). Date.UTC keeps it daylight saving safe and leap year aware.
  function dayOfYear(year, month, day) {
    return Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 1)) / 86400000) + 1;
  }
  function p2(n) { return String(n).padStart(2, '0'); }
  function p3(n) { return String(n).padStart(3, '0'); }
  function buildSD(year, doy, hour, min) { return year + '.' + p3(doy) + '.' + p2(hour) + p2(min); }
  // The other direction: 2143.126.0614 to { year, month, day, hour, minute, doy }, or null.
  function parseSD(sd) {
    var m = /^(\d{4})\.(\d{3})(?:\.(\d{2})(\d{2}))?$/.exec(String(sd || '').trim());
    if (!m) return null;
    var year = +m[1], doy = +m[2], d = new Date(Date.UTC(year, 0, doy));
    if (doy < 1 || doy > 366 || d.getUTCFullYear() !== year) return null;
    return { year: year, month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour: m[3] ? +m[3] : 0, minute: m[4] ? +m[4] : 0, doy: doy };
  }

  // Section letters: A to Z are 1 to 26, the digits 0 to 9 are 27 to 36. 0 means no section.
  function sectionIndex(ch) {
    if (ch === undefined || ch === null || ch === '') return 0;
    var i = CHARS.indexOf(String(ch).toUpperCase());
    if (i < 0 || String(ch).length !== 1) return -1;
    return i >= 10 ? i - 9 : i + 27;      // letters (CHARS index 10 to 35) then digits (0 to 9)
  }
  function sectionLetter(idx) {
    if (!idx) return null;
    return idx <= 26 ? CHARS[idx + 9] : CHARS[idx - 27];
  }

  function packData(yo, mo, d, h, mi, num) {
    var n = yo;
    n = n * 12 + (mo - 1);
    n = n * 31 + (d - 1);
    n = n * 24 + h;
    n = n * 60 + mi;
    n = n * 1000 + num;
    return n;
  }
  function unpackData(n) {
    var num = n % 1000;  n = Math.floor(n / 1000);
    var mi = n % 60;     n = Math.floor(n / 60);
    var h = n % 24;      n = Math.floor(n / 24);
    var d = (n % 31) + 1; n = Math.floor(n / 31);
    var mo = (n % 12) + 1; n = Math.floor(n / 12);
    return { yearOff: n, month: mo, day: d, hour: h, minute: mi, num: num };
  }

  function genPermutation(salt, n) {
    var perm = []; for (var i = 0; i < n; i++) perm.push(i);
    var seed = Math.abs(Math.floor(salt)) % M;
    if (!seed) seed = 987654321;
    seed = lcgStep(seed);
    for (var j = n - 1; j > 0; j--) {
      var r = lcgInt(seed, j + 1); seed = r.seed;
      var t = perm[j]; perm[j] = perm[r.val]; perm[r.val] = t;
    }
    return perm;
  }
  function computeChecksum(ds, fs) {
    var val = 0, s = ds + fs;
    for (var i = 0; i < s.length; i++) val = (val * 31 + CHARS.indexOf(s[i]) * (i + 1)) % (BASE * BASE);
    return encodeB36(val, 2);
  }
  function genFillerSeed(packNum, salt) {
    var a = packNum % M, b = Math.abs(Math.floor(salt)) % M;
    var seed = (a * 31337 + b * 1000003) % M;
    return seed || 111222333;
  }

  // generateCode(year, month, day, hour, minute, number, salt [, section]) -> { code } or { error }
  function generateCode(year, month, day, hour, minute, number, salt, section) {
    var yearOff = year - BASE_YEAR;
    if (yearOff < 0 || yearOff > 600) return { error: 'Year must be 1900–2500' };
    if (month < 1 || month > 12) return { error: 'Month must be 1–12' };
    if (day < 1 || day > 31) return { error: 'Day must be 1–31' };
    if (hour < 0 || hour > 23) return { error: 'Hour must be 0–23' };
    if (minute < 0 || minute > 59) return { error: 'Minute must be 0–59' };
    if (number < 0 || number > 999 || number !== Math.floor(number)) return { error: 'Crew number must be 0–999' };
    if (!salt || salt < 1) return { error: 'Set and save a salt first' };
    var sec = sectionIndex(section);
    if (sec < 0) return { error: 'Section must be one letter or digit' };

    var packNum = packData(yearOff, month, day, hour, minute, number) + sec * SECTION_STEP;
    if (packNum >= DATA_LIMIT) return { error: 'Too large to encode' };
    var ds = encodeB36(packNum, 9);
    var fSeed = genFillerSeed(packNum, salt);
    var fil = '';
    for (var i = 0; i < 9; i++) { fSeed = lcgStep(fSeed); fil += CHARS[Math.floor((fSeed / M) * BASE)]; }
    var ck = computeChecksum(ds, fil);
    var raw = ds + fil + ck;
    var perm = genPermutation(salt, 20);
    var sh = new Array(20);
    for (var k = 0; k < 20; k++) sh[perm[k]] = raw[k];
    var flat = sh.join('');
    return { code: flat.slice(0, 5) + '-' + flat.slice(5, 10) + '-' + flat.slice(10, 15) + '-' + flat.slice(15, 20) };
  }

  // decodeEntry(code, salt) -> { valid, year, month, day, hour, minute, doy, stardate, number, section, entryId } or { valid:false, error }
  // `section` is null for a code made before sections existed, and `entryId` is the same value as `number` (kept for old callers).
  function decodeEntry(code, salt) {
    var raw = String(code).replace(/-/g, '').toUpperCase().trim();
    if (raw.length !== 20) return { valid: false, error: 'Must be 20 characters (excluding hyphens)' };
    for (var i = 0; i < 20; i++) if (CHARS.indexOf(raw[i]) < 0) return { valid: false, error: 'Invalid character: ' + raw[i] };
    if (!salt || salt < 1) return { valid: false, error: 'Salt must be a positive integer' };
    var perm = genPermutation(salt, 20);
    var us = new Array(20);
    for (var j = 0; j < 20; j++) us[j] = raw[perm[j]];
    var u = us.join('');
    var ds = u.slice(0, 9), fil = u.slice(9, 18), ck = u.slice(18, 20);
    if (ck !== computeChecksum(ds, fil)) return { valid: false, error: 'Invalid checksum — wrong salt or corrupted code' };
    var packNum = decodeB36(ds);
    if (packNum < 0) return { valid: false, error: 'Could not decode data segment' };
    var fSeed = genFillerSeed(packNum, salt), ef = '';
    for (var k = 0; k < 9; k++) { fSeed = lcgStep(fSeed); ef += CHARS[Math.floor((fSeed / M) * BASE)]; }
    if (fil !== ef) return { valid: false, error: 'Filler mismatch — wrong salt or corrupted code' };
    var secIdx = Math.floor(packNum / SECTION_STEP);
    var d = unpackData(packNum - secIdx * SECTION_STEP);
    var year = d.yearOff + BASE_YEAR;
    var doy = dayOfYear(year, d.month, d.day);
    return { valid: true, year: year, month: d.month, day: d.day, hour: d.hour, minute: d.minute, doy: doy,
             number: d.num, entryId: d.num, section: sectionLetter(secIdx), stardate: buildSD(year, doy, d.hour, d.minute) };
  }

  return { CHARS: CHARS, DEFAULT_SALT: DEFAULT_SALT, generateCode: generateCode, decodeEntry: decodeEntry, dayOfYear: dayOfYear,
           buildSD: buildSD, parseSD: parseSD, sectionIndex: sectionIndex, sectionLetter: sectionLetter, encodeB36: encodeB36, decodeB36: decodeB36 };
});
