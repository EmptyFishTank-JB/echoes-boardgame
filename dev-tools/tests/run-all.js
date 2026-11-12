#!/usr/bin/env node
// Runs every terminal test suite against the files in this repo and prints one line per suite.
//   node dev-tools/tests/run-all.js            all suites
//   node dev-tools/tests/run-all.js ui5 hl17   only the named suites
// Starts its own static server on a free port, so nothing else needs to be running.
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.md': 'text/markdown' };

const SUITES = [
  ['newfeatures', 'built-ins, hidden items, level rules, override tree, validator'],
  ['phase3', 'programs and the FETCH LOG window, gateways, layer jumps'],
  ['phase4', 'author mode: create, edit, move, delete, export, draft'],
  ['ui5', 'item glyphs, eye toggle, hover and click, right-click menus, cursor'],
  ['archive6', 'file-explorer archive view, address bar, TYPE/SIZE table, author tree jump'],
  ['title6', 'title art rows and variants'],
  ['titles19', 'DSCF CHARON on the start screen and header, phone header'],
  ['lore7', 'in-world documents, expansion lines, boot fallback'],
  ['fetch8', 'FETCH LOG.EXE: codes, recovered list, health and type columns'],
  ['boot6', 'boot check statuses (OK / WARN / INVALID / BROKEN / MISSING) and [LEGEND]'],
  ['fix12', 'title art survives long chats'],
  ['hidden13', 'hidden [ECHOES.ARCHIVE], player vs author [TREE]'],
  ['cursor1', 'cursor in the override menu'],
  ['restore15', 'restored screens do not replay the glow'],
  ['hl17', 'input highlight for listed and hidden commands'],
  ['ctx18', 'right-click info rows and per-property editing'],
  ['docs20', 'the five partial-recovery documents open'],
  ['docs21', 'the same documents fit a phone screen'],
  ['pace16', 'what types and what lands whole, speeds, sounds'],
  ['layers22', 'per-layer settings: colors, title, intro, sound'],
  ['editor23', 'engine editor: no theme or per-layer sound sections'],
  ['codes25', 'log code module: existing codes unchanged, department codes round trip'],
  ['transition28', 'layer transitions: accepted line, clear, transition text, then theme and sound switch'],
  ['dialog29', 'author editing windows: movable themed dialogs, fields by type, layer colors, sound list with preview'],
  ['textedit27', 'author mode: tool lines land whole, line by line text editing and preview'],
  ['state30', 'game state flags, gated items, programs listed like apps, INBOX.EXE, author flag commands'],
  ['logeditor26', 'log editor: sections in order, authors and crew, Log ID in the code, condition, override, first-click preview'],
  ['logs24', 'log data lint (lore.json, dev_logs.json) and fetching the 2143 logs'],
];

function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
      fs.readFile(p, (err, buf) => {
        if (err) { res.writeHead(404); return res.end('not found'); }
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(buf);
      });
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}
function runSuite(name, url) {
  return new Promise((resolve) => {
    const file = path.join(__dirname, name + '.js');
    if (!fs.existsSync(file)) return resolve({ name, skipped: true });
    const t0 = Date.now(); let out = '';
    const child = spawn(process.execPath, [file], { env: Object.assign({}, process.env, { ECHOES_URL: url }), cwd: __dirname });
    const timer = setTimeout(() => { out += '\nFAIL suite timed out\n'; child.kill('SIGKILL'); }, 290000);
    child.stdout.on('data', (d) => { out += d; }); child.stderr.on('data', (d) => { out += d; });
    child.on('close', (code) => {
      clearTimeout(timer);
      const lines = out.split('\n');
      resolve({ name, code, secs: Math.round((Date.now() - t0) / 1000), pass: lines.filter((l) => /^\s*PASS /.test(l)).length,
        fails: lines.filter((l) => /^\s*FAIL /.test(l)), crashed: code !== 0 && !lines.some((l) => /^\s*FAIL /.test(l)) ? lines.filter((l) => /Error|Cannot|SyntaxError/.test(l)).slice(0, 3) : [] });
    });
  });
}
(async () => {
  const only = process.argv.slice(2);
  const srv = await serve(); const url = 'http://127.0.0.1:' + srv.address().port;
  console.log('serving ' + ROOT + ' at ' + url + '\n');
  let bad = 0;
  for (const [name, what] of SUITES) {
    if (only.length && !only.includes(name)) continue;
    const r = await runSuite(name, url);
    if (r.skipped) { console.log('SKIP  ' + name.padEnd(11) + ' (file missing)'); continue; }
    const ok = r.code === 0 && !r.fails.length && !r.crashed.length;
    if (!ok) bad++;
    console.log((ok ? 'PASS  ' : 'FAIL  ') + name.padEnd(11) + String(r.pass).padStart(3) + ' checks  ' + String(r.secs).padStart(3) + 's  ' + what);
    r.fails.forEach((f) => console.log('        ' + f.trim().slice(0, 200))); r.crashed.forEach((f) => console.log('        ' + f.trim().slice(0, 200)));
  }
  srv.close();
  console.log('\n' + (bad ? bad + ' suite(s) failed' : 'all suites passed'));
  process.exit(bad ? 1 : 0);
})();
