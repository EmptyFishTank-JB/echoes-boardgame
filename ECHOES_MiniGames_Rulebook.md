# ECHOES
## Official Rulebook — Echo Deck Mini-Games

# Echo Deck Mini-Games

Certain cards in the Echo Deck are marked as Echo Events. When drawn, an Echo Event interrupts the current action — whether a room discovery or a terminal interaction — and must be fully resolved before play continues. The ship does not wait.

Echo Events cost no additional actions to resolve. However, they cannot be ignored. Every Echo Event requires the active player to place a wager before any dice are rolled.

## Universal Rules

**The Wager**

Before resolving any Echo Event mini-game, the active player must stake one resource from their personal inventory. Any resource type may be wagered unless the specific mini-game states otherwise.

> **IMPORTANT:** If the active player has no resources available, the mini-game is an automatic failure. The player receives +4 Noise and immediately continues to the next card draw. No rolls are taken.

If a crewmate wishes to cover the active player's wager, they must be physically present in the same room as the active player at the moment the Echo Event is triggered. Resource donations are not permitted across rooms or at a distance.

**Winning and Losing**

- **WIN:** The wagered resource is returned to the active player. Some mini-games award an additional resource of the same type, effectively doubling the wager. See each mini-game's specific rules for payout details.
- **FAIL:** The wagered resource is permanently removed from the game. A Noise penalty is applied to the active player's Noise Tracker. See each mini-game for the specific penalty.

**After Resolution**

Once an Echo Event is fully resolved — win or lose — the active player must still satisfy the original action that triggered the draw. If the Echo Event was drawn during room discovery, the player draws again to populate the room. If drawn during a terminal interaction, the terminal interaction continues.

---

# MINI-GAME 01 — Pressure Leak

*The hull groans. A seal somewhere in this section has given way and atmosphere is bleeding into the void. You have seconds to choose how hard you push the repair — and how much you're willing to risk.*

**Dice Used:** Two D6 — one designated Champion Die, one designated Opposing Die.

## Overview

Pressure Leak is a risk-selection mini-game. Before any dice are rolled, the active player selects a Tier that determines both the ceiling of their Champion Die and the difficulty of the roll. Choosing a lower Tier increases the reward potential but dramatically reduces the odds of success. The player commits to their chosen Tier before rolling and may not change it afterward.

## The Tiers

Six Tiers are printed on the Echo Event card, color-coded from red (most dangerous) to green (safest). The Tiers represent the maximum value the Champion Die may show in order to count as a valid result.

To win, the Champion Die must meet two conditions simultaneously:

- The Champion Die result must be equal to or higher than the Opposing Die result.
- The Champion Die result must be equal to or lower than the chosen Tier ceiling.

If either condition is not met, the roll is a failure for that attempt.

## Tier Reference

| Tier | Color | Die Ceiling | Notes |
|---|---|---|---|
| Tier 6 | Green | 1–6 | Safest option. Champion Die may be any value as long as it beats or matches the Opposing Die. |
| Tier 5 | Yellow-Green | 1–5 | If Opposing Die rolls a 6, the roll is an automatic failure. |
| Tier 4 | Yellow | 1–4 | Champion Die must land between 1 and 4 and still beat the Opposing Die. |
| Tier 3 | Orange | 1–3 | Significant risk. Champion Die limited to 1, 2, or 3. |
| Tier 2 | Red-Orange | 1–2 | High danger. Champion Die must be 1 or 2 and match or beat the Opposing Die. |
| Tier 1 | Red | 1 only | The Jackpot. Both dice must roll a 1. Extremely rare. |

## Outcomes

The player has a maximum of 3 rolls to satisfy their chosen Tier conditions. If the active player meets their Tier conditions on any roll, the mini-game is immediately won. If all 3 rolls are exhausted without meeting the conditions, the mini-game is failed.

| Outcome | Condition | Consequence |
|---|---|---|
| WIN | Champion Die meets Tier conditions on any roll | Wagered resource returned. Reward determined by Tier chosen — higher risk Tiers yield greater returns. |
| FAIL | 3 rolls exhausted without meeting Tier conditions | Wagered resource lost. Noise penalty applied based on chosen Tier. |

---

# MINI-GAME 02 — Pull the Fuse

*Sparks cascade across the junction box. Six fuses, all live, and the whole grid threatening to blow. You have three chances to shut them down before the surge tears through the bulkhead.*

**Dice Used:** Two D6 — designated Red Die and Blue Die.

## Overview

