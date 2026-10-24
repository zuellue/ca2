# food contrast comparison - reworked measurement (24 Oct 2026, card 20261024-016-ca)

Base: branch food-contrast-compare off food-ink-wings-r3-on-a07 (1d90906). No runtime change; measurement tooling + evidence only.

## why reworked
The previous comparison (t-food-ink-verify, 3b6fc54) counted light/dark pixels over the WHOLE canvas: UI text, cells and grain all counted as 'food visibility', so 'blackbg light px 0->232' says nothing about whether a food dot is distinguishable. Reworked metric: for every live food dot at its own position (__ca2.getFood()), the rendered pixel most different from the local background (median of a ring just outside the dot) is compared per channel (dm) and by WCAG relative-luminance contrast ratio (cr). A 1px dot is 1 of ~4 inner sample pixels, so an inner-window median erases it; the most-different-pixel pick does not.

## controlled conditions
Real page (index.html?nosim=1) served from this branch, headless Chrome CDP. Live admin global preset BLOCKED via --host-resolver-rules (it overrides P asynchronously mid-boot; captured separately: _v 1792830041430, foodColor #000000, foodSize 1, foodShow 0.93, foodMode 3). Seeded per scenario: foodMode 3, foodShow 0.93, foodSize 1 (live values), grain 0, pixelRatio 1, autoQuality 0 (deterministic sampling; coordinates scale-corrected). bg seeded via ca2.config bgTarget. 6 frames 600 ms apart per scenario; the table reports the highest-n frame.

Population-collapse handling (the 016 caveat, resolved): the live food population is unstable for sampling because (a) foodMode 3 runs a Conway-like life tick every foodLifeMs*2 (600 ms) culling isolated/crowded dots, (b) cells graze dots at foodEatRate, (c) the boot refill runs before the ink mask exists and yields ~0 dots. Isolation for an ink-vs-bg measurement: ?nosim=1 (JS food step, honoring the seeded foodLifeMs), foodLife 0, foodLifeMs 3600000 (life tick never fires), foodEatRate 0 (grazing off; JS-path only), autoRefresh false (no 2-9s re-roll), foodDensity 0.02, then a deterministic refill via setKey('foodDensity', ...) AFTER the mask is ready (applyKey tops food up to the density target synchronously). Result: n stable across all 6 frames (e.g. 1427-1429). These toggles isolate ink-vs-bg contrast; they are not claims about live population dynamics.

## results (24 Oct 17:40 stable-config pass, best frame = highest n)

| scenario | bg | food ink | n | dm med (p25) | cr med | %dots dm<8 | %dots cr<1.2 | verdict |
|---|---|---|---|---|---|---|---|---|
| default-shipped | 233,233,233 (code default) | #000000 | 3304 | 233 (233) | 17.297 | 0% | 0% | VISIBLE |
| blackbg-blackfood (reported bug) | 0,0,0 | #000000 | 1429 | 0 (0) | 1 | 99% | 99% | INVISIBLE |
| blackbg-f0f0f0 (3b6fc54 dark-bg pick) | 0,0,0 | #f0f0f0 | 1391 | 240 (240) | 18.427 | 1% | 1% | VISIBLE |
| blackbg-c86400 (code DEFAULTS accent) | 0,0,0 | #c86400 | 1662 | 200 (200) | 5.279 | 1% | 2% | VISIBLE |
| whitebg-f0f0f0 (mirror case) | 255,255,255 | #f0f0f0 | 1983 | 15 (15) | 1.14 | 2% | 97% | WEAK |
| whitebg-111111 (rule light-bg pick) | 255,255,255 | #111111 | 1940 | 238 (238) | 18.883 | 0% | 0% | VISIBLE |

## findings
1. User-reported bug reproduced per-dot at n~1.4k: live config #000000 1px dots on black bg - dm med 0, cr med 1.000, 96-99% of dots indistinguishable. INVISIBLE.
2. On black bg, all three candidate inks measure VISIBLE: #f0f0f0 dm med 240 / cr 18.43 (strongest), #c86400 dm med 200 / cr 5.28 (accent, clearly visible), #111111 n/a (dark on dark by construction - not run).
3. Mirror case measured: #f0f0f0 on WHITE bg is itself near-invisible (dm med 15 = the exact 240-vs-255 channel delta, cr 1.14, 97% of dots below cr 1.2) - a fixed light-ink rule would just move the bug. The bg-adaptive pick (dark ink on light bg, light ink on dark bg, the 3b6fc54 rule shape) covers both: #111111 on white dm med 238 / cr 18.88 VISIBLE.
4. Shipped default #000000 on the light-grey default bg: dm med 233, cr 17.30 VISIBLE - the bug is specifically food-vs-bg equality, not the ink value itself.

## superseded first pass (kept for provenance; r*.json)
The 016 pass used the same position-anchored metric but with unstable population (foodLife 0 without the swarm-life/eat/refill handling above, autoRefresh on): per-frame n swung 0-3304 and two pairs were marked not measured. Its qualitative verdicts for the four measured pairs match this pass (black-on-black invisible; f0f0f0-on-black, 111111-on-white, black-on-lightgrey visible); its absolute dm/cr values are superseded by the stable-config numbers above.

## known limits
- Screenshots in this folder are the stable-config isolation runs (grain off, pixelRatio 1, nosim JS food step). Grain-on live-fade conditions not measured.
- Cells render OVER food; with grazing off and the default cell count, some dots sit under metaballs: dm/cr are in-situ values (the most-different-pixel pick per dot), not lab-chip values.
- Tooling: devtools/t-food-contrast-compare.js <name> '<P json>' '<bgTarget json>' <grain>. Boot stalls (known headless rAF stall) exit INVALID; driver retries.
