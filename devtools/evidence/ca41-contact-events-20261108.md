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

- ir=20, 40 cells: CLEAN 10 steps, contacts=16813, hit=14830
  (FEED=24 TRACE2=1 CA2TRIG=1 FULLST=1 STATESEED=k
   SET=divideOn=1,divideAt=0.5,interactionRadius=20,foodEatR=8 STEPS=10
   ARGV="1 40 160 1")
- ir=40, 60 cells, 120 steps: CLEAN, contacts=218440, hit=84208
  (ARGV="1 60 120 1", interactionRadius=40)

## New divergence loci (all flagged CA2TRIG=1, STATESEED=1, 10 steps,
## ARGV="1 40 160 1", common SET prefix: divideOn=1,divideAt=0.5,
## interactionRadius=20,foodEatR=8,eatDistF=0.85,fuseDistF=0.6,symDistF=1.1,
## reproMinAgeMs=100 - isolated one event family at a time)

### Locus A - eat events (eatChance=0.15, mergeChance=0, reproChance=0)

SEED step=5. Eaten counters fire (eaten>0 both sides before the seed); the
first divergence is a value cascade (energy/radius after an eat), not a
population flip. Config: ...SET=...,eatChance=0.15,mergeChance=0,reproChance=0.

### Locus B - merge family (mergeChance=0.03 -> merge/fuse/pair)

SEED step=1, population js 148 wasm 146: a two-cell event-decision flip
(one merge/fuse/pair decision differs). Counters fire on the JS side
(merge=167, fuse=42, pair=113 in the all-events config).
Config: ...SET=...,eatChance=0,mergeChance=0.03,reproChance=0.
Attribution queued: pair-level draw assignment and the fuse gate arithmetic.

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
- TR2CH wording fixed: cl/comp inertness is NOT universal; it holds only
  when merge=fuse=0 for that run. The CA-40 'CA verifier limits' section is
  amended by reference: cl/comp inertness is proven per run with
  merge=fuse=0 (counters printed), not unconditionally.

## Accounting for this investigation (completed/crashed/unrun)

Non-event proofs: ir=20 x10 seeds + ir=40 x1 heavy config, 11/0/0, all
CLEAN. Event-family probes: all-events x1, A x1, B x1, C x3
(incl. habitatOn=1 and reproMinAgeMs=0 variants), 6/0/0, all SEED by
design (discovery runs, not gates). Runner selfcheck: PASS (see report).
