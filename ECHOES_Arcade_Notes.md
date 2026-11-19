# ECHOES: Arcade Edition (parked idea)

Notes for a possible digital spinoff of the board game that would run on the author's AtGames Legends Ultimate cabinet.
Written 2026-11-19. **Status: parked.** The author wants the tabletop rules settled first, so nothing here has been built.
This file keeps what was decided, what was checked and what is still unknown, so work can start cleanly later.

## Direction (decided so far)

- A **top-down, grid-based turn-based game**: characters take turns, with interactable environment elements (terminals, vents,
  lockers, ammo crates), as an adaptation of the board game, not a port of its physical parts.
- Target platform: **Game Boy Advance** first (the author's choice and mine). Genesis is the alternative. MAME is not a platform
  to target (it emulates many boards, so it would mean homebrewing for one specific arcade board).
- Art: **3rd-generation Pokémon** style (tile-based overworld, small characters in four directions, a separate screen for
  encounters), or something like **Medal of Honor: Infiltrator** on GBA.
- 2D top-down, not 3D. It reads clearly and keeps the motion-tracker, fog-of-war feel.
- Not before the tabletop rules are settled. The digital version should read its numbers from data, as the terminal does.

## The author's hardware

The **full-size Legends Ultimate**: 24 inch 1080p screen, two joysticks with six buttons each, two spinners, a trackball,
navigation buttons, one HDMI and two USB ports, Wi-Fi and Bluetooth. The author has already played GBA games on it. **Not yet known:
how they were loaded** (an add-on image on USB, or something built in), and the cabinet's firmware version.

## How a game gets onto the cabinet (what was found, 2026-11-19)

| Route | What is known | What is not |
|---|---|---|
| **Add-on image** (`.UCE` on a USB drive) | An unofficial community guide packs a LibRetro core (`.so`), the game files, box art, an XML file and an `exec.sh` into one file. It shows up under an Add-on filter in the Games menu. Tools exist for Linux and Windows. Saves live inside the image. | The guide was verified on firmware 3.0.19. Whether it works on the current firmware is unverified. The cabinet's CPU architecture is not known, so a compatible core build is not confirmed. |
| **Custom MAME games on USB** | Reported for the cabinet's MAME 2003 core. | Not useful for this project. |
| **External Apps and SDK** (AtGames) | An official page exists on `atgames.net`, said to be open to everyone. | The page could not be read (the host is not allowed in the cloud session). What an external app may be (web, native, emulated), and whether it can use the spinners and trackball, is unknown. |
| **ArcadeNet** | AtGames' storefront for licensed games. | Whether third parties can publish is unknown. It looks licensing-based. |
| **An external device on HDMI** (Raspberry Pi or a PC) | Reported to work, using the cabinet as screen and Bluetooth controls. | It would not appear in the cabinet's own menu. |

A **GBA ROM can only read GBA buttons**: the joystick as the d-pad and the buttons as A, B, L, R, Start and Select. How the cabinet
maps the spinners and trackball for emulated games is unverified, and a GBA game has no way to read them either way. Using them
would need a non-GBA build, which depends on the External Apps SDK.

## Why the rules fit a grid tactics game

From `rules.html` and `board-data/board.json`:

- 1 to 5 players, cooperative; 5 to 6 playable characters with a role and one or two passives.
- A turn is one player's Player Phase (2 Moves and 2 Actions) followed at once by that player's Creature Phase. Each player has their
  own Noise Tracker. The Creature Phase rolls a D12 Noise Die against it and resolves creature movement by a fixed table (half speed
  on a pass, or Direct Pursuit, Vent Shortcut or Immediate Vent), then Line of Sight Rush and any Creature Encounter.
- A 5 by D12 dice engine, combat with dice pools, a 120 card Echo Deck (planned), and fog of war (about 15 to 20 undiscovered rooms).
- The board data has 31 rooms with doors and walls, 22 room family definitions, 35 points of interest and a space count per room,
  so rasterizing rooms to a tile grid is natural. Room families are placed at random each game.

A good screen split, taken from both art references: a grid overworld for moving and acting, and a separate encounter screen (a fixed
first-person view with pre-drawn frames, or a battle screen) when the creature reaches a player or combat starts.

## Platform notes

- **GBA:** 240 by 160, ARM7TDMI at about 16.78 MHz, 256 KB of external work RAM plus 32 KB of internal, 96 KB of video memory,
  128 hardware sprites, ROMs up to 32 MB. Hardware windowing and alpha blending make fog of war and flashlight cones cheap. Precedent
  for grid tactics: *Fire Emblem* and *Advance Wars*. Tools: devkitPro (devkitARM), libtonc or the Butano C++ engine; mGBA to test.
- **Genesis:** 320 by 224, FM sound. Tools: SGDK. Precedent: *Shining Force*.
- **Medal of Honor: Infiltrator (GBA, 2003):** per [MobyGames](https://www.mobygames.com/game/33258/medal-of-honor-infiltrator/) and
  [GameZone](https://gamezone.com/reviews/medal_of_honor_infiltrator_gba_review/amp), an overhead 2D view for exploration with
  fixed-position first-person shooting sections, compared by reviewers to *Commando* and *Metal Slug*.

## What can be done in the cloud session (checked 2026-11-19)

- Installable from the system packages: `gcc-arm-none-eabi` 13.2 and mGBA 0.10.2 (`mgba-sdl`, `libmgba-dev`).
- **Not reachable:** `pkg.devkitpro.org` and `mgba.io`. Without devkitPro, Butano is out of reach; a plain compiler setup (or
  vendored libtonc) would be needed, or the host allowed in the environment's network settings.
- A headless mGBA runner (run a ROM, press keys, save screenshots for tests) looks possible with `libmgba-dev` but has not been tried.
- Nothing in the cloud can test on the real cabinet.
- I can generate placeholder tilesets and sprites within GBA limits (8 by 8 tiles, 16 color palettes) and look at them in screenshots.
  Polished pixel art and music need a person or dedicated tools.

## Tools worth having

Game code: devkitPro with Butano or libtonc (GBA), SGDK (Genesis). Emulator and debugger: mGBA (tile, sprite and map viewers).
Pixel art: Aseprite (paid), LibreSprite or Pixelorama (free). Maps: Tiled, or extend `dev-tools/board-editor.html`. Music: OpenMPT or
MilkyTracker (tracker modules the GBA sound engine plays). Cabinet packaging: the community add-on tool from the guide.

## What to settle in the tabletop rules first (digital readiness)

This also makes the tabletop rules clearer.

1. **Every number in a table**: noise per action, speeds, health, damage, dice pools, thresholds. Not only in prose.
2. **Creature behavior as an exact procedure**: how it picks a target, ties, what "half speed" rounds to, how it travels through doors
   and vents, and what blocks line of sight (diagonals, doors, other characters).
3. **Spaces and adjacency**: how spaces inside rooms work, whether diagonal moves are allowed, how vents connect.
4. **Turn flow as a state machine**: Reaction, Hiding, and the "no Move after Action 2" exceptions.
5. **Echo card effects as structured data**: trigger, condition and effect from a small fixed vocabulary, so about 120 cards can become
   data and not free text.
6. **Layout generation**: what is random in room family placement and which constraints it must follow.
7. **Objectives and difficulty**: the win and lose formulas, Objective Backlog Aggression, and the pending player-count scaling.
8. **Inventory and items** as lists with fixed fields.

## Risks

- **Scope:** a faithful game is large (characters, abilities, combat, inventory, the deck, creature AI, art, music). Plan a vertical slice first.
- **Rules still moving:** several rules sections are pending (prologue, scaling).
- **Reaching the cabinet:** the add-on route is unofficial and its current-firmware status is unverified.
- **Licensing:** check each emulator core's license before selling anything (some Genesis cores are reported to be non-commercial; this
  is unverified). Distribution through AtGames would need their terms.

## Plan when it is unparked

1. Settle the rules (the checklist above). Export the board and deck data in a stable form.
2. Start a **separate session and repo** for the spinoff, with its own environment (compiler and emulator installed, the devkitPro
   host allowed). This repo stays the source of truth for rules and board data. The sessions coordinate through `inter-session/` letters.
3. Build a **browser prototype** at 240 by 160 with GBA palette limits: one character, a handful of rooms from `board.json`, the move,
   action, noise and creature loop, and a few Echo cards.
4. Port the proven logic to GBA, test in mGBA (headless where possible), then on the cabinet.
5. Open questions to answer first: how the author loads GBA games on the cabinet; the cabinet's firmware; whether the External Apps
   SDK can run anything beyond emulated cores.

## Sources

- [AtGames Legends Ultimate (Wikipedia)](https://en.wikipedia.org/wiki/AtGames_Legends_Ultimate)
- [Stuff review](https://www.stuff.tv/review/atgames-legends-ultimate-review)
- [ReviewGeek: the cabinet as a modder's dream](https://www.reviewgeek.com/75848/review-the-atgames-legends-ultimate-arcade-cabinet-is-a-modders-dream/)
- [Community add-on image guide](https://github.com/FalkensMaze1983/ultimate_addon)
- [ArcadeNet announcement](https://www.newswire.com/news/atgames-announces-arcadenet-for-legends-ultimate-with-games-on-demand-21064101)
- [MobyGames: Medal of Honor: Infiltrator](https://www.mobygames.com/game/33258/medal-of-honor-infiltrator/)
