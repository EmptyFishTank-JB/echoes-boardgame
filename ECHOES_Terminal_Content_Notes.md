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

---

# Lore logs (`terminal-data/lore.json`)

Written 2026-11-11. The lore documents are treated as guidance, not as settled: where they disagree with each other
this section says so.

## Suggested edits to the two existing logs

Nothing here is applied. Both stay as they are until you decide.

**CAPTAIN'S LOG A-01 (2143.119.1719)**

| Line | Problem | Suggestion |
|---|---|---|
| "Fourteen months to the next supply ship." | There were only two supply ships, the second docked in 2109 (2109.201), and Mars has not answered since the reply office closed during its crossing. In 2143 no ship is coming and the crew knows nobody answers. | "Nearly thirty-four years since the last ship docked. Nobody on Mars has answered in all that time, and the reports still go out on schedule." It keeps the dread: "We have everything we need", said twice, now reads as a man counting what he has because nothing is coming. |
| "Morale is good — as good as it gets out here" | An em dash in an in-world document. | "Morale is good, as good as it gets out here, which is good enough." |

Everything else in A-01 holds. "The new research phase", the closed doors and the fourteen all match the Timeline, and the
day-one date matches the phase start.

**CAPTAIN'S LOG A-15 (2143.136.2132)**

Accurate. Osei's supplemental report, "Cross's department", "I've known Harlan Cross for eleven years" and "keep me informed"
all fit. The label number is the open point. Under the Log ID scheme below a log is named for its author, so the Captain's logs
would all read A-014 and the stardate tells them apart. A-01 and A-15 still carry their old numbers and old-style codes. They work
unchanged. To move them over, load each in the log editor, pick Capt. E. Harrow, press GENERATE and tick REPLACE THE OLD CODE.
That changes the code players type, so only do it if neither code has gone out yet.

Question for the signature: every log ends `    —— Name`, two em dashes. The prose rules say none outside interrupted
dialogue. The new logs keep the `——` attribution to match A-01, A-15 and the dev logs, and avoid em dashes in the text.
Drop the attribution dashes in all of them if you want the rule applied strictly.

## Log IDs, codes and the crew registry

A log's ID is the ID of whoever wrote it: a department letter and a three digit crew number, always three digits (`R-118`).
The number belongs to the person and stays with them, because reassigning one aboard the Charon is a slow process. Every log
a person files carries the same ID and the stardate tells them apart. Each department has up to 999 numbers.

- **The code carries the Log ID.** The 20 character code packs the moment (year to minute), the crew number and the department
  letter, scrambled with the project salt (`dev-tools/log-codes.js`). Codes made before departments existed carry no letter and
  read as number 1. They still decode and still work.
- **The registry is `terminal-data/crew.json`.** Departments (letter, name, usual log type) and crew (ID, name, signature, role).
  The editor's author list is built from it, and adding a character in the editor writes it back. Every ID in it is provisional
  until the department list is settled (`provisional: true`).
- **Dev logs use `D`.** `D-001` is the developer. The letter is reserved for the dev department (`"dev": true` in `crew.json`),
  and dev logs are never read in a lore context. Avoid `L` as a department letter, it reads like a level (L1, L2, L3).
- **One level notation.** The terminal and the editor write levels as `L1`, `L2`, `L3`. FETCH LOG.EXE runs at L2 (lore.json)
  and L3 (dev_logs.json), so the editor sets `clearance` to 2 for a lore log and 3 for a dev log and has no picker.
- **Condition.** Each log has a `health` of PARTIAL, DEGRADED or CORRUPTED, or none for INTACT. FETCH LOG shows it on the status
  line and in the RECOVERED LOGS list. Older entries that used `type: partial` still read the same way.
- **Override.** For a log filed with no valid ID (falsified, stripped or damaged), the editor can damage the ID, the stardate and
  the sign-off line at levels 0 to 3, seeded so the same log always shows the same gaps. The entry keeps `override.real` (the
  real ID, moment and sign-off) so the editor can restore it, and the code carries the real ID unless the ID level is 3
  ("no ID at all"), where the code carries none either.

## The new logs

