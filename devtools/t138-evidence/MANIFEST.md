# t138 evidence custody — f9 behavior reconstruction (owner block 93d, 2026-10-26)

Scope: reconstruct the f9 candidate's behavior under the 77d deterministic
fixed-dt replay harness (devtools/t130-deterministic-pair.js @ organic-walls
0cad700, UNCHANGED). Pairing isolates the f9 delta: A = f8-pressure-force
7df4765 (the f9 base), B = ohal/ca a474509 (f9: whole-contact root repair =
per-frame pair-resolve positional budget, JS mirror + wasm). Same pinned 77d
scenario as all accepted t130 evidence: stateB inject (85 cells), frozen
livepreset, pinned boundary-motion script t130m-motion-base-s1.json
(sha256 e0230a2d1616f24d6cbab71bd89da82af69c932640c0c480bea2abb061005359),
220 frames, fixed dt 1/60, seeds 1-3, T130_RES=0.4, T130_MOTION=1.

## Instrumented engine pins (sha256) — harness-only probes, NOT shipped
  fd5fd0ac272e22f28db75ffc30e29b9793fd28b2905c21eb1796e61d6824dd44  pins/tr8F8R-ca2.js  (f8 root ca2.js @7df4765 + t130 probes + replay hook)
  0e06759e7ad0bb5d98df3f142154d551902c13e9da3609d17f5e75582d28d928  pins/tr8F9R-ca2.js  (ohal/ca test/ca2.js @a474509 + same probes + t138 f9budget witness)
  b1f98a1241ad6279eb6a013e491c2ae60a52e7678da6f8fdd9f0c9c970d83f16  f8 ca2core.wasm        (ST=30, from f8-pressure-force root)
  4f017bc6cab97c970747e24e8687f9a51fbc787c385058154f4695f561cc363f  f8 ca2core-simd.wasm
  2f08663575b54004dd27e51d6a7483677495fe16be16ce2cdeaaf068d14d2ac6  f9 test/ca2core.wasm   (md5 8d522fe28eaf579e52b825fa460f2063 = ohal/ca 3b56151 build)
  73b0498a7beb4b62fd5bb04462b9e49cd1ca2c3a4c5f1223c1725b1bbcb72c45  f9 test/ca2core-simd.wasm (md5 e92e5f171d16873a3b5507333ae4a4d9)
  91278cb635871bdf6b23b1b4a1d9432f9add148156c921e1df756865970885d3  stateB.json (identical to accepted t130 pin)
  ac69803daff0410f3be0df499bed606d353af4d6f141af607e0efc00ee8bac27  livepreset.json (identical to accepted t130 pin)
Probe provenance: the exact probe set was recovered from the accepted pins
(diff tr7Base vs a62be62, tr7BaseR vs tr7Base). Patcher validation: applying
it to pin ca2-candidate-base-a62be62.js reproduces pin tr7BaseR-ca2.js
BYTE-IDENTICAL (sha256 d9cba119820f71768e68364abff8c352eecb30b69ec0e8dabe3e6bec5aa470f7).
The t138 f9budget witness (f9 build only) is read-only window counters in the
JS-mirror pair-resolve; it does not touch physics and never fires under wasm.

## Controls (all PASS)
- t138-aa-f8-s1.json / t138-aa-f9-s1.json — A/A self-checks replay-OFF:
  determinismSelfCheck true both; inject receipts 85/85 idFnOk both; simOn=true
  both engines on their own ST=30 wasm (f9 ABI guard passes: sim_stride=30).
- Replay assert fail-closed: every replay run completed (hook fired exactly
  once per frame, applied fields === script row; 8 fields both engines).
- Motion witness: 220/220 frames exact-equal, maxAbsDiff 0, ALL paired runs.
- Replay hook fidelity: under forced own-script, BOTH engines bit-reproduce
  their replay-OFF natural metrics (f8 s1 osc 3272 path 1276.89 mx 183.87;
  f9 s1 osc 2881 path 1099.86 mx 107.80) — same inertness property the
  accepted a62be62 run showed; the pinned script is these builds' natural
  script (f8/f9 share the drag/easing code; the prod step-1 delta from the
  accepted findings is prod-specific).

## Paired results (A=f8, B=f9, common imposed 77d boundary motion)
  s1: f8 osc 3272 path 1276.89 mx 183.87 d 45 | f9 osc 2881 path 1099.86 mx 107.80 d 51
  s2: f8 osc 3138 path 1228.14 mx 159.79 d 48 | f9 osc 3216 path 1264.65 mx 103.88 d 45
  s3: f8 osc 2845 path 1095.72 mx 183.87 d 46 | f9 osc 3184 path 1260.10 mx 103.97 d 44
  (osc = population oscillation flips, path = mean per-cell path px,
   mx = max single-frame step px, d = deaths; full rows in t138r-pair-s*.json)

## Mechanism witness (t138n-pair-nosim-s1.json — BOUNDED nosim diagnostic,
   boot 40 pumps, HOLD_SCALE 0.25, NOT matrix-comparable; JS mirror path only)
f9 pair-resolve over 1656 pair contacts: raw separation demand sepSum
535344.73 px (mean ~323 px/contact, max 393.31) vs budget-admitted spentSum
6775.14 px (mean ~4.09 px/contact); 1655/1656 contacts had demand exceeding
cell A's remaining frame budget (1656/1656 for B). The unbudgeted
whole-contact jumps f8 allows (its mx 183.87 plateau) are exactly what the
f9 budget refuses.

## Reading (reconstruction, NO winner claim)
Under the common imposed 77d boundary motion the f9 repair is visible at the
behavior level as a hard single-frame displacement ceiling: mx 103.9-107.8
every seed vs f8's 159.8-183.9 (183.87 = the uncapped whole-contact resolve
plateau, also seen in the accepted a62be62 base). osc and mean path direction
varies by seed (s1 f9 lower, s2-s3 f9 higher) — no selection; deaths mixed
(s1 f9 +6, s2 -3, s3 -2). Context vs the accepted prod/base replay table
(t130-evidence MANIFEST): prod mx stayed ~130 with LOWER osc all seeds;
f9's ceiling lands BELOW prod's natural max step while deaths stay in the
prod/base range. Engine response conditional on common imposed boundary
motion only — NOT end-to-end drag/easing quality.

## Open residuals
- f9budget witness fires on the JS mirror path only; the wasm pair-resolve is
  engine-internal (JS/wasm pair-budget parity itself is covered by the
  existing t133/t134 suites on ohal/ca).
- Birth identity (tid >= 1000) is per-engine lineage only; divergent runs
  birth different cells (carried from t130 conventions).
- nosim diagnostic is bounded (boot 40, HOLD_SCALE 0.25): witness-grade, not
  comparable to the 220-frame matrix rows.
- Independent regression contracts for these behaviors are the counterpart
  lane (devtools/f9-regression/**, branch ohal/ca-f9-regression), NOT this dir.

Reproduction: devtools/t138-run.sh (exact commands + env).
