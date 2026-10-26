# t139 evidence - f9 independent regression (owner block 93d, writer VP0BF, 2026-10-26)

Scope: independent executable regression tests on the 77d fixed-dt replay harness for the deployed f9
build (item 64 step 9, main:test/ @ 5e1a3f9, ca2.js sha256 1c090453.., wasm d4434025 / simd 227163d1).
f9 source branch 7f8c506 is lost; the deployed test/ artifacts are the reference. Private lane only:
no merge, no deploy, no visual-policy change, no product-file edits. All paths NEW: devtools/t139-*/.
Counterpart VP081 (t138) owns the f8-vs-f9 reconstruction lane; zero file overlap.

## Harness and pins
- Harness: devtools/t130-deterministic-pair.js @ f8-pressure-force 7df4765, run UNMODIFIED for all
  drawn legs. One copy-only env addition (t139-nodraw-patch.js, T130_NODRAW) used ONLY for the two
  legs explicitly labelled nodraw; inertness was tested, NOT assumed (finding F4).
- Fixtures: stateB.json + livepreset.json + replay script t130m-motion-base-s1.json sha256 e0230a2d..
  (accepted 77d pins, verified byte-identical). dt=1/60, 220 frames, T130_RES=0.4, forced replay
  fail-closed (hook fires exactly once per frame, 8/8 fields asserted).
- pins/tr9F9R-ca2.js sha256 529a9637..: f9 test/ca2.js + the accepted tr7 probe set (carry counters,
  killTrans/resetGlobals, replay hook), applied by t139-probe-port.js with exact-anchor fail-closed
  matching: 5 insertions, 0 deletions, syntax-verified. Probe lines are read-only bookkeeping;
  determinism + archive reproduction controls below.

## Controls (all PASS)
- C-A/A: f9 A/A forced replay, seeds 1-3: determinismSelfCheck=true every seed; motion 220/220 exact;
  replayFields=8; inject verify mism=0.
- C-ARCHIVE: prod leg of prod-vs-f9 reproduces the accepted archived prod numbers EXACTLY
  (s1 3279/1822.74/129.36/45, s2 3439/1882.42/130.32/40, s3 3350/1804.95/38) = harness+fixtures+prod
  pin chain verified end to end.
- C-XCHECK: my independently ported f9 reproduces counterpart VP081's t138 f9 numbers bit-identically
  on all 3 seeds (s1 2881/1099.86/107.80/51; s2 3216/1264.65/103.88/45; s3 3184/1260.10/103.97/44).
  Two independent probe ports, same trajectories.

## R3 - prod vs f9 under the SAME imposed boundary motion (NEW evidence; f9 never replay-paired vs prod)
A=prod da2fbd0 (tr7ProdR pin sha c49157d6.., verified), B=f9, seeds 1-3, motion 220/220 exact all runs:
  s1: prod osc 3279 path 1822.74 mx 129.36 d45 | f9 osc 2881 path 1099.86 mx 107.80 d51
  s2: prod osc 3439 path 1882.42 mx 130.32 d40 | f9 osc 3358* path 1335.03* mx 103.88 d41*  (* see F3)
  s3: prod osc 3350 path 1804.95 d38          | f9 osc 3184 path 1260.10 mx 103.97 d44
Reading (no winner, metrics not acceptance): under common motion f9 shows LOWER oscillation than prod
on s1/s3, lower single-frame ceiling on all seeds (104-108 vs 129-131), more path per cell on s2/s3
for prod; deaths mixed. Direction consistent with the accepted prod-vs-base table.

## Contract probes (t139-contract.js, executable, exit 1 on fit-containment failure)
Fit split: a cell with 2r > min(plateW,plateH) cannot fit (CA7 class); asserted separately.
- f9 FIT cells: max penetration 17.97 px (frame 5 of the drag, tid 10, r=99.9, identical worst event
  s1/s2 under motion control); 1,784-1,928 fit cell-frames over 0.75 px tol (of ~10k).
  prod FIT cells: max 101.99 px, 7,539 cell-frames. => f9 reduces fit-cell wall penetration ~5.7x
  (max) / ~4x (count) vs prod, but strict non-penetration is NOT achieved transiently for large
  cells during the fast wall advance. Upper-bound metric: radius is raw (sq not exported), felt
  penetration at effR is <= reported.
