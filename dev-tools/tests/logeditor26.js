// The lore / dev log editor (dev-tools/lore-devlog-editor.html): sections in order of use, the author selector and crew registry,
// the Log ID in the code, condition and access level, the ID override, loading an entry on the first click, and saving.
const { chromium, launchOptions, BASE } = require('./env.js');
const LC = require('../log-codes.js');
(async () => {
  const b = await chromium.launch(launchOptions);
  const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 } });
  // The editor asks GitHub for its own commit id and Google for a font. Answer both here so the suite never depends on the network.
  await ctx.route(/api\.github\.com/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  p.on('dialog', (d) => d.accept());
  let fails = 0; const check = (n, ok, x) => { console.log((ok ? 'PASS ' : 'FAIL ') + n + (!ok && x !== undefined ? '  ' + JSON.stringify(x) : '')); if (!ok) fails++; };
  const URL = BASE + '/dev-tools/lore-devlog-editor.html';
  const ready = () => p.waitForFunction(() => /CREW:/.test(document.getElementById('fstat-crew').textContent), null, { timeout: 15000 });
  const fresh = async () => { await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.goto(URL); await ready(); await p.waitForTimeout(150); };
  const val = (id) => p.inputValue('#' + id);
  const ev = (f, a) => p.evaluate(f, a);
  const hdr = () => ev(() => document.getElementById('hp-line1').textContent + ' / ' + document.getElementById('hp-line2').textContent);
  const setSD = async (sd) => { await p.fill('#sdin', sd); };
  // Fill a complete lore log by the screen, as a person would
  const writeLog = async (o = {}) => {
    if (o.author !== false) await p.selectOption('#authsel', o.author || 'R-118');
    await setSD(o.sd || '2143.126.0614');
    await p.fill('#logtxt', o.text || 'The numbers do not match the last survey.\n\n    —— Dr. A. Osei');
  };

  // ---------- structure ----------
  await fresh();
  check('the page loads without errors', errs.length === 0, errs);
  const order = await ev(() => ['sec-author', 'sec-kind', 'sec-when', 'sec-cond', 'sec-text', 'sec-code', 'sec-save'].map((i) => document.getElementById(i))
    .every((el, i, a) => !!el && (i === 0 || (a[i - 1].compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING))));
  check('the sections run in order of use: author, kind, date, condition, text, code, save', order);
  check('the tools (template editor, decode, import) come after the save step', await ev(() => {
    const t = document.querySelector('.tools-title'), s = document.getElementById('sec-save');
    return !!(s.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING) && ['tpl-editor', 'dec-sec', 'dz'].every((i) => !!(t.compareDocumentPosition(document.getElementById(i)) & Node.DOCUMENT_POSITION_FOLLOWING));
  }));
  check('there is no classified toggle or L1 preview box', await ev(() => !document.getElementById('l1pre') && !document.querySelector('#ctg [data-v="classified"]') && !document.getElementById('clrg')));
  check('access offers L2 and L3 only', JSON.stringify(await ev(() => [...document.querySelectorAll('#atg .tg')].map((b) => b.dataset.v))) === '["2","3"]');
  check('the condition buttons are INTACT, PARTIAL, DEGRADED, CORRUPTED', JSON.stringify(await ev(() => [...document.querySelectorAll('#ctg .tg')].map((b) => b.dataset.v))) === '["INTACT","PARTIAL","DEGRADED","CORRUPTED"]');

  // ---------- author selector ----------
  const loreIds = await ev(() => [...document.querySelectorAll('#authsel option')].map((o) => o.value).filter(Boolean));
  check('the author list holds the lore crew and no dev ID', loreIds.includes('R-118') && loreIds.includes('A-014') && !loreIds.some((v) => v[0] === 'D'), loreIds);
  await p.selectOption('#authsel', 'R-118');
  const f1 = await ev(() => ({ l: lidl.value, n: lidn.value, ro: lidl.readOnly && lidn.readOnly, lt: logtype.value }));
  check('picking an author fills and locks the Log ID and sets the usual log type', f1.l === 'R' && f1.n === '118' && f1.ro && f1.lt === 'RESEARCH LOG', f1);
  check('the header carries the three digit Log ID', /^\[Log R-118 \| Stardate \d{4}\.\d{3}\.\d{4}\] \/ RESEARCH LOG$/.test(await hdr()), await hdr());
  await p.selectOption('#authsel', '');
  check('choosing no author unlocks and clears the ID boxes', await ev(() => !lidl.readOnly && !lidn.readOnly && lidl.value === '' && lidn.value === ''));
  await p.fill('#lidl', 'r'); await p.fill('#lidn', '142');
  check('typing an ID that is in the registry picks that person', (await val('authsel')) === 'R-142' && await ev(() => lidl.readOnly), await val('authsel'));
  await p.selectOption('#authsel', '');
  await p.fill('#lidl', 'q'); await p.fill('#lidn', '7');
  check('a free ID is padded to three digits in the header', /^\[Log Q-007 \|/.test(await hdr()), await hdr());
  await ev(() => setMode('dev'));
  const devIds = await ev(() => [...document.querySelectorAll('#authsel option')].map((o) => o.value).filter(Boolean));
  check('dev mode lists only the dev department and picks the developer', JSON.stringify(devIds) === '["D-001"]' && (await val('authsel')) === 'D-001' && (await val('logtype')) === "CREATOR'S LOG", [devIds, await val('authsel')]);
  check('...and the header starts with D-001', /^\[Log D-001 \|/.test(await hdr()), await hdr());
  await p.click('#ktg [data-v="virus"]');
  check('a virus log cannot be chosen for a dev log', await ev(() => kind === 'full'));
  await ev(() => setMode('lore'));

  // ---------- characters ----------
  await fresh();
  await ev(() => openCharForm('new'));
  const nf = await ev(() => ({ d: gv('cf-dept'), n: gv('cf-num'), opts: [...document.querySelectorAll('#cf-dept option')].map((o) => o.value) }));
  check('a new character starts on a department with the next free number', nf.opts.includes('R') && !nf.opts.includes('D') && /^\d{3}$/.test(nf.n), nf);
  await p.selectOption('#cf-dept', 'R');
  check('...for research that is one past the highest (R-158)', (await val('cf-num')) === '158', await val('cf-num'));
  await p.fill('#cf-num', '118');
  check('an ID that is taken is refused', /already belongs to Dr\. Aisha Osei/.test(await ev(() => ge('cf-idline').textContent)));
  await ev(() => saveChar());
  check('...and not saved', await ev(() => crewDB.crew['R-118'].name === 'Dr. Aisha Osei' && !crewDB.crew['R-118'].provisional === false));
  await p.fill('#cf-num', '158'); await p.fill('#cf-name', 'Dr. Test Person'); await p.fill('#cf-role', 'Research Team');
  await ev(() => saveChar());
  const nc = await ev(() => ({ rec: crewDB.crew['R-158'], sel: gv('authsel'), lid: gv('lidl') + gv('lidn'), chip: ge('fstat-crew').textContent, ls: localStorage.getItem('echo_crew') }));
  check('a saved character is selected, with its signature defaulting to its name', nc.sel === 'R-158' && nc.rec && nc.rec.signature === 'Dr. Test Person' && nc.lid === 'R158', nc);
  check('...and the registry shows unsaved changes, kept in the browser', /UNSAVED/.test(nc.chip) && /"R-158"/.test(nc.ls || ''), nc.chip);
  await p.reload(); await ready();
  check('unsaved registry changes survive a reload', await ev(() => !!crewDB.crew['R-158'] && /UNSAVED/.test(ge('fstat-crew').textContent)));
  await p.selectOption('#authsel', 'R-158');
  await ev(() => openCharForm('edit'));
  check('editing opens the character with its fields', (await val('cf-name')) === 'Dr. Test Person' && (await val('cf-num')) === '158');
  await p.fill('#cf-num', '159'); await p.fill('#cf-role', 'Visiting researcher');
  await ev(() => saveChar());
  check('changing the number moves the character to the new ID', await ev(() => !crewDB.crew['R-158'] && crewDB.crew['R-159'] && crewDB.crew['R-159'].role === 'Visiting researcher'));
  await p.selectOption('#authsel', 'R-159'); await ev(() => openCharForm('edit'));
  await ev(() => delChar());
  check('deleting removes the character and leaves the registry equal to the file', await ev(() => !crewDB.crew['R-159']));
  await p.reload(); await ready();
  check('...so nothing is left unsaved after a reload', await ev(() => !crewDB.crew['R-159'] && !/UNSAVED/.test(ge('fstat-crew').textContent)), await ev(() => ge('fstat-crew').textContent));

  // ---------- date, code ----------
  await fresh();
  await writeLog();
  const dts = await ev(() => ['dt-year', 'dt-month', 'dt-day', 'dt-hour', 'dt-min'].map((i) => document.getElementById(i).value).join(','));
  check('typing a stardate sets the date fields', dts === '2143,5,6,6,14', dts);
  await p.click('text=▶ GENERATE');
  const code = await val('codef');
  const dec = LC.decodeEntry(code, LC.DEFAULT_SALT);
  check('the generated code carries the department and the number', dec.valid && dec.section === 'R' && dec.number === 118 && dec.stardate === '2143.126.0614', dec);
  check('the code line says it matches the fields', /^✓ The code matches the fields: R-118/.test(await ev(() => ge('code-says').textContent)), await ev(() => ge('code-says').textContent));
  await p.selectOption('#authsel', 'R-142');
  check('changing the author makes the code line say it no longer matches', /but the fields say R-142/.test(await ev(() => ge('code-says').textContent)), await ev(() => ge('code-says').textContent));
  await p.selectOption('#authsel', 'R-118');
  await p.fill('#codef', 'TEMP0-R0008-00000-00126');
  check('a placeholder code is flagged as not a real code', /Not a code this tool made/.test(await ev(() => ge('code-says').textContent)));
  await p.fill('#codef', '1GOXN-58Y5R-VNCUE-MUB0F');
  check('an old-style code is flagged as having no department', /Old-style code/.test(await ev(() => ge('code-says').textContent)));
  check('the wording says Log ID, never entry ID', await ev(() => !/entry id/i.test(document.getElementById('escroll').innerText)));

  // ---------- label ----------
  await p.click('text=▶ GENERATE');
  const lab1 = await val('labf');
  check('the label follows the fields and has no condition suffix', lab1 === 'RESEARCH LOG R-118 | Stardate 2143.126.0614', lab1);
  await p.fill('#logtype', 'MEDICAL LOG');
  check('...and updates when the log type changes', (await val('labf')) === 'MEDICAL LOG R-118 | Stardate 2143.126.0614');
  await p.fill('#labf', 'My own label');
  await p.fill('#logtype', 'RESEARCH LOG');
  check('a typed label stops following the fields', (await val('labf')) === 'My own label');
  await p.click('#sec-text button:text-is("AUTO")');
  check('AUTO takes it back', (await val('labf')) === 'RESEARCH LOG R-118 | Stardate 2143.126.0614');

  // ---------- condition and access ----------
  await p.click('#ctg [data-v="PARTIAL"]');
  const e1 = await ev(() => buildEntry());
  check('a partial log saves as type full with health PARTIAL and level 2', e1.type === 'full' && e1.health === 'PARTIAL' && e1.clearance === 2 && e1.author === 'R-118', e1);
  check('the preview status line says the condition', /> ENTRY RECOVERED: PARTIAL/.test(await ev(() => document.getElementById('preview').innerText)));
  await p.click('#ctg [data-v="CORRUPTED"]');
  check('corrupted reads the same way', /> ENTRY RECOVERED: CORRUPTED/.test(await ev(() => document.getElementById('preview').innerText)) && (await ev(() => buildEntry().health)) === 'CORRUPTED');
  await p.click('#ctg [data-v="INTACT"]');
  const e2 = await ev(() => buildEntry());
  check('an intact log carries no health field', !('health' in e2) && e2.type === 'full', e2);
  check('the access line says level 2 for lore', /L2/.test(await ev(() => ge('acc-line').textContent)) && !(await ev(() => document.querySelector('#acc-line button, #acc-line input'))));
  await p.click('#atg [data-v="3"]');
  const a3 = await ev(() => ({ c: buildEntry().clearance, line: ge('acc-line').textContent }));
  check('a lore log can be set to L3 (for example the creature\'s own logs), and the line says what that means', a3.c === 3 && /ACCESS RESTRICTED/.test(a3.line), a3);
  await p.click('#atg [data-v="2"]');
  check('...and back to L2', (await ev(() => buildEntry().clearance)) === 2);
  await p.click('#ktg [data-v="virus"]');
  check('a lore log can be a virus', (await ev(() => buildEntry().type)) === 'virus');
  await p.click('#ktg [data-v="full"]');

  // ---------- save ----------
  await p.fill('#codef', '');
  check('saving is blocked without a code', (await ev(() => problems())).some((m) => /^Code/.test(m)));
  await p.click('text=▶ GENERATE');
  await p.click('#ctg [data-v="DEGRADED"]');
  await ev(() => saveEntry());
  const saved = await ev(() => ({ keys: Object.keys(iData), e: iData[Object.keys(iData)[0]], row: document.querySelector('.erow') && document.querySelector('.erow').innerText }));
  check('SAVE ENTRY adds the log to the list', saved.keys.length === 1 && saved.keys[0] === code, saved);
  check('...with label, type, health, level, author and the generated header', saved.e.label === 'RESEARCH LOG R-118 | Stardate 2143.126.0614' && saved.e.type === 'full' && saved.e.health === 'DEGRADED' && saved.e.clearance === 2 && saved.e.author === 'R-118' &&
    saved.e.text.split('\n').slice(0, 2).join('|') === '[Log R-118 | Stardate 2143.126.0614]|RESEARCH LOG', saved.e);
  check('...and the list row shows the condition', /DEGRADED/.test(saved.row) && /L2/.test(saved.row), saved.row);
  const keyOrder = Object.keys(saved.e).join(',');
  check('...in a readable field order', keyOrder === 'label,type,health,clearance,author,text', keyOrder);

  // ---------- dev log ----------
  await ev(() => setMode('dev'));
  await setSD('2026.315.0904'); await p.fill('#logtxt', 'Testing the dev log path.\n\n    —— Dev. J. Betancourt\n[END OF LOG]');
  await p.click('text=▶ GENERATE');
  const dcode = await val('codef'), ddec = LC.decodeEntry(dcode, LC.DEFAULT_SALT);
  check('a dev log code carries the D department', ddec.valid && ddec.section === 'D' && ddec.number === 1, ddec);
  await ev(() => saveEntry());
  const de = await ev(() => iData[Object.keys(iData)[0]]);
  check('in dev mode access is L3 and the L2 button is off', await ev(() => accessLevel() === 3 && document.querySelector('#atg [data-v="2"]').disabled));
  check('a dev log is saved at level 3 with its author', de.clearance === 3 && de.author === 'D-001' && de.type === 'full' && /CREATOR'S LOG — DAY \d+$/.test(de.text.split('\n')[1]), de);
  await ev(() => setMode('lore'));

  // ---------- override ----------
  await fresh();
  await writeLog();
  await p.click('text=▶ GENERATE');
  const realCode = await val('codef');
  await p.check('#ovr');
  await p.selectOption('#ovr-id', '2'); await p.selectOption('#ovr-time', '1'); await p.selectOption('#ovr-sign', '2');
  const h1 = await ev(() => document.getElementById('hp-line1').textContent);
  check('override levels damage the ID, the stardate and the sign-off in the header', h1 === '[Log R-███ | Stardate 2143.126.06██]', h1);
  const prevTxt = await ev(() => document.getElementById('preview').innerText);
  check('...and in the preview, where the sign-off becomes [UNVERIFIED]', /\[UNVERIFIED\]/.test(prevTxt) && !/Osei/.test(prevTxt) && /R-███/.test(prevTxt), prevTxt.slice(0, 200));
  check('the code still carries the real ID and moment', LC.decodeEntry(await val('codef'), LC.DEFAULT_SALT).section === 'R' && (await val('codef')) === realCode);
  await ev(() => saveEntry());
  const oe = await ev(() => iData[Object.keys(iData)[0]]);
  check('the saved entry holds the damaged text and the real values', oe.override && oe.override.id === 2 && oe.override.time === 1 && oe.override.sign === 2 &&
    oe.override.real.id === 'R-118' && oe.override.real.stardate === '2143.126.0614' && /Osei/.test(oe.override.real.sign) && !/Osei/.test(oe.text) && oe.author === 'R-118', oe);
  await ev(() => newEntry());
  await p.click('.erow');
  const back = await ev(() => ({ ovr: ovrOn(), id: gv('ovr-id'), sign: gv('ovr-sign'), body: gv('logtxt'), lid: gv('lidl') + gv('lidn'), sd: gv('sdin'), auth: gv('authsel') }));
  check('loading it again brings back the real ID, moment and sign-off, with the override still on', back.ovr && back.id === '2' && back.sign === '2' && /Dr\. A\. Osei/.test(back.body) && back.lid === 'R118' && back.sd === '2143.126.0614' && back.auth === 'R-118', back);
  await p.selectOption('#ovr-id', '1');
  const idA = await ev(() => document.getElementById('hp-line1').textContent);
  await p.selectOption('#ovr-sign', '1'); await p.selectOption('#ovr-sign', '3');
  const idB = await ev(() => document.getElementById('hp-line1').textContent);
  check('the same log always gets the same damage', idA === idB && /^\[Log R-(█\d\d|\d█\d|\d\d█) \|/.test(idA), [idA, idB]);
  const signs = [];
  for (const lv of ['1', '3']) { await p.selectOption('#ovr-sign', lv); signs.push(await ev(() => signedBody(gv('logtxt')).split('\n').filter((l) => /——/.test(l)).pop())); }
  check('sign-off levels: partly damaged keeps some letters, blacked out keeps none', /^    —— /.test(signs[0]) && /█/.test(signs[0]) && /[A-Za-z]/.test(signs[0].slice(7)) && signs[1] === '    —— ███ ██ ████', signs);
  await p.selectOption('#ovr-id', '3');
  check('"no ID at all" shows █-███ and leaves the ID out of the code', /^\[Log █-███ \|/.test(await hdr()) && await ev(() => codeIdentity().none === true));
  await p.click('text=▶ GENERATE');
  const nid = LC.decodeEntry(await val('codef'), LC.DEFAULT_SALT);
  check('...so the code decodes with no department and number 0', nid.valid && nid.section === null && nid.number === 0, nid);
  await p.uncheck('#ovr');
  check('turning the override off restores the header', /^\[Log R-118 \| Stardate 2143\.126\.0614\]/.test(await hdr()));

  // ---------- the first click shows the right entry ----------
  await fresh();
  const mk = (sd, lt, id, body, extra = {}) => Object.assign({ label: lt + ' ' + id + ' | Stardate ' + sd, type: 'full', clearance: 2, text: '[Log ' + id + ' | Stardate ' + sd + ']\n' + lt + '\n\n' + body }, extra);
  const c1 = LC.generateCode(2143, 5, 6, 6, 14, 118, LC.DEFAULT_SALT, 'R').code, c2 = LC.generateCode(2143, 5, 25, 22, 50, 87, LC.DEFAULT_SALT, 'S').code;
  const data = { [c1]: mk('2143.126.0614', 'RESEARCH LOG', 'R-118', 'First body.\n\n    —— Dr. A. Osei'), [c2]: mk('2143.145.2250', 'SECURITY LOG', 'S-087', 'Second body.\n\n    —— Officer D. Whitlock') };
  await ev((d) => parseImp(JSON.stringify(d), 'test'), data);
  const rows = await p.$$('.erow');
  await rows[0].click();
  const a1 = await ev(() => ({ pv: document.getElementById('preview').innerText, lab: gv('labf'), h: document.getElementById('hp-line1').textContent }));
  check('the first click on an entry shows its own header and label', /2143\.126\.0614/.test(a1.pv) && /R-118/.test(a1.pv) && a1.lab === 'RESEARCH LOG R-118 | Stardate 2143.126.0614' && /R-118/.test(a1.h), a1);
  await rows[1].click();
  const a2 = await ev(() => ({ pv: document.getElementById('preview').innerText, lab: gv('labf') }));
  check('...and so does the next one, with nothing left from the last', /2143\.145\.2250/.test(a2.pv) && !/2143\.126\.0614/.test(a2.pv) && a2.lab === 'SECURITY LOG S-087 | Stardate 2143.145.2250', a2);
  check('a loaded entry reads its fields (ID, author, log type, date)', await ev(() => gv('lidl') + gv('lidn') === 'S087' && gv('authsel') === 'S-087' && gv('logtype') === 'SECURITY LOG' && gv('sdin') === '2143.145.2250'));
  check('...and the code line says it matches', /^✓ The code matches/.test(await ev(() => ge('code-says').textContent)), await ev(() => ge('code-says').textContent));

  // ---------- old entries, other fields ----------
  const legacy = LC.generateCode(2143, 4, 29, 17, 19, 1, LC.DEFAULT_SALT).code;
  const oldE = mk('2143.119.1719', "CAPTAIN'S LOG", 'A-01', 'Old body.\n\n    —— Capt. E. Harrow', { type: 'partial', clearance: 1, foo: 'keep me', l1_preview: 'x' });
  await ev((a) => parseImp(JSON.stringify({ [a[0]]: a[1] }), 'test'), [legacy, oldE]);
  await p.click('.erow');
  const lg = await ev(() => ({ cond: cond, kind: kind, id: gv('lidl') + gv('lidn'), says: ge('code-says').textContent, auth: gv('authsel') }));
  check('an old entry loads with its condition read from the old type, its ID padded to three digits', lg.cond === 'PARTIAL' && lg.kind === 'full' && lg.id === 'A001' && /^Old-style code/.test(lg.says), lg);
  await p.selectOption('#authsel', 'A-014');
  await p.click('text=▶ GENERATE');
  check('generating a new code for a loaded entry ticks REPLACE THE OLD CODE', await ev(() => ge('rekey').checked && ge('rekey-row').style.display !== 'none'));
  await p.uncheck('#rekey');
  await ev(() => saveEntry());
  check('saving without the tick is refused and keeps the old code', await ev(([c]) => Object.keys(iData).length === 1 && iData.hasOwnProperty(c), [legacy]));
  await p.check('#rekey');
  await ev(() => saveEntry());
  const rk = await ev(() => ({ keys: Object.keys(iData), e: iData[Object.keys(iData)[0]] }));
  const rkDec = LC.decodeEntry(rk.keys[0], LC.DEFAULT_SALT);
  check('...with the tick the entry moves to the new code and the old key is gone', rk.keys.length === 1 && rk.keys[0] !== legacy && rkDec.valid && rkDec.section === 'A' && rkDec.number === 14, rk.keys);
  check('...the old type became type full with health PARTIAL, level 2', rk.e.type === 'full' && rk.e.health === 'PARTIAL' && rk.e.clearance === 2 && rk.e.author === 'A-014', rk.e);
  check('...and fields the editor does not know are kept', rk.e.foo === 'keep me' && !('l1_preview' in rk.e), rk.e);
  const cls = mk('2143.130.1000', 'SECURITY LOG', 'S-087', 'Classified body.', { type: 'classified', l1_preview: '[REDACTED]' });
  const ccode = LC.generateCode(2143, 5, 10, 10, 0, 87, LC.DEFAULT_SALT, 'S').code;
  await ev((a) => parseImp(JSON.stringify({ [a[0]]: a[1] }), 'test'), [ccode, cls]);
  await p.click('.erow');
  await ev(() => saveEntry());
  const ce = await ev((c) => iData[c], ccode);
  check('a classified entry stays classified, with its L1 preview, until changed', ce.type === 'classified' && ce.l1_preview === '[REDACTED]' && /CLASSIFIED/.test(await ev(() => ge('kind-note').textContent)), ce);
  const curly = mk('2026.140.1200', 'CREATOR\u2019S LOG', 'D-001', 'Curly title.\n\n    \u2014\u2014 Dev. J. Betancourt');
  curly.text = curly.text.replace('CREATOR\u2019S LOG', 'CREATOR\u2019S LOG \u2014 DAY 100');
  await ev((a) => parseImp(JSON.stringify({ [a[0]]: a[1] }), 'test'), [LC.generateCode(2026, 5, 20, 12, 0, 1, LC.DEFAULT_SALT, 'D').code, curly]);
  const curlyRow = await p.$$('.erow'); await curlyRow[curlyRow.length - 1].click();
  const cl = await ev(() => ({ lt: gv('logtype'), lab: gv('labf') }));
  check('a curly apostrophe in a loaded title becomes a straight one in the log type and label', cl.lt === "CREATOR'S LOG" && /^CREATOR'S LOG /.test(cl.lab) === (cl.lab.indexOf('\u2019') < 0), cl);
  const cd = await ev(() => entCond({ text: 'something [CORRUPTED] here' }));
  check('a [CORRUPTED] mark in the text reads as PARTIAL, the way the terminal reads it', cd === 'PARTIAL', cd);

  // ---------- ready list, autosave, tools ----------
  await fresh();
  check('an empty form lists what is missing', await ev(() => /✗/.test(ge('ready-list').innerText) && problems().length >= 3), await ev(() => ge('ready-list').innerText));
  await writeLog(); await p.click('text=▶ GENERATE');
  check('a complete form has nothing missing', await ev(() => problems().length === 0 && !/✗/.test(ge('ready-list').innerText)), await ev(() => ge('ready-list').innerText));
  await p.check('#ovr'); await p.selectOption('#ovr-id', '2');
  await p.click('#ctg [data-v="PARTIAL"]');
  await p.waitForTimeout(1500);
  await p.reload(); await ready(); await p.waitForTimeout(300);
  const rs = await ev(() => ({ auth: gv('authsel'), text: gv('logtxt').slice(0, 20), cond: cond, ovr: ovrOn(), id: gv('ovr-id'), sd: gv('sdin'), code: gv('codef').length }));
  check('the draft comes back after a reload, with the author, condition and override', rs.auth === 'R-118' && /^The numbers/.test(rs.text) && rs.cond === 'PARTIAL' && rs.ovr && rs.id === '2' && rs.sd === '2143.126.0614' && rs.code === 23, rs);
  await ev(() => { toggleDec(); });
  await p.fill('#dec-in', await val('codef')); await ev(() => doDecode());
  const dr = await ev(() => document.getElementById('drp-body').innerText);
  check('the decode tool shows the Log ID', /LOG ID\s*R-118/.test(dr) && !/ENTRY ID/.test(dr), dr);
  check('the page raised no errors in all of this', errs.length === 0, errs);

  console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
