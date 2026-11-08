# CA-31 ORACLE first findings: raw single-step bit mismatches vs stepSquash-masked TRACE2

Date: 2026-11-07. Branch: ca/187-js-rust-alignment. Follows rustpow-port-20261107.md.

## ORACLE mode (devtools/t70-interact-iso-served.js, ORACLE=N with FULLST=1)
Real mkState base per seed, aligned xorshift128+ streams, exactly ONE step per engine
(J.frame() vs pack+sim_step), per-cell bit comparison of x/y/vx/vy/energy. NO stepSquash
post-pass (unlike TRACE2 and the app frame).

## Measured (ORACLE=2000, 40 cells/state)
- 589/2000 states (29.45%) show at least one per-cell bit mismatch after ONE step.
- Dominant pattern: 1-ulp velocity diffs on a single axis (e.g. dvy -5.55e-17), energy
  exact: ~0.7% of cell-steps. Rare large diffs (1/2000 states: dv ~1.4, dEnergy -0.14) =
  a downstream draw-count desync once a gate flips on a near-equal comparison.
- A first naive synthetic-single-cell oracle variant diverged systematically (organic /
  survival side effects from non-harness params) - discarded; only real-mkState results
  above count.

## Reconciliation with TRACE2's 30-step bit-exactness
TRACE2 snapshots AFTER J.stepSquash() on both engines (the app frame order, ca2.js:2302);
ORACLE compares raw frame output. The residual seed lives in the raw update/interact/keepIn
outputs and the stepSquash post-pass masks or absorbs most of it; where a seed survives,
amplification shows up at step ~26-39 in TRACE2 (per trace2-noise-floor-20261107.md, the
first diff lands in crowd at ~1 ulp). The served binary's cos/sin are V8-compatible on the
overwhelming majority of draws (~99.3%), unlike a Rust 1.99.1 build (~50% mismatch vs V8);
the served toolchain's libm is close to but not bit-identical with V8's fdlibm.

## STATUS NOTE (same day, post-commit)
The stepSquash-masking reconciliation above is a HYPOTHESIS, not a measured line: the
first quantification attempt (extending ORACLE with a post-pass compare) was buggy
(index misalignment after the JS death-splice + contaminated sqS in the reused mirror)
and was discarded uncommitted.

## CA-32 measured line 1 (same day): masking DISPROVEN
ORACLE rewritten with the FULLST loop's exact mirror handling (fresh clone, readback of
slots 0-13 + 24-28, dead-splice, then J.stepSquash() on both sides, app frame order):
FULLST=1 ORACLE=2000: raw mismatched states 577 (28.85%); post-stepSquash mismatched
states 577 (28.85%); masked 0.0%. stepSquash does NOT mask the raw seeds - the raw and
post-pass mismatch sets are identical. Seeds remain 1-ulp single-cell single-axis
velocity diffs (energy exact), e.g. seed#=4 cell=22 dvx +2.22e-16.
Consequence: TRACE2's 30-step bit-exact run dodged trigger inputs for 30 steps on one
base state; the underlying raw seed rate is ~0.7% of cell-steps (577/2000 states have
>=1 seed at step 1). The seeds are real JS-vs-served compute differences in the raw
update/interact/keepIn path; FULLST distribution parity absorbs them.

## OPEN (next run)
- Attribute the 1-ulp velocity seed decisively: replay the diverging cell's draws and
  compare wasm-implied cos(a)/sin(a) (needs per-cell draw-index accounting in descending
  processing order, or a DIVMODE=passthrough build with draw logging in a fresh wasm build
  - noting fresh 51dce62 != served, so only per-draw replay against the served binary is
  authoritative).
- Quantify how stepSquash masks raw seeds (compare raw vs post-stepSquash mismatch rates
  on the same states).
- FULLST distribution parity (the shipped gate) is unaffected throughout: PASS.

## CA-32 draw-level attribution (2026-11-07, oracle DRAWLOG + chain solver)