- notFit overshoot (CA7 class, UNRESOLVED, both engines): f9 max 192.69 px (tid 74, r=294.8 vs plate
  h 204.1), prod max 190.32 px; 21-22 distinct cells per seed grow past plate fit during the run.
  Matches VDV052's independent dense binding (T==B symmetric overshoot, notFit-vertical).
- Radius (metric, not asserted): f9 injected survivors gained up to +157% (eating), worst loss -23.7%;
  prod worst loss -80.2%. f9 preserves radius far better under the same script.
- Displacement: f9 maxStep 103.88-107.80 (p99 54.9-58.5); prod maxStep 129.36 (p99 86.8).

## Findings (deviations demonstrated)
- F1 (contract gap): f9's non-penetration is statistical, not strict: worst fit-cell event 17.97 px
  (~18% of that cell's radius) at the first drag frames; count ~1.8-1.9k cell-frames/seed.
- F2 (engine deviation): f9 JS fallback != f9 wasm under identical seed+script+inject (nodraw config,
  labelled): JS osc 2184 path 418.41 mx 71.55 d67 vs wasm osc 2657 mx 71.99 d47. 20 more deaths and
  ~2.5x less travel in the JS path = the two engines are NOT behavior-equivalent in the 77d scenario.
  Consistent with the fixture-level budget gap (live f9 wasm worst cell 44 px vs JS mirror 1.0 px).
  Full-drawn nosim leg exceeds this sandbox's 115 s exec window (JS path ~0.5 s/frame); bounded here
  to nodraw mode 2 both sides; drawn JS-vs-wasm remains OPEN (needs a longer exec budget).
- F3 (harness validity): B-side contamination via wasm compile-cache warmth: f9-after-prod seed 2
  diverges from clean f9 seed 2 (osc 3358 vs 3216), deterministic across repeats (frames byte-equal),
  first diff frame 4, tid 59, 0.126 px, cont identical all 220 frames, inject verify clean (delta below
  the 0.01 inject tolerance), boot pumps identical (330). Present 1/3 seeds here; seeds 1/3 B-side
  reproduced clean f9 bit-exactly. A/A controls unaffected. Recommendation: pre-warm both wasm modules
  in-process before pairing, or pair as two A/A runs with cross-run diff (t139 pattern). The accepted
  prod-vs-base archive has the same structural exposure (B-side wasm cold when binary differs).
- F4 (harness validity): f9's own __ca2NoDraw=2 is NOT behavior-inert: same seed+script+inject, drawn
  vs nodraw trajectories differ (osc 2881->2657, mx 107.80->71.99, d 51->47) = the f9 sim consumes its
  drawing path; nodraw/nosim diagnostics do not characterize shipped drawn behavior. Also: the flag
  must be set AFTER the first frame (frame() early-returns before window.__ca2 is assigned).

## Files
- pins/tr9F9R-ca2.js (+SHA256SUMS), t139-probe-port.js, t139-contract.js, t139-nodraw-patch.js
- aa-replay-s{1,2,3}.json (C-A/A), prodvf9-s{1,2,2b,3}.json (R3 + F3 repeat), c0-nodraw-wasm-s1.json
  (F4 control), aa-nosim-nodraw-s1.json (F2), t139-{f9,prod}-s{1,2}-frames.json + s2-afterprod frames.
## Bounds
Metrics are not acceptance; no organic/visual claim (no rendered-pixel review); 77d scenario only
(stateB inject, one drag script, seeds 1-3, 220 frames); nosim leg nodraw-scoped; penetration metric
is a raw-radius upper bound.