Pull the Fuse is a puzzle-solving mini-game. Six fuses — numbered 1 through 6 — are printed on the Echo Event card. The active player has a maximum of 3 rolls, called Pulses, to shut all six fuses. Each roll generates values that can be applied to fuses in multiple ways. The game ends immediately when all fuses are shut or when the 3rd Pulse is exhausted.

## Reading the Dice

On each Pulse, the active player may shut fuses using any combination of the following methods. All three methods may be used on the same roll.

- **Individual Values:** Each die's face value shuts the fuse matching that number. A roll of 2 and 5 can shut fuses [2] and [5].
- **Sum:** The combined total of both dice shuts the fuse matching that number. A roll of 2 and 5 can shut fuse [7] — however, since fuses only go up to 6, only totals of 6 or lower are valid.
- **Difference:** The larger die minus the smaller die shuts the fuse matching that result. A roll of 2 and 5 can shut fuse [3].

A single roll of 2 and 5 therefore offers the following fuse options: [2], [5], [7 — invalid], and [3]. The player shuts whichever of these are still open.

## System Surge — Doubles

If both dice show the same number, a System Surge occurs. The player shuts the fuse matching the rolled number as normal, and may additionally shut one extra fuse of their choice from any remaining open fuses.

## The Fail Condition

If a roll produces values that cannot be applied to any remaining open fuse — meaning every value derived from that roll corresponds to a fuse already shut — the mini-game immediately fails. The player does not need to wait for the 3rd Pulse.

## Outcomes

| Outcome | Condition | Consequence |
|---|---|---|
| WIN | All 6 fuses shut within 3 Pulses | Wagered resource returned plus one additional resource of the same type. |
| FAIL | Any fuse remains open after 3rd Pulse, or a roll cannot be applied to any open fuse | Wagered resource lost. Add +1 Noise to the Noise Tracker for each fuse that remains open at the time of failure. |

---

# MINI-GAME 03 — Dead Reckoning

*The targeting system flickers. A grid of coordinates scrolls across the display. You have one shot to lock in the right position before the window closes.*

**Dice Used:** Two D6 — designated Blue Die (row) and Red Die (column).

## Overview

Dead Reckoning is a coordinate-betting mini-game. A three-by-three grid is printed on the Echo Event card. Rows are labeled by Blue Die ranges along the left edge. Columns are labeled by Red Die ranges along the bottom edge. Before rolling, the active player places their wager token on a single cell of the grid. One roll determines the outcome.

## The Grid

Each cell on the grid represents a coordinate formed by a Blue Die range and a Red Die range. The ranges are as follows:

- Rows (Blue Die): 1–2 / 3–4 / 5–6
- Columns (Red Die): 1–2 / 3–4 / 5–6

The active player selects one cell and places their wager token on it before rolling. The cell cannot be changed after the wager is placed.

## Rolling and Reading the Result

Both dice are rolled simultaneously. The Blue Die result determines the row. The Red Die result determines the column. These two values form the rolled coordinate, which is then compared to the player's chosen cell.

## Outcomes

| Outcome | Condition | Consequence |
|---|---|---|
| Direct Hit | Rolled coordinate matches chosen cell exactly (both row and column) | Wagered resource returned plus one additional resource of the same type. |
| Partial Hit | Rolled coordinate matches either the row OR the column of the chosen cell, but not both | Wagered resource returned. No bonus. |
| Miss | Rolled coordinate matches neither the row nor the column of the chosen cell | Wagered resource lost. +2 Noise added to the Noise Tracker. |

---

# MINI-GAME 04 — Cascade Failure

*The reactor coolant is venting. Warning indicators trip one after another across the panel in a chain you can barely keep up with. Every second you spend stabilizing makes the next problem worse. At some point, you have to decide: enough, or one more push?*

**Dice Used:** Two D6 rolled together each Pulse.

## Overview

Cascade Failure is a push-your-luck mini-game with escalating risk. The active player rolls both dice and adds the sum to a running total. They may continue rolling up to a maximum of 3 rolls — called Pulses — or stop voluntarily once certain thresholds are met. Stopping at the right moment is as important as rolling well. Going too far can turn a winning position into a catastrophic failure.

## The Pulses

At the start of each Pulse, the active player rolls both dice and adds the sum to the running total. After each Pulse, they assess their total against the thresholds below and decide whether to stop or continue.

> **IMPORTANT:** The active player must declare their intention to stop BEFORE rolling the next Pulse. A player may not roll and then retroactively claim a partial win. The decision to stop must be made while the dice are still in hand.

## Thresholds

