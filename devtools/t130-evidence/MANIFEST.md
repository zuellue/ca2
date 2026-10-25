# t130 evidence custody — item 64 (organic wall / separator / compression life)

Status: 2026-10-25, branch `organic-walls`. All runs with the probe-gated
fail-closed harness (commit 463de26) after the frozen-`__ca2.trans` root-cause
fix. Every pre-fix run (files in /tmp/t130w-*, /tmp/t130-220-*) is
CONTAMINATED / NOT ATTRIBUTABLE (static-wall stub + active 21s morph +
diverged trans-lerped globals) and retracted; none of it is archived here.

## Harness
`devtools/t130-deterministic-pair.js` (this branch, HEAD at archival).
Command:
  NODE_PATH=<node_modules> node devtools/t130-deterministic-pair.js \
      <A_dir>/ca2.js <B_dir>/ca2.js <stateB.json> <livepreset.json> 220 <seed> 60
Env used: T130_RES=0.4, T130_TRACE=1 (dumps), T130_BOUNDARY=1 (boundary run),
T130_SEARCH='?nosim=1' (nosim run), T130_BOOT_SETTLE=40 (bounded nosim boot only).
Fixed dt = 1/60 per pump; PRNG reseeded per engine at inject.

## Engine pins (sha256) — exact builds that produced these results
  fa19b3378af05ce6f2ca92b3e3b2d841065fa4689336023265e61148064ee777  pins/ca2-candidate-base-a62be62.js  (item-64 baseline a62be62)
  830f1ce0c9d687aea123d1610c5c7671c5cf4eb21ce3c1bace2c599b504c8371  pins/ca2-production-da2fbd0.js     (production reference)
  09619fd74c6e02e9273b640ef0d8608fe15644ab61639a808eb2ad2f248c3ff5  pins/candA2-ca2.js  (candidate (a)v2, separator effR-inset box)
  4a84f6d210cf85a9b8e9025fa9b071dcc246eaf55ecf09d352b660fb1012a960  pins/candB2-ca2.js  (candidate (b) atomic)
  09ba099d74832eac3dbfc8c57e6cf90f1880b31311df4effa594014a5f6eb261  pins/tr7Base-ca2.js (base + probes __ca2KillTrans/__ca2ResetGlobals)
  0573ba06d18c8f1a113676fae3fd082cc1ac5a81fe76cd83ada96c0e93f2aab8  pins/tr7A2-ca2.js   (candA2 + probes + rich carry counters)
  a9218dcba25cb18a3bc554bb3575c35331efc80710155b3e77e7960a1acf4cc6  pins/tr7B2-ca2.js   (candB2 + probes + rich carry counters)
  aa8a42da7d10f5ca4316848b6dcaec57d512cd9719620575e60f1cde106a2c70  pins/tr6Base-ca2.js (base + stage traces + boundary + probes)
  cf4df93ef17dc34056bcb150c0b1a6c2f8a0413d7471408459907a19b4349ea0  pins/tr6V2-ca2.js   (candA2 + stage traces + boundary + probes)
  dec5fc5531663373758bd7a56aed20d0c9af44ab91121a9c58b9544f63856b5e  pins/ca2core.wasm        (bit-identical across all builds)
  3a11107e8ce8559f46e5dda42919b2725dbed58c1ccc3b246fac531d01484d61  pins/ca2core-simd.wasm   (bit-identical across all builds)
  pins/stateB.json     = injected fixture (85 cells; no envV/pr/comp/sym/bornAt)
  pins/livepreset.json = frozen worker preset (U=1 CELL_RADIUS=50 ir=1 mr=2.627
                         mut=9.628 cellMorphMs=4200 cellMorph=1 respawnMorph=1)

## Files
- t130c-a2-s{1,2,3}.json, t130c-b2-s{1,2,3}.json — clean pair matrix, seeds 1-3.
  A = base (tr7Base), B = candidate (tr7A2 or tr7B2). Metrics per engine:
  osc (population oscillation), path, mx (max speed), d (deaths),
  carry events (pist/refl split), cellframes (unique cell-frames with >=1 carry
  event, via frameT keys), dvPos/dvNeg (signed per-event speed-delta sums;
  dvPos was 0 in every run: carry never injects speed, only damps it).
- t130c-a2-nosim-s1.json — bounded nosim diagnostic (JS sim path, boot 70 pumps,
  HOLD_SCALE=1.0; NOT matrix-comparable: boot window differs).
