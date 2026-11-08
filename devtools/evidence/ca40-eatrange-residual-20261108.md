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
