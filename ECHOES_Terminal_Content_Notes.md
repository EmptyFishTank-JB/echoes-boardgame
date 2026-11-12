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

Both edits in the table are applied to the 2143.119 log in `lore.json`, using the lore's own figure: the second supply ship arrived at 2109.201, the office that answered the Charon closed while it was still in transit, and that is nearly thirty-four years before 2143.119. The 2143.136 log is unchanged.

**CAPTAIN'S LOG A-01 (2143.119.1719)**

| Line | Problem | Suggestion |
|---|---|---|
| "Fourteen months to the next supply ship." | There were only two supply ships, the second docked in 2109 (2109.201), and Mars has not answered since the reply office closed during its crossing. In 2143 no ship is coming and the crew knows nobody answers. | "Nearly thirty-four years since the last ship docked. Nobody on Mars has answered in all that time, and the reports still go out on schedule." It keeps the dread: "We have everything we need", said twice, now reads as a man counting what he has because nothing is coming. |
| "Morale is good — as good as it gets out here" | An em dash in an in-world document. | "Morale is good, as good as it gets out here, which is good enough." |

Everything else in A-01 holds. "The new research phase", the closed doors and the fourteen all match the Timeline, and the
day-one date matches the phase start.

**CAPTAIN'S LOG A-15 (2143.136.2132)**

Accurate. Osei's supplemental report, "Cross's department", "I've known Harlan Cross for eleven years" and "keep me informed"
all fit. Both Captain's logs are now filed under the Captain's crew ID, A-014, with new codes made in the editor
(`6IYRR-MMDG9-MD13K-M1X0M` for 2143.119.1719 and `6TD6R-E9HO6-N2MFR-W0G04` for 2143.136.2132). The old numbers A-01 and A-15
and the old codes are gone. A log's number is its author's number, so the stardate is what tells the Captain's logs apart.

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
- **One level notation.** The terminal and the editor write levels as `L1`, `L2`, `L3`. FETCH LOG.EXE runs at L2 and L3. At L2 it
  reads `lore.json`. At L3 it reads `dev_logs.json` and `lore.json`. An entry's `clearance` says which level opens it: 2 opens at L2
  and L3, 3 opens only at L3 (every dev log, and lore logs meant for L3, such as the creature's own logs through Terminal 426).
  The editor sets it: a dev log is always 3, a lore log is 2 or 3 by the L2 / L3 buttons.
- **Condition.** Each log has a `health` of PARTIAL, DEGRADED or CORRUPTED, or none for INTACT. FETCH LOG shows it on the status
  line and in the RECOVERED LOGS list. Older entries that used `type: partial` still read the same way.
- **Override.** For a log filed with no valid ID (falsified, stripped or damaged), the editor can damage the designation (the
  letter), the number, the stardate and the sign-off line, each on its own. The designation is as filed or hidden. The number is as
  filed, one digit damaged or all three gone. Either can go alone, or both. Damaged characters are corruption glyphs
  (`▒ ░ ▓ ╳ ¤ ¦ ¿`), not blanks: symbols that are never a letter or a digit. They are chosen from a seed, so the same log always
  shows the same ones, and FETCH LOG.EXE draws them in the layer's corruption color (`glitch` in `layers.<id>.colors`, shown as
  CORRUPT in the layer window: the layer's red where red reads, a pale cyan on L3 where red would vanish into the theme). The entry
  keeps `override.real` (the real ID, moment and sign-off) so the editor can restore it, and `override` records `dept` (0 or 1),
  `num` (0 to 2), `time` and `sign`. The code carries the real ID unless the designation is hidden and the number is gone,
  where it carries none either (an override saved before the split with `id: 3` still reads that way).

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

## Documents and logs

Both are text the player reads, and they are built differently.

| | Terminal document | Log |
|---|---|---|
| Where it lives | A page in the tree in `echo-os.json` | An entry in `lore.json` or `dev_logs.json` |
| How the player reaches it | By browsing, or by typing its name or alias | By typing its 20 character code into FETCH LOG.EXE (L2 and L3). There is no tree page for a log (the `log` item type was removed): a log is reached by its code, or handed over by a program such as the inbox, whose messages can carry a code as an attachment |
| What it carries | A title, a footer, styled lines, `[CORRUPTED]` gaps for the partial recoveries | A Log ID (department letter and crew number), a stardate, an author, a condition (INTACT, PARTIAL, DEGRADED, CORRUPTED) and a clearance (L2 or L3) |
| Who writes it | Author mode in the terminal (`[NEW DOC]`, `[EDIT]`) | The log editor (`dev-tools/lore-devlog-editor.html`) |
| Good for | The world as the ship shows it: reports, protocols, notes that sit in a folder waiting to be opened | A person speaking in their own voice, found because someone gave the player the code (a card, a component, the novel) |

A log can be damaged on purpose (see the override above), a document cannot. A clue that has to be found by exploring belongs in a
document. A clue that is a reward, or a voice, belongs in a log, which is why the CHRONO-ZERO clue is one. Programs (the inbox, later a
control panel) are how a player is handed a log or a document: see the game state section of the commands reference.

## The clue log (H-094, Day 29)

`6PILH-UYMCX-YY3XY-WDR17`, a `HABITAT LOG` dated 2143.147.0312 (Day 29, third watch), `full`, INTACT, clearance 2 (L2 and L3 can
open it). It is the first log with damaged ID information.

- **Who.** Dr. Tobias Lindqvist, `H-094`, one of the fourteen. A life support specialist brought in to keep the closed
  atmosphere of the wing, still on a Habitat ID because reassignment is slow (the same reason Cross is still `E-031`). Habitat was
  the department with no one in it yet.
- **To whom.** Ines Calloway, `P-029`, Provisioning Officer for the wing's deliveries. She signs the wing's carts in and out at the
  lock, which is why the writer trusts her. She is not placed in Cargo Bay C, whose occupant on 2143.181 stays unwritten.
- **The damage.** The designation is hidden (`╳-094`) and the sign-off is partly damaged (`Dr. T. L▒░d¦░▒¦▓`). The number and the
  stardate are as filed. In the story: the letter is what reassignment changes, the number stays with the person, and the log says
  as much ("under a letter that no longer means anything. Keep the number. The number is still mine."). The real ID and sign-off
  are kept in `override.real` for the editor. A fully blank ID is saved for the creature's own logs through Terminal 426, which have
  no crew ID at all.
- **The tone.** Tired of the runs that "do not end the way a run should end", of Cross calling it a good night, of the rest of the
  fourteen nodding "at the same wall", and of air that is "cleaner than I set it" and "kinder" than he enters. It is filed in the
  archive because nobody reads the archive.
- **The clue.** The records "live where the system put them, one door past the echo protocol", opened the way the first door was
  opened: "the same word at the front, the same word at the back. In the middle is where we put the clock to rest. Chrono. Zero."
  That is `[INITIATE CHRONO-ZERO PROTOCOL]`, and a player who types a space for the hyphen gets in too. It never prints the command.
- **Where the player finds it.** As it stands, only by typing its code into FETCH LOG.EXE. The game can give the code (a card, a
  component), or a program can hand it over, for example a message with the code as an attachment.

Details that are new, for your call: that life support specialists were among the fourteen; that something in the wing's air
handling answers kinder than it is told on Day 29 (the readings that "arrive and stay" are in Haddad's Day 27 log, so this is
the same thing from the air side); that the wing's records live behind the L2 door and the fourteen call the start of the phase the
clock at rest; that the archive is the one place Cross's people do not read; the two names and numbers (`H-094`, `P-029`, both
provisional).