- t130-bnd-A/B.json — boundary run (3 frames post-inject, first-divergence
  witness: 'sep' stage, cell tid 5, dy ~0.73px). Forwarded to Q4H9.
- t130-bnd-run.json, t130-bnd-selfcheck.json — boundary run meta + reset
  equality receipts (rel-0 sim.pre 85/85 x 29 slots + s0/s1 bit-identical).
- t130t-a2-s{1,2,3}.json — stage-trace run JSONs for (a)v2.
- t130-trace-{A,B}-s{1,2,3}.json.gz, t130-trace-{A,B}.json.gz — per-frame stage
  dumps ('cont','pre','sep','fin1','fin2') for seeds 1-3 (-s*) and the original
  seed-1 pair (no suffix). gunzip to read.

## Findings archived here (summary, hypothesis-level, NO winner)
- Stage-first divergence (a)v2, 3/3 seeds: 'sep' stage first, cell tid 5,
  y-only, A leaves 291.94 (outside inset box bottom 292.672), B clamps to edge.
  Frame+1 'pre' amplifies. Mechanism hypothesis (Q4H9): base pre-clamp hides
  overrun, carrySide later converts it to velocity.
- (a)v2 carry participation: events 6407-7102 -> 1170-1565; unique cell-frames
  5027-5600 -> 632-842; piston 1018-1146 -> 143-231. (b) carry ~ base.
- osc/path/deaths direction varies by seed for both candidates: no selection.

## Open residuals (NOT cleaned by frame-0 bit-equality)
- (b) stage-first trace: instrumentation exists on the (a) line only (tr6Base/tr6V2).
- pr[]/SQS press residue (sim.rs:236,251-257, exported via SQS slot 28) is
  wasm-internal and not inject-resettable from JS (no export); consistent with
  rel-1 sq diffs. Needs a wasm-side reset export (writer/owner topic).
- p[43-45] proven gated by sim.rs:80 `if p[P_ECOL] != 0.0`; food sentinel slot
  nf unread (sim.rs:324 loops 0..self.nf). Confirmed OFF by code + receipts.

## Motion witness (77d explicit boundary-motion pin, 2026-10-25 pm)
Harness T130_MOTION=1 records per-frame RAW boundary-motion rows
[cont.x, cont.y, cont.w, cont.h, wvx0, wvx1, wvy0, wvy1] (unrounded) per engine
and compares them exactly per frame.
- t130m-aa.json — A/A self-check (tr7Base vs tr7Base, seed 1): determinism true,
  motionCompare 220/220 exact-equal, maxAbsDiff 0.
- t130m-a2-s1.json — base vs (a)v2 witness run (seed 1): motionCompare 220/220
  exact-equal, maxAbsDiff 0; engine outputs still diverge (oscFlips 4100 vs 3561),
  so divergence is ENGINE RESPONSE, not input.
- t130m-motion-base-s1.json / t130m-motion-a2-s1.json — the two recorded scripts,
  sha256 e0230a2d1616f24d6cbab71bd89da82af69c932640c0c480bea2abb061005359 BOTH
  (byte-identical). "Same boundary-motion input" is now MEASURED, not assumed from
  seed, for the 77d scenario. Forced replay unnecessary here (zero divergence to
  suppress); the witness catches any future scenario where motion diverges.
Scope: 77d scenario (stateB drag script, 220 frames, seed 1) only.

## prod-vs-branch runs (2026-10-25 pm, T130_MOTION witness) - NOT motion-controlled
Pairing: A = tr7Prod (production da2fbd0 ca2.js sha 830f1ce0 + t130 probes; probe build
pins/tr7Prod-ca2.js sha 71ad6c7e1cf65147ec1c428c68cad2b4f99794d7b220ab305f7e64132cb700a6;
production wasm pins/tr7Prod-ca2core.wasm sha da211141..., -simd 3fc2ec0f..., matched pair
from the da2fbd0 tree) vs B = tr7Base (branch a62be62 + probes, branch wasm dec5fc55...).
Both engines simOn=true on their OWN wasm. A/A prod self-check (t130p-aa.json): det true,
motion 220/220 exact.

