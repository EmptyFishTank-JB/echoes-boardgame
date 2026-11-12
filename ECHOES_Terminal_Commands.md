# ECHOES O.S. Terminal: Command Reference

Every `[COMMAND]` the terminal (`terminal.html`) understands, where it works, and where it is defined.
Last verified against the code on 2026-11-10.

**Keeping this current.** When a command is added, renamed or removed, update this file in the same
commit. `node dev-tools/check-command-doc.js` compares the code and data against this file and lists any
command that is missing from it. Run it before committing terminal changes. The browser tests are in
`dev-tools/tests` (`node dev-tools/tests/run-all.js`; see the README there).

| Command source | File |
|---|---|
| Built-ins, `[SYSTEM OVERRIDE]` menu, author lock/unlock | `terminal.html` (`tryBuiltin`, `handleOverrideInput`, `handleAuthorInput`) |
| Author editing commands | `terminal-data/author.js` (`COMMANDS`, `HELP`) |
| Folders, docs, hidden items, gateways, programs, `[HELP]` text | `terminal-data/echo-os.json` |
| Programs | `terminal-data/programs/<id>.js` |

---

## 1. How input works

- Commands are typed in square brackets and are case-insensitive: `[help]` and `[HELP]` are the same. The
  brackets are required.
- `[OPEN <name>]` is shorthand for `[NAME]`. `[OPEN CREW MANIFEST]` opens `[CREW MANIFEST]`.
- Anything typed in the chat that is not a command is free text and gets a response from `personality.json`.
- While the terminal is drawing a page or running a sequence, typing is ignored. Nothing is queued.
- Clicking works everywhere typing does (see section 3).
- Levels are written **L1, L2, L3** everywhere: the address bar badge, the status line, the author tree, prompts, and
  `[JUMP L2]`. The data files store the same number in a field called `tier`.

**How output renders.** Every line the terminal prints has a kind, and one table (`RENDER`, in `terminal.html`)
says how each kind appears. To change what types and what lands whole, change a kind's mode in that table.

| Kind | What it covers | How it renders |
|---|---|---|
| `chat` | Replies to free text: personality responses, easter eggs, denied and admin lines, `KNOCK KNOCK`. This is the only place speed varies. | Typed. Speed varies, slower on the slow words. |
| `boot` | The landing screen's text: the intro, `> VERIFYING SUBSYSTEM CONNECTIONS...`, the `FULL ACCESS` / `DEGRADED` verdict, the fallback boot text. | Typed, uniform speed. |
| `check` | The five subsystem check lines (label, dashes, `[STATUS]`, commit ID, colors kept). | Whole line with the static sound, a short beat between lines. |
| `flavor` | Transition text between layers, the mount and unmount lines, layer enter and exit confirmations, the `[SYSTEM OVERRIDE]` banner, the self-destruct sequence. | Typed, uniform speed. |
| `status` | One-line system messages: errors, `<NAME>.EXE CLOSED`, command headings, validation summary. | Typed, uniform speed. |
| `doc` | Body text of a document printed inline. | Typed, uniform speed. |
| `prompt` | `> AWAITING INPUT`. | Typed, uniform speed. |
| `list` | `[HELP]` entries, `[LEGEND]` rows, `[STATUS]` results, `[TREE]`, the author `[LS]`, the echo of what you typed, and everything author mode says to the author (prompts, answers, info lines, errors). | Whole line, a short pause between lines. |
| `page` | Archive pages (folders, documents, logs). | Whole line, a shorter pause between lines. |

Settings in `engine_config.json`, under `typing`: `base_ms` is the uniform typing speed (default 38 ms per
character) and the base for chat; `variance` and `slow_multiplier` apply to chat only; `line_ms` is the pause
after a whole `list` line (default 40) and `page_ms` after a `page` line (default 22).

Either way the glow is the same. A whole line flashes once as a whole and fades to its normal brightness. Typed
characters each flash and fade on their own. Brightness and duration are `timing.phosphor_brightness` and
`timing.phosphor_duration_ms`. A screen that is put back (leaving an archive for the chat, leaving
`[SYSTEM OVERRIDE]`) returns settled, with no flash. A page redrawn from data (`[BACK]`, `[ROOT]`, a click on the
address bar) renders again as new lines.

---

## 2. Player commands

