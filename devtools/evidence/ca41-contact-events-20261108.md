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