KEY FINDING - motion scripts DIVERGE 220/220 from frame 0 (t130p-motion-*.json):
identical drag events produce different boundary-motion scripts across prod vs branch.
Profile identical across seeds 1-3 (geometry-driven, not RNG): max |diff| x 22.24, w 44.48,
y 0.06, h 0.13, wvx 7.12, wvy 71.5. Prod cont values are integers and static-ease
(x=276 frames 2-4); branch floats and eases (259.34 -> 256) - the step-1 delta (float wall
geometry + time-based drag easing, wallSmoothMs) IS part of the candidate. Therefore these
runs are NOT attributable under identical boundary motion: the 77d prod step-by-step
requirement needs FORCED REPLAY (an engine override hook for cont+wv per frame on both
builds) or must be labelled motion-uncontrolled. This is the precisely characterized
prod-comparison gap, replacing "not run".

Behavioral (label: motion-uncontrolled, not attributable): see t130p-prod-v-base-s{1,2,3}.json.
  prod  osc 2234/2547/2460  path 1115.85/1498.48/1199.62  maxStep 128.33/119.18/146.79  deaths 51/54/55
  base  osc 4100/3689/3473  path 1473.4/1322.1/1285.58    maxStep 183.87 (all)          deaths 42/46/49
Branch side reproduces the earlier clean-matrix A-side EXACTLY (carry ev 7102/7068/6407,
pist 1018/1146/1097, cf 5600/5504/5027, dvNeg -7907.6/-9403.1/-8379.2, deaths 42/46/49).
Prod carry counters = 0 == UNAVAILABLE, not zero contacts: prod da2fbd0 has no carry
mechanism (reflect-only wallPull) and no finalWallClamp; under wasm its cell wall
resolutions are engine-internal with no JS hook.

## Forced-replay prod-vs-branch (architect decision 25 Oct): FIRST motion-controlled evidence
Harness T130_REPLAY=<script.json> imposes ONE pinned boundary-motion script on both
engines (probe hook right after each build's cont/wvx recompute; per-frame fail-closed
assert: hook fires exactly once + applied fields === row; branch forces 8 fields
(bounds+wvx), prod 4 (bounds; wvx has NO consumer in da2fbd0 - UNAVAILABLE, not zero)).
Pinned script: t130m-motion-base-s1.json sha256 e0230a2d1616f24d6cbab71bd89da82af69c932640c0c480bea2abb061005359.
Rationale: continuity with ALL existing 77d evidence (clean 6/6 matrix, traces, boundary
witness ran under this script); not tuned to the candidate. Prod-script sensitivity
variant remains possible with t130p-motion-prod-s1.json.
Builds (harness-only probes, not shipped): pins/tr7BaseR-ca2.js sha d9cba119820f71768e68364abff8c352eecb30b69ec0e8dabe3e6bec5aa470f7,
pins/tr7ProdR-ca2.js sha c49157d67121f9b1ff17841296f7d15ec8c63a6cd6f12b35b4c9988a3065e5f6.

CONTROLS (before interpretation): baseR A/A replay-OFF det true + metrics bit-reproduce
the clean-matrix A-side (osc 4100, d 42, ev 7102, pist 1018, cf 5600, dvNeg -7907.6,
maxStep 183.87) = replay hook INERT. prodR A/A replay-OFF det 2/3 true (one flake at
frame 44, single-cell event - prod natural drag-easing is marginally wall-clock
sensitive, hypothesis); metrics reproduce (osc 2234, d 51). Under replay-ON all 6
paired runs are bit-stable across two repeats per seed (STABLE=true).

PAIRED (A=prod da2fbd0, B=branch a62be62, shared imposed script, 220 frames):
  s1: prod osc 3279 path 1822.74 mx 129.36 d 45 | base osc 4100 path 1473.4 mx 183.87 d 42
  s2: prod osc 3439 path 1882.42 mx 130.32 d 40 | base osc 3689 path 1322.1 mx 183.87 d 46
  s3: prod osc 3350 path 1804.95 mx 131.82 d 38 | base osc 3473 path 1285.58 mx 183.87 d 49
  motion 220/220 exact all runs (4 shared fields). Base under forced own-script is
  BIT-IDENTICAL to its natural run = hook captures every consumed component.
READING (no winner): under common boundary motion prod shows LOWER osc all 3 seeds and
higher mean path with lower maxStep; deaths mixed (s1 base lower, s2-s3 prod lower).
Scope: engine response conditional on COMMON IMPOSED boundary motion - NOT end-to-end
drag/easing quality (prod's natural script differs by design, step-1 delta). Prod carry
metrics remain UNAVAILABLE (no mechanism, no JS hook). Earlier motion-uncontrolled runs
(t130p-*) stay valid characterization, not attribution.
