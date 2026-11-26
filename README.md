# The Rag Army

A lane battler about an army of rag dolls. Your quilted keep stands on the left end of a long floating island, the foe's Fray Spire on the right. Spend scrap to send rags down the lane, grow your loom so scrap comes faster, fire the spool cannon when it's charged, and knock the spire down before the Frayed reach your keep.

It's an **original** game in the lane-battler genre. Every rag, foe, stage, name and piece of art is its own; only the genre's mechanics are shared. It uses the UI look of **Rag Toss** and **Element Rag** (flat ink panels, cut corners, one lime accent, Rubik). The rags fuse two character styles: Element Rag's chunky flat mannequin (thick round limbs, no outlines, accent cuffs, a headband with trailing tails) and On Two Feet's cloth doll (sphere head, two glowing oval eyes, visible stitches, a scarf).

It's pure HTML5 and vanilla JS (ES modules), with no build step and no dependencies. All art is drawn in code and every sound is synthesized.

To play, serve the folder (for example `python3 -m http.server`) and open `index.html`. ES modules don't load from `file://`.

## Controls

| Input | Action |
| --- | --- |
| Tap a rag card, or `1` to `0` | Deploy that rag |
| Loom button, or `Q` | Upgrade the loom (faster scrap, bigger wallet) |
| Cannon button, or `E` / `Space` | Fire the cannon once it's charged |
| `F` | Battle speed (1x / 2x, or 3x with Quickstep) |
| `P` / `Esc` | Pause |
| Drag, mouse wheel, or `A` / `D` | Look along the lane (the camera follows the front line otherwise) |

## Battle systems

- **Scrap and the loom.** Scrap trickles in and drops from every foe you defeat. The loom has 8 levels; each one raises the scrap rate and the wallet cap. Upgrade costs scale with the stage's cost multiplier.
- **Deploying.** 10 lineup slots, each with a scrap cost and a recharge. Up to 50 rags on the field. Chapters 2 and 3 multiply costs (x1.15 and x1.3).
- **Fighting.** Units stop at the first target in reach. Each attack has a wind-up before the hit lands, then waits out its attack rate. Single-target units hit the closest foe; area units hit everything in reach; long-distance units hit a zone ahead; omni units also hit behind them.
- **Shoves (knockbacks).** Every unit has a shove count; it's shoved back each time its health crosses a threshold. Units can't be hit while flying back.
- **Bosses** arrive with a shockwave that shoves every rag back.
- **Foe keep triggers.** Some foes only appear once the spire drops below a health threshold.
- **Cannons** (7, unlocked by clearing stages, upgraded with materials): Spool (damage and shove), Frost (freeze), Snare (snag), Rag Wall (a wall that holds the line), Breaker (shatters barriers and husks), Quake (a rolling shove) and Thread Lance (pierces; Revenants it fells stay down).
- **Battle items:** Quickstep (3x speed), Scrap Sack (loom starts maxed), Autopilot (the battle plays itself), Lookout (shoots and shoves the front foe), Treasure Lamp (Gold treasure guaranteed) and Study Lamp (+50% thread).
- **Continue** once per battle for 30 Buttons: full keep, full wallet, foes pushed back.

### Traits and abilities

Foes have traits: Plain, Crimson, Drifting, Shadow, **Steel** (1 damage per hit; critical hits and Steel Shred cut through), Gilded, **Starborn** (shrug off half your damage until you collect Starward treasures), **Revenant** (get back up and burrow unless finished by an Unraveller), **Ancient** (Hex your rags) and **Void** (regrowing husks and death surges).

Rag abilities include Strong vs, Resistant, Unbreakable, Massive and Ruinous damage, Targets-only, Shove, Freeze, Snag, Fray, Hex, Critical, Savage Seam, Ripple and Mini Ripple, Surge, Second Wind, Hang On, Base Breaker, Steel Shred, Barrier Breaker, Husk Pierce, Unraveller, Scavenger (double scrap), Sidestep, Ripple Wall, multi-hit, long distance, omni strike and immunities. Foes add Barrier, Husk, Get Back Up, Burrow, Warp, Toxic and Death Surge.

## Progression

