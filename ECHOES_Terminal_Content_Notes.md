# ECHOES O.S.: Archive Content Notes

What the in-world documents in `terminal-data/echo-os.json` say, where each detail comes from, and which
details are new and need the author's ruling before they are treated as canon. Written 2026-11-10.
Source of truth for the story is the lore repo (`Echoes-Lore`); nothing here changes it.

## What the documents assume about the voyage

- **This is one research phase among many.** The *Charon* left Mars in 2093 and has carried several research
  programs at once for fifty years, compartmentalized as a matter of routine (the novel's 2143 section says so).
  The sealed phase that begins 2143.119 is the "new research phase" of Captain's Log A-01. It is not the first
  experiment. Dr. Osei has worked on the wing for years, the closed doors are normal, and the Captain let this phase keep
  its doors closed "like the others". The fourteen were brought aboard for this work and had been aboard long enough to be
  known, so nothing reads as their first week.
- **Nobody on Mars has answered in years.** The company closed the office that read the *Charon*'s traffic while Supply
  Ship 2 was still crossing, so the last ship arrived from an organization that had stopped replying (novel, 2143 backstory;
  Technical Reference 8B). The crew knows only that replies stopped. The Communications Intercepts therefore carry no live
  contact: the Comms Officer's note says nobody has answered since the second ship docked and sends anyway, and the machine
  line reads `INBOUND MESSAGES SINCE 2109: NONE`. Nothing in the documents depends on Mars reading anything.

## Day count

The documents count days of the 2143 phase. Day 1 is 2143.119 (Captain's Log A-01, "Day one of the new research
phase"). Day *n* is 2143.(118 + *n*). In-world the count is "the research phase" count the Captain's office started, and
the Emergency Protocol gives its review date as a stardate as well.

| Day | Stardate | Event in the lore |
|---|---|---|
| 1 | 2143.119 | Research phase begins |
| 15 | 2143.133 | An experiment goes wrong |
| 18 | 2143.136 | Dr. Osei's supplemental sensor report (Log A-15) |
| 23 | 2143.141 | Terminal 426 takes the drives |
| 30 | 2143.148 | It manifests |
| 31 | 2143.149 | CONTAINMENT BREACH, the existing document |
| 32 | 2143.150 | Cross pulls the primary cells. Last human session at the Operations Center |
| 33 | 2143.151 | Transmissions cut |
| 34 | 2143.152 | MEDICAL TRIAGE |
| 41 | 2143.159 | EMERGENCY PROTOCOL review date |
| 44 to 46 | 2143.162 to .164 | The pods launch |

The old document titles (Day 31, 34, 41) land on these dates without any adjustment, which is why the day count
is built this way.

## The documents

All are tier 1 partial recoveries (`[CORRUPTED]` gaps, closing line `FURTHER DATA REQUIRES DEEPER ARCHIVE ACCESS`)
so the fuller versions can arrive later through entry codes at tier 2 and tier 3.

| Document | Where | Listed? | What it carries |
|---|---|---|---|
| `[MEDICAL TRIAGE — DAY 34]` | Incident Reports | Yes | Triage board from the medical bay on its own battery, off the network, after the cells went. Falls on the spoke climbs. Eleven intake forms with the cause written as "corridor". Blood products running out. |
| `[EMERGENCY PROTOCOL — DAY 41]` | Incident Reports | Yes | Filed from the Operations Center on 2143.150.2318, the last session. Closes the Operations Center, records the cell move under the Chief Engineer's authority, sets a Day 41 review, then opens the pod bays to all if conditions have not improved. One hundred and twenty seats, seats not assigned, no one ordered in or out, beacon settings corrupted, copies posted by hand because the address system is down with the cells. |
| `[CAPTAIN'S PRIVATE LOG]` | Restricted Files | No (type it) | Capt. Harrow, 2143.150.2301, the same night. Eleven years with Cross. Cross told him what he meant to do with the cells and he let him. Osei came to him on Day 30. The wing has always kept its doors closed and he let this phase keep them closed like the others. He wrote on Day 1 that they had everything they needed and believed it. Nearly nine hundred people, one hundred and twenty seats. |
| `[RESEARCH NOTES — DR. OSEI]` | Restricted Files | Yes | Dr. Aisha Osei, four recovered entries (Days 6, 15, 18, 25). Baseline for the new phase, on the same calibration sources she has used on the wing for years. Wing feed taken off the shared network, compartmentalized "like the last programs". Run fourteen of the phase ends early with no trip in the shielding log. Her supplemental report copy "belongs to nobody". A workstation in the wing keeps a session open overnight with no operator, which no earlier program ever did, and the readings change when it is active. |
| `[COMMUNICATION INTERCEPTS]` | Restricted Files | Yes | Flagged traffic 2143.148 to .151, every entry classed routine by ECH/OES. Internal channel fragments, a manual outbound entry from the Comms Officer that is sent knowing nobody answers, and the transmitter disabled on local backup with the authorizer corrupted. |

## Details that are new (the author's call)

These are in the documents and not in the lore. Cut or confirm each one.

1. **Dr. Osei's first name is Aisha** (from the author, not yet in the lore repo).
2. **The Day count itself** (Day 1 is 2143.119). It is derived from Log A-01 and fits the other dates, but the lore never states it.
3. **Medical power.** The bay runs on a local battery and is off the network after the cells went. This fits the isolated medical unit planned for Garrett Keys.
4. **The Operations Center is closed by the Captain's protocol** on the last session, which is why nobody uses the terminal again.
5. **The Day 41 review.** The pods open on a review date, three days before the first launch. The lore only says they launched 2143.162 to .164.
6. **Pod beacon settings are `[CORRUPTED]`.** The lore says the pods left with no beacon but gives no reason. The document does not give one either.
7. **A manual outbound message went out on 2143.150** from the Comms Officer, knowing nobody answers. The lore says the vessel kept transmitting into an empty queue, so this fits, but it is the first hint that a person tried to send something during the crisis. Its text is `[CORRUPTED]`.
   **Replies stopped by 2109.** The documents say nothing has been answered since the second ship docked and give the inbound count as none since 2109. The lore fixes the closure inside the 2106 to 2109 crossing, so the exact year of the last reply is open.
8. **The Captain's last night is 2143.150.2301 and 2318.** The lore fixes the date (the night the lights went out) and not the hour.
9. **Osei's "session with no operator"** is deliberately unnamed. It can be read as Terminal 426 and it never says so. Where 426 sits (a lab office in the Research Wing annex is the lore's working idea) is untouched.
10. **No document says what the creature is.** Everything about it is "it", "the corridor" or `[CORRUPTED]`.

## Prose rules applied

No em dashes in document text (titles keep the existing `—` in item names), numbers spelled out in narrative
text and numerals for stardates and readouts, no "not X but Y" constructions, no warmth from the machine voice.
