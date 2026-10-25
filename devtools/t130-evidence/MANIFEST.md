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