Method: ORACLE mode with DRAWLOG=1 records every aligned-stream draw plus per-cell draw-boundary
marks (frame template injection, inert unless DRAWLOG set). For each first-divergent cell in the raw
1-step bit-compare, the cell is matched back to its base slot (tagged __bi), and only isolated
(nn=0 within interactionRadius) wall-inert cells are solved: keepIn disabled via SET=boundAware=0,
so the post-step velocity is an exact f64 chain of the six per-cell trig evals:
wander cos/sin(a1) -> limit -> organic cos/sin(a2)*t -> lerp toward cos/sin(a3)*maxSpeed at 0.04 ->
limit -> f10 limit. The solver replays the chain in JS for all 5^6 = 15625 combinations of
{-2,-1,0,+1,+2} ulp shifts on the six V8 trig values and records which combos reproduce the wasm
post-step velocity bits exactly. Zero-shift chain validated against the JS engine bits first.

Measurement (FULLST=1 ORACLE=600 DRAWLOG=1 SET=boundAware=0, 40-60 cells in a 400 box):
- 71 clean isolated divergent cells; 65/71 chain-validated (6 minor model gaps, e.g. oob-death races).
- 65/65 validated cells have at least one admissible trig-shift combo (hitsAny).
- 63/65 (97%) are explained by a SINGLE trig draw differing by <=2 ulp.
- Channel marginals: the organic-d channel (scale t~0.1) is permissive for any shift; the
  discriminative wander (0.2) and organic-q (0.04*maxSpeed) channels require the nonzero shifts.

Conclusion: the residual raw seed (~0.7%/cell-step, 22.5-30.5% of mkState states at step 1, 0.0%
masked by stepSquash) is a single 1-ulp cos/sin difference between V8's Math.cos/Math.sin and the
served binary's libm on one of the six per-cell RNG-angle evals (wander, organic direction, organic
lerp heading). Draw order, draw counts and all basic-op paths are bit-identical; single-axis or
both-axis velocity deltas follow from which draw differs and whether a speed limit couples the axes.
This is a libm-level difference between the JS engine's platform trig and the served binary's
compiled-in trig, not a logic difference in ca2.js. As with CA-30 (pow), no ca2.js change is
warranted: shipping a private trig implementation would import behavior that is neither V8's nor
verifiably the served binary's, and the divergence is below every flag-free behavioral tolerance.

## CA-33 served-trig fingerprint + end-to-end collapse (2026-11-08)

REQ extension of the CA-32 solver: a channel is "required" when shift 0 is inadmissible over all
15625 combos (every bit-exact explanation perturbs that channel); with a single-draw hit the cell
is uniquely attributed: that channel's trig differs at that recorded angle. 99 uniquely-attributed
cells over ORACLE=1500 (channels wC 20, wS 17, oC 7, oS 3, qC 18, qS 34; angles spread over
[0, 2pi], shifts +-1, both signs - a spread polynomial-level difference, not a reduction boundary).

Candidate libm ports (bit-exact JS, all basic f64 ops):
- ORIGINAL netlib fdlibm (k_sin/k_cos with qx branch, fully-nested polynomials, fn-based e_rem_pio2
  medium path): matches V8 Math.sin/cos on 400000/400000 angles in [0, 2pi] (0.000%). V8 ships
  original fdlibm, bit for bit.
- MODERN FreeBSD msun (no-qx kernel_cos, split r = z*(C1+z*(C2+z*C3)) + w*w*(C4+z*(C5+z*C6)),
  direct 1..4xpio2_1 reduction branches): mismatches V8 on 0.897% (sin) / 0.925% (cos) of angles,
  always +-1 ulp, both signs - and its value at each of the 40 checked uniquely-attributed REQ
  angles equals V8 + the required shift, 40/40. The served binary's trig is the modern
  FreeBSD-msun-derived family (consistent with the Rust libm crate sourcing sin/cos from FreeBSD
  msun; musl/original-fdlibm excluded because they are bit-identical to V8).

End-to-end confirmation: COSMSUN=1 (harness probe swapping Math.cos/sin for the modern port around
the JS frame only) collapses the ORACLE raw 1-step mismatch from 29.88% (239/800) to 0.00% (0/800)
at 60 cells/state. Every observed raw 1-step seed is the V8-vs-served trig difference; no other
divergence source exists at step 1 in this mode.