- **51 rags** in six rarities (Basic, Special, Rare, Epic, Mythic, Legend), three forms each. The 12 Mythics are the Elemental rags from Element Rag (Ember, Tide, Gale, Stone, Rime, Storm, Thorn, Void, Radiance, Chrono, Gravity, Echo).
- **Levels** cost thread. The second form comes at level 10. The third form needs level 20 or 30, thread and **dye**. The cap is 10 until The Long Seam chapter 1 is cleared, then 20; **Seam Gems** (and Mythic Gems for Mythic/Legend past 30) raise it to 30, 40 or 50. Duplicate draws add **plus levels** and **Needle Points**.
- **Talents** on third forms, bought with Needle Points (health, attack, cost, recharge, speed, reach, shove, effect chance and duration, crit, hang on, sidestep, resistances, immunities).
- **Combos:** 23 lineup combos (start scrap, health, attack, speed, cannon, loom, wallet, trait mastery and more).
- **Treasures:** every story stage hides one (Bronze, Silver or Gold). Six make a set bonus; there are 72 sets across the 9 chapters (loom, cannon, keep, recharge, thread, energy, rag health and attack, start scrap, drops, effect duration, trait mastery and Starward).
- **Workshop upgrades:** 10 upgrades up to level 20 (cannon power, reach and charge; loom speed and wallet; keep fortitude; research; accounting; study; pack size).
- **Ragbag:** a Rare Ragbag with a weekly featured banner, single and 11-draws (the 11th is always Epic or better), Rare tickets, a Platinum ticket (Mythic or Legend) and a 100-draw guarantee. A Thread Bag for Thread tickets holds specials, items and materials. Special rags are also sold for Buttons.
- **Energy** for battles, 1 back per minute; refill for Buttons; rank rewards refill it.
- **Scavenger:** send a crew on 5 to 60 minute trips to 7 areas for thread, materials, items, dye and gems. They level up, and helpers add to the haul. Trips run while the game is closed.
- **Missions:** daily and weekly missions, 27 badges, a 28-day login stamp card and 15 rank rewards (rank is the sum of all rag and upgrade levels).
- **Guide:** a codex of every rag and foe you've seen, plus how-to-play.

## Modes

- **Story:** three lands, three chapters each, 48 stages per chapter (432 stages). The Long Seam, The Fraying Lands (Starborn foes) and The Unspun Void (Revenant, Ancient and Void foes). Boss stages are 12, 24 and 36; each chapter ends on a finale boss.
- **Legend Seams:** Tales of the Seam (24 seams) and Uncanny Tales (12 seams), four stages each, each clearable on up to four crowns. Some stages have rules (rarity limits, cost caps, no cannon, deploy limits, time limits), and stage IV can drop a special rag.
- **Events (rotate daily and monthly):** Thread Mill (thread), Dye Garden (dye by weekday), Steel Ring (Steel foes; drops the Steel Spindle), Ticket Run, Button Hunt, Gem Trail, a monthly festival and the Trial of Haste (time attack).
- **Rot Outbreaks:** every cleared chapter rots over with Revenants, 8 stages each.
- **Needle Spire:** 50 floors with a boss every 10.
- **The Scrap Yard:** a 2-minute score attack against an unbreakable keep, with weekly reward tiers.
- **Weekly Gauntlet:** 5 battles in a row; lose one and you start over.
- **The Tangle:** a 30-floor run where you pick a door each floor (battle, elite, charm or cache). Charms power up the run.
- **Legend Trek:** 48 levels of Legend stages, each with a random borrowed lineup.
- **Rival Dojo:** a rival rag army with its own wallet fights back and grows with every win.

## Balance

Stage strength is checked headlessly. `node tools/minlevel.mjs [c1|c2|c3|arc2|arc3|misc]` plays stages with the autopilot (it grows the loom early, keeps walls up and saves for heavy hitters) and binary-searches the lowest rag level that wins. The current curve:

| Stage | Lowest winning level | Planned player level |
| --- | --- | --- |
| Long Seam 1-24 / 1-48 | 6 / 4 | ~5 / ~10 |
| Long Seam 2-24 / 2-48 | 10 / 22 | ~15 / ~19 |
| Long Seam 3-24 / 3-48 | 20 / 23 | ~22 / ~25 |
| Fraying 1-48 / 3-48 | 10 / 35 | ~28 / ~36 |
| Void 2-24 / 3-48 | 30 / 30 | ~42 / ~48 |
| Legend 24-IV | 30 | ~40 |
| Needle Spire 30 / 50 | 13 / summit (wins at total level 75+) | ~36 / ~48 |

Other tools: `node tools/checks.mjs` (rule regression checks), `node tools/balance.mjs` (win/loss sweep), `node tools/modes.mjs` (one battle of every mode), `node tools/smoke.mjs` (headless browser run through every screen; fails on console errors).

## Code layout

| File | What it does |
| --- | --- |
| `js/battle.js` | Pure battle simulation (no DOM): economy, spawning, targeting, procs, waves, surges, cannons, autopilot, rival AI |
| `js/scene.js` | Battle camera, rendering, HUD, input and event-to-effect mapping |
| `js/art.js` | Procedural rags, foes, keeps, worlds and portraits |
| `js/fx.js` | Pooled particles, ragdolls for the fallen, rings, beams, numbers |
| `js/audio.js` | Synthesized SFX and procedural music |
| `js/save.js` | Save data, bonuses, unit stat building and every progression action |
| `js/game.js` | Battle start under stage rules, rewards and progress |
| `js/ui.js` | Every menu screen and modal |
| `js/data/*.js` | Rags, foes, stages for every mode, meta data (upgrades, cannons, combos, talents, treasures, missions, banners) |
