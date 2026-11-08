# CA-41: contact-event paths - first measurement (2026-11-08)

Scope: the interact() event gates (eatChance, mergeChance/fuse/pair,
reproChance contact birth) had NEVER been exercised by a TR2 parity run:
the FULLST harness force-zeroes reproChance/divideOn/eatChance/mergeChance
("constant population" legacy, harness line ~159) and the line-78 P.*
assignments in ca2.js (eatDistF/fuseDistF/symDistF) sit OUTSIDE the object
the harness extracts, so those keys were undefined (NaN-gated) in every
prior run. SET= overrides both (it runs last). Every config below sets all
event keys explicitly via SET= and prints non-vacuousness counters.

## Non-event contact channels: bit-exact

Energy transfer, gene drift, hostility push, hit counter and the pair
iteration order are bit-exact under heavy contact load:

- ir=20, 40 cells, STEPS=10: CLEAN, contacts=16813, hit=14830
  (FEED=24 TRACE2=1 CA2TRIG=1 FULLST=1 STATESEED=k
   SET=divideOn=1,divideAt=0.5,interactionRadius=20,foodEatR=8 STEPS=10
   ARGV="1 40 160 1")
- ir=40, 60 cells, box 120: CLEAN at both measured step counts:
  - STEPS=10 (the run this file first mislabeled "120 steps" - 120 is the ARGV
    box size, not the step count): contacts=218440, hit=84208, divide=299
  - STEPS=120 (goreda round13 config, re-run here on the fixed harness,
    identical counters): contacts=4799239, hit=3199249, divide=1892
  (FEED=24 TRACE2=1 CA2TRIG=1 FULLST=1 STATESEED=1
   SET=divideOn=1,divideAt=0.5,interactionRadius=40,foodEatR=8 ARGV="1 60 120 1")

## New divergence loci (all flagged CA2TRIG=1, STATESEED=1, 10 steps,
## ARGV="1 40 160 1", common SET prefix: divideOn=1,divideAt=0.5,
## interactionRadius=20,foodEatR=8,eatDistF=0.85,fuseDistF=0.6,symDistF=1.1,
## reproMinAgeMs=100 - isolated one event family at a time)

### Locus A - eat events (eatChance=0.15, mergeChance=0, reproChance=0)

SEED step=5. Eaten counters fire (eaten>0 both sides before the seed); the
first divergence is a value cascade (energy/radius after an eat), not a
population flip. Config: ...SET=...,eatChance=0.15,mergeChance=0,reproChance=0.

### Locus B - merge family (mergeChance=0.03 -> merge/fuse/pair)

Was: SEED step=1, population js 148 wasm 146. First attribution round:

1. HARNESS ARTIFACT found and fixed (same commit as this note): the harness
   never round-tripped sym links. The app wasm-mode frame packs the sym
   partner's slot index (ca2.js:1063 slot 14) and restores it after the step
   (ca2.js:1094); the harness packed -1 and never read slot 14 back, so every
   pair event's sym link vanished on the wasm side at the next pack and the
   sym gate (short-circuit on !a.sym) consumed rolls the JS side skipped.
   The readback now restores sym via a slot->cell map (1:1 the app), the pack
   sends the identity-checked partner index, and the comp slot (21) is
   mirrored for existing cells too (comp is write-only in ca2.js: fuse
   accumulation + a display stat, proven inert by source read and by an
   unchanged signature after the fix).
   After the fix: steps 0-1 bit-exact, SEED moves to step 2 (POP js 279 wasm
   278, per-step EVCHK counters: births js 133 wasm 132, merge js+10 wasm+11,
   fuse 2=2, hit js+514 wasm+518).
2. The residual is in the FUSE path: symbiogenesisOn=0 makes the config
   CLEAN for 10 steps; symbiosisOn=0 still SEEDs; both off: CLEAN.
3. The first fuse is bit-exact (same pair, product radius
   13.010764773832475 both sides) - gate distance uses the RAW radius
   (effR variant REJECTED: flips the signature to js 270 wasm 278) and the
   product arithmetic matches.
4. The second fuse fires on different pairs (js: (68.94,116.51)x(63.13,115.90)
   roll 0.00583; wasm: product at (147.88,55.31) - js never fuse-gated that
   coordinate). Roll stream aligned through the first fuse, then one gate
   evaluation's worth of consumption differs.