### Anywhere (chat and archive)

| Command | What it does |
|---|---|
| `[HELP]` | Lists the commands. The list is the `help` block in `echo-os.json`. |
| `[TREE]` | Prints the file tree. Available to everyone, locked or not. Players see only what the archive shows them: hidden items, stubs, programs, gateways and deeper levels are left out, and a level root appears by name only (no `[COMMAND]`). In author mode (`[AUTHOR UNLOCK]`) every hidden item appears, with its marks. |
| `[CLEAR]` | Clears the screen. |
| `[SYSTEM OVERRIDE]` | Hardcoded recovery menu (section 4). Works from any state, even mid-draw, and cannot be blocked by data. |

### Chat (layer 1 console)

The chat has no listed commands. The landing screen prints the title art, the five boot lines and a hint to type
`[HELP]`. `[ECHOES.ARCHIVE]` is not shown there (see the hidden commands below).

Free text gets a personality response. Special cases: `KNOCK KNOCK`, the easter eggs in `personality.json`,
and the admin keywords (`admin`, `root`, `sudo`, `bypass`, `superuser`, `administrator`, `authenticate`,
`backdoor`, `shell`, `exploit`, `elevate`, `privilege`, `grant access`, `hack`), which draw a "flagged and
logged" style response. A bracket command the chat really defines wins over the keyword scan. An unknown
bracket that contains a keyword still draws the admin response.

### Archive pages (any level)

| Command | What it does |
|---|---|
| `[LS]` | Redraws the current folder. In author mode it lists everything, with `~hidden` and `?stub` marks. |
| `[BACK]` | Up one level. At a level root it leaves the level, same as `[EXIT]`. |
| `[ROOT]` | Jumps to the root of the current level. |
| `[EXIT]` | Leaves the level: L3 to the L2 root, L2 to the L1 root, L1 back to the chat. |
| `[<ITEM NAME>]` | Opens any item listed on the page, for example `[INCIDENT REPORTS]`. |

Items listed on a page are the visible children of that folder. Aliases come from `echo-os.json`.

### Hidden commands (discovered in play)

These never appear in a listing. The player learns them from the story.

| Command | Where | What it does |
|---|---|---|
| `[ECHOES.ARCHIVE]` | The chat | Enters the layer 1 archive with the transition sequence (below): the mount line, a cleared screen, the L1 transition text, then the theme switch and the ECHOES.ARCHIVE root. It is not on the landing screen, not in `[HELP]` and not in the player `[TREE]`: it is printed on a few of the game's Echo cards, and players bring it to the terminal and type it. Its item in `echo-os.json` (the `l1c` root's command) has `"hidden": true`. Typed only: nothing on the chat screen can be clicked to enter. The author `[TREE]` lists it. |
| `[INITIATE ECHO PROTOCOL]` | Anywhere: the chat or any archive page | Gateway to the L2 root. Plays the transition sequence with the L2 transition text (`L2A_INTRO`), then draws `L2A_ROOT`. |
| `[INITIATE CHRONO-ZERO PROTOCOL]` | Any page at L2 or L3 (an unknown command at L1 and in the chat, because the gateway is a level 2 item) | Gateway to the L3 root. Plays the transition sequence with the L3 transition text (`L3A_INTRO`), then draws `L3A_ROOT`. Hidden commands ignore hyphens, spacing and capitals, so `[INITIATE CHRONO ZERO PROTOCOL]` works too. The clue to it is the Day 29 log `6PILH-UYMCX-YY3XY-WDR17` (see the content notes). |
| `[FETCH LOG ENTRY: //]` | Any L2 or L3 page (answers "unavailable" in the chat and at L1) | Program `lore-entry`, shown as **FETCH LOG.EXE** in its own window (see section 3a). |

A hidden item opens only if its level is at or below the level you are in. A program opens only where its
`scope` allows (`tier` in the data, shown as LEVEL in prompts, means any page of that level; `folder` means only the folder it sits in). Anywhere
else it answers "fetch unavailable".

### Defined but not reachable