Landing option (needs direction): replacing Math.cos/Math.sin at the sim-path call sites in ca2.js
with this port (same shape as the CA-29 hypot patch) would make the JS engine bit-identical to the
served binary in oracle mode. Not landed: ca2.js is the shipped app and the port costs ~50 lines +
per-draw overhead for a difference that is below every flag-free behavioral tolerance; the served
binary may also be rebuilt at any time (it already predates Rust 1.99.1's libm, whose trig differs
again - a rebuild would re-open the gap in the other direction). Harness probe COSMSUN=1 retains
the capability.

## CA-34 trig port landed behind a flag (2026-11-08, parent ruling)

ca2.js rand2D (the only per-step RNG-angle trig site) now returns the modern FreeBSD-msun port
when globalThis.CA2_TRIG_MSUN is truthy; default OFF: the flag check returns before the lazy port
initializes, so shipped behavior is bit-identical (verified: ORACLE raw mismatch 30.25% OFF vs
29.88% pre-change baseline; full regression battery PASS). ON: ORACLE raw 1-step mismatch 0.00%
(0/800 seeds x 60 cells) - bit-exact parity with the served binary's sim_step. The port is
self-contained inside rand2D (the harness brace-extracts functions standalone) and valid only for
|x| <= 9pi/4; all other Math.cos/sin call sites (swim, easing, placement, render) keep native trig.
Harness enable: CA2TRIG=1.

## CA-35 (2026-11-08): multi-step horizon past step 1 - the second seed is position-sum ASSOCIATION

The TRACE2 exact threshold (mx>0, was 1e-9) rewrites the CA-27 record: with native trig the
engines were never bit-exact for 58 steps. TRIGCNT (per-draw MSUN-vs-native cos/sin counting
inside the TR2 loop) measured ~8 trig-ulp mismatches per step (0.84-0.88% of 27600 draws over
60 steps) hiding below the old 1e-9 diff threshold; the first >1e-9 crossing (step 26/49) was
amplification, not the seed. Real first visible divergence with native trig: step 0-1.

With CA2TRIG=1 (CA-34 port ON) step 0 is bit-exact and divergence appeared at step 1 with a
stable cross-state signature: cr/sq 1-2 ulp, vx/vy ~1e-15, x/y ~1e-14, en/r/g equal, on
wall-pressed cells. Isolation (all TRACE2=1 CA2TRIG=1 FULLST=1 STEPS=200):
- SET=boundAware=0: 200 steps BIT-EXACT -> the seed lives in the boundAware cluster.
- SET=crowdRel=0 and SET=squashIn=0,squashOut=0: still step 1 (kr pow and squash easing
  cleared).
- SET=crowdGain=0: first divergence moves to step 7 and the FULLST 200-step check PASSes ->
  the crowd-block envV drift is the carrier, not the crowd arithmetic itself.
Root cause: ca2.js update() integrated position as `c.x += c.vx + c.envVx` (x + (vx + envVx));
the served binary sums in two steps, (x + vx) + envVx. The associations differ by <=1 ulp only
when envV != 0, which first happens at step 1 (keepIn's crowd drift writes envV after update's
position integration at step 0). That is why step 0 was clean and every step from 1 onward
carried a fresh 1-ulp seed, amplifying into the TRACE2+FULLST population drift (js 3400 vs
wasm 3600 at step 200). A KGMEAS probe (served-side per-cell crowd/press measurement) and a
two-statement position-sum mutation both confirmed it: with the two-statement sum, 3 runs of
STEPS=200 showed zero exact-threshold divergence and PASS.

