# Terminal, pre-Echo O.S.

Snapshot taken 2026-11-10 at commit a19ef18, before the Echo O.S. engine
replaced the node-graph terminal. Contains the engine (terminal.html), every terminal-data
file except echo-os.json (the migrated tree), and the four terminal-related editors.

Restore: copy terminal.html and terminal-data/*.json back to the repo root locations.
Exact pre-snapshot state: commit a19ef18 (also restorable with `git checkout a19ef18`).

The old node-graph editor, nodes.json and the one-time migration script live only here now (removed from
dev-tools/ and terminal-data/ when Echo O.S. phase 5 retired them). Editing now happens in the terminal itself.
