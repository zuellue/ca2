# Random-transport method choice for the wasm sim (card 20261024-014-ca), measured 2026-10-24

Question: jsrnd (per-draw env.js_rnd, exact Math.random stream) was measured slow. Choose the
random-transport method by measurement. Constraint kept: the sim consumes the REAL Math.random
stream in the exact global draw order of the JS fallback (a Rust PRNG substitute is not approved).

## Candidates
- M0 default: kernel xorshift128+ PRNG seeded per call (production default). No stream parity.
- M1 jsrnd (spike, ?jsrnd=1): every draw is one wasm->JS import call returning Math.random().
  Exact global order.
- M2 rndbatch (this branch, ?jsrnd=2): one shared f64 buffer (8192) + one shared [cur,end] cursor
  in wasm memory, manipulated by both Rust (rndbatch::next) and JS (Math.random override).
  Fill-on-exhaust only: a refill happens exactly when cur==end, so stream value k always goes to
  the consumer that advances the cursor past k. Same global value assignment as M1 by construction;
  one boundary crossing per 8192 draws plus zero steady-state overhead for JS-side draws (they pop
  the same buffer). All 129 direct Math.random sites in ca2.js stay unmodified (the override
  preserves the single global stream).

## Measured (node v22.23.3, devtools/t-cost-fixture2.js, captured 55-cell fixture t-cost-fixture.json;
medians of 3 interleaved reps x 3000 steps in ONE process; us per sim_step; draws from the same
seeded stream; this sandbox CPU, not a device)

| method | MULT=1 (55 cells, ~407 draws/step) | MULT=4 (220 cells, ~1680 draws/step, synthetic scale-up) |
|---|---|---|
| M0 default nonSIMD | 42.70 | 441.6 |
| M1 jsrnd nonSIMD | 57.96 | 508.0 |
| M2 rndbatch nonSIMD | 53.25 | 488.4 |
| M0 default SIMD | 42.94 | 445.3 |
| M1 jsrnd SIMD | 58.44 | 496.3 |
| M2 rndbatch SIMD | 53.05 | 494.0 |

Derived (within-process deltas):
- M1 crossing overhead: +15.3 us (MULT=1) / +51..66 us (MULT=4) vs M0, i.e. ~31-39 ns per import call, scaling with draw count.
- M2 overhead: +10.3 us (MULT=1) / +43..52 us (MULT=4) vs M0. Isolated buffer path: 6.2-6.6 ns/draw
  (sim_rndbatch_bench, 1e6 draws). The in-situ residual above the isolated cost is codegen
  second-order effect (next() inlined at ~40 draw sites); not further attributed.
- M2 vs M1: -4.7..-5.4 us (MULT=1), -8..-20 us (MULT=4); M2 wins at both scales and the advantage
  grows with draw count. M2 also removes the per-draw crossing from every FUTURE ported kernel
  automatically (one transport for all rnd sites).
- Process-to-process absolute drift up to ~20% observed (49 vs 59 us for the same binary); only
  within-process comparisons are used above.

## Parity evidence (M2 vs M1, exact global order)
- Node gate (t-cost-fixture2.js): 120 steps from identical packed state, same seeded stream:
  0 mismatch steps, cell arrays + out arrays byte-equal (Object.is per element), draw counts equal
  per step (417/step fixture). Both SIMD and nonSIMD. (M0 differs by design, kernel PRNG.)
- Live gate (t-jsrnd-batch-live.js): seeded Math.random, stubbed clock, manually stepped raf,
  network-off, autoQuality=0, 120 frames each, boot aligned (wasm pre-loaded before frame 1):
  A=?jsrnd=1 vs B=?jsrnd=2 projected state (cells+food primitives + P + event counters + consumed draws).
  Result 2026-10-24 (final): LIVE-BYTE-EQUAL. Hash 3546837131 both legs, serialization length
  147587 both, cells 222/222, food 0/0, consumed 1,134,017 both, fills B=139, rndN A=69,543 vs
  B=0 (by design), fb=9 both (blocked font/net fetches), no page errors.
  The earlier "mismatch" was a METRIC artifact in the gate, not a world fork: B's pre-override
  boot draws (2,160: grain texture init etc. drawn directly from the seeded stub before the
  Math.random override installs) were not counted in the first consumed formula. Per-frame
  diagnosis (t-jsrnd-diag.js): wasmA==wasmB draw-for-draw every frame, cells/food equal every
  frame, and the JS-side delta constant from frame 0 (boot-only). Corrected metric:
  consumed = pops + (__draws - fills*cap), i.e. buffer pops plus pre-override direct draws
  (base/fill draws are transport, not consumption). With that, the live page is byte-equal too.

## Live frame numbers (headless SwiftShader, NOT device numbers; relative within-run only)
Not measurable under the determinism fixture: the stubbed clock makes intra-frame deltas 0 by
construction. Measured free-running instead (t-jsrnd-perf-live.js: real clock/raf, autoQuality=0,
~20 s per leg, page's own exp-avg stage stats, ms/frame):
  A ?jsrnd=1:  pack 0.566  step 0.505  js 3.172  SIMW.ms 2.117  (rndN 15,921, fills 0)
  B ?jsrnd=2:  pack 0.086  step 0.278  js 3.702  SIMW.ms 0.444  (rndN 0, fills 2)
  C default:   pack 0.099  step 0.286  (SIMW.js not populated on the no-jsrnd path; world not
               comparable: no determinism fixture, real Math.random, worlds diverge)
M2 cuts the wasm-adjacent stage costs vs M1 (pack -85%, step -45%, SIMW.ms -79% in this run);
the B js-stage number includes the Math.random-override dispatch. Headless software raster,
single sandbox box: direction is the evidence, not the absolute ms. Device numbers: not measured (headless sandbox only).

## Choice
M2 (rndbatch, ?jsrnd=2). Exact global Math.random order preserved, byte-proven on node (120
steps, SIMD + nonSIMD) AND on the live page (120 frames, projected world state + consumed-draw
count identical). Strictly faster than M1 at both measured node scales and on the free-running
live stage stats. No per-draw crossings for present or future kernels. JS fallback path
untouched, default binaries untouched (all changes cfg(feature jsrnd/jsrndbatch)-gated;
no-feature build of this source measures 43.0-43.5 us = shipped default within noise).

## Not changed / not claimed
- M0 (kernel PRNG) remains the production default; this branch changes no default binary.
- M2 is a transport change only; world evolution given the same stream is byte-identical to M1
  (proven), NOT to a JS-fallback world (the known ulp-drift of the wasm port is unchanged, separate lane).
- Device (real iPhone/desktop GPU) frame numbers: not measured here (headless sandbox only).