5. REJECTED hypotheses (variants in devtools/, all one-line): V1 skip the eat
   roll at eatChance=0 (SEED step 0 - the served binary DOES consume
   zero-chance event rolls); V3 no sym partner clearing on fuse (unchanged
   279/278; fuse-1 participants were sym-linked to EACH OTHER, no third-party
   clearing ran); V4 no re-fuse of composite cells (js 274 wasm 278).
6. Probe variants committed: ca2-mergeprobe-v1/v2/v3/v4.js, ca2-fuselog.js,
   ca2-fuselog2.js (js-side step-2 fuse/divide gate logs). Harness: EVCHK=1
   prints per-step wasm sim_out counters vs js; FUSECHK=1 prints r>12 cells
   at step 2 on both sides.
7. SYMCHK=1 (harness): sym mirrors verified IDENTICAL at steps 0-1 (indices,
   coordinates, partners - 3 links each side). The step-2 flip is not a
   sym-state difference at step start. Full ordered gate log (ca2-gatelog.js,
   step 2, every roll-consuming gate): between the two fuses js consumed 14
   rolls (EAT/FUSE/SYM x2 pairs of the grown product, EAT+SYM on a third
   pair - no fuse roll there because dist 17.27 > (13.01+10)*0.6 fails the
   gate - then SYM/MERGE/SYM/MERGE/SYM/MERGE/FUSE on the next cell's pairs).
8. LEAD HYPOTHESIS for the second-fuse flip (H-dead): fuse 1 is the FIRST
   kill in the run (no deaths/eats/fuses at steps 0-1: pop arithmetic
   40+36=76, 76+72=148, 148+133-2=279 exact). The js frame has no alive
   check before the pair loop - interact() early-returns on !a.alive before
   any roll. If the served binary does not early-return the same way for
   pairs whose outer cell was killed mid-step (its turn comes later), it
   consumes rolls js skips, the stream shifts by one, and the next passing
   fuse roll lands on a different pair (js (68.94,63.13) roll 0.00583 vs
   wasm product at (147.88,55.31)). Next probes: dead-cell pair-consumption
   micro-config (2-3 cells, forced step-0 fuse, a distant witness cell whose
   wander draws reveal the stream position), then the flag-gated product fix.
Next probes: per-pair roll-consumption reconciliation in the window between
the two fuses (fuse-gate condition set for the grown product's later pairs,
pair-iteration order after a mid-loop kill), then a flag-gated product fix.

### Locus C - reproduce (contact birth): served binary never fires under FULLST pack

With divideOn=0 (keeps population under the reproduce cap
cells.length < UNIVERSE_SIZE*4 = 300), reproChance=0.5, reproMinAgeMs=100:
JS births 30 over 10 steps (birth=30, divide=0), wasm births ZERO; SEED
step=5 (population js 47 wasm 40). With reproMinAgeMs=0 the seed moves to
step 0 (js 43 wasm 40, JS births 274 over 10 steps, wasm still zero), so
the age-gate time source is RULED OUT as the locus. Remaining hypotheses:
the served binary reads reproChance/reproMinAgeMs from different pack slots
than the harness writes (p[58]/p[59]), or its contact-birth gate has an
extra condition under the full-step pack. The BIRTH-mode battery (CA-3)
proves the served binary CAN contact-birth in the other pack mode.
Config: ...SET=divideOn=0,...,eatChance=0,mergeChance=0,reproChance=0.5
(reproMinAgeMs=100 and =0 variants).
NOTE: reproduce coverage requires divideOn=0 or a config that stays below
the 300-cell cap; at the cap reproduce is structurally blocked in BOTH
engines (identical gate), which previously read as vacuous CLEAN.

## Harness changes in this commit (t70-interact-iso-served.js)

- Contact counter (globalThis.__CT) in the frame template; TR2CH now prints
  contacts/eaten/pair/hit/merge/fuse per run (non-vacuousness markers).
- POP-mismatch branch prints a greedy sorted-walk pop-diff with ONLY-JS /
  ONLY-WASM rows (first-attribution aid; near-miss cells appear on both
  sides by design).
- Trace smoke (battery): proves the TRACE=1 FULLST branch runs and prints
  its marker only; it does NOT assert traced-value parity (TRACE mode has no
  aligned RNG; js/wasm trace values legitimately differ). Traced-value parity
  is covered only by the TR2 aligned-RNG compare. (goreda round14)
- TR2CH wording fixed: cl/comp inertness is NOT universal; it holds only
  when merge=fuse=0 for that run. The CA-40 'CA verifier limits' section is
  amended by reference: cl/comp inertness is proven per run with
  merge=fuse=0 (counters printed), not unconditionally.

## Accounting for this investigation (completed/crashed/unrun)

Non-event proofs: ir=20 x10 seeds + ir=40 x1 heavy config, 11/0/0, all
CLEAN. Event-family probes: all-events x1, A x1, B x1, C x3
(incl. habitatOn=1 and reproMinAgeMs=0 variants), 6/0/0, all SEED by
design (discovery runs, not gates). Runner selfcheck: PASS (see report).

## Round 3 (2026-11-08 late morning): stream-position analysis, false-clean correction, new locus D (food path)

### Corrections to round-2 hypotheses

- The earlier fb10 "FUSEBREAK: CLEAN" result was a FALSE CLEAN: the eval that
  produced it ran with an empty CFG (a failed && chain swallowed the variable),
  so no FULLST/STATESEED/TR2 ran at all. Re-run properly, break-after-fuse does
  NOT align the seed-10 world (SEED step 0 unchanged). H-dead (dead-cell roll
  consumption, any subset: gate rolls only, tail rolls, fuse-roll inserts K=1..3,
  pair-loop break, pair-loop restart) is REFUTED by emulation: every variant
  changes the outcome signature away from the served one (fuse counts 1,3,4 vs
  the served 2, pops 274/278/280 vs 278).

### Stream-position analysis of the locus-B second-fuse flip

The TR2 per-step stream is exactly reproducible offline (makeRng port). At
locus B step 2: js's first fuse roll sits at stream index 2276 (roll
0.003689085720500307), the second at 2337 (roll 0.005832443672270093, offset
+61). Sub-0.009 draws in the window +1..+250 exist ONLY at +61 and +81
(0.0012576508670320008). The served binary's second fuse (product at
(147.8812,55.3051), radius bit-exact 13.010764773832475) therefore used one of:
(a) the +61 draw - identical roll consumption between the fuses, so the served
engine gated a DIFFERENT PAIR at the same stream position (pair-set/order
difference after the mid-step kill, not a roll-count difference); or
(b) the +81 draw - the served engine consumed exactly 20 more rolls than the js
frame between the fuses. All constant-offset emulations tested (dead-a gate
rolls, break, restart, break+dead-a, break+fuse-draw) land on neither. The
discriminating probe is a food-free single-fuse micro-world (below).

