# TRACE2 per-cell position diff: the FULLST30 crowdPush drift was a harness artifact (frameT frozen)

Date: 2026-11-07. Branch: ca/187-js-rust-alignment. Mode: `TRACE2=1 FULLST=1` (aligned-RNG per-cell diff).

## Method (TRACE2)
Both engines are fed the identical xorshift128+ stream per step (1:1 sim.rs rnd01:
s0=(s0<<32)|0x9E3779B9, s1=(s1<<32)|0x85EBCA6B, reseeded per sim_step call; Math.random
overridden with the same seeds for the JS frame). Per-step per-cell snapshots
(x,y,vx,vy,envV,crowd,sq,radius,energy,gene), max |diff| per step, first-divergence dump.

## Trace result (pre-fix harness)
- step 0: EXACT (0.0000 across all channels) - the draw streams align 1:1.
- step 1: velocities diverge across ~35/40 cells (top |dv| 4.17), while envV/crowd/sq/energy
  still match (worst-cell energy diff 1.5e-5). Pattern: a draw-count desync or a budget
  difference inside the second frame, not a formula difference in crowdPush.

## Root cause
The harness frame template ran with `frameT=0` forever. JS interact() resets its
positional-correction budget only when `a.__ccT !== frameT` (ca2.js:492). With frameT
frozen, `__ccU` accumulated across every frame of a trial and was never reset, so from
frame 2 on the JS side could not separate overlapping pairs (spa9 clamped to 0), while the
wasm `used[]` budget is zeroed every step. Pairs stayed overlapped on the JS side, pressed
cells accumulated differently at the walls, and the crowd field / crowdPush envV drifted -
the exact "served injects 2-3x envV" signature recorded in
fullstep-crowdpush-drift-20261107.md and crowdpush-drift-injection-ledger-20261107.md.
In the app, frameT advances every frame (ca2.js:2216), so app JS and wasm both reset the
budget per frame: 1:1. The divergence never existed in the app.

## Fix (harness only, no engine change)
1. Harness frame advances `frameT += frameDtf` per frame (1:1 app).
2. Per-trial reset: `J.frameT=0` and `bornAt=0` on cloned cells, JS and wasm runs alike
   (otherwise the clock accumulates across trials and the juvenile reproduction gate
   opens on the JS side only: birth js 661 wasm 0).
3. pack() writes cell slot 23 = `J.frameT - (c.bornAt||0)` every step, 1:1 the live pack
   (ca2.js:1012); previously slot 23 was packed 0 forever, which would freeze the wasm
   juvenile gate once frameT advanced.

## Verification (all vs the SERVED binary 54f02eee)
- FULLST=1 STEPS=10 (400x40x160x2): PASS.
- FULLST=1 STEPS=30 (100x40x160x2): PASS - the former 2x envV gap is gone.
- TRACE2=1 FULLST=1 STEPS=30: per-cell max|dpos| 0.0000 through step 24, 1.3e-9 at step 25
  (f64 noise floor, not structural).
- Regressions: default counters 800x4 PASS, EAT 400x2 PASS, BIRTH 800x4 PASS,
  BIRTH=1 LOGCHK=1 200x4 PASS (kind1/kind3 exact, kind2 4546 <= out[0] 14572),
  BOUND 1x40x30 PASS (maxAbsDiff 0).
- Mutation: disable the `__ccT/__ccU` budget reset in a ca2.js copy (CA_JS) -> FULLST30
  FAILs with the exact old gap2 signature (sq/crowd/envV means collapse on the JS side).
  The test has teeth on this path.

## Consequences
- CA-15/gap2 RESOLVED: no engine difference in the crowdPush/envV path. JS and the served
  binary are behaviorally aligned flag-free in every harness mode.
- The CA-7 ruling question no longer carries a "which side is truth for the 2x drift" fork:
  there is no drift. What remains of the owner ask (23:10) is source hygiene only: the
  served binary is 51dce62 + uncommitted v6/v8b work, and the in-repo Rust source is the
  orphan (re-verified below).
- Fresh 51dce62 build (0c08ab5e), re-run with the FIXED harness: still fails every mode
  catastrophically (default: hit 107200 vs 128800, death 0 vs 51200; BIRTH: all counters
  3-20x off; BOUND maxAbsDiff 84.6; FULLST sq/crowd means 60-140x). The frameT artifact did
  not manufacture the fresh-build failure; the CA-22 correction stands.

## Simd served binary (20763187), fixed harness
default 800x4 PASS, BIRTH 800x4 PASS, FULLST30 PASS, BOUND PASS. CA-26 closed.
