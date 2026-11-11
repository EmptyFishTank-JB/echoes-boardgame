// Log data: every entry in lore.json and dev_logs.json is well formed, and the 2143 logs can be fetched and listed.
const L = require('./lib.js'), LC = require('../log-codes.js');
(async () => {
  const t = await L.open(); const { p, send, check } = t;
  const lore = await p.evaluate(() => fetch('./terminal-data/lore.json').then((r) => r.json()));
  const dev = await p.evaluate(() => fetch('./terminal-data/dev_logs.json').then((r) => r.json()));
  const registry = (await p.evaluate(() => fetch('./terminal-data/crew.json').then((r) => r.json())));
  // A header may hold corruption glyphs where the log was damaged on purpose (the override), so the ID and the stardate are read loosely
  // and checked against override.real and the override levels below.
  const GL = '▒░▓╳¤¦¿█', glRe = new RegExp('[' + GL + ']', 'g'), hasGl = (x) => new RegExp('[' + GL + ']').test(x);
  const HEAD = new RegExp('^\\[Log ([A-Z' + GL + ']-[0-9' + GL + ']{2,3}) \\| Stardate ([0-9' + GL + ']{4}\\.[0-9' + GL + ']{3}\\.[0-9' + GL + ']{4})\\]$'), LABEL = /^(.*?) ([A-Z]-\d{2,3}) \| Stardate (\d{4}\.\d{3}\.\d{4})$/;
  const lint = (name, data, levels, dev) => {
    const bad = [];
    for (const [code, e] of Object.entries(data)) {
      const lines = String(e.text || '').split('\n'); const h = HEAD.exec(lines[0] || ''), l = LABEL.exec(e.label || '');
      if (!/^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(code) || /^TEMP/.test(code)) bad.push(code + ': code format (or a TEMP placeholder)');
      const ov = e.override, real = ov && ov.real;
      const wantId = real ? real.id : h && h[1], wantSd = real ? real.stardate : h && h[2];   // the real ID and moment: the label always carries them
      if (!h || !l || wantId !== l[2] || wantSd !== l[3]) bad.push(code + ': header and label disagree');
      if (ov && h && real) {   // the damage in the header is what the override says
        const [hl, hn] = h[1].split('-'), [rl, rn] = real.id.split('-'), ng = (hn.match(glRe) || []).length;
        if (ov.dept ? !hasGl(hl) : hl !== rl) bad.push(code + ': the header letter does not follow override.dept');
        if (ov.num === 0 ? hn !== rn : ov.num === 1 ? ng !== 1 : ng !== 3) bad.push(code + ': the header number does not follow override.num');
        if (ov.time ? !hasGl(h[2]) : h[2] !== real.stardate) bad.push(code + ': the header stardate does not follow override.time');
        const sl = [...lines].reverse().find((x) => /——/.test(x));
        if (ov.sign && (!sl || sl.trim() === real.sign.trim() || (ov.sign === 2 ? !/\[UNVERIFIED\]/.test(sl) : !hasGl(sl)))) bad.push(code + ': the sign-off does not follow override.sign');
      }
      if (!/^(full|classified|virus)$/.test(e.type)) bad.push(code + ': type');
      if (e.health && !/^(PARTIAL|DEGRADED|CORRUPTED)$/.test(e.health)) bad.push(code + ': health');
      if (!levels.includes(e.clearance)) bad.push(code + ': clearance should be ' + levels.join(' or ') + ' (the level that can open it)');
      if (!/^\[END OF LOG\]$/.test(lines[lines.length - 1])) bad.push(code + ': no END OF LOG');
      if (e.label !== e.label.replace(/Creator's/i, (m) => m.toUpperCase()) && /creator/i.test(e.label) && !/CREATOR'S LOG/.test(e.label)) bad.push(code + ': label capitalization');
      // A code made with a department carries the Log ID, so the ID in the header must be that one, and registered.
      const d = LC.decodeEntry(code, LC.DEFAULT_SALT);
      if (d.valid && d.section) {
        const want = d.section + '-' + String(d.number).padStart(3, '0'), person = registry.crew[want];
        if (wantId !== want) bad.push(code + ': the code says ' + want + ' but the log says ' + wantId);
        if (d.stardate !== wantSd) bad.push(code + ': the code says stardate ' + d.stardate + ' but the log says ' + wantSd);
        if (!person) bad.push(code + ': ' + want + ' is not in crew.json');
        else if (e.author !== want) bad.push(code + ': author should be ' + want);
        else if (!(real && real.sign ? real.sign : lines.join('\n')).includes(person.signature)) bad.push(code + ': the sign-off does not use ' + want + "'s signature");
        if (!!(registry.departments[d.section] || {}).dev !== dev) bad.push(code + ': department ' + d.section + ' is on the wrong side (lore vs dev)');
      }
    }
    check(name + ': every entry has a real code, a matching header and label, a type, a level (' + levels.join(' or ') + ') and an end marker', !bad.length, bad);
  };
  lint('lore.json', lore, [2, 3], false); lint('dev_logs.json', dev, [3], true);
  check('codes are unique across both files', new Set([...Object.keys(lore), ...Object.keys(dev)]).size === Object.keys(lore).length + Object.keys(dev).length);

  check('the boot checks still read both log files as OK', await p.evaluate(() => FILE_STATUS.lore.state === 'ok' && FILE_STATUS.devlogs.state === 'ok'), await p.evaluate(() => [FILE_STATUS.lore, FILE_STATUS.devlogs]));
  // The 2143 logs keep the lore's prose rules: no em dashes in the text (the attribution line may carry them), numbers spelled out.
  const crew = Object.entries(lore).filter(([, e]) => /Stardate 2143\./.test(e.label) && !/^CAPTAIN'S LOG/.test(e.label));
  const dashes = crew.filter(([, e]) => e.text.split('\n').some((l) => /—/.test(l) && !/^\s+—— /.test(l)));
  check('the crew logs have no em dashes in their text', !dashes.length, dashes.map(([c]) => c));
  const digits = crew.filter(([, e]) => e.text.split('\n').slice(1).some((l) => /\d/.test(l.replace(/\b\d{4}\b/g, '').replace(/ECH\/OES/g, ''))));
  check('...and spell numbers out (clock times excepted)', !digits.length, digits.map(([c]) => c));
  const widest = Math.max(...Object.values(lore).map((e) => Math.max(...e.text.split('\n').map((l) => l.length))));
  check('no log line is wider than the FETCH LOG window fits (92)', widest <= 92, widest);
  const sd = Object.values(lore).filter((e) => /^\w[\w' ]* [A-Z]-\d+ \| Stardate 2143\.(\d{3})\./.test(e.label)).map((e) => +/2143\.(\d{3})/.exec(e.label)[1]);
  check('every 2143 log falls inside the incident window (2143.119 to 2143.181)', sd.length >= 8 && sd.every((d) => d >= 119 && d <= 181), sd);

  // Fetch them in the terminal
  await send('[ECHOES.ARCHIVE]'); await send('[INITIATE ECHO PROTOCOL]');
  const open = async () => { await p.fill('#t-field', '[FETCH LOG ENTRY: //]'); await p.press('#t-field', 'Enter'); await p.waitForSelector('#prog-layer .le-code', { timeout: 15000 }); };
  await open();
  const fetchCode = async (code) => { await p.fill('.le-code', code); await p.press('.le-code', 'Enter'); await p.waitForTimeout(250); return p.evaluate(() => document.querySelector('.le-view').innerText); };
  const security = Object.entries(lore).find(([, e]) => /^SECURITY LOG/.test(e.label));
  const v = await fetchCode(security[0]);
  check('a crew log opens in the FETCH LOG window with its header and text', v.includes(security[1].text.split('\n')[0]) && v.includes('empty on every frame'), v.slice(0, 120));
  for (const [c] of Object.entries(lore)) if (c !== security[0]) await fetchCode(c);
  await p.click('.le-actions >> text=RECOVERED LOGS'); await p.waitForTimeout(300);
  const rows = await p.evaluate(() => Array.from(document.querySelectorAll('.le-row')).map((r) => Array.from(r.children).map((s) => s.textContent)));
  const types = new Set(rows.map((r) => r[3]));
  check('the recovered list shows every log with its type', rows.length === Object.keys(lore).length && ['CAPTAIN\'S LOG', 'RESEARCH LOG', 'SECURITY LOG', 'ENGINEERING LOG', 'MEDICAL LOG', 'POD BAY LOG', 'HABITAT LOG'].every((x) => types.has(x)), [...types]);
  check('...all intact, and none overflows its row', rows.every((r) => r[2] === 'INTACT') && await p.evaluate(() => Array.from(document.querySelectorAll('.le-row')).every((r) => r.scrollWidth <= r.clientWidth + 2)), rows.map((r) => r[2]));
  console.log('page errors:', JSON.stringify(t.errs)); await t.done();
})();