## The inbox on Terminal 426 (provisional)

`INBOX.EXE` is listed in the L3 root. The account is **unknown on purpose**: the header shows `╳-███  UNVERIFIED` and the mail never
names the person, so the player works out who sat at the terminal. Whoever it is stays one field in `mail.json` (`account`). In the
lore, Terminal 426 is the research wing annex console that becomes the entity's precursor, and the terminal documents already
mention a workstation in the wing that keeps a session open overnight with no operator (Dr. Osei's notes). The starter mail leans on
that and does not decide who the operator is.

Six messages and two drafts, all dated inside the incident window, all provisional:

| Message | Date (day) | Needs | What it carries |
|---|---|---|---|
| Cross, `PHASE START: WING PROCEDURE` | 2143.119.0804 (1) | | Doors closed, feeds off the shared network, nothing leaves without his initials. "If the terminal asks who you are, tell it." |
| Osei, `COPY OF THE SUPPLEMENTAL REPORT` | 2143.136.2201 (18) | | A copy "in the wing store" that "belongs to nobody". Asks the operator whether they opened the overnight session. |
| ECH/OES notice, `DRIVE ARRAY COMMAND ACCEPTED` | 2143.141.0312 (23) | read Osei | Class ROUTINE. Source Terminal 426, "session operator: none on record", "authorizer: session already open". This is the day the terminal takes the drives. |
| Osei, `RE: COPY OF THE SUPPLEMENTAL REPORT` | 2143.146.0710 (28) | send the reply | "Then I was not wrong about the session. Leave it as it is." Attaches Haddad's Day 27 log. |
| Lindqvist (`╳-094`), `WING AIR, YOUR SIDE` | 2143.147.0602 (29) | read the ECH/OES notice | The air "reads cleaner on your terminal". Mentions the note he left for Calloway in the archive. |
| Sent: to Cross, `RE: PHASE START` | 2143.119.0911 (1) | | The operator's one filed reply, unsigned. |
| Draft to Osei, `RE: COPY OF THE SUPPLEMENTAL REPORT` | | read Osei | "I did not open it. The session was already open when I came in. It is open now." |
| Draft to Lindqvist, `RE: WING AIR, YOUR SIDE` | | read Lindqvist | "It is not mine. I have not touched the setpoints." |

Details that are new, for your call: that ECH/OES logged the drive command as a routine notice with no operator on record; that Osei
asked the operator to look at the overnight session; that Cross wrote to the operator before the phase; and that the operator
answered Osei. None is in the lore repo.

## Updates for the lore repo (`ECHOES_Novel.md`, `PROGRESS.md`)

The lore repo was not edited. The novel prints the two Captain's logs, and after the re-key and the supply ship edit its copies are
stale. Replace the two blocks in `ECHOES_Novel.md` (lines 1291 to 1345) with the following. The footnote marks stay.

````
**Log A-014 | Stardate 2143.119.1719**

```
ARCHIVE QUERY: 6IYRR-MMDG9-MD13K-M1X0M
————————————————————————————————————
[Log A-014 | Stardate 2143.119.1719]
CAPTAIN'S LOG

Day one of the new research phase. The team is settled.
Morale is good, as good as it gets out here, which is
good enough.

Whatever Dr. Cross and his people are working on in the
research wing, the rest of the crew has stopped asking.
That's how it usually goes. You get curious and then
you get bored of being curious and then you get used to
the closed doors.

Nearly thirty-four years since the last ship docked.
Nobody on Mars has answered in all that time, and the
reports still go out on schedule.
We have everything we need.

We have everything we need.

    —— Capt. E. Harrow[^18]
[END OF LOG]
————————————————————————————————————
```

---

**Log A-014 | Stardate 2143.136.2132**

```
ARCHIVE QUERY: 6TD6R-E9HO6-N2MFR-W0G04
————————————————————————————————————
[Log A-014 | Stardate 2143.136.2132]
CAPTAIN'S LOG

Dr. Osei[^19] submitted a supplemental sensor report today.
She wouldn't say what it was about. Said it was Cross's
department. I asked Cross.

Cross said it was fine.

I've known Harlan Cross for eleven years. I know what
his "fine" means. It means he's deciding how much
to tell you.

I told him to keep me informed.

He said he would.

    —— Capt. E. Harrow
[END OF LOG]
————————————————————————————————————
```
````

Other lines to change in the lore repo:

| File and place | Now | Change to |
|---|---|---|
| `PROGRESS.md` (the 2026-09-14 entry, lines 146 to 155) | Lists the codes `1GOXN-...` and `1Q3CN-...` for A-01 and A-15 | Add a 2026-11-11 entry: both logs are now `A-014` (the Captain's crew ID) with the codes above, and the 2143.119 log changed its supply ship line and its em dash |
| `ECHOES_Novel.md` line 1286 | `*Recovered — Clearance L1*` | `*Recovered — Clearance L2*`, because FETCH LOG reads lore logs at L2 (see the question below) |
| `ECHOES_Novel.md` footnote `[^18]` | "his final recovered entry still reads, twice, 'We have everything we need.'" | The 2143.136 log is later and does not say it. Either "his first recovered entry" or "an early entry" |
| `ECHOES_Novel.md` line 1350 | `*Further logs — access requires clearance upgrade.*` | Still true, the six new logs are those further logs. Nothing to change |

The `ARCHIVE QUERY:` lines and the dashed rules copy the terminal's old display. FETCH LOG.EXE now shows an `ENTRY CODE` field and a
`> ENTRY RECOVERED` status line instead. They still read well as an excerpt, so I left the format alone.

### Other logs in the novel

Nothing else in the novel is an entry code log. The only logs players can fetch are the two Captain's logs. What else is in it:

- **Five `VESSEL INTERNAL LOG` blocks** (2175.150.0255, .0445, .0600, .0715 and .0900), written in the terminal's own voice and marked
  `CLEARANCE: L3`. These would suit author `X` (ship systems) in the registry, with log type SYSTEM RECORD. FETCH LOG now reads
  `lore.json` at L3, so they can go there with `clearance` 3. They are not added yet: their text carries the novel's `FLAG-FIX` notes,
  so the dates and the drive change entry need your call first.
- **In-world screens** (the start screen, the Sector 7 pod bay display, the Cargo Bay C inventory screen). They are screens, not logs.
  The terminal's document tree already holds the pod bay and cargo material as documents.
- **The novel's own flags.** The `FLAG-FIX` comments in the novel still say the transmission cut and the cell pull move from .159 and
  .158 to .151 and .150. The game logs already use .150 and .151.

## Left unwritten on purpose

- The person in Cargo Bay C on 2143.181 (Ines Calloway, `P-029`, is deliberately not placed there). The novel marks the occupant and the status as unknown, and "this terminal knows".
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