Fix (same gate as CA-34): globalThis.CA2_TRIG_MSUN also selects the two-step position sum in
update(). The flag-free default stays bit-identical to shipped JS. Verified with the real
ca2.js: flag ON, TRACE2 FULLST STEPS=200, 3 states x 2 trials x 200 steps, NO exact-threshold
divergence and channel parity PASS (52 pressed cells); flag OFF diverges at step 0-1 as
before. OFF battery: default/EAT/BIRTH 800x4/BOUND/FULLST10/LOGCHK PASS (BOUND maxAbsDiff
0.00), teeth (fuse-gate x2 via CA_JS) FAIL as required. One BIRTH 800x4 run failed on
eaten/death/fuse (3.9/4.4/18.6%) then passed 3/3 reruns - unseeded-mkState noise; the
flag-free path is bit-identical by construction.

## CA-36 (2026-11-08): the "third seed" was CA-35 fallout; horizon now bounded by state starvation

The crowdGain=0 step-7 divergence seen during CA-35 isolation was measured on the pre-fix
tree and is gone with the association fix: post-fix, both default and SET=crowdGain=0 aligned
runs (TRACE2=1 CA2TRIG=1 FULLST=1 STEPS=200) show ZERO exact-threshold divergence over
3 states x 2 trials each, FULLST channel parity PASS. Extending the horizon past 200 steps
hits a state-construction wall, not an engine mismatch: FULLST states carry no food, initial
energy 3-15/cell (mkState) starves the population between steps ~200 and 250 ("no pressed
cells" precondition), and STEPS=1000 runs stay bit-exact through the collapse. A longer
horizon needs fed/longer-lived FULLST states (mkState energy or a food-enabled aligned mode),
not further engine work.

## CA-38 divide() draw-stream attribution (2026-11-08, state-seeded run)

Aligned TRACE2 run (CA2TRIG=1, BORNTR=1, per-step seeds 1000/5000), FULLST mode with SET=divideOn=1,divideAt=0.5, 37 divides at step 0. Stream positions are draws from makeRng(1000,5000) replayed in node; JS values from DIVP/DIVG/DIVC hooks (devtools/ca2-div-probe.js), wasm child slots from BORN dump.

Findings:
1. First divide fully aligned in BOTH engines at stream pos 5 (angle = st[5]*6.2832, placement err 3.3e-16, trig-ulp only). Desync starts at the SECOND divide.
2. JS divide #1 consumes positions 5..53 = 49 draws (JS 2nd ang at 54): ang, rnd(100) mutation check, Cell constructor (rand2D v, popD, sv, hostility, speedModifier, 6-draw genome init, newShape, life), mutGenome(6), newShape-parent ph/ph2 (2).
3. Wasm divide #1 consumes positions 5..33 = 29 draws: child0 host=st[9], smod=0.7+1.6*st[10] exact; child1 host=st[38] exact => pattern ang(k), rnd100(k+1), v(k+2), ONE draw (k+3), host(k+4), smod(k+5) - the served binary skips ONE of JS's constructor draws between v and hostility (popD is UI-only: popD = UI_END + rnd*(CELL_END-UI_END), the likely skip).
4. Wasm child genome is parent-based mutGenome with amplitude 0.12 (the compiled default), NOT the packed genomeMut=0.5: child app channel = clamp(papp + (2*st[12]-1)*0.12) matched EXACTLY (2.4e-8); spd/bnd channels near st[11]/st[13] with residual ~1e-4 (formula detail still open; col channels did not match any consecutive triple - open).
5. Wasm per-divide consumption VARIES (host positions 9,38,61,78,111,139,156,179 => deltas 29,23,17,33,28,17,23) - mutation (rnd100<5) and newShape/life branch draws; not yet decomposed.
6. Wasm child placement angles for children past the first do NOT invert against st[k]*6.2832 with any parent's divide-time position (best mixed-axis err ~1e-4..1e-1) - placement-angle source for later divides is still unattributed (possible pre-vs-post-update parent positions or interleaved divide/update pass in the served binary).

Next: decode wasm per-divide draw layout (29 vs JS 49: popD + constructor-genome 6 + ? ), verify the genomeMut=0.12 pack-override, then implement flagged divide() alignment (skip popD, drop constructor genome init in favor of parent-based mutGenome at 0.12-from-pack semantics, port placement trig via rand2D._msun keeping 6.2832).

## CA-38 RESOLVED (core) + fix landed (2026-11-08)

Full decode of the served divide() draw layout (stream = makeRng(1000,5000) replay; wasm child slots via BORN/BORNP dumps; JS via devtools/ca2-div-probe.js hooks + RCCNT draw counter):

Served divide consumes exactly 12 draws per divide (JS consumed 30-32):
1. ang = rnd*6.2832; placement with nr = max(packed CELL_RADIUS, parent.r*0.62), msun cos/sin
2. rnd(100) mutation check (vs parent mutationRate)
3. v = rand2D (child velocity direction)
4. sv = rnd(-1,1)
5. hostility = rnd
6. speedModifier = rnd(0.7,2.3)
7-12. mutGenome(parent.g, 0.12): spd/app/bnd/col x3 - parent-based, amplitude 0.12 (COMPILED DEFAULT; packed genomeMut ignored by the served divide path)

Child init: vx,vy = v * max(0, 10 + sv*15) - COMPILED DEFAULTS baseMaxSpeed=10, maxSpeedVariation=15 (packed 2/30 ignored), NO genomeOn*g.spd multiplier. Verified 36/36 children bit-exact velocity (|v| err <= 4e-15) and 3/3 spd/app/bnd exact (0.0); col = served mutGenome col formula max(0.001, c + rnd(-a,a)*0.5) = JS's own mutGenome col. No Cell-constructor genome init (JS wasted 6 draws), no newShape draws (child shp = parent clone), no life-jitter draw, no popD draw.

Fix (test/ca2.js divide(), behind globalThis.CA2_TRIG_MSUN): flagged branch replicates the 12-draw layout exactly + placement trig via rand2D._msun (angle constant kept at 6.2832). Flag-free path byte-identical.

Results: aligned TRACE2 run (FULLST+BORNTR+SET=divideOn=1,divideAt=0.5) step-0 max|dpos| = 0.0000 (was 211+). Flag-free battery: default PASS, BOUND PASS, FULLST10 PASS, BIRTH=1 LOGCHK 200x4 PASS, BIRTH 800x4 PASS, EAT 800x4 PASS (EAT/BIRTH small-sample 2x2 counter FAILs reproduce identically on the pre-edit baseline = unseeded-mkState noise, not the fix).

OPEN - CA-38b: step-1+ divide-count delta (~3 cells/step: 40->70 JS vs 40->73 wasm). The JS gate (update() line 241) requires P.foodGrow && cells.length < max(60, UNIVERSE_SIZE*4) && c.energy > 1; the served binary divided ~all cells every step up to the 300-slot pack cap (40->73->139->250->300) - served gate lacks the energy>1 condition and the 223.8 population cap at minimum. Also: mutateGene firing case (rnd100 < mutationRate, ~5%) draw pattern unverified (no firing case observed in 36 divides).

## CA-38b progress (2026-11-08, post-fix)

With the CA-38 fix, step-0 divide counts match across states (6/6 runs equal) and populations track (js [72 136 240 300 ...] vs wasm [72 136 240 300 ...]). Step-1 per-divide stream positions (RCCNT draw counter + BORNC host inversion vs makeRng(1002,5002)): the FIRST divides align exactly, then a single intervening cell update consumes +3/+4 draws in the wasm (run A: aligned 6,43,77,114,137 then js 188 vs wasm 191; run B: aligned 6,43,94 then js 115 vs wasm 119). Ruled out: mutation firing (rnd100 = 93 at the diverging divide), parent shp.t (diverging parent t=0), energy split (child energies exact 0.0), newborn-update skip (26/27 wasm newborns move at step 1), checkSurvival (no draws), shp.t===1 update branch (no draws). Newborns ARE updated by the wasm at step 1 (positions move), and the wasm also processes divides in the same backward order (first divide at pos 6 at step 1 in both engines). The +3/+4 is a conditional draw in the per-cell update path that fires in the served binary but not JS (or vice versa) - organic()/pairing (symbiosis) pass is the prime remaining suspect.

## CA-38b: step-1+ residual — interact() pair loop is the next decode layer (03:55)
- Step-0 divides bit-exact after CA-38; step-1 diverges mid-step in FULLST BORNTR SET=divideOn=1,divideAt=0.5
  (30-cell box 220): first 3-4 divides align exactly (run B: rc 6,43,94 both engines), then one cell's
  processing consumes 9 draws JS vs 13 wasm (+4) before the next aligned divide.
- FULLST zeroes reproChance/divideOn/eatChance/mergeChance/habitatOn but LEAVES symbiosisOn=1,
  symbiogenesisOn=1, eatMergeOn=1: the chance values are 0 but the DRAWS still fire when the
  proximity/gene conditions pass.
- Draw sequence per cell i (ca2.js:2323-2336): update(c_i) [rand2D + organic(3) + select(1) + gate(1)
  + possible divide(12)] then `for k=i-1..0: interact(c_i, cells[k])` — the pair loop is INTERLEAVED
  with the cell loop, so a divider's interact draws sit between its divide and the next cell's update.
- interact() draw map (per call passing dist < interactionRadius; early-return beyond):
  eat band (dist<(ra+rb)*eatDistF): ratio>=eatRatio → 1 draw (<eatChance=0); else-if |dgene|<=mergeGene → 1 draw (<mergeChance=0)
  fuse: dist<(ra+rb)*fuseDistF && |dgene|<=mergeGene → 1 draw (<mergeChance*0.3=0)
  pair: !a.sym && !b.sym && dist<(ra+rb)*symDistF → 1 draw (<mergeChance*0.5=0)
  hostility>0.5 block: TBD (lines ~21-24 of interact)
  reproduce: dist<ra+rb → 1 draw (<reproChance*birthCapF()=0)
  collision: r1,r2 = rand2D() x2 near the end (conditional structure TBD)
  → 2..7 draws per qualifying pair depending on bands.
- Hypothesis: the +3/+4 = cell-A interact loop drawing more in the wasm (different conditional
  structure/order, or r1/r2 unconditional where JS skips, or vice versa). Next: hook per-interact
  draw counts in the probe (pair indices + bands + draws), invert the served layout from the
  delta between aligned divide anchors, same method as the CA-38 divide decode.

## CA-38b: step-1 +2 attribution progress (05:16)
- nir (interactionRadius=0) isolates a +2 per-span wasm extra with interacts dead: span = one cell
  update (JS 5) vs wasm 7, in 8/8 runs. selectOn=0 -> JS 4 vs wasm 6 (not select). senseR=0,
  restless=0, wallCarry/wallSpread/squash*=0 do NOT kill it (served likely reads compiled defaults
  for the v6/v8b channels, same pattern as the CA-38 divide constants).
- The +2 sits INSIDE the first-diverging cell's own processing (state divergence starts at the
  highest-index processed cell; energy/radius stay bit-equal -> the shifted draws touch only
  velocity, consistent with organic-style wander draws).