### NEW LOCUS D: food-eat path (seed-10 microscope)

FEED=24 worlds with interactionRadius=20 host a food-path divergence, isolated
in the STATESEED=10, 14-cell, divideOn=0, mergeChance=0.1 world, step 0: one
fuse each side, fused product BIT-EXACT (position + radius
22.55697919103689), then sorted cell 10 diverges: js r=5.158670920258665 /
en=19.492568488277215 vs served r=4.558670920258665 / en=14.492568488277213 -
EXACTLY one food eat (foodGrowAmt 0.6, foodEnergyValue 5) at fd=5.63 with
eatR0_ = 4.5587+8 = 12.56. The js frame consumed the eat roll (rc-logged); the
served binary consumed no roll for that cell's food scan (one-cell downstream
draw shift; the fused product, processed earlier, stays bit-exact). So the
served eat gate is narrower than r+foodEatR under this config's conditions,
even though the CA-40 eat config (interactionRadius=0, divideOn=1, 20 seeds x
30 steps) eats in lockstep at the hoisted range. What differs (range basis,
hunger gate, scan position) is open. In the locus-B 40-cell world, all step-2
FOODEAT events sit at rc 3974+ - AFTER the second fuse (rc 2338) - so the food
path does NOT explain the locus-B flip; it contaminates only later stream
positions and the FEED=24 micro-worlds. Micro-world probes for locus B must
run FEED=0 (or verify no FOODEAT lines in the window).

### Runner fail-closed contract (R2AH review of 0c5edb6, resolved)

devtools/ca2-parity-run.sh now refuses vacuous probes: REQUIRE=comma-list
(each named env key must be non-empty), REQUIRE=SEEDED-FULLST (FULLST=1 without
STATESEED is refused - the empty-CFG false-clean class), NEEDCOUNT=comma-list
(each named counter must be nonzero on some side in the TR2CH lines - an
all-zero event gate proves nothing). All violations exit 2 ERROR, never clean.
Negative test devtools/t-runner-failclosed.sh (6 checks incl. the exact
empty-CFG shape of the false clean) is wired into the battery tail. Unseeded
FULLST verdict comparisons (the birth-mutation battery mode) remain allowed
without REQUIRE. Full matrix re-verified through runner verdicts with
REQUIRE=SEEDED-FULLST + NEEDCOUNT=divide: eat x20 20/20 CLEAN, no-eat x45
45/45, ir=0 x20 20/20, boundAware=0 x10 10/10 TR2-exact (runner ERROR = known
pressed-cells artifact), battery + trace smoke + selfcheck PASS.