| Command | Status |
|---|---|
| `[STATUS]`, `[SCAN]` | Reserved names for future programs. Nothing defines them yet, and an alias cannot take them. (`[STATUS]` does exist inside the override menu, section 4.) |

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
| Type a full command | The input field highlights as soon as what you typed is a valid command, listed or not. Hidden commands (`[ECHOES.ARCHIVE]`, `[SYSTEM OVERRIDE]`, `[INITIATE ECHO PROTOCOL]`, `[INITIATE CHRONO-ZERO PROTOCOL]`, hidden items, programs) light it too, so finding one confirms it is real. Author commands light it only once typed in full, and only in author mode. Inside `[SYSTEM OVERRIDE]` only the override menu's own commands light it. |
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
| Health | The entry's own `health` field: `PARTIAL`, `DEGRADED` or `CORRUPTED` (the log editor writes it, and the same word shows on the status line when the log opens). With no field, text containing `[CORRUPTED]` reads `PARTIAL`, older entries that used `type: partial`, `degraded` or `corrupted` read the same, a classified entry viewed at L1 reads `RESTRICTED`, and anything else is `INTACT`. A code whose entry no longer exists shows `LOST`. |
| Type | The wording before the log number in the entry's `label` (`CAPTAIN'S LOG`, `MEDICAL LOG`, `INTERCEPT`, ...). |

A log whose ID, date or sign-off was damaged on purpose (the override in the log editor) holds corruption glyphs (`▒ ░ ▓ ╳ ¤ ¦ ¿`, never a letter or a digit) in its text. FETCH LOG.EXE draws them in the layer's `--theme-glitch` color, in the log and in the recovered list.

A typed code is looked up in `lore.json`, and at L3 in `dev_logs.json` first. An entry with `"clearance": 3` (every dev log, and any
lore log meant for L3 only, such as the ones the creature writes through Terminal 426) opens only at L3. At L2 its code answers
`ACCESS RESTRICTED` and is not added to the recovered list. A dev log shows the `DECRYPTING ENTRY` lines, a lore log never does. A log
already in the recovered list can be reopened from any layer.

**Writing the logs.** `lore.json` and `dev_logs.json` are written with `dev-tools/lore-devlog-editor.html`. Each entry is
`"CODE": { label, type, health?, clearance, author?, text }`: `type` is `full` or `virus`, `health` is left out when the
log is intact, and `clearance` is 2 for a lore log players read, 3 for a dev log or a lore log for L3 only (the level that can open it). A log's ID is its
author's ID, a department letter and three digits (`R-118`), taken from `terminal-data/crew.json`, and the 20 character code
carries that ID and the moment the log was filed. Dev logs use the reserved department `D`. See the lore-log section of
`ECHOES_Terminal_Content_Notes.md` for the details.

The mouse pointer is drawn in JavaScript from the active layer color: an arrow, a bracket reticle over
anything clickable, and an I-beam over the input.

---

## 4. `[SYSTEM OVERRIDE]` menu

Type `[SYSTEM OVERRIDE]` anywhere. The screen goes black and green. These work inside it, typed or clicked (hovering a command shows it in the input field, as everywhere else):

| Command | What it does |
|---|---|
| `[STATUS]` | Runs the data validator: file status, dangling targets, unknown command or node types, orphaned nodes, stub items. |
| `[LEGEND]` | Explains the boot check labels (`OK`, `WARN`, `INVALID`, `BROKEN`, `MISSING`), the status line, and which label belongs to which file. Built from the live label strings, so it matches the boot screen even if you rename them. |
| `[TREE]` | The full author view of the tree (hidden items, stubs, levels, programs, gateways). |
| `[JUMP L1]`, `[JUMP L2]`, `[JUMP L3]` | Jumps to that level's archive root with the theme and ambient sound for it. |
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
| `[NEW DOC]` | New page with its own text, typed a line at a time (see "Typing a text" below). Lines can start with `/dim`, `/low`, `/warn` or `/denied` to set a style. `[DONE]` finishes, `Esc` aborts. Capitalization and indentation are kept. |
| `[NEW PROGRAM]` | Registers a program from `terminal-data/programs/<id>.js` as a hidden item. Asks for its scope. |
| `[NEW GATEWAY]` | Hidden command that jumps to any folder, at any level. A different level plays the transition. |
| `[EDIT]` | Opens the item's editing window (section 5b): name, alias, title, hidden, requires, footer, text and whatever else fits its type. On a stub it turns it into a real doc once it has text. |
| `[LAYER]`, `[LAYER <SETTING>]` | Opens the layer window (sections 5a and 5b) on the layer you are standing in, or the one a right-click named, with a tab for each of the chat and the three archive layers. `[LAYER PRIMARY]` opens it scrolled to that setting. |
| `[SET]`, `[SET <PROPERTY>]` | Opens the item's window on one property: `[SET NAME]` puts the cursor in the name box. Properties: `NAME`, `ALIAS`, `TITLE`, `HIDDEN`, `FOOTER`, `REQUIRES`, `TEXT` (docs and stubs), `DESTINATION` (gateways), `PROGRAM` and `SCOPE` (programs). Gateways and programs have only the ones that apply to them: they never draw a page, so no title or footer, and a gateway has no hidden toggle. Asks which item unless a click or the right-click menu named it. |
| `[HIDE]`, `[SHOW]` | Unlists an item (it still opens by its alias) or lists it again. A program is hidden unless you `[SHOW]` it: then it is listed in its folder with the program glyph and runs when clicked. Gateways are always hidden. |
| `[FLAGS]`, `[FLAG]`, `[RESET STATE]` | `[FLAGS]` lists the game flags that are on and the items they gate. `[FLAG]` turns one on or off by name (author mode ignores `requires`, so use `[AUTHOR LOCK]` to see what a player sees). `[RESET STATE]` clears every flag, recovered code and unlock for a fresh game. |
| `[ALIAS]` | Opens the item's window on its alias, which is checked as you type. |
| `[MV]` | Moves an item and everything under it to another folder. `..` means the parent folder. |
| `[RM]` | Deletes an item and everything under it. Refuses if a gateway points into it. |
| `[EXPORT]` | Downloads `echo-os.json` and clears the draft. Hand the file over to commit. |
| `[RESTORE DRAFT]`, `[DISCARD DRAFT]` | Recover or drop the autosaved draft (kept in the browser as `echo_os_draft`). |

Every prompt can be canceled with `Esc`. Edits are autosaved to the draft and offered back on the next unlock.

**Ids.** Every item has an id the engine stores in links. `L3A_ROOT` reads as level 3, Archive, root: `A` means archive
(the chat screens use `C`, as in `L1C_ROOT`). Gateways are `GW_...` and programs `L<n>A_PROG_...` (n is the level). A gateway's
destination is stored as the destination folder's id, so it keeps working if the folder is renamed; the menus and the
author `[TREE]` show it as name and id.

**Alias rules.** An alias cannot shadow a built-in or reserved name (`[HELP]`, `[TREE]`, `[LS]`, `[BACK]`,
`[ROOT]`, `[EXIT]`, `[CLEAR]`, `[SYSTEM OVERRIDE]`, `[AUTHOR UNLOCK]`, `[AUTHOR LOCK]`, `[STATUS]`, `[SCAN]`,
`[OPEN ...]`, or any author command). Hidden aliases must be unique everywhere. Visible aliases only need to
be unique within their folder. Programs may share an alias across levels.

**Author-only mouse features.**

| Input | Effect |
|---|---|
| `(o)` / `(-)` beside an item | Open or closed eye. Click it to list or unlist the item. |
| Right-click an item | A menu that starts with what the item is, one row per property: `ID`, `TYPE`, `NAME`, `ALIAS`, `TITLE` (not for gateways and programs), `HIDDEN`, `REQUIRES`, `FOOTER`, `CONTAINS` (folders), `TEXT` (docs), `DESTINATION` (gateways, shown as name and id, for example `L3 ROOT (L3A_ROOT)`), `PROGRAM` and `SCOPE` (programs). `ID`, `TYPE` and `CONTAINS` are read-only. Click any other row to change that property: it asks only the one question (`[SET NAME]`, `[ALIAS]`, `[SHOW]`/`[HIDE]` and so on). Below the rows: open, edit everything, move, delete. Skips the "which item?" prompt. |
| Right-click empty space | Menu: the create commands, tree, export, help, lock. At a level root it also offers `LAYER SETTINGS...`. |
| Right-click the address bar | The same rows as an item's menu, for the page you are on. At a level root it adds the layer's settings (section 5a). |
| Click a line in `[TREE]` | Jumps straight to that item, across levels. Programs, gateways and stubs land on their folder. |

---

### 5a. Layer settings

There are four layers: the chat (`l1c`) and three archive layers (`l1a`, `l2a`, `l3a`). Each has its own colors, so the archive's
first level can look different from the chat. The chat shares the sound and the transition text of `l1a`. Everything that makes a
layer look and sound the way it does lives in `layers.<id>` in `echo-os.json` (plus its transition screen `L<n>A_INTRO`), and every
setting is edited in the layer window with a live result.

| Setting | What it changes | Control |
|---|---|---|
| Title | The header text while you are in the layer. | Text box |
| Colors | `PRIMARY`, `WARN`, `DENIED`, `GLITCH` (shown as CORRUPT: the damaged characters in a log's ID, date and sign-off) and `BACKGROUND` (the glow around the screen). The dim, low and border tints are made from `PRIMARY`. `GLITCH` is its own color so a layer whose `DENIED` is red can show corruption in another one (L3 uses a pale cyan). | A color picker and a hex box each, and a row of theme chips that set all the colors at once |
| Strength | How strong the `DIM`, `LO` and `BORDER` tints are. | Sliders |
| Transition text | The text shown while the terminal moves into the layer (the `L<n>A_INTRO` screen). The blank lines and the rule line around it are added for you. | A line editor with a style per line, and a typed preview |
| Sound | The ambient sound of the layer. | A list you can listen to, and a volume slider |

**Theme chips.** `CYAN` (the original blue), `STEEL`, `CYAN ON STEEL`, `PEWTER`, `COBALT`, `STEEL BLUE`, `PERIWINKLE`, `SILVER`, `GREY JADE`,
`AMBER` and `RED` (layers 2 and 3 as they were). One click sets all the colors, so any layer can be tried in any palette and set back. `GREY JADE` is the default for L1A.

**Sounds.** `VENTILATION`, `CHORD`, `SUB-BASS`, `REACTOR HUM`, `COLD AIR`, `SIGNAL`, `DEEP PULSE` and `SILENT`. The play button
previews a sound (the layer's own sound ducks meanwhile and a preview stops by itself after 12 seconds), a click on the name
chooses it and sets its default volume, and the volume slider changes it afterward. What a sound is made of (oscillators, filters)
is in the `ambient` block of the layer, for anyone who wants a custom sound in the JSON.

**Typing a text.** `[NEW DOC]` takes its text one line per entry. Type a line to add it at the end (a blank entry is a blank line).
These commands, each typed alone, work while you are typing:

| Command | What it does |
|---|---|
| `[BACK]` | Removes the last line, and says which one it was. |
| `[LIST]` | Prints the lines with their numbers (a styled line shows its `/dim` and so on). |
| `[PREVIEW]` | Plays the text as a page lands, whole. |
| `[EDIT n]` | Shows line *n* and asks for a replacement. `Enter` keeps it, `[BLANK]` makes it a blank line, `Esc` cancels. Only that line changes. |
| `[INS n]` | Asks for one line and inserts it before line *n* (`[INS 5]` on a four line text adds it at the end). |
| `[DEL n]` | Removes line *n*. |
| `[CLEAR]` | Removes every line, after a Y/N. |
| `[DONE]` | Saves. `Esc` asks whether to discard. |

An existing text (a document, or a layer's transition text) is edited in its window instead, as lines with a style each.

Where to find the layer window: right-click the address bar at a level root (rows with swatches, click one to open the window on it), or
type `[LAYER]` while standing in that level. Colors, title and sound apply as soon as the change is made, and `[EXPORT]` carries them.

**The transition sequence.** Every move into a layer (chat to L1, L1 to L2, L2 to L3, by command or gateway) plays the same
steps: (1) the command is accepted, a typed line in the layer you are leaving; (2) the screen clears; (3) the layer's transition
text (`L1A_INTRO`, `L2A_INTRO`, `L3A_INTRO`) types on the clear screen, still in the old theme; (4) the theme, header title and
ambient sound switch; (5) the layer's root page is drawn. Moving up (`[EXIT]`) clears and switches without text. The accepted
lines are strings under `terminal_strings` in `engine_config.json`: `layer_mount` (chat to L1, default `> MOUNTING ECHOES:\ . . .`),
`layer_entry_l2` and `layer_entry_l3` (default `> GATEWAY COMMAND ACCEPTED . . .`), and `layer_unmount` (leaving to the chat).

### 5b. The editing windows

`[EDIT]`, `[SET ...]`, `[ALIAS]`, `[LAYER ...]`, a click on a row of the right-click menu and "EDIT EVERYTHING..." all open a floating
window instead of asking questions one at a time. The window is not modal (the page behind it still works), moves by its title bar
(mouse or touch) and stays on the screen, wears the colors of the layer it edits (the layer window changes as you change the colors), and
there is one per item. `Esc` or `[X]` closes it, and so does `[AUTHOR LOCK]`.

| Window | Controls |
|---|---|
| Folder, doc, log | Name, alias (checked as you type), title (with a "= NAME" button), a hidden toggle, footer. A doc or stub also has its text as lines: a style per line, move up and down, delete, `+ LINE`, `+ BLANK`, `PASTE...` (replaces all lines, `/dim` and so on read as styles) and `PLAY` (types the lines into a preview). A log has `LORE` / `DEV` and the entry code, with the entry's label, clearance and health shown as you type. A folder shows how many items it holds. |
| Gateway | Name, alias and where it goes, chosen from a list of folders by level. |
| Program | Name, alias, the program file (it must load) and where it works: any page of the level, or only its folder. |
| Layer | Tabs for the chat and L1A, L2A, L3A. Title, theme chips, colors, strengths, transition text and the sound list (section 5a). |

Item windows write on `APPLY` (nothing changes before it, the footer says `UNAPPLIED CHANGES`, and `Enter` in a text box applies), then
redraw the page behind them. An alias that shadows a built-in or is already used is refused. `REVERT` puts the fields back. Names and titles are kept
in capitals. In the layer window colors, strengths, title and sound apply as you change them; the transition text has its own
`SAVE THE TRANSITION TEXT`; `REVERT THIS LAYER` puts the layer back to how it was when the window opened.

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
| NAVIGATION ARCHITECTURE | `echo-os.json` | No `tree.children`, or no level 1 folder. | No layer 1 chat (landing) screen, duplicate item ids, a gateway that points nowhere, or no colors for layer `l1a`, `l2a` or `l3a` (the built-in colors are used). |
| CORE ENGINE PARAMETERS | `engine_config.json` | Not an object, or `typing` or `timing` is missing. | `idle_messages` is not a list. |

Examples that now report `INVALID`: `lore.json` containing `["not", "an", "object"]`, `dev_logs.json` containing
`{"hello": "world"}`, `personality.json` containing `{"easter_eggs": "text", "admin_triggers": 7}`. Before this
check existed all three showed `[OK]` and `FULL ACCESS`.

The landing screen (title art, the five lines, the `[HELP]` hint) is data in `echo-os.json`. If that
file is `MISSING`, `BROKEN` or `INVALID`, the engine has no landing screen to draw, so it draws the same five check
lines from its own built-in copy instead, with the error showing. The terminal then runs with the chat only, because
there is no archive to enter. `[SYSTEM OVERRIDE]` then `[STATUS]` lists each problem and the reason for it.


**Where the vessel name shows.** `DSCF CHARON` (Deep Space Colonial [Outpost] Facility, Ixion-class) appears in three
places. The start screen shows it large above the hub name, with the full `DSCF CHARON - ECHOES SHIP SYSTEM TERMINAL 426`
under the power button. The landing screen opens with a `DSCF CHARON ────` heading row above the ECHOES art (the first
two rows of the `art` item in `echo-os.json`: a heading and a spacer). The header in the chat reads the full name from
`terminal_title` in `engine_config.json`. On a phone the header puts the name on its own row.
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
| Colors, header title, intro text and ambient sound, per layer | `terminal-data/echo-os.json` (`layers`, and the `L<n>A_INTRO` screens). Edited in the terminal: see section 5a. |
| Timing, typing, master volume, idle messages, system messages | `terminal-data/engine_config.json` (edited with `dev-tools/terminal-engine-editor.html`) |

The `self_destruct` block in `personality.json` is data only. The terminal does not run it.

Browser storage used: `echo_os_draft` (author draft), `echo_disc` (recovered codes), `echo_misc` (unlocked
programs), `echo_state` (game flags), `echo_l3_visited`.

---

## 8. Writing a program

A program is `terminal-data/programs/<id>.js` with `export default { id, title, exe, async run(ctx) {} }`, plus a
`program` item in `echo-os.json` (or `[NEW PROGRAM]` in author mode) that sets its alias, level and scope.

| `ctx` member | Use |
|---|---|
| `ctx.window({ width, height, title, exe })` | Tints the screen and opens the window. Returns `win` with `win.body` (fill it with DOM), `win.style(css)`, `win.focus(el)`, `win.setTitle()`, `win.close()` and `win.closed` (a promise that resolves on close). Size with any CSS length, for example `min(96vw, 880px)`. |
| `ctx.sound.click / backspace / enter / denied / line / tone` | The terminal's sound effects. |
| `ctx.recovered()` | Codes entered so far: `[{code, sd, ts}]`, oldest first. |
| `ctx.discovered(code)` | Records a recovered code. |
| `ctx.state.get(name)`, `.has(name)`, `.set(name, value)`, `.all()` | The game flags (section 9). `set` with no value turns a flag on, `false` turns it off, and it returns whether anything changed. |
| `ctx.stardate()` | The current stardate as the terminal shows it. |
| `ctx.level`, `ctx.lore`, `ctx.devLogs`, `ctx.strings` | Current level, the two log files, system messages. |
| `ctx.virus(entry)` | Runs the virus sequence. Close the window first, then return `'reset'`. |

`run` returns `'stay'` when it is done (a windowed program leaves the page untouched) or `'reset'` after
`ctx.virus`. Shared look: use the classes `pg-btn` and `pg-input`, and the theme variables `--theme-full`,
`--theme-dim`, `--theme-lo`, `--theme-warn`, `--theme-denied`, `--theme-glitch`, `--theme-bc`.

---

## 9. Game state, gated items and INBOX.EXE

**Flags.** The terminal keeps named flags in the browser (`echo_state`). A program sets one with `ctx.state.set('wing_door_open')`.
A flag is on, off, or (for the programs' own use) holds a value such as a stardate. Reading a message sets `read:<id>` and sending a
draft sets `sent:<id>` (the value is the stardate it was sent).

**Gated items.** Any item (doc, folder, program, gateway) can carry `"requires": ["flag", "!other"]`. While one of those is not
satisfied (a leading `!` means the flag must be off) the item does not exist for the player: it is not listed, its alias is refused,
and it has no page. Setting a flag rebuilds the tree. Every gated item that appears is announced when the program that set the flag
closes, as `> RECEIVED: [ALIAS]` (or its own `notice` text, with the start of the line in the `item_received` string). Author mode
ignores `requires` so the author sees everything. Set it in the item window (`REQUIRES`, comma separated) or `[SET REQUIRES]`.

**Programs in a folder.** A program is hidden by default and runs by its alias. Set it to listed (`"hidden": false`, or `[SHOW]`) and it
appears in its folder with the program glyph, `EXE` in the type column, and runs when clicked or typed. Each program chooses.

**INBOX.EXE** (`terminal-data/programs/inbox.js`, data in `terminal-data/mail.json`) is listed in the L3 root. It is the mail of the
account on Terminal 426: INBOX, SENT and COMPOSE tabs, the account on top, the list on the left and the open message on the right.

| In `mail.json` | What it does |
|---|---|
| `account` `{id, status, label}` | Who the account is. It is left unknown on purpose: `╳-███  UNVERIFIED`, drawn in the corruption color. Change it when it is decided. |
| `messages[]` `{id, box, from, to, date, subject, text}` | `box` is `in` or `out`. Inbox is newest first. Unread messages carry a `*` and count on the tab and in the window bar. |
| `requires` | The flags that must be on for the message or draft to exist (same rules as gated items). |
| `sets` | Flags set the first time the message is opened. This is how reading mail unlocks things. |
| `attach` | A list of log codes from `lore.json` (and `dev_logs.json` at L3). RECOVER adds the code to FETCH LOG's recovered list and shows the log. A level 3 entry is locked at L2. |
| `drafts[]` `{id, to, subject, text, reply_to?}` | Shown under COMPOSE (and as REPLY on the message named by `reply_to`). SEND sets `sent:<id>` and files it under SENT. A message that requires `sent:<id>` then arrives. |

The messages in `mail.json` are a provisional starting set (see the content notes): rewrite them freely, the program reads whatever is there.
