// Shared setup for the terminal test suites: finds Playwright and a Chromium binary, and the address of the site.
//   ECHOES_URL    where the site is served (run-all.js starts its own server and sets this)
//   CHROMIUM_PATH a Chromium/Chrome binary to use instead of Playwright's own
const fs = require('fs');
let pw;
try { pw = require('playwright'); }
catch (e) { try { pw = require('/opt/node22/lib/node_modules/playwright'); } catch (e2) { throw new Error('Playwright is not installed. Run: npm install --no-save playwright (then npx playwright install chromium)'); } }
const exe = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium'].filter(Boolean).find((p) => fs.existsSync(p));
exports.chromium = pw.chromium;
exports.launchOptions = exe ? { executablePath: exe } : {};
exports.BASE = process.env.ECHOES_URL || 'http://localhost:8803';