## Round 4 (2026-11-08, on 9ccf63b): seed-11 turn structure, probe vacuity found, emulations refuted

### Runner (R2AH on 9ccf63b)
- Header fixed: fail-closed gates are OPT-IN (REQUIRE/NEEDCOUNT supplied); default unseeded FULLST stays allowed verdict-only. The broad "FULLST without STATESEED is refused" wording was wrong.
- REQUIRE keys are allowlist-validated as env identifiers before eval; SEEDED-FULLST is a pseudo-key, never evaluated (was passing the generic eval as a variable fallback).
- Header notes: NEEDCOUNT proves non-vacuity (one side >0), NOT parity; the verdict path still catches event divergence. The 95-run matrix is a writer result, not independently rerun. The roll-offset remains a hypothesis, not a fix.

### Seed-11 FEED=0 microscope (SET divideOn=0,ir=20,eatDistF=.85,fuseDistF=.6,symDistF=1.1, eatChance=0,mergeChance=0.15,reproChance=0; ARGV "1 20 160 1"; STATESEED=11)
- New probes (env-gated, inert when unset): TURNRC (per-turn alive+rc at turn start), TURNINS (insert 1 draw at end of turn N), DEADROLLS (insert K draws for a dead cell's turn), EVT (wrap fuseCells/joinCluster: event, rc, cell indices), DDI (index-aligned pre-sort per-cell |dx|+|dy| dump).
- Step 0 event map: MERGED rc=71 pair (a=12,b=9) [joinCluster: clustering, NO death]; FUSED rc=98 big=9 sm=3 (one gate roll consumed at rc=98); pop 20->19 both sides; all counters match (merge=1 fuse=1 hit=6 birth=0).
- Quiet turn = 5 draws (envNoise x2, wander rand2D, select roll, crowd death roll). Merge turn=12, fuse turn=9.
- DDI: post-splice idx 9-18 EXACT (pre-splice 10-19), idx 0-8 diverge (0.058-2.13) = pre-splice {0,1,2,4,5,6,7,8,9} - the fuser (post-splice 8 = pre-splice 9) DIVERGES. The desync begins AT the fuser's own state, not after it.
- SYMCHK: no sym links at steps 0-2 in seed 11 (sym-link roll hypotheses dead here).

### VACUITY FOUND: FUSEBREAK / FUSERESTART probes never fire
interact() returns undefined on every path (bare returns). The template probes `if(interact(c,ck2))break` / `{k=i;continue;}` are VACUOUS - the round-3 "refuted: pair-loop break after fuse" and "pair-loop restart" conclusions are VOID and must be redone with a working event signal. The EVT wrapper (fuseCells/joinCluster) is the non-vacuous signal. NOTE the earlier fb10 false clean was a separate empty-CFG defect; this is a second, distinct vacuity in the same family.

### Emulations refuted this round (all seed-11 step-0, runner verdict, TR2 FIRST quoted)
- TURNINS=7,8,9,10,11,12 (+1 draw at end of turn N): no CLEAN; T>=10 kills the fuse (pop js 20 vs wasm 19). Insert-at-turn-end at any single turn is not the desync.
- DEADROLLS=1,2,3 (wasm consumes K draws in the dead cell's turn; js update() early-returns on !c.alive, confirmed by inspection): all |dp| 4.09 (worse than baseline 3.15). REFUTED at the exact position.
- fuse-no-roll (fuse gate roll removed, constant-true): js over-fuses massively (pop 14-17 vs wasm 19-20 across 12 seeds). The served binary DOES chance-gate the fuse. REFUTED. (Seed 4 passed identically under both - single qualifying pair worlds can't distinguish; multi-pair worlds can.)
- Screening bug caught: grepping logs for 'TR2 FIRST' with a CLEAN fallback masks ERROR verdicts (a crashed harness read as "CLEAN" 13 times). Seed sweeps must read the runner verdict line (PASS/FAIL/ERROR), never grep the log. This is exactly the vacuous-clean class the runner now guards; the guard applies only when the verdict is read.

### New lead: fuse-formula difference (no stream shift required)
The fuser's own state diverges. interact(a,b) writes BOTH cells, so a wrong fused product propagates kicks down the processing chain (turn 9's post-fuse pairs kick cells 8..0) with NO draw-count difference. Consistent with: all counters matched, quiet-turn 5 draws matched, TURNINS/DEADROLLS/no-roll all refuted, 40-cell world bit-exact through step 1 (its step-1 fuse pair-set matched; seed 11's may not). Next: reconstruct big/sm pre-fuse state, solve which blend maps inputs to the wasm's exact product (radius/velocity/energy), then emulate.

## Round 5 (2026-11-08): locus B fuse residual solved at step-0 level (3 ingredients), keepIn zone sub-locus opened

Microscope: N=4 micro-worlds (SET=divideOn=0,interactionRadius=200,eatDistF=0.85,fuseDistF=20,mergeGene=100,symDistF=1.1,reproMinAgeMs=100,eatChance=0,mergeChance=1,reproChance=0, ARGV="1 4 160 1", EAT=1 REQUIRED - the wasm pack only receives the SET factors with EAT=1; sweeps without it compared js-fused vs wasm-UNFUSED worlds and are void). In 10 of 19 firing worlds the fuse turn's own cell is the internal big, so nothing touches the product after the fuse and the wasm end-state reads its at-fuse writes directly. New probes: ITRACE (per-interact rc/positions/velocities), KWRAP (per-call keepIn in/out), VPROBE (synthetic-cell keepIn oracle), RAWALL/PRESTEP dumps.

CONFIRMED served-binary fuseCells behavior (emulation CLEAN 0.0000 on N=4 seeds 11 and 1, plain ca2.js SEED 3.9px):
1. ZERO stream draws (js: 8 = mixShape newShape 7 + coin flip 1). Proven by stream-localization: the post-fuse kick/organic/select draws sit at seed-independent stream positions; only draw-shift Kw=0 reproduces the wasm cell-0 trajectory (err 0.048 vs >=0.34 for Kw 1..24; js-side chain validated to 1e-9).
2. Keeps the internal big's genome bit-exact (js mixGenome per-channel average; 0 draws both sides).
3. Writes NO velocity: at-fuse product v = big.v exactly (recovered wasm at-fuse v = big.v + the subsequent pair's hostility push to 5e-6).

NEW SUB-LOCUS (keepIn zone, previously masked): the served binary's keepIn zone z behaves bnd-SCALED (z=min(70*bnd, cont.w/2.5)) at the update-internal call but UNSCALED at the post-pair call for the fused product (effective z=64 at bnd=0.906988: sqS/envV/crowd reproduced to <1e-9 by the two-pass asymmetric model; symmetric bnd-scaled and symmetric unscaled both fail). OPEN: a seed-7 corner cell (bnd=0.851822 at (50.014,41.562)) gives wasm sqS=0.307618 implying effective z=60.028 - neither 70*bnd (59.6275) nor 64. Zone rule needs one more constraint (candidates: position at pass time, per-side terms, radius terms). Emulation vehicle: devtools/tmpv-fusecombo.js (FUSEMIX=0 drops mixGenome, FUSESHP=0 drops mixShape) + harness ZNOBND2=1 (keepInNB unscaled post-pair clone, env-gated).

Status: CA-41 REMAINS OPEN. Seeds 7/10 step-0 and seed-11 step-1 residuals (~0.1px, corner/wall-press family) under investigation; loci A (eat step-5 cascade), C (reproduce), D (food gate) untouched this round.

## Round 6 (2026-11-08, late): LOCUS B zone rule SOLVED - products use a persistent re-averaged "zone bnd"

The round-5 open item (seed-7 corner z=60.028, "needs one more constraint") and the seed-10/seed-11 product zones are all one rule. Instruments: CELLSJSON mkState oracle (exact caller-supplied cells into the BOUND keepIn-only mode), KWRAP with container coords, an exact Python keepIn replica (/tmp/zfit.py method: crowd+envV are exact functions of press and hence of the zone; solve the zone from the wasm's end-of-step cr/envV, then validate against v/position to 1e-9).

1. ORACLE (BOUND, p[56]=2, 13 exact cells incl. corner pass-1+pass-2 states): wasm keep_in == js keepIn, bnd-scaled, maxAbsDiff 2.78e-2, no channel >0.05. The keepIn FUNCTION is shared; all locus-B divergence is in WHICH bnd feeds the zone for fused products.
2. mixGenome = per-channel AVERAGE on the js side, exact: product bnd 0.9583335555451596 = (0.9069879075766167 + 1.0096792035137026)/2.
3. Served fuseCells keeps big's genome STORED bit-exact (RAWW product bnd == big's), keeps big.v, writes r/en, consumes ~1 stream draw (coin).
4. THE RULE: a fused product's keepIn zone is min(70*zb, w/2.5, h/2.5) where zb is a PERSISTENT cached zone-bnd carried on the cell: zb = (zb_big + zb_sm)/2 at every fuse, with zb == g.bnd for never-fused cells. It applies at BOTH passes, on the fuse frame AND all later frames; the stored genome still keeps big's bnd (so the zone bnd and the stored bnd diverge after a fuse).
   - seed-10 world (4-cell micro-world, pair (3,0) fuse): fitted wasm pass-2 zone 59.950668569 = 70*(0.8216093218975853 + 0.89126692293323)/2 to 1e-9; pass-1 (pre-fuse, ordinary big cell) = 70*0.8216093218975853 = 57.512652533 to 8e-11; pass-2 input v and gene=4 recovered EXACTLY equal to the js chain. The whole step-0 chain is js-identical except this one zone.
   - seed-11 product: zb = 0.9583335555451596 -> 70*zb = 67.08 -> capped 64 = observed.
   - battery standing product (bnd stored 0.836327, fused an earlier frame): wasm sqS=0.1205678 = 1-56.28/64 (capped avg zone) vs stored-scaled 58.54 - proves PERSISTENCE across frames.
   - battery gen-2 product (stored bnd 1.0268): wasm zone 62.206 = 70*(0.9583+0.8190)/2 pattern - proves RE-AVERAGING of the cached zb at the second fuse, not a recompute from the stored genome bnd.
5. Emulation (env-gated, default OFF): CA_JS=devtools/tmpv-fusecombo.js FUSEMIX=0 FUSESHP=0 FUSEKINB=1 EAT=1; harness keepInFB variant + persistent __fuseKiB marker with symmetric re-averaging. Verdicts: STATESEED 11/1/7/10 micro-worlds ALL CLEAN 0.0000 (seed 10 was the holdout; the persistent+re-average fix closed it).
6. Full matrix re-run after the harness edits (goreda rule): failclosed PASS, selfcheck PASS (deliberate crash -> exit=1, never clean), t-birth-mutation PASS (all 9 mutants + shp guard + failclosed suite), no-eat x45 45/45 CLEAN, eat x20 20/20 CLEAN (REQUIRE=SEEDED-FULLST + NEEDCOUNT=divide). Flag-free default behavior bit-unchanged.

REMAINING RESIDUAL (default 10-states x 3000-trials battery, still SEED step 0): (a) gen-2+ products: same-zone (sqS identical) but crowd/envV/v deltas ~3e-3..5e-2 - the re-averaged zb still drifts from the wasm's by generation 2+ in some lineages, or a pass-2-only detail; (b) en-only deltas ~1e-4..3e-3 on fuse products (fuse energy merge formula/timing: js en=(b+s)*0.85; served differs slightly); (c) kick-draw interleaving around fuse pairs still unmodeled. OPEN instrument anomaly: FUSEDBG (fuse-time print inside fuseCells) did not show the ITRACE-logged (3,0) fuse first - the battery sections' fuses interleave in stdout; per-section tagging needed before trusting fuse-time prints. Next: gen-2+ zb refinement via a controlled two-generation fuse micro-world; fuse energy via FUSED-log en deltas; then the flag-gated product fix in test/ca2.js (default OFF) + 20+ seed gate.

Status: CA-41 REMAINS OPEN. Locus B root-caused and emulated (single-seed fuse worlds clean); battery residuals (a)-(c) and loci A, C, D open.

## Round 7 (2026-11-08, late): update-internal zb dispatch + fuse-frame zone rule; 2-gen world clean to the energy floor

Controlled two-generation fuse world (CELLSJSON injected: A bnd 0.8 r10, B bnd 1.2 r5, C bnd 0.6 r6; gen-1 fuse at t=33.4, gen-2 at t=50.1; FUSEDBG now prints frameT/x/y/zb lineage):

1. UPDATE-INTERNAL keepIn ALSO uses the product's zb zone (not the stored bnd): the fuse happened in the small cell's turn, so the product's own-turn update ran post-fuse; the wasm's update-internal keepIn pressed the product with z=70*zb1 (=64) while the harness only patched the post-pair call site (z=70*stored=56) - the exact "same sqS, different crowd/envV/v" signature from the battery (cr chain reproduced to <1e-9: 0.041540446 -> 0.058742 internal -> 0.07387307324296151 post-pair == wasm bit-exact). Fix: under FUSEKINB the generated-scope keepIn itself dispatches on the cell's zb marker, so update-internal and post-pair both see it (call site reverted to plain keepIn; ZNOBND2 path untouched).
2. FUSE-FRAME vs PERSISTENT zone: on the fuse frame itself the product's zone uses the parents' STORED-bnd average (gen-2: (0.8+0.6)/2=0.7 -> z=49 -> wasm sqS=0, no press, no cpush, double crowd decay 0.0739*(1-kr)^2=0.07094196643175724 == js exactly); from the NEXT frame the persistent re-averaged zb applies (gen-2: (zb1=1.0 + 0.6)/2=0.8 -> z=56; wasm step-3 sqS=0.04104846451941213 = 1-53.7013/56.001). Simple-stored (0.7 persistent) and no-update (1.0) rules both falsified; battery gen-2 case (stored 1.0268, z=62.206=(0.9583+0.8190)/2*70) confirms re-averaging for standing products. Emulation: big.__fuseKiBF (frame-scoped, stored-bnd avg) + big.__fuseKiB (persistent, symmetric zb avg); dispatcher picks __fuseKiBF when __fuseKi===frameT.
3. Result: the 2-gen world runs 6 steps at max|dpos| <= 0.0015 = the fuse-energy floor only; step-1 product bit-exact on every motion channel. Fuse seeds 11/1/7/10 still CLEAN 0.0000; no-eat x45 45/45, eat x20 20/20, failclosed PASS, selfcheck PASS, birth-mutation PASS after the edits.
4. FUSE ENERGY residual (only remaining divergence in the controlled world): served fuse-en is slightly ABOVE js (b.en+s.en)*0.85: gen-1 delta +1.4868e-3 on 84.81, gen-2 delta +1.3965e-3 on 114.37 (product metabolism between keepIns is constant-subtractive 0.065372 both steps, so deltas are at fuse time). Not constant, not proportional to b.en+s.en, not symEnergy*x2; formula unresolved. Battery: en-only deltas up to ~6e-3 per fuse on products.
5. Statistical battery (10x3000, unseeded) still SEED step 0 with reduced amplitude (~0.11 max): residual classes now (i) rare sub-percent sqS zone deltas on frame-0 products (fuse-pair timing/lineage cases the two-rule model does not cover yet), (ii) same-sqS crowd/envV/v deltas ~1e-2, (iii) en-only deltas. All single-seed fuse worlds clean.

Status: CA-41 REMAINS OPEN. Product-zone rule complete for 1- and 2-generation lineages; fuse energy formula and the residual battery classes open; loci A, C, D open.

## Round 8 (2026-11-08 late wake): fuse-energy delta is constant per fuse, not proportional to en sum

Controlled single-fuse world (/tmp/1gen.json: A r10 bnd0.8 en30 + B r5 bnd1.2 en10, CELLSJSON, STATESEED=1, same harness flags as round 7):
- js fuse-en = (29.863446606 + 9.794811670)*0.85 = 33.709519534; wasm end-en + metabolism => wasm fuse-en = 33.711006328.
- delta = +0.001486794 -- IDENTICAL to the 2-gen world gen-1 delta (+0.00148679327) to ~1e-9, despite the en sum being 39.66 vs 99.78. RULES OUT any en-proportional term. delta is a per-fuse additive constant for r10+r5 fuses.
- gen-2 fuse (product r10.276 + C r6) had delta +0.0013965 -- different, so the constant depends on something other than en (radius pair? comp count? gene pairing?).
- delta does NOT accumulate: st=3 and st=4 en deltas both exactly +1.4868e-3 (m identical js/ws after fuse). Fuse-time one-off confirmed.
- New anomaly 1: m_js between fuse log and first DD print = 0.130744118 = exactly 2 x 0.065372059 -- the product was updated twice in that frame window here (fuse fired BEFORE the product's own update slot in the same frame; in the 2-gen world it fired after). Frame-position of the fuse inside the update loop varies with the coin timing.
- New anomaly 2: 1-gen post-fuse steps diverge on motion channels (st=3: same x/y but js sqS=0.4261 vs ws sqS=0.3442, vx 0.5803 vs 0.4621; st=4 max|dpos| 0.2841). Hypothesis: when the fuse fires before the product's own update slot, the fuse-FRAME stored-bnd zone (__fuseKiBF) must apply at the SAME-frame update too, or the zone emulation's frame boundary is off by one. 2-gen world never exercised this ordering. Open.

Round-8 addendum (frame-order analysis, test/ca2.js:2327-2345): the JS frame loop is descending-index `for (i = n-1; i >= 0; i--) { update(c_i); for (k = i-1; k >= 0; k--) interact(c_i, c_k); keepIn(c_i); limit(c_i); }`. So a fuse fires inside cell i's pair pass AFTER update(c_i) but BEFORE update(c_k) for every partner k < i. When the bigger cell is the LOWER-indexed partner (1-gen world: big A = cells[0], fuse in B's turn i=1), the product's own update + internal keepIn still run later that SAME frame - the fuse-frame zone rule must cover a post-fuse same-frame update. When the bigger cell is the higher-indexed one (2-gen world), the product's next update is next frame. This ordering difference is the likely root of anomaly 2: on the fuse frame the wasm product update already sees the newly stored bnd (avg 1.0, z clamped 64) AND the m=2x "anomaly" is just ordinary per-frame metabolism across the frames between fuse and the DD print (fuse at an earlier frame than in the 2-gen world), not a double-charge. The st=3 cr channel mismatch (js 0.2522 vs ws 0.2337 at identical x/y) says the wasm's keepIn zone on that same-frame update is NEITHER the harness-emulated stored-avg (z=64) nor the re-averaged (z=56) - cr ratio 0.9267, non-integer zone ~59 if linear. Next: fit z with zfit on the 1-gen world.

## Round 9 (2026-11-09): persistent product zone rule CORRECTED - stock genome-bnd, not re-averaged zb

The round-7 persistent re-averaged-zb rule is FALSIFIED; its 2-gen gen-2 validation was a coincidence ((1.0+0.6)/2 = 0.8 = the product's kept genome bnd).

Discriminating experiment (/tmp/1g2.json: A r10 bnd 0.6 + B r5 bnd 1.2, CELLSJSON, STATESEED=1): candidates separate cleanly - re-avg 0.9 -> z=63, big-kept 0.6 -> z=42. Wasm sqS fit at st=3 AND st=4: z = 42.0000 exactly (zb 0.6). The 1-gen world (0.8/1.2) fits z = 56.0000 = 70x0.8 the same way.

TRUE RULE (both halves now validated on independent worlds):
- Fuse FRAME (the frame the fuse fires, incl. the same-frame post-fuse update when the big partner is lower-indexed): zone from the parents' stored-bnd average (big.bnd+sm.bnd)/2 (__fuseKiBF) - validated at 2-gen gen-2 frame (0.7 -> z=49, bit-exact) and both 1-gen fuse frames.
- Every later frame: stock zone = 70 x the product's stored genome bnd (big's kept bnd, clamped) - validated z=42.0000 (1g2) and z=56.0000 (1-gen) via sqS press fits, and 2-gen gen-2 window (0.8 -> 56).

Harness change: dropped __fuseKiB entirely; the FUSEKINB dispatcher is now a fuse-frame-only override (else stock keepIn). KEEPINFB KWRAP logging added for the override path (env-gated, inert otherwise).

Result: all three controlled worlds (1g2, 1gen, 2gen) now run 6 steps FLAT at the fuse-energy floor: constant dpos 0.0026 / 0.0015 / 0.0014 = the en-delta only, motion channels bit-exact. Note the 1g2 floor gives a third en-delta data point: (big 0.6, sm 1.2) r10+r5 -> +2.6e-3, vs (0.8, 1.2) r10+r5 -> +1.4868e-3 (two worlds, identical to 1e-9), vs gen-2 (product r10.276 + C r6) -> +1.3965e-3. The constant keys on the bnd/radius pairing, NOT the en sum.

Matrix after the edits (runner verdicts): fuse seeds 11/1/7/10 (default STEPS=1) CLEAN 0.0000 x4; failclosed all pass; selfcheck PASS; t-birth-mutation PASS (all mutants detected); no-eat 45/45 CLEAN; eat 20/20 CLEAN (REQUIRE=SEEDED-FULLST + NEEDCOUNT=divide). Spot-check: STEPS=3 on seeds 11/7 SEEDs identically under the OLD rule - the multi-step residual in random micro-worlds is pre-existing (battery residual classes), not a regression from this fix. Flag-free default behavior bit-unchanged (all edits env-gated).
