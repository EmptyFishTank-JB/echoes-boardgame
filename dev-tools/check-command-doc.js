#!/usr/bin/env node
// Lists every [COMMAND] the terminal defines that ECHOES_Terminal_Commands.md does not mention.
// Usage: node dev-tools/check-command-doc.js   (exit code 1 if anything is missing)
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const doc = read('ECHOES_Terminal_Commands.md');
const html = read('terminal.html');
const os = JSON.parse(read('terminal-data/echo-os.json'));
const found = new Map();                      // command -> where it is defined
const add = (cmd, where) => { cmd = String(cmd || '').trim().toUpperCase(); if (/^\[.+\]$/.test(cmd) && !found.has(cmd)) found.set(cmd, where); };

// Engine: val === '[COMMAND]' covers the built-ins, the override menu and author lock/unlock.
for (const m of html.matchAll(/val\s*===?\s*'(\[[^'\]]+\])'/g)) add(m[1], 'terminal.html');

// Author commands.
const au = read('terminal-data/author.js');
const list = /const COMMANDS = \[([\s\S]*?)\];/.exec(au);
if (list) for (const m of list[1].matchAll(/'(\[[^']+\])'/g)) add(m[1], 'terminal-data/author.js');

// Data: help entries, the chat screens' commands, gateways and programs.
(os.help && os.help.entries || []).forEach((e) => { found.set(e.alias.toUpperCase().replace('<NAME>', '<name>'), 'echo-os.json help'); });
Object.entries(os.screens || {}).forEach(([id, s]) => (s.body || []).forEach((b) => { if (b.type === 'command') add(b.label, 'echo-os.json screen ' + id); }));
(function walk(it) {
  if (it.type === 'gateway' || it.type === 'program') add(it.alias, 'echo-os.json ' + it.type + ' ' + it.id);
  (it.children || []).forEach(walk);
})(os.tree);

const missing = [...found].filter(([cmd]) => !doc.includes(cmd) && !doc.includes(cmd.replace('<NAME>', '<name>')));
console.log('commands found in code and data: ' + found.size);
if (missing.length) {
  console.log('NOT in ECHOES_Terminal_Commands.md:');
  missing.forEach(([cmd, where]) => console.log('  ' + cmd + '   (' + where + ')'));
  process.exit(1);
}
console.log('every command is documented');
