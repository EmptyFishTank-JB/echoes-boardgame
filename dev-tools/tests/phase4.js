const { chromium, launchOptions, BASE } = require('./env.js');
const URL = BASE + '/terminal.html';
let fails = 0;
const check = (name, ok, extra) => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); };
const LORE = '6IYRR-MMDG9-MD13K-M1X0M', DEV = 'LLMTA-DWP3N-4WPJY-CDD0O';

async function session(ctxOrBrowser, patch = {}) {
  const page = await ctxOrBrowser.newPage({ viewport: { width: 1200, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route('**/engine_config.json*', async r => { const x = await r.fetch(); const j = JSON.parse(await x.text()); j.typing = { base_ms: 1, slow_multiplier: 1, variance: 0 }; j.timing.fade_ms = 5; j.idle_delay_ms = 99999999; r.fulfill({ response: x, body: JSON.stringify(j) }); });
  for (const [pat, fn] of Object.entries(patch)) await page.route(pat, async r => { const x = await r.fetch(); const j = JSON.parse(await x.text()); const out = fn(j); r.fulfill({ response: x, body: JSON.stringify(out || j) }); });
  await page.goto(URL); await page.waitForTimeout(800);
  const lastLine = () => page.evaluate(() => { const l = document.getElementById('t-output').lastElementChild; return l ? l.textContent.trim() : ''; });
  const s = {
    page, errs,
    settle: async () => { await page.waitForFunction(() => { const l = document.getElementById('t-output').lastElementChild; const t = l ? l.textContent.trim() : ''; return uiLock === 0 && !isResponding && !window.typing && ((progWait && termState === 'PROGRAM') || !!progWin || (termState !== 'PROGRAM' && (t === '> AWAITING INPUT' || t.startsWith('Enter option exactly')))); }, null, { timeout: 20000 }); await page.waitForTimeout(150); },
    out: async () => (await page.$eval('#t-output', e => e.innerText)).split('\n').map(l => l.trim().replace(/^(?:\((?:o|-)\)\s+)?(?:(?:DIR|DOC|LOG|EXE|GATE|UP)\s+(?:\S.*?\s{2,})?)?[\\≡▪►»↰]\s+(?=\[)/, '')).filter(Boolean),
    st: async () => ({ state: await page.evaluate(() => termState), level: await page.evaluate(() => currentLevel), crumb: await page.$eval('#t-breadcrumb', e => e.textContent) }),
    send: async c => { await page.fill('#t-field', c); await page.press('#t-field', 'Enter'); await page.waitForTimeout(120); await s.settle(); },
    // an author command plus its answers, one per prompt; {key:'Escape'} cancels a prompt
    run: async (cmd, answers = []) => {
      await page.fill('#t-field', cmd); await page.press('#t-field', 'Enter');
      for (const a of answers) {
        await page.waitForFunction(() => progWait && uiLock === 0 && termState === 'PROGRAM', null, { timeout: 10000 }); await page.waitForTimeout(60);
        if (typeof a === 'object') await page.press('#t-field', a.key); else { await page.fill('#t-field', a); await page.press('#t-field', 'Enter'); }
      }
      await s.settle();
    },
    jump: async n => { await s.send('[SYSTEM OVERRIDE]'); await s.send('[JUMP L' + n + ']'); },
    tree: async (full = true) => { await s.send('[TREE]'); const o = await s.out(); return o.slice(o.lastIndexOf(full ? 'ECHOES O.S. FILE TREE — FULL (AUTHOR VIEW)' : 'ECHOES O.S. FILE TREE')); },
    prompt: () => page.$eval('#t-prompt', e => e.textContent.trim()),
  };
  await page.click('#power-btn'); await s.settle();
  return s;
}

(async () => {
  const browser = await chromium.launch(launchOptions);

  // ---- 1. locked states ----
  { const s = await session(browser);
    await s.send('[MKDIR]'); let o = await s.out();
    check('before unlock, author commands do not exist', o.some(l => l.includes('COMMAND NOT RECOGNIZED')) && (await s.prompt()) === '>');
    await s.send('[AUTHOR UNLOCK]'); o = await s.out();
    check('[AUTHOR UNLOCK] switches author mode on, prompt shows AUTHOR>', o.includes('> AUTHOR MODE ACTIVE') && (await s.prompt()) === 'AUTHOR>', await s.prompt());
    await s.send('[AUTHOR LOCK]'); await s.send('[MKDIR]'); o = await s.out();
    check('[AUTHOR LOCK] turns it off again', (await s.prompt()) === '>' && o.filter(l => l.includes('COMMAND NOT RECOGNIZED')).length === 2);
    console.log('   page errors:', s.errs); await s.page.close(); }
  { const s = await session(browser, { '**/echo-os.json*': j => { j.meta.locked = true; } });
    await s.send('[AUTHOR UNLOCK]'); const o = await s.out();
    check('meta.locked:true removes the commands entirely', o.some(l => l.includes('COMMAND NOT RECOGNIZED')) && (await s.prompt()) === '>' && !o.includes('> AUTHOR MODE ACTIVE'));
    await s.page.close(); }

  // ---- 2. the editing commands ----
  const ctx = await browser.newContext({ acceptDownloads: true });
  const s = await session(ctx);
  await s.send('[ECHOES.ARCHIVE]'); await s.send('[AUTHOR UNLOCK]');
  await s.send('[AUTHOR HELP]'); let o = await s.out();
  check('[AUTHOR HELP] lists the commands', o.some(l => l.startsWith('[MKDIR]')) && o.some(l => l.startsWith('[EXPORT]')));

  await s.run('[MKDIR]', ['FIELD NOTES', '', '', '']); o = await s.out();
  check('[MKDIR] creates a folder and redraws the page with it listed', o.includes('[FIELD NOTES]'));
  await s.send('[FIELD NOTES]');
  await s.run('[NEW DOC]', ['Day One', '', '', '', 'Hello World', '    indented line', '', '/warn careful now', '[DONE]']);
  check('[NEW DOC] adds it to the folder', (await s.out()).includes('[DAY ONE]'));
  await s.send('[DAY ONE]'); o = await s.out();
  check('doc text keeps the author\'s capitalization and indentation', o.includes('Hello World') && o.some(l => l === 'indented line' || l.endsWith('indented line')));
  const warnCls = await s.page.evaluate(() => { const d = Array.from(document.querySelectorAll('#t-output .t-line')).find(e => e.textContent.trim() === 'careful now'); return d ? d.className : ''; });
  check('/warn prefix styles the line', warnCls.includes('warn'), warnCls);
  await s.send('[BACK]');

  await s.run('[HIDE]', ['DAY ONE']); o = await s.out();
  const eyeOff = await s.page.evaluate(() => { const e = document.querySelector('#t-output .t-line[data-id="L1A_DAY_ONE"]'); return e ? { off: !!e.querySelector('.eye.off'), dim: e.classList.contains('lo') } : null; });
  check('[HIDE] says so under the page; author view keeps the item, dimmed with a closed eye', o.some(l => l.includes('IS NOW HIDDEN')) && eyeOff && eyeOff.off && eyeOff.dim, JSON.stringify(eyeOff));
  await s.send('[LS]'); o = await s.out();
  check('author [LS] still shows it, marked hidden', o.some(l => l.includes('[DAY ONE]') && l.includes('~hidden')));
  await s.send('[DAY ONE]'); let st = await s.st();
  check('a hidden item still opens by its alias', /DAY_ONE/.test(st.state), st.state);
  await s.send('[BACK]'); await s.run('[SHOW]', ['DAY ONE']);
  await s.send('[LS]'); o = await s.out(); check('[SHOW] lists it again', o.some(l => l.includes('[DAY ONE]') && !l.includes('~hidden')) );

  await s.run('[ALIAS]', ['DAY ONE', '[HELP]', { key: 'Escape' }]); o = await s.out();
  check('an alias that shadows a built-in is refused', o.some(l => l.includes('THAT IS A BUILT-IN COMMAND')));
  await s.run('[ALIAS]', ['DAY ONE', '[FIRST DAY]']); o = await s.out();
  check('...a valid one is accepted, and the result shows under the redrawn page', o.some(l => l.includes('ALIAS IS NOW [FIRST DAY]')) && o.includes('[DAY ONE REVISED]') === false);
  await s.send('[FIRST DAY]'); st = await s.st(); check('the new alias opens the item', /DAY_ONE/.test(st.state));
  await s.send('[BACK]');
  await s.run('[EDIT]', ['FIRST DAY', 'DAY ONE REVISED', '', '', 'REV TITLE', 'N']);
  await s.send('[FIRST DAY]'); o = await s.out(); check('[EDIT] changes the title, keeps the rest', o.includes('REV TITLE') && o.includes('Hello World'));
  await s.send('[BACK]');

  await s.run('[NEW DOC]', ['Twin', '', '[FIRST DAY]', { key: 'Escape' }]); o = await s.out();
  check('a duplicate alias in the same folder is refused', o.some(l => l.includes('ALREADY USED BY')));

  await s.send('[BACK]'); await s.run('[MKDIR]', ['ARCHIVE B', '', '', '']);
  await s.run('[MV]', ['FIELD NOTES', 'ARCHIVE B']); o = await s.out();
  check('[MV] moves an item and its subtree', o.some(l => l.includes('MOVED')) && !o.slice(o.lastIndexOf('ECHOES.ARCHIVE')).includes('[FIELD NOTES]'));
  await s.send('[ARCHIVE B]'); o = await s.out(); check('...it is now listed in the destination', o.includes('[FIELD NOTES]'));
  await s.send('[BACK]');

  // gateway into the moved folder blocks deleting it
  await s.run('[NEW GATEWAY]', ['PEEK', '[PEEK]', 'FIELD NOTES']);
  await s.send('[ARCHIVE B]'); await s.run('[RM]', ['FIELD NOTES']); o = await s.out();
  check('[RM] refuses to delete something a gateway points into', o.some(l => l.includes('CANNOT DELETE') && l.includes('GW_PEEK')));
  await s.send('[BACK]'); await s.send('[PEEK]'); st = await s.st(); check('gateway jumps to its destination folder', /FIELD_NOTES/.test(st.state), st.state);
  check('a gateway made by [NEW GATEWAY] has no title (it never draws a page)', await s.page.evaluate(() => !('title' in osItems.GW_PEEK)));
  await s.send('[ROOT]'); await s.run('[RM]', ['PEEK', 'Y']); await s.send('[ARCHIVE B]'); await s.run('[RM]', ['FIELD NOTES', 'Y']); o = await s.out();
  check('...and deletes it (with its contents) once nothing points into it', o.some(l => l.includes('DELETED 2 ITEM(S)')), o.filter(l => l.includes('DELETE')).join(' | '));

  await s.send('[BACK]');
  await s.run('[NEW LOG]', ['BREACH COPY', '', '', '', 'LORE', LORE]); await s.send('[BREACH COPY]'); o = await s.out();
  check('[NEW LOG] shows a lore.json entry on its page', o.includes('We have everything we need.'));
  await s.send('[BACK]');
  await s.run('[NEW LOG]', ['BAD', '', '', '', 'LORE', 'ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ']); o = await s.out();
  check('[NEW LOG] refuses a code that is not in the file', o.some(l => l.includes('NO ENTRY ZZZZZ')));

  // programs + a cancel path
  await s.jump(2);
  await s.run('[NEW PROGRAM]', ['no-such-program']); o = await s.out(); check('[NEW PROGRAM] refuses an id with no file', o.some(l => l.includes('NO PROGRAM FILE')));
  await s.run('[NEW PROGRAM]', ['lore-entry', 'SECOND ENTRY', '[FETCH SECOND]', 'FOLDER']);
  await s.page.fill('#t-field', '[FETCH SECOND]'); await s.page.press('#t-field', 'Enter');
  await s.page.waitForSelector('#prog-layer.open .le-code', { timeout: 8000 }).catch(() => {});
  check('a registered program runs by its alias (in its window)', (await s.st()).state === 'PROGRAM' && !!(await s.page.$('#prog-layer .le-code')));
  await s.page.keyboard.press('Escape'); await s.settle();
  await s.run('[MKDIR]', [{ key: 'Escape' }]); o = await s.out(); check('Escape cancels an author command, nothing is created', o.includes('> CANCELED'));
  await s.run('[NEW DOC]', ['ABORTED', '', '', '', 'some text', { key: 'Escape' }, 'Y']); o = await s.out();
  check('Escape in the text prompts to discard; confirming drops the doc', o.some(l => l.includes('DISCARD THIS TEXT')) && o.includes('> CANCELED'));

  // ---- 3. export round-trip and the draft ----
  await s.jump(1); await s.send('[ECHOES.ARCHIVE]'.replace('[ECHOES.ARCHIVE]', '[LS]'));
  const draftBefore = await s.page.evaluate(() => localStorage.getItem('echo_os_draft'));
  check('edits autosave a draft', !!draftBefore && draftBefore.includes('BREACH_COPY'));
  const [dl] = await Promise.all([s.page.waitForEvent('download'), s.send('[EXPORT]')]);
  const text = require('fs').readFileSync(await dl.path(), 'utf8'); const exported = JSON.parse(text);
  const flat = {}; (function w(i) { flat[i.id] = i; (i.children || []).forEach(w); })(exported.tree);
  check('[EXPORT] downloads echo-os.json', dl.suggestedFilename() === 'echo-os.json');
  check('exported file has the new items, no internal fields', !!flat.L1A_BREACH_COPY && !!flat.L2A_PROG_SECOND_ENTRY && !text.includes('_parent') && !!exported.meta.last_saved);
  check('...and not what was deleted or cancelled', !flat.L1A_FIELD_NOTES && !!flat.L1A_ARCHIVE_B && !flat.GW_PEEK && !flat.L1A_ABORTED);
  check('export clears the draft', (await s.page.evaluate(() => localStorage.getItem('echo_os_draft'))) === null);
  await s.page.close();

  // the exported file works as the new data file for a player
  { const p = await session(browser, { '**/echo-os.json*': () => exported });
    await p.send('[ECHOES.ARCHIVE]'); const t = await p.out();
    check('a fresh terminal loads the exported file; the new log is listed', t.includes('[BREACH COPY]') && t.includes('[ARCHIVE B]'));
    await p.send('[BREACH COPY]'); check('...and opens', (await p.out()).includes('We have everything we need.'));
    await p.send('[SYSTEM OVERRIDE]'); await p.send('[STATUS]'); const v = await p.out();
    check('...and the validator finds no dangling links', v.some(l => /DANGLING TARGETS: 0/.test(l)));
    console.log('   page errors:', p.errs); await p.page.close(); }

  // draft recovery after a reload
  { const c2 = await browser.newContext(); const d = await session(c2);
    await d.send('[ECHOES.ARCHIVE]'); await d.send('[AUTHOR UNLOCK]'); await d.run('[MKDIR]', ['DRAFTED', '', '', '']);
    await d.page.reload(); await d.page.waitForTimeout(800);
    await d.page.route('**/engine_config.json*', async r => { const x = await r.fetch(); const j = JSON.parse(await x.text()); j.typing = { base_ms: 1, slow_multiplier: 1, variance: 0 }; j.timing.fade_ms = 5; r.fulfill({ response: x, body: JSON.stringify(j) }); });
    await d.page.click('#power-btn'); await d.settle();
    await d.send('[ECHOES.ARCHIVE]'); let t = await d.out(); check('after a reload the unsaved edit is gone from the player view', !t.includes('[DRAFTED]'));
    await d.send('[AUTHOR UNLOCK]'); t = await d.out(); check('unlocking reports the draft', t.some(l => l.includes('UNSAVED DRAFT')));
    await d.send('[RESTORE DRAFT]'); t = await d.out(); check('[RESTORE DRAFT] brings the edit back', t.includes('[DRAFTED]'));
    await d.send('[DISCARD DRAFT]'); check('[DISCARD DRAFT] clears it', (await d.page.evaluate(() => localStorage.getItem('echo_os_draft'))) === null);
    await d.send('[AUTHOR LOCK]'); await d.page.close(); await c2.close(); }

  console.log('page errors (main session):', s.errs);
  console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASSED');
  await browser.close();
})();
