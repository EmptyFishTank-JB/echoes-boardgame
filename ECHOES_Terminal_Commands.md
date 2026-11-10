# ECHOES O.S. Terminal: Command Reference

Every `[COMMAND]` the terminal (`terminal.html`) understands, where it works, and where it is defined.
Last verified against the code on 2026-11-10.

**Keeping this current.** When a command is added, renamed or removed, update this file in the same
commit. `node dev-tools/check-command-doc.js` compares the code and data against this file and lists any
command that is missing from it. Run it before committing terminal changes.

| Command source | File |
|---|---|
| Built-ins, `[SYSTEM OVERRIDE]` menu, author lock/unlock | `terminal.html` (`tryBuiltin`, `handleOverrideInput`, `handleAuthorInput`) |
| Author editing commands | `terminal-data/author.js` (`COMMANDS`, `HELP`) |
| Folders, docs, logs, hidden items, gateways, programs, `[HELP]` text | `terminal-data/echo-os.json` |
| Programs | `terminal-data/programs/<id>.js` |

---

## 1. How input works

- Commands are typed in square brackets and are case-insensitive: `[help]` and `[HELP]` are the same. The
  brackets are required.
- `[OPEN <name>]` is shorthand for `[NAME]`. `[OPEN CREW MANIFEST]` opens `[CREW MANIFEST]`.
- Anything typed in the chat that is not a command is free text and gets a response from `personality.json`.
- While the terminal is drawing a page or running a sequence, typing is ignored. Nothing is queued.
- Clicking works everywhere typing does (see section 6).

---

## 2. Player commands

### Anywhere (chat and archive)

| Command | What it does |
|---|---|
| `[HELP]` | Lists the commands. The list is the `help` block in `echo-os.json`. |
| `[TREE]` | Prints the file tree. Currently available to everyone. It is meant to be author-only once the file is locked. |
| `[CLEAR]` | Clears the screen. |
| `[SYSTEM OVERRIDE]` | Hardcoded recovery menu (section 4). Works from any state, even mid-draw, and cannot be blocked by data. |

### Chat (layer 1 console)

| Command | What it does |
|---|---|
| `[ECHOES.ARCHIVE]` | Enters the layer 1 archive. Prints a mount line, then the ECHOES.ARCHIVE root. |

Free text gets a personality response. Special cases: `KNOCK KNOCK`, the easter eggs in `personality.json`,
and the admin keywords (`admin`, `root`, `sudo`, `bypass`, `superuser`, `administrator`, `authenticate`,
`backdoor`, `shell`, `exploit`, `elevate`, `privilege`, `grant access`, `hack`), which draw a "flagged and
logged" style response. A bracket command the chat really defines wins over the keyword scan. An unknown
bracket that contains a keyword still draws the admin response.

### Archive pages (any tier)

| Command | What it does |
|---|---|
| `[LS]` | Redraws the current folder. In author mode it lists everything, with `~hidden` and `?stub` marks. |
| `[BACK]` | Up one level. At a tier root it leaves the tier, same as `[EXIT]`. |
| `[ROOT]` | Jumps to the root of the current tier. |
| `[EXIT]` | Leaves the tier: L3 to the L2 root, L2 to the L1 root, L1 back to the chat. |
| `[<ITEM NAME>]` | Opens any item listed on the page, for example `[INCIDENT REPORTS]`. |

Items listed on a page are the visible children of that folder. Aliases come from `echo-os.json`.

### Hidden commands (discovered in play)

These never appear in a listing. The player learns them from the story.

| Command | Where | What it does |
|---|---|---|
| `[INITIATE ECHO PROTOCOL]` | Anywhere: the chat or any archive page | Gateway to the L2 root. Plays the L2 flavor text in the layer 1 theme, then changes theme and ambient sound, then draws `L2A_ROOT`. |
| `[FETCH LOG ENTRY: //]` | Any tier 2 or tier 3 page (answers "unavailable" in the chat and at tier 1) | Program `lore-entry`, shown as **FETCH LOG.EXE** in its own window (see section 3a). |

A hidden item opens only if its tier is at or below the tier you are in. A program opens only where its
`scope` allows (`tier` means any page of that tier, `folder` means only the folder it sits in). Anywhere
else it answers "fetch unavailable".

