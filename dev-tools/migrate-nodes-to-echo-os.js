#!/usr/bin/env node
// ONE-TIME migration, already run: terminal-data/echo-os.json is now edited directly and is the source of truth.
// Do not re-run this; it would overwrite hand edits (hidden gateway, program items, anything authored since).
// Kept for reference. Original usage: node dev-tools/migrate-nodes-to-echo-os.js
'use strict';
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'terminal-data');
const old = JSON.parse(fs.readFileSync(path.join(DATA, 'nodes.json'), 'utf8'));
const nodes = old.nodes;

const SENTINELS = new Set(['__EXIT__', '__BACK__', '__ROOT__', '__FETCH__', '__ECHO_ARCHIVE__', '__ENTER_ARCHIVE__', '__CLEAR__', '__HOME__']);
const tierOf = (layer) => ({ l1a: 1, l1c: 1, l2a: 2, l2c: 2, l3a: 3, l3c: 3 }[layer] || 1);
const bare = (label) => (label || '').trim().replace(/^\[|\]$/g, '');
const cleanBody = (body) => (body || []).filter((b) => b.type !== 'command').map((b) => Object.assign({}, b));

const converted = new Set();
const report = { stubs: [], dropped_back_commands: [], cross_tier_links: [], shared_links: [] };

function convert(id, label, parentId) {
  const n = nodes[id];
  converted.add(id);
  const item = {
    id,
    type: 'folder',
    name: bare(label) || n.title,
    alias: (label || '').trim() || null,
    tier: tierOf(n.layer),
    hidden: false,
    fetch_allowed: !!n.fetch_allowed,
    title: n.title || '',
    footer: n.footer || '',
    body: cleanBody(n.body),
    children: [],
    commands: [],
  };
  (n.body || []).forEach((b) => {
    if (b.type !== 'command') return;
    const tgt = b.target || '';
    const lbl = (b.label || '').trim();
    if (!tgt) {
      item.children.push({
        id: id + '__STUB_' + bare(lbl).replace(/[^A-Za-z0-9]+/g, '_').toUpperCase(),
        type: 'doc', name: bare(lbl), alias: lbl, tier: item.tier, hidden: true, stub: true,
        title: bare(lbl), body: [], children: [], commands: [],
      });
      report.stubs.push(id + ' -> ' + lbl);
      return;
    }
    if (SENTINELS.has(tgt) || tgt === parentId || (nodes[tgt] && nodes[tgt].node_type === 'chat')) {
      report.dropped_back_commands.push(id + ' -> ' + lbl + ' -> ' + tgt);
      return;
    }
    if (!nodes[tgt]) throw new Error('dangling target ' + id + ' -> ' + tgt);
    if (nodes[tgt].layer !== n.layer) {
      item.commands.push({ label: lbl, goto: tgt });
      report.cross_tier_links.push(id + ' -> ' + lbl + ' -> ' + tgt);
      return;
    }
    if (converted.has(tgt)) {
      item.commands.push({ label: lbl, goto: tgt });
      report.shared_links.push(id + ' -> ' + lbl + ' -> ' + tgt);
      return;
    }
    item.children.push(convert(tgt, lbl, id));
  });
  item.type = (item.children.length || n.is_root) ? 'folder' : 'doc';
  return item;
}

// Archive roots, one per tier. Alias comes from the chat-layer command that enters it.
const rootAlias = {};
Object.keys(nodes).forEach((id) => {
  const n = nodes[id];
  if (n.node_type !== 'chat') return;
  (n.body || []).forEach((b) => { if (b.type === 'command' && nodes[b.target]) rootAlias[b.target] = b.label.trim(); });
});
const roots = Object.keys(nodes)
  .filter((id) => nodes[id].is_root && nodes[id].node_type === 'standard')
  .sort((a, b) => tierOf(nodes[a].layer) - tierOf(nodes[b].layer))
  .map((id) => convert(id, rootAlias[id] || '', null));
roots.forEach((r) => { r.title = nodes[r.id].title; r.name = nodes[r.id].title; });

// Screens: chat consoles, tier intros and data pages the engine renders directly (not part of the browsable tree).
const screens = {};
Object.keys(nodes).forEach((id) => {
  const n = nodes[id];
  if (['chat', 'intro', 'data'].includes(n.node_type)) {
    const s = Object.assign({}, n); delete s._editor; screens[id] = s;
  }
});

