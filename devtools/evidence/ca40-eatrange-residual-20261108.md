# CA-40 residual: eat-range radius is loop-invariant in the served binary

Status: RESOLVED 2026-11-08, on top of the seek-coefficient fix (f382c6a).

## Symptom

After the seek-coefficient fix, FEED+eat 30-step seeded replays (STATESEED=k,
SET=divideOn=1,divideAt=0.5,interactionRadius=0,foodEatR=8, ARGV "1 40 160 1",
CA2TRIG=1 FULLST=1) still diverged ~100%, horizon steps 1-12, macro paired-identity
class, populations equal at every step (multiset identity-swap appearance).

## Bisect (STATESEED=1, 30 steps, pre-fix)

- boundAware=0: SEED step=2 (wall-independent; not the seek locus, which was already fixed)
- divideOn=0: SEED step=0 (divides not required)
- foodGrow=0: CLEAN 30/30 steps. Note foodGrow gates three things: the eat-time radius
  bump, the post-loop shrink, and the divide gate (`P.divideOn && P.foodGrow && ...`).
  divideOn=0 still seeding excludes the divide path; the locus is the eat-time radius bump
  or the shrink.

## Step-0 multiset diff (divideOn=0, first divergent step)

17/76 cells mismatched at step 0 with energy, gene, age, radius bit-identical and only
position/velocity drifted; x bit-identical on wall-pressed cells because keepIn clamps
x to cont.x + radius (masking pre-clamp differences). Identical energy means the eat
roll OUTCOMES matched; the desync is in the number of rolls consumed per food scan,
not in their values.

## Discriminating variants (unconditional JS variants, STATESEED=1 divideOn=0, STEPS=2)

- Z (no radius bump at all): SEED step=0 - the served binary DOES grow the radius
  (dump radius would otherwise match).
- H (range test uses loop-entry radius, bump kept per eat): CLEAN.
- G (live range test, bump deferred to after the loop): CLEAN - within the scan the
  radius never changes, so the range test is loop-invariant either way. H and G are
  indistinguishable on observable state while the growth clamp never binds
  (final radius = r0 + foodGrowAmt*eats both ways); H is the minimal change.
- HG: CLEAN (equivalent to H).

Conclusion: the served binary tests `fd < radius + foodEatR` against the radius at
food-scan entry; a mid-scan radius bump from a successful eat never widens the eat
range within the same scan. Shipped JS used the live (grown) radius, so after a cell's
first eat the range widened mid-scan, extra dots entered the roll sequence, the RNG
stream desynced by the extra rolls, and every later cell's wander/organic draws shifted
(positions/velocities drift) while eat outcomes and energies mostly held (thr ~1.7%:
most shifted rolls still fail). foodGrow=0 removes the mid-scan change entirely,
hence CLEAN; no-eat configs never bump the radius, hence CLEAN.

## Fix

test/ca2.js, behind globalThis.CA2_TRIG_MSUN: hoist `eatR0_ = c.radius + P.foodEatR`
before the food scan and test `fd < eatR0_` on the flagged path. The flag-free path
keeps the shipped live-radius test bit-identical.

## Verification (all on the committed tree)

- eat residual config, seeds 1-20, STEPS=30: 20/20 CLEAN (pre-fix: 20/20 SEED steps 1-12)
- no-eat config (foodEatRate=0), seeds 1-45, STEPS=10: 45/45 CLEAN (regression)
- no-eat interactionRadius=0, seeds 1-20, STEPS=30: 20/20 CLEAN
- eat boundAware=0, seeds 1-10, STEPS=30: TR2-exact all steps (runner ERROR is the
  known FULLST "no pressed cells" gate artifact with boundAware=0, not a divergence)
- mutation battery: baseline CLEAN + 6/6 mutants SEED; new eat stanza: eat baseline
  CLEAN 30 steps, devtools/ca2-eatrange-mutant.js (live radius under the flag)
  SEED step=5 - the residual signature reproduced as a negative test
- runner selfcheck: PASS
- OFF battery (flag-free): default 4x200 PASS, FULLST10 PASS (17933 live cells,
  16983 pressed) - default behavior bit-unchanged