- Firing-window data (chk = S[ang_pos+1]*100 of the PREVIOUS divide): nir/sense/rest/wall fire at
  chk=64.97; sel1 (selectOn=0, shifted positions) aligned through chk=81.96/94.84/73.87/90.46 then
  fired -> served threshold in (64.97, 73.87); served-child slot 11 measured = 5.0 (inherits) ->
  the threshold is NOT the cell mutationRate slot. Compiled-default boundZone=70 fits numerically
  but the step-0 bit-exactness forbids a constant threshold at step 0.
- Diverging-cell features: wall1 cell52 vx=vy=0 (maxSpeed==0, interior); sel1 cell49 vx=vy=0
  (maxSpeed==0); nir1 cell54 x==bx0 exactly (edge-clamped by the divide clamp), maxSpeed>0.
  Working hypothesis: a v6/v8b update channel (stalled/pressed-cell jitter, 2 draws) gated on
  maxSpeed==0 or exact-edge contact - never fires at step 0 (originals: maxSpeed>=2, positions
  off-clamp), fires ~per-cell at step 1. Next: 20-run correlation of firing vs (cms==0, exact-edge)
  computed from the replayed stream, then implement behind CA2_TRIG_MSUN.

## CA-38b attribution update (2026-11-08 ~05:22)

