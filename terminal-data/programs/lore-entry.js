// Lore code entry: the player types a 20-character code and the matching log is shown.
// Level 3 reads dev_logs.json, every other allowed level reads lore.json.
// Where it can run is set in echo-os.json (the program items' tier and scope), not here.
const CODE_RE = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;

async function showEntry(ctx, code, text, isDev) {
  await ctx.clearScreen();
  ctx.breadcrumb('RECOVERED ENTRY: ' + code);
  const lines = [{ text: '', cls: 'blank' }, { text: 'ENTRY: ' + code, cls: 'full' }, { text: ctx.sep, cls: 'low' }];
  if (isDev) lines.push({ text: '> DECRYPTING ENTRY...', cls: 'dim' }, { text: '> STATUS: PARTIAL RESTORATION', cls: 'dim' }, { text: '', cls: 'blank' });
  (text || '').split('\n').forEach((p) => lines.push({ text: p, cls: 'full' }));
  lines.push({ text: ctx.sep, cls: 'low' }, { text: '', cls: 'blank' }, { text: '> AWAITING INPUT', cls: 'low' });
  await ctx.lines(lines);
  await ctx.pause();
}

async function showClassified(ctx, code, entry) {
  await ctx.clearScreen();
  ctx.breadcrumb('QUERY: ' + code);
  const lines = [{ text: '', cls: 'blank' }, { text: 'ENTRY: ' + code, cls: 'full' }, { text: ctx.sep, cls: 'low' },
    { text: 'CLASSIFICATION: ACCESS RESTRICTED', cls: 'warn' }, { text: '', cls: 'blank' }];
  (entry.l1_preview || '[CONTENT REDACTED]').split('\n').forEach((p) => lines.push({ text: p, cls: 'dim' }));
  lines.push({ text: '', cls: 'blank' }, { text: '> Full entry requires elevated access.', cls: 'low' }, { text: ctx.sep, cls: 'low' },
    { text: '', cls: 'blank' }, { text: '> AWAITING INPUT', cls: 'low' });
  await ctx.lines(lines);
  await ctx.pause();
}

async function showNotFound(ctx, code) {
  await ctx.clearScreen();
  await ctx.lines([{ text: '', cls: 'blank' }, { text: 'ENTRY: ' + code, cls: 'denied' }, { text: ctx.sep, cls: 'low' }, { text: '', cls: 'blank' },
    { text: 'NO MATCHING ENTRY FOUND.', cls: 'denied' }, { text: 'Verify code and try again.', cls: 'low' }, { text: '', cls: 'blank' },
    { text: ctx.sep, cls: 'low' }, { text: '  [BACK]', cls: 'low' }, { text: '  [EXIT]', cls: 'low' }, { text: ctx.sep, cls: 'low' },
    { text: '', cls: 'blank' }, { text: '> AWAITING INPUT', cls: 'low' }]);
  ctx.denied();
  await ctx.pause();
}

export default {
  id: 'lore-entry',
  async run(ctx) {
    const S = ctx.strings;
    await ctx.say('> ENTER ENTRY CODE:', 'dim');
    let code;
    for (;;) {
      const raw = await ctx.ask({ placeholder: 'XXXXX-XXXXX-XXXXX-XXXXX', mask: 'code' });
      if (!raw) { await ctx.say(S.error_fetch_cancelled, 'low'); return 'stay'; }
      if (CODE_RE.test(raw)) { code = raw; break; }
      ctx.denied();
      await ctx.say(S.error_fetch_format, 'denied');
      await ctx.say('> AWAITING INPUT', 'low');
    }
    ctx.echo(code);

    const isDev = ctx.level === 3;
    const data = isDev ? ctx.devLogs : ctx.lore;
    if (!data) { ctx.denied(); await ctx.say(S.error_nav_offline, 'denied'); return 'stay'; }
    const entry = data[code] || data[code.replace(/-/g, '')];
    if (!entry) return showNotFound(ctx, code);
    if (!isDev && entry.type === 'virus') { await ctx.virus(entry); return 'reset'; }
    ctx.discovered(code);
    if (!isDev && entry.type === 'classified' && ctx.level === 1) return showClassified(ctx, code, entry);
    return showEntry(ctx, code, entry.text || '', isDev);
  },
};