- ORACLE=800 CA2TRIG=1: 0 raw / 0 post-stepSquash mismatched states

## Coverage widening 2026-11-08 (same commit series)

The TR2 snapshot and divergence metric now cover every snapshot channel: sqS is
captured PRE-stepSquash on both sides (the post-pass zeroes it by design; capture
points are post-dead-sweep on both sides and stepSquash never splices, so index
alignment holds) and attached to the sorted snapshots; the metric adds |sqS| and
the post-birth channels spd/app/bnd/maxSpeed/speedModifier, and the pairing key
gains the same fields so identical-key ties cannot cross-pair. Before this, a
channel-only divergence on those fields read as mx=0 (masked).

shp (JS-only): the served binary has no shape slots. Coverage is by construction
plus a failing per-step guard: mkState and every birth path seed shp.t=0, the
flagged divide path copies the parent's shp verbatim (newShape is never called on
the flagged path), and newShape/mixShape never produce t=1 from non-1 parents
(body-plan jumps flip 0<->2 only), so the string-swim block (shp.t===1) is
unreachable in compared configs. The harness checks every compared cell on both
sides at every step: any shp.t===1 prints 'SHPGUARD FAIL step <st> side <js|wasm>'
and exits 3 (runner: never clean). Negative test: devtools/ca2-shpstring-mutant.js
(flags divide children t=1 on the flagged path) trips the guard at step 0 side js;
the mutation battery requires both the non-clean verdict and the SHPGUARD line.

Non-vacuousness markers per TR2 run: TR2CH js divide=<n> birth=<n> shpStrings=<n>
(divide=0 prints a not-exercised warning) and the existing FEED eats=<n> line.
Measured: eat 30-step config 459-469 divides/run, no-eat 10-step 261 divides/run,
sqS exercised (17354 pressed in FULLST10), SHPGUARD silent on every legit config.

Negative tests: devtools/ca2-sqs-mutant.js (press x1.001) SEEDs at step 0 and is in
the mutation battery list; ca2-eatrange-mutant.js stays as the residual regression;
devtools/ca2-shpstring-mutant.js trips SHPGUARD at step 0 (battery requires the
guard line); devtools/ca2-birthchan-mutant.js (birth hostility x0.5, same draw
count) SEEDs at step 0 via the hst channel.

Birth-carried channel widening 2026-11-08: the snapshot, metric and pairing key
gain hst (hostility), sv, mr (mutationRate) and c0/c1/c2 (the mutGenome col draws
- the served divide's 6 gene draws are spd/app/bnd + col x3, and only the first
three were compared before). cl/comp are excluded with inert proof: no contacts
at interactionRadius=0, and TR2CH now prints merge=/fuse= counters (0 on every
compared run). mr is inherited verbatim at divide (constant per lineage); hst/sv
are fresh draws per divide, exercised 459-469x per eat run.

Matrix after widening (completed/crashed/unrun): eat x20 STEPS=30 20/0/0 CLEAN;
no-eat x45 STEPS=10 45/0/0 CLEAN; no-eat interactionRadius=0 x20 STEPS=30 20/0/0
CLEAN; eat boundAware=0 x10 TR2-exact (runner ERROR = pressed-cells gate artifact);
mutation battery baseline CLEAN + 7/7 SEED + eat stanza CLEAN/SEED; selfcheck PASS;
OFF battery 4x200 PASS + FULLST10 PASS (17932 live cells, 17354 pressed);
ORACLE=800 CA2TRIG=1: 0 raw / 0 post-stepSquash mismatches.

## Stated limits (goreda review of 13440af, kept verbatim)

- The TR2 snapshot is 25 fields; that is the compared state, nothing more.
- Birth-carried channels (hst/sv/mr/col) are tested via the DIVIDE path only -
  not merge/fuse/contact-birth or any other birth path.
- cl/comp inertness is proven only at interactionRadius=0 (459 divides, 0 merge/fuse
  per eat run; the counters are printed per run).
- Sorted-state pairing is not lineage identity.
- All parity claims are flagged CA2TRIG=1 configs only.
- No served-shp comparison and no whole-simulation parity is claimed.