Confirmed harness builds J from `vr('P')` = ca2.js DEFAULTS only; the line-64
Object.assign preset is NOT loaded. Runtime P = pristine defaults + SET overrides,
so packed p[23]=boundZone=70, CELL_RADIUS=10 (matches observed child nr=10).

- 20-run correlation (nir config, /tmp/cor1..20.txt): with selectOn=1 every run
  diverges at fb=1; divide#0 chk = S1[ang0+1]*100 = 64.97 always. With selectOn=0,
  divides at chk 81.96/94.84/73.87/90.46 stay aligned; +2 then appears on a
  maxSpeed==0 cell's own update. Window: threshold in (64.97, 73.87), consistent
  with 70 (the packed boundZone value; literal-70 vs p[23] indistinguishable
  because boundZone is load-bearing in keepIn - SET=boundZone=20/100 probes are
  contaminated: populations explode js 1068 / wasm 2685 via the death channel).
- BORNP age probe (new slot-23 dump): wasm parent age at step 1 = 0, so a
  5+age-style threshold is dead; the threshold is constant ~70 within a step.
- Model: mechanism A: served divide() mutation check fires at rnd(100) < ~70 in
  the step-1+ stream (step 0 unaffected - likely gate or origin difference still
  under investigation); mechanism B: served update path draws +2 for
  maxSpeed==0 cells (velocity channels only, energy/radius untouched).