### Defined but not reachable

| Command | Status |
|---|---|
| `[L2 ROOT]`, `[L3 ROOT]` | Exist on the L2 and L3 chat screens (stubs). The engine never routes to those screens. |
| `[STATUS]`, `[SCAN]` | Reserved names for future programs. Placeholder screens exist but nothing opens them. (`[STATUS]` does exist inside the override menu, section 4.) |

---

## 3. Keyboard and mouse

| Input | Effect |
|---|---|
| `Enter` | Submit what is typed. |
| `Tab`, `Down`, `Up` on an archive page | Step through the listed items, filling the input field. |
| `Up`, `Down` in the chat | Command history. |
| `Right` with text typed | Submit it. |
| `Left` with an empty field | Same as `[BACK]` (on a program prompt, cancels). |
| `Esc` | Same as `[EXIT]` on an archive page. In a program prompt it cancels. |
| Hover an item | Highlights it and shows its `[COMMAND]` in the input field. Moving away restores what was typed. |
| Click an item | Runs it as if typed. Ignored while the terminal is drawing. |
| Address bar `↰` | Up one level (`[BACK]`). |
| Address bar path segment | Jumps to that ancestor folder. |
| `Esc` or `[X]` on a program window | Closes the program. |

### 3a. Program windows and FETCH LOG.EXE

A program opens as a floating window. Everything already on screen (header and terminal) gets a dark tint and
blur, and the window sits centered above it with a solid, filled title bar (`TITLE · NAME.EXE`, `[X]` at the
right). The page behind is inert until the window closes. Each program sizes its own window. Closing it prints
`> <NAME>.EXE CLOSED` and gives the prompt back.

FETCH LOG.EXE layout, top to bottom:

| Area | What it is |
|---|---|
| Code field | `ENTRY CODE` and a `FETCH` button. Typing hyphenates and uppercases (`XXXXX-XXXXX-XXXXX-XXXXX`). `Enter` fetches. |
| Status line | One line of feedback (`ENTRY RECOVERED`, `INVALID FORMAT`, `ACCESS RESTRICTED`, ...). |
| Log pane | The fetched log, or the recovered list. Lines never wrap on a desktop screen (on a phone they wrap). |
| `FETCH NEW LOG` | Clears the field and the pane and puts the cursor back in the field. |
| `RECOVERED LOGS` | Lists every code entered so far, oldest first. Click a row to reopen that log. Hovering a row shows its code in the field. |

Each recovered row reads `[Log header]  //  CODE  //  HEALTH  //  TYPE`:

| Column | Where it comes from |
|---|---|
| Log header | First line of the entry's text, for example `[Log A-15 \| Stardate 2143.136.2132]` (falls back to the entry's `label`). |
| Health | `INTACT`, `PARTIAL` (the text contains `[CORRUPTED]`), `RESTRICTED` (classified and viewed at tier 1). An entry can set its own `health` field in `lore.json` or `dev_logs.json` to override it. A code whose entry no longer exists shows `LOST`. |
| Type | The wording before the log number in the entry's `label` (`CAPTAIN'S LOG`, `MEDICAL LOG`, `INTERCEPT`, ...). |

Typed codes follow the layer rule (L3 reads `dev_logs.json`, L2 reads `lore.json`). A log already in the recovered
list can be reopened from any layer.

The mouse pointer is drawn in JavaScript from the active layer color: an arrow, a bracket reticle over
anything clickable, and an I-beam over the input.

---

## 4. `[SYSTEM OVERRIDE]` menu

Type `[SYSTEM OVERRIDE]` anywhere. The screen goes black and green. These work inside it:

| Command | What it does |
|---|---|
| `[STATUS]` | Runs the data validator: file status, dangling targets, unknown command or node types, orphaned nodes, stub items. |
| `[TREE]` | The full author view of the tree (hidden items, stubs, tiers, programs, gateways). |
| `[JUMP L1]`, `[JUMP L2]`, `[JUMP L3]` | Jumps to that tier's archive root with the theme and ambient sound for it. |
| `[EXIT]` | Leaves the override and restores the screen you were on. |

---

## 5. Author mode

Author mode edits the tree in the browser. It is for the author only. Setting `"locked": true` under `meta`
in `echo-os.json` removes every author command: `[AUTHOR UNLOCK]` then behaves like any unknown command.

| Command | What it does |
|---|---|
| `[AUTHOR UNLOCK]` | Turns author mode on (no passphrase). The prompt becomes `AUTHOR>`. Redraws the page so hidden items appear. |
| `[AUTHOR LOCK]` | Turns it off. |
| `[AUTHOR HELP]` | Lists the author commands. |
| `[MKDIR]` | New folder in the folder you are standing in. |
| `[NEW DOC]` | New page with its own text. Lines can start with `/dim`, `/low`, `/warn` or `/denied` to set a style. `[DONE]` finishes, `Esc` aborts. Capitalization and indentation are kept. |
| `[NEW LOG]` | New page that shows a `lore.json` (`LORE`) or `dev_logs.json` (`DEV`) entry by code. |
| `[NEW PROGRAM]` | Registers a program from `terminal-data/programs/<id>.js` as a hidden item. Asks for its scope. |
| `[NEW GATEWAY]` | Hidden command that jumps to any folder, in any tier. A different tier plays the transition. |
| `[EDIT]` | Changes an item's name, alias, title, hidden flag and text. On a stub it turns it into a real doc. |
| `[HIDE]`, `[SHOW]` | Unlists an item (it still opens by its alias) or lists it again. Programs and gateways are always hidden. |
| `[ALIAS]` | Changes an item's `[COMMAND]`. |
| `[MV]` | Moves an item and everything under it to another folder. `..` means the parent folder. |
| `[RM]` | Deletes an item and everything under it. Refuses if a gateway points into it. |
| `[EXPORT]` | Downloads `echo-os.json` and clears the draft. Hand the file over to commit. |
| `[RESTORE DRAFT]`, `[DISCARD DRAFT]` | Recover or drop the autosaved draft (kept in the browser as `echo_os_draft`). |

Every prompt can be canceled with `Esc`. Edits are autosaved to the draft and offered back on the next unlock.

**Alias rules.** An alias cannot shadow a built-in or reserved name (`[HELP]`, `[TREE]`, `[LS]`, `[BACK]`,
`[ROOT]`, `[EXIT]`, `[CLEAR]`, `[SYSTEM OVERRIDE]`, `[AUTHOR UNLOCK]`, `[AUTHOR LOCK]`, `[STATUS]`, `[SCAN]`,
`[OPEN ...]`, or any author command). Hidden aliases must be unique everywhere. Visible aliases only need to
be unique within their folder. Programs may share an alias across tiers.

**Author-only mouse features.**

| Input | Effect |
|---|---|
| `(o)` / `(-)` beside an item | Open or closed eye. Click it to list or unlist the item. |
| Right-click an item | Menu: open, edit, change alias, hide or show, move, delete. Skips the "which item?" prompt. |
| Right-click empty space | Menu: the create commands, tree, export, help, lock. |
| Click a line in `[TREE]` | Jumps straight to that item, across tiers. Programs, gateways and stubs land on their folder. |

---

## 6. Boot checks

The five lines on the landing page check the five data files. Each line ends with a status in brackets, then that
file's latest commit ID from GitHub (a dash if GitHub does not answer). The last line summarizes them.

| Status | Color | Meaning |
|---|---|---|
| `OK` | green | Loaded, parsed, and the contents look right. |
| `WARN` | amber | Usable, but something inside is off. The file is used as is. |
| `INVALID` | red | Valid JSON with the wrong contents. Treated as unavailable. |
| `BROKEN` | red | Fetched, but not valid JSON. Treated as unavailable. |
| `MISSING` | red | Could not be fetched (not found, or the network failed). Treated as unavailable. |

The labels are editable as the `status_ok`, `status_warn`, `status_invalid`, `status_broken` and `status_missing`
strings in the terminal engine editor.

The last line reads `FULL ACCESS`, `FULL ACCESS — n WARNING(S)`, or `DEGRADED — n SUBSYSTEM(S) OFFLINE` (with
`, n WARNING(S)` added if there are warnings too). INVALID, BROKEN and MISSING count as offline.

| Label | File | `INVALID` when | `WARN` when |
|---|---|---|---|
| CREW BEHAVIORAL MATRIX | `personality.json` | Not an object, or `easter_eggs`, `denied` or `admin_triggers` (`keywords` and `responses` lists) is missing or the wrong type. | Some easter eggs lack `keys` or `variants`. |
| ARCHIVE LOG DATABASE | `lore.json` | Not an object of entries, or no entry has `text` and a `type` of `full`, `classified` or `virus`. | The file has no entries, some entries are malformed, or a code is not in the `XXXXX-XXXXX-XXXXX-XXXXX` format. |
| DEVELOPMENT RECORDS | `dev_logs.json` | Same as `lore.json`. | Same as `lore.json`. |
| NAVIGATION ARCHITECTURE | `echo-os.json` | No `tree.children`, or no tier 1 folder. | No layer 1 chat (landing) screen, duplicate item ids, or a gateway that points nowhere. |
| CORE ENGINE PARAMETERS | `engine_config.json` | Not an object, or `typing`, `timing` or `theme` is missing. | A theme is missing for layer 1, 2 or 3, or `idle_messages` is not a list. |

Examples that now report `INVALID`: `lore.json` containing `["not", "an", "object"]`, `dev_logs.json` containing
`{"hello": "world"}`, `personality.json` containing `{"easter_eggs": "text", "admin_triggers": 7}`. Before this
check existed all three showed `[OK]` and `FULL ACCESS`.

The landing screen (title art, the five lines, the `[ECHOES.ARCHIVE]` command) is data in `echo-os.json`. If that
file is `MISSING`, `BROKEN` or `INVALID`, the engine has no landing screen to draw, so it draws the same five check
lines from its own built-in copy instead, with the error showing. The terminal then runs with the chat only, because
there is no archive to enter. `[SYSTEM OVERRIDE]` then `[STATUS]` lists each problem and the reason for it.

---

## 7. Where content lives

| What | Where |
|---|---|
| Tree of folders, docs, logs, hidden items, gateways, programs | `terminal-data/echo-os.json` (`tree`) |
| Chat consoles, intros, title art, landing text | `terminal-data/echo-os.json` (`screens`) |
| Item glyphs and the open and closed eye | `terminal-data/echo-os.json` (`glyphs`) |
| `[HELP]` text | `terminal-data/echo-os.json` (`help`) |
| Lock switch | `terminal-data/echo-os.json` (`meta.locked`) |
| Lore entries (code lookup) | `terminal-data/lore.json`, `terminal-data/dev_logs.json` |
| Chat personality, easter eggs, admin responses | `terminal-data/personality.json` |
| Timing, audio, themes, system messages | `terminal-data/engine_config.json` (edited with `dev-tools/terminal-engine-editor.html`) |

The `self_destruct` block in `personality.json` is data only. The terminal does not run it.

Browser storage used: `echo_os_draft` (author draft), `echo_disc` (recovered codes), `echo_misc` (unlocked
programs), `echo_l3_visited`.

---

## 8. Writing a program

A program is `terminal-data/programs/<id>.js` with `export default { id, title, exe, async run(ctx) {} }`, plus a
`program` item in `echo-os.json` (or `[NEW PROGRAM]` in author mode) that sets its alias, tier and scope.

| `ctx` member | Use |
|---|---|
| `ctx.window({ width, height, title, exe })` | Tints the screen and opens the window. Returns `win` with `win.body` (fill it with DOM), `win.style(css)`, `win.focus(el)`, `win.setTitle()`, `win.close()` and `win.closed` (a promise that resolves on close). Size with any CSS length, for example `min(96vw, 880px)`. |
| `ctx.sound.click / backspace / enter / denied / line / tone` | The terminal's sound effects. |
| `ctx.recovered()` | Codes entered so far: `[{code, sd, ts}]`, oldest first. |
| `ctx.discovered(code)` | Records a recovered code. |
| `ctx.level`, `ctx.lore`, `ctx.devLogs`, `ctx.strings` | Current tier, the two log files, system messages. |
| `ctx.virus(entry)` | Runs the virus sequence. Close the window first, then return `'reset'`. |

`run` returns `'stay'` when it is done (a windowed program leaves the page untouched) or `'reset'` after
`ctx.virus`. Shared look: use the classes `pg-btn` and `pg-input`, and the theme variables `--theme-full`,
`--theme-dim`, `--theme-lo`, `--theme-warn`, `--theme-denied`, `--theme-bc`.