| Outcome | Condition | Consequence |
|---|---|---|
| Full Win | Running total is 18–21 | Wagered resource returned plus one additional resource of the same type. Player may stop or was forced to stop by reaching 3 Pulses. |
| Partial Win | Running total is 14–17 and player voluntarily stops | Wagered resource returned. No bonus payout. |
| Overload | Running total exceeds 21 | Automatic failure regardless of remaining Pulses. See Fail consequences below. |
| Fail | 3 Pulses exhausted without reaching 14, or Overload triggered | Wagered resource lost. +3 Noise added to the Noise Tracker, plus +1 additional Noise for each Pulse in which either die showed a 1. |

## The Live Wire — Rolling a 1

Cascade Failure punishes hesitation. On any Pulse in which either die shows a result of 1, the system destabilizes slightly. Add +1 Noise to the Noise Tracker immediately, regardless of whether the overall mini-game is won or lost. This Noise is applied the moment the die is read and cannot be avoided.

## Strategy Note

A player sitting at a total of 14 after the first Pulse faces a genuine decision. The average sum of two D6 is 7, meaning a second roll is likely to push into full win territory — but it could just as easily trigger an Overload. There is no safe play once the dice are in motion.

---

# MINI-GAME 05 — Dead Signal

*Static. Then something beneath it — a pattern, a rhythm, almost like a voice. The frequency is fragmenting. You lock in the coordinates and try to hold the signal long enough to confirm it. Whatever is transmitting out there, it knows you're listening.*

**Dice Used:** Two D6 rolled together each Pulse.

## Overview

Dead Signal is a sequential-matching mini-game with a memory component. At the start of the mini-game, the active player rolls both dice to establish two Signal Values. These values are locked for the entire mini-game and must be noted. The player then has up to 3 Pulses to roll both dice and match both Signal Values across the two dice simultaneously. Partial progress carries between Pulses.

## Establishing the Signal

Before the first Pulse, the active player rolls both dice. The result of each die becomes one of the two Signal Values. These values are fixed for the duration of the mini-game. Record them openly so all players can track progress.

*Example: A roll of 3 and 5 establishes Signal Values of [3] and [5]. The player must now match both a 3 and a 5 across their two dice within 3 Pulses.*

## The Pulses

On each Pulse, the active player rolls both dice and compares the results to the remaining unconfirmed Signal Values.

- If both dice match both remaining Signal Values (in any order), the signal is confirmed. The mini-game is immediately won.
- If one die matches one unconfirmed Signal Value, that value is confirmed and marked. Only the remaining unconfirmed value needs to be matched on subsequent Pulses.
- If neither die matches any unconfirmed Signal Value, the Pulse is wasted. No progress is made.

Confirmed Signal Values remain confirmed between Pulses. Progress is not reset between rolls.

## Outcomes

| Outcome | Condition | Consequence |
|---|---|---|
| WIN | Both Signal Values confirmed within 3 Pulses | Wagered resource returned plus one additional resource of the same type. Place 1 Data Token at any terminal or data point in any already-discovered room. The active player must navigate to that location and be adjacent to the terminal or data point to retrieve it using a standard data extraction action. |
| FAIL | 3 Pulses exhausted with one or both Signal Values unconfirmed | Wagered resource lost. +2 Noise per unconfirmed Signal Value (maximum +4 Noise if neither value was confirmed). The creature immediately advances +1 space toward the active player, regardless of whether it is currently dormant or active. |

## The Creature Advance

The +1 creature advance on failure is applied immediately after the Noise penalty. If the creature is dormant, it shifts one space closer to the active player's current position. If the creature is already active and in motion, the advance is applied on top of its normal movement during the upcoming Creature Phase. The creature does not discriminate — any player caught in its path or line of sight during this advance is subject to the standard line of sight rules.

---

# Quick Reference — All Echo Events

The following table summarizes all five Echo Event mini-games for fast reference during play.

| Mini-Game | Type | Max Rolls | Win Payout | Fail Noise |
|---|---|---|---|---|
| Pressure Leak | Risk Selection | 3 | Wager returned + Tier reward | Varies by Tier |
| Pull the Fuse | Puzzle Solving | 3 Pulses | Wager doubled | +1 per open fuse |
| Dead Reckoning | Coordinate Bet | 1 | Wager doubled (Direct Hit) | +2 Noise (Miss only) |
| Cascade Failure | Push Your Luck | 3 Pulses | Wager doubled (18–21) | +3 + 1s rolled |
| Dead Signal | Sequential Match | 3 Pulses | Wager doubled + Data Token | +2/+4 + Creature +1 |