- Next: pin whether A is p[23]-bound or literal via a keepIn-decoupled probe
  (e.g. BOUND=1 mode or boundAware=0), then implement both behind
  CA2_TRIG_MSUN and run the battery.

## CA-38b RESOLVED (2026-11-08 ~05:38): served divide child maxSpeed = max(0, 10+sv*15) * mutated g.spd

The step-1+ desync was NOT a draw-stream shift. It was a value-level difference the
TR2 |dp| formula (x,y,en,g,vx,vy) could not see at birth: the served binary applies
the Cell-constructor genome multiplier to the child's maxSpeed
(ca2.js line 120: `maxSpeed *= genomeOn ? g.spd : 1`), using the MUTATED genome.
Measured 8/8 exact: wasm child slot-8 maxSpeed == max(0, 10+sv*15) * child g.spd,
all digits; birth velocity stays on the pre-multiplier value (step-0 was already
bit-exact, velocities included). From step 1 the maxSpeed enters the update path
(limit cap, organic lerp target q*maxSpeed, keepIn ms=maxSpeed+1, crowd push), so
every moving newborn diverged while stationary (maxSpeed==0) newborns, originals
and the divide draws themselves stayed aligned. This also explains: energy/radius
untouched (maxSpeed feeds neither), zero extra stream draws (children of diverging
parents still bit-aligned), the false "chk window (64.97,73.87)" (span analyzer
misattributed the first diverging CELL to the preceding divide), the v=0 clean
cells, and why SET= senseR/restless/wallCarry probes could not kill it.

Fix (test/ca2.js, behind globalThis.CA2_TRIG_MSUN, flag-free path untouched):
cms0 = max(0, 10 + sv*15); child maxSpeed = cms0 * cgm.spd; birth vx,vy = cv*cms0.

Verification (engine = test/ca2.js itself, nir config
SET=divideOn=1,divideAt=0.5,interactionRadius=0, TRACE2 CA2TRIG FULLST BORNTR BORN
RCCNT, STEPS=10, nStates=1): 4/5 runs 10/10 steps bit-exact (max|dpos| all
0.0000); 1/5 diverges at step 9 with |dp|~6 (rare late residual, next target).
Pre-fix: 8/8 runs diverged at step 1.
Battery: ON default ORACLE 0.00% (0/800) PASS; OFF battery unchanged:
default raw 29.88% (known trig baseline), BOUND PASS maxAbsDiff 0.00,
FULLST10 PASS, BIRTH 800x4 PASS, EAT 800x4 PASS, LOGCHK 200x4 PASS.
Harness notes: nStates>1 wasm state is NOT reset between states (population
accumulates) - only state 0 is valid in multi-state BORNTR runs; single-state
runs: argv[5]=1. New probes: BDEAD (dead slot list), BORNC ms/sv, BORNP ms,
DD=<step> full js/wasm JSON dump of every velocity-diverging cell at that step.
Residual (CA-38c): rare step-9 velocity-channel divergence (|dp|~6, envV ~0.5%
off, energy exact) - maxSpeed-genome aligned, suspect a second late-blooming
channel (candidate: genome-channel draw order inside mutGenome visible only via
behavior, or a limit()/cap edge).
CA-38b follow-up: the genome-multiplier fix (798b7fb) moved runs from 0/8 past step 1 to 4/5 fully bit-exact over 10 steps. The rare remaining failure (CA-38c) has a distinct signature, now measured:

- With nir config (divideOn, divideAt 0.5, interactionRadius 0, STEPS 10, DD=-1 all-steps dump), the first divergence appears at a late step (observed 4,7,8,9 across unseeded runs) with |dp| ~5.46, then explodes next step (|dp| > 300) once a divide/death gate flips.
- Seed-step signature: ~88% of cells (253/288) show small velocity-only diffs (|dv| ~0.1-0.5) with energy/radius/gene EXACT and arrays aligned (no death mismatch). Genome channels (spd/app/bnd), maxSpeed and speedModifier were added to the snapshot: ALL bit-identical across engines for diverging cells. Clean cells appear in scattered gaps (32,40,47,51,59,72,90,95,98 clean while neighbors diverge).
- At the seed step, exactly one divide occurred (pack.n 288->289). Small |dv| with identical inputs says the draws are the same magnitude class but shifted: consistent with a draw-consumption difference during the step-5 divide (the previously falsified "+2 mutation-gate draws" theory is not dead for these rare steps: chk in [5,70) is only reachable when a mutation actually fires, which needs chk<5 in JS terms... under investigation).
- The scattered clean gaps and small |dv| also admit a wasm slot-reuse/order explanation (readback order diverging from splice order after a birth into a freed slot); discriminating via the step-5 divide's DIVP rc and stream positions next.
- Tooling: snap() now captures genome channels + maxSpeed + speedModifier; DD=-1 dumps all steps. Mutation-gate threshold probes (SET=boundZone=20/100, STEPS=3) fully aligned: the served divide mutation gate matches JS rnd(100) < c.mutationRate with no threshold quirk at default scale.
CA-38c RESOLVED (engine fix behind CA2_TRIG_MSUN): the rare late-step (4-9) residual was the divide population gate evaluated against a DIFFERENT population count. The served binary removes a dead cell immediately, so its gate count excludes cells killed earlier in the same step; JS defers removal to the post-pass splice, so cells.length still includes them and the gate stays closed at the cap. When a death and a gate-passing cell coincide in one step at the cap (population == max(60, UNIVERSE_SIZE*4)), the wasm divides (+12 draws mid-step) while JS does not: a one-event stream shift, small velocity-only diffs from the divider down the processing order, energy/radius/genome exact, arrays aligned (the harness's BORNTR readback appends the wasm child to JS). Next step the JS gate is still closed while the wasm's child exists: explosion.

Evidence chain: seeds 12/20 baseline, 0/20 with selectOn=0, 0/20 with selStrength=0.0001 (kills/deaths required); BORN trace: growth stops at the cap (U*4: 25->100, default 75->300), then exactly one birth AT the cap coincident with a death (aliveSlots 300 flat, topAlive 299->300) at the seed step; a select-killed cell with en<1 did NOT divide in JS (no KDIV), ruling the kill-divide path out; the <= gate variant makes it WORSE (13/20, seeds at the step the cap is reached). Fix: the flagged gate counts live cells (liveCount scan, O(n) only when the other gate terms pass); flag-free path keeps shipped cells.length. Verification: nir STEPS=10 0/15 seeds (baseline 12/20; p ~ 1e-6 under the old rate). Dead-cell's-own-divide (select-killed cell with en>1) remains unprobed; no evidence it occurs (the one observed kill had en<1).
