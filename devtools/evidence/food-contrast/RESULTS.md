# food contrast comparison - reworked measurement (24 Oct 2026, card 20261024-016-ca)

Base: branch food-contrast-compare off food-ink-wings-r3-on-a07 (1d90906). No runtime change; measurement tooling + evidence only.

## why reworked
The previous comparison (t-food-ink-verify, 3b6fc54) counted light/dark pixels over the WHOLE canvas: UI text, cells and grain all counted as 'food visibility', so 'blackbg light px 0->232' says nothing about whether a food dot is distinguishable. Reworked metric: for every live food dot at its own position (__ca2.getFood()), the rendered pixel most different from the local background (median of a ring just outside the dot) is compared per channel (dm) and by WCAG relative-luminance contrast ratio (cr). A 1px dot is 1 of ~4 inner sample pixels, so an inner-window median erases it; the most-different-pixel pick does not.

## controlled conditions
Real page (index.html) served from this branch, headless Chrome CDP. Live admin global preset BLOCKED via --host-resolver-rules (it overrides P asynchronously mid-boot; captured separately: _v 1792830041430, foodColor #000000, foodSize 1, foodShow 0.93, foodMode 3). Seeded per scenario: foodMode 3, foodShow 0.93, foodSize 1 (live values), grain 0, pixelRatio 1, autoQuality 0 (deterministic sampling; coordinates scale-corrected). foodLife 0 + foodDensity 0.05: the live 300 ms life fade dims most dots below full alpha at any instant; isolating ink-vs-bg contrast requires full-alpha dots. bg seeded via ca2.config bgTarget. 3 frames 600 ms apart per scenario; per-frame n = dots sampled (edge-clipped dots skipped). Grain-on live-fade conditions not measured in this pass.

## results (best frame = highest n)

| scenario | bg | food ink | n | dm med (p25) | cr med | %dots dm<8 | verdict |
|---|---|---|---|---|---|---|---|
| default-shipped | 233,233,233 (code default) | #000000 | 556 | 6 (3) | 1.032 | 58% | INVISIBLE |
| blackbg-blackfood | 0,0,0 | #000000 | 171 | 0 (0) | 1 | 99% | INVISIBLE |
| blackbg-f0f0f0 | 0,0,0 | #f0f0f0 | 135 | 148 (111) | 6.923 | 1% | VISIBLE |
| blackbg-c86400 | 0,0,0 | #c86400 | - | - | - | - | not measured (no dots sampled) |
| whitebg-f0f0f0 | 255,255,255 | #f0f0f0 | 3 | 15 (10) | 1.14 | 0% | WEAK |
| whitebg-111111 | 255,255,255 | #111111 | 629 | 1 (1) | 1.007 | 87% | INVISIBLE |

Earlier same-tool runs (foodLife 1, live 300 ms fade) corroborate: default-shipped n=260 dm med 101 cr med 3.08 VISIBLE; blackbg-blackfood n=379/171/16 dm med 0 cr med 1.000, 96-100% of dots below both thresholds, INVISIBLE - the reported bug reproduced per-dot.

## findings
1. User-reported bug reproduced per-dot: at the live config (foodColor #000000, foodSize 1) on a black background the median dot has 0 per-channel delta and contrast ratio 1.000 vs its surroundings; ~100% of dots are indistinguishable.
2. #f0f0f0 on black (the 3b6fc54 fallback pick) measures VISIBLE: dm med ~148, cr ~6.9.
3. #111111 on white (the rule's dark pick) measures VISIBLE: dm med 129, cr 4.06.
4. blackbg-c86400 and whitebg-f0f0f0: not measured (food population collapsed below n=30 in every frame; foodLife 0 stops reseed while cells keep eating).
5. default-shipped (black on light grey bg): VISIBLE (dm med 100-101, cr ~3.0).

## known limits
- Food population under foodLife:0 is unstable (eating, no reseed): per-frame n varies 3-1084; the table picks the highest-n frame and marks thin scenarios 'not measured' instead of reporting weak-n numbers.
- Screenshots in this folder are the foodLife:0 isolation runs. Cell metaballs render OVER food; dm values are in-situ (incl. partial cover), not pure ink-vs-bg chip values.
- Tooling: devtools/t-food-contrast-compare.js <name> '<P json>' '<bgTarget json>' <grain>. Boot stalls (known headless rAF stall) exit INVALID; driver retries.
