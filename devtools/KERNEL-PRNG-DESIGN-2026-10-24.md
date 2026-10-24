# Kernel-internal PRNG compatibility design (DRAFT for review, no kernel-stream code written)
Base: wasm-jsrnd-spike @ d69eb5bd. Kernel stream semantics unchanged while measuring.

## 1. Measured (one 15 s headless run per mode, jsrnd=1, foodMode set via setKey; devtools/t-kernel-hits.js on a patched COPY of ca2.js with a counter before each `E.<kernel>(` call; raw: devtools/cmp-traces/kernel-hits-2026-10-24.txt)
Headless frame rate is low, so counts are small. They show reachability only, not rates on a device (ölçülmedi).
| foodMode | kernel calls (15 s) | new hooks | fsN | JS-stream Math.random total |
|---|---|---|---|---|
| 1 life | fd1_tick 3, sw_run 2, tr_run 5, pa_run 5, bs_run 5 | lbN 0 | 1 | 6606 |
| 2 blobs | sw_run 5, pa_run 6, bs_run 6, tr_run 4 | lbN 0 | 2527 | 6232 |
| 3 swarm | sw_run 7, pa_run 6, bs_run 6, tr_run 5 | lbN 0 | 2447 | 8956 |
| 4 worms | wm_run 2, sw_run 5, pa_run 6, bs_run 6, tr_run 4 | wmN 0 | 2871 | 4793 |
| 5 spores | sp_run 2, sw_run 4, pa_run 6, bs_run 6, tr_run 4 | n/a | 5507 | 6244 |
- Hooks lifeBirths (lbN) and wormGrowSplit (wmN) were hit 0 times in every mode where they could apply. Measured, consistent with the source reading: they sit in the JS body after stepFoodW/stepWormsW.
- sw_run shows calls in modes other than 3 (2..7 per run). Cause not diagnosed (ölçülmedi); it may be calls before the mode switch took effect.
- The earlier mode-4 "timeout" was my shell loop (two ~90 s runs in one 120 s tool call), not a harness fault; the single run above completes.
- Sampled (1 in 10) Math.random callers are dominated by the wasm import js_rnd; the JS draw sites are small. Not a CPU claim.

## 2. Source-derived (read, not measured)
- fd1.rs, swarm.rs, worms.rs, spores.rs, parasites.rs, tr.rs each own an xorshift128+ r01() seeded from 2 JS Math.random draws per call, plus an 8-draw warm-up. bs.rs has no PRNG.
- r01 call sites: fd1 2, swarm 8, worms 9, spores 9, parasites 13, tr 3.
- sim.rs already has the jsrnd pattern: Sim::rnd01 calls js_rnd.
- swarm.rs order read against the JS stepSwarm body: per item vx then vy jitter; then c<2 gate 0.3, c>5 gate 0.4, birth gate 0.3 (&& can_birth), then a, b, r; refill: cx, cy then 4 x (a, b, r). Matches the JS body statement order, by reading only.
- fd1.rs birth: one r01 per accepted candidate, same as the JS body (this is what post_life_births mirrors).
- Not read yet: worms.rs, spores.rs, parasites.rs, tr.rs order against their JS bodies. Equivalence for them is unknown.

## 3. Compatibility choices
A. Keep (current default): kernel PRNG, seeded by 2 JS draws. Stream differs from the JS route by design: distribution-only, never parity. No change.
B. jsrnd feature only: each kernel r01() calls js_rnd; the warm-up and the 2 JS seed draws are removed (feature-gated, default path untouched). Target stream = the JS fallback body stream. Needs, per kernel:
   1. extraction of the REAL JS fallback body, run on identical state with a seeded Math.random against the kernel with js_rnd bound to the same stream;
   2. comparison of every output field and the draw count; faults as degraded.
   Only kernels where the order check passes would move. A kernel that does not match its JS body must stay as is and be listed as incompatible.
C. Keep the kernel PRNG and mirror it in JS (seed + state transfer): rejected for scope, because it would add a Rust-PRNG substitute to the JS route, which is not approved.
Recommended: B, one kernel at a time, order fd1_tick, sw_run, wm_run, sp_run, tr_run, pa_run (by increasing r01 sites). Every kernel needs its own boundary test before moving.

## 4. Open
- 1711/1715 (swarm life JS body): its degraded-only behaviour is its own scope. Under B it becomes the parity reference for sw_run, not an active-path port.
- Random-comparator sort (line ~598) and unhit callers are untouched.
- f32/f64 metaball and stepLive default remain main's decisions.