Six logs, all `full`, all inside the incident window and on the day count (Day *n* is 2143.(118 + *n*)). I read "the 13" as
the research team of fourteen without Cross, and the logs use two of them plus four other crew. Names are invented, and so are
their crew numbers (provisional, see above). The codes are real, made with the project salt.

| Code | Log | Stardate (day) | Who | What it carries |
|---|---|---|---|---|
| `L1O7J-U38KD-IYXZ4-Y5G29` | RESEARCH LOG R-142 | 2143.126.0614 (Day 8) | Dr. R. Ibarra, Research Team | The third program he has worked in the wing. The closed doors are routine. Cross runs the floor. Osei thinks the baseline is too steady. |
| `LN5QJ-X2M7G-JKS6E-4X02I` | RESEARCH LOG R-157 | 2143.145.2250 (Day 27) | Dr. N. Haddad, Research Team | The fourteen sleep in the wing "for continuity". The readings "do not drift, they arrive and they stay". The lights dim on a schedule none of them set. |
| `QTI6N-J595F-ATCV7-THZ2F` | SECURITY LOG S-087 | 2143.149.0712 (Day 31) | Officer D. Whitlock, Security | Four went to the corridor outside the wing on a door alarm ECH/OES classed routine, two walked back. The cameras recorded the whole time and the corridor is empty on every frame. The ring is sealed. |
| `R7SY6-BA3LI-OBD0J-AXP03` | ENGINEERING LOG E-143 | 2143.150.2352 (Day 32) | M. Okonkwo, Engineering | Cross and six people at the aft hub with a written order. The cells are emptied by hand, a bank at a time, onto carts. He told her where they are going and asked her to put it out of her head. The reactor bus keeps the air, the lights that matter, the pods and the spin. |
| `WRY30-WJAXL-Q5U7U-9O61D` | MEDICAL LOG M-052 | 2143.152.0618 (Day 34) | Dr. A. Reyes, Medical Bay | The author of the triage record. Eleven forms with the same one word for the cause, "corridor". Blood for two days and a battery that outlasts it. Patients asking about the hubs. |
| `6RR68-2HTES-9EC73-G1K23` | POD BAY LOG O-066 | 2143.162.2205 (Day 44) | J. Park, Pod Bay Technician | Sector Seven bay: five pods, all away by 2140, the last released by the author. Six seats each, empty seats counted on the way out. The beacons are dark and three frightened people gave three reasons. |

The pod bay technician is on an Operations ID (`O-066`) because I was not sure about `P` for the pod bay. His log type is still
POD BAY LOG. Move him with the editor's EDIT button if you settle on a different department.

They pair with the archive documents. Reyes wrote the triage board (the document only says `DR. [CORRUPTED]`). Whitlock is the
security side of the Day 31 breach. The night of 2143.150 now has a sequence: Cross tells the Captain (2301), the protocol is filed
(2318), Okonkwo is at the aft hub (2352).

## Left unwritten on purpose

- The person in Cargo Bay C on 2143.181. The novel marks the occupant and the status as unknown, and "this terminal knows".
- The owner of the kit bag whose name tab has faded past reading.
- Garrett Keys. He was frozen in 2143 and the lore limits what he can know, so his entries are best written with you.
- Anything that says what the thing in the wing is.

## Inconsistencies in the lore documents

1. **When the transmissions were cut.** The Timeline, CLAUDE.md and the Technical Reference say 2143.151. The novel's pod bay display
   says `TRANSMISSION DISABLED: STARDATE 2143.159` and John says so in the dialogue. The archive documents use .151. The new logs
   avoid giving a date.
2. **Pod bays.** The Technical Reference places Pod Bays 1 and 2 in the forward hub and 3 and 4 in the aft hub. The Timeline says
   "Pod Bay 7". The novel says Sector 7, aft starboard, with the surviving four in Bay 3, Sector 2, mid-port. P-44 uses
   "Sector Seven bay".
3. **Supply ships.** Log A-01 says "fourteen months to the next supply ship". See the table above.
4. **Distance from port.** You already flagged the "five years from the nearest port" line in the crew quarters scene.
5. **The research team's size.** "Fourteen specialists, led by Dr. Harlan Cross" can mean fourteen plus Cross or fourteen including him.
   You wrote "13", which reads as the second. The logs do not say.
