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
| `[FETCH LOG ENTRY: //]` | Any tier 2 or tier 3 page (answers "unavailable" in the chat and at tier 1) | Program `lore-entry`. Opens in its own titled window. Prompts for a 20 character code (`XXXXX-XXXXX-XXXXX-XXXXX`) and shows the matching entry from `lore.json` (L2) or `dev_logs.json` (L3). `Esc` or the window's `[X]` cancels. |

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
| Program window `[X]` | Same as `Esc`: cancels the program. |

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

The five lines on the landing page are real load checks. Each shows `[OK]` if the file was fetched and parsed
and `[ERROR]` if not, followed by that file's latest commit ID from GitHub. The last line reads `FULL ACCESS`,
or `DEGRADED` with a count of offline subsystems.

| Label | File | Counts as `[OK]` when |
|---|---|---|
| CREW BEHAVIORAL MATRIX | `personality.json` | It loads and parses. |
| ARCHIVE LOG DATABASE | `lore.json` | It loads and parses. |
| DEVELOPMENT RECORDS | `dev_logs.json` | It loads and parses. |
| NAVIGATION ARCHITECTURE | `echo-os.json` | It loads, parses, and the tree has a layer 1 root. |
| CORE ENGINE PARAMETERS | `engine_config.json` | It loads and parses. |

These checks do not validate contents. A file that is valid JSON but has the wrong shape still passes (use
`[SYSTEM OVERRIDE]` then `[STATUS]` to validate the tree). If `echo-os.json` itself fails, the landing screen
cannot come from it, so the same five checks are drawn from code instead.

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