// Global commands (HELP etc.): node_type global pull commands become command entries.
const commands = [];
Object.keys(nodes).forEach((id) => {
  const n = nodes[id];
  if (n.node_type !== 'global') return;
  (n.body || []).forEach((b) => {
    if (b.type === 'command' && b.label.trim() !== '[HELP]') commands.push({ alias: b.label.trim(), kind: b.cmd_type, screen: b.target, scope: n.layer_scope || null });
  });
});

delete screens.GLOBAL_HELP;
const help = {
  title: 'AVAILABLE COMMANDS',
  entries: [
    { alias: '[HELP]', desc: 'display this list' },
    { alias: '[TREE]', desc: 'show the file tree' },
    { alias: '[LS]', desc: 'list this folder', scope: 'archive' },
    { alias: '[OPEN <name>]', desc: 'open an item by name', scope: 'archive' },
    { alias: '[BACK]', desc: 'go up one level', scope: 'archive' },
    { alias: '[ROOT]', desc: "return to this layer's root", scope: 'archive' },
    { alias: '[EXIT]', desc: 'leave this layer', scope: 'archive' },
    { alias: '[CLEAR]', desc: 'clear the screen' },
  ],
};

const os = {
  meta: {
    version: '1.0',
    description: 'ECHO O.S. virtual filesystem',
    migrated_from: 'nodes.json ' + (old.meta && old.meta.last_saved || ''),
    locked: false,
  },
  layers: old.layers,
  help,
  commands,
  screens,
  tree: { id: 'ROOT', type: 'folder', name: '/', alias: null, tier: 1, hidden: false, title: '', body: [], commands: [], children: roots },
};

// ---- verification against the original graph ----
const errors = [];
const flat = {};
(function walk(it) { flat[it.id] = it; it.children.forEach(walk); })(os.tree);

Object.keys(nodes).forEach((id) => {
  const n = nodes[id];
  if (n.node_type !== 'standard') return;
  const it = flat[id];
  if (!it) { errors.push('standard node not migrated: ' + id); return; }
  const oldText = JSON.stringify(cleanBody(n.body));
  if (JSON.stringify(it.body) !== oldText) errors.push('body differs: ' + id);
  const oldNav = (n.body || []).filter((b) => b.type === 'command' && b.target && !SENTINELS.has(b.target) && nodes[b.target] && nodes[b.target].node_type !== 'chat' && b.target !== (it._parent || null)).length;
  const newNav = it.children.filter((c) => !c.stub).length + it.commands.length;
  const stubs = (n.body || []).filter((b) => b.type === 'command' && !b.target).length;
  if (it.children.filter((c) => c.stub).length !== stubs) errors.push('stub count differs: ' + id);
  if (oldNav < newNav) errors.push('extra links appeared: ' + id);
});
const seen = new Set();
Object.keys(flat).forEach((id) => { if (seen.has(id)) errors.push('duplicate id ' + id); seen.add(id); });
Object.keys(flat).forEach((id) => flat[id].commands.forEach((c) => { if (!flat[c.goto]) errors.push('goto dangling: ' + id + ' -> ' + c.goto); }));
commands.forEach((c) => { if (!screens[c.screen]) errors.push('command screen missing: ' + c.alias + ' -> ' + c.screen); });

fs.writeFileSync(path.join(DATA, 'echo-os.json'), JSON.stringify(os, null, 2) + '\n');

console.log('items: ' + Object.keys(flat).length + ' (incl. ROOT), screens: ' + Object.keys(screens).length + ', commands: ' + commands.length);
console.log('stubs kept as hidden placeholders: ' + report.stubs.length);
report.stubs.forEach((s) => console.log('   ' + s));
console.log('back/exit commands dropped (replaced by built-in [BACK]): ' + report.dropped_back_commands.length);
console.log('cross-tier links kept: ' + report.cross_tier_links.length);
report.cross_tier_links.forEach((s) => console.log('   ' + s));
if (errors.length) { console.error('VERIFY FAILED:\n  ' + errors.join('\n  ')); process.exit(1); }
console.log('VERIFY OK');
