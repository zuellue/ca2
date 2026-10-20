# Rust/wasm migration notes (zuellue/ca2)

Source of truth for orders: main agent relay (owner iMessage 2026-10-21 01:10: "her sey wasm a": all compute in Rust/wasm; JS fallback and ?nowasm=1 stay; DOM/canvas/WebGL calls stay JS).
Rules: GitHub push with the vault login (zuellue); rebase before push; small commits; measured before/after ms, unmeasured = "olculmedi".

## Build (Linux sandbox)
rustup minimal + wasm32-unknown-unknown. In wasm/: `cargo build --release --target wasm32-unknown-unknown`, copy target/.../ca2core.wasm to ../ca2core.wasm.
SIMD: `RUSTFLAGS="-C target-feature=+simd128" CARGO_TARGET_DIR=target-simd cargo build --release --target wasm32-unknown-unknown`, copy to ../ca2core-simd.wasm. Commit both binaries with the source.
Headless chrome tests (devtools/harness.js): page boot is slow here, wait up to 45 s for window.__ca2; `pkill -f '[g]oogle-chrome'` (plain `pkill -f chrome` kills the shell).
Wasm i64 returns become BigInt in JS: return f64 from exports.

## Done
- step 1 a91a39a metaball field + pixel pass; HUD afa9c6b; sim 0316ade (sim.rs per-frame cell loop)
- 1f05679 t70: JS interact vs wasm interact on frozen input (p[56]=1 interact-only): merge +1.2%, fuse +1.7%, eaten -0.2%, pair -1.3%, hit 0.0% (18k frames). The ~12% low merge/fuse seen live is NOT in interact().
- b7f5d27 keep_in zone floor 0 (matches 801ecfe); t72 JS keepIn vs wasm (p[56]=2): max diff 0, closest gap 0.00 px (zone 0), 0.54 px (zone 70). Live 0.9 px not reproducible in sandbox (plate/radius differ).
- d6dde21 swarm food step -> wasm/src/swarm.rs (stepSwarmW in ca2.js, JS stepSwarm is the fallback). Bench t73 (node, pack+unpack included): 300 food 0.469 -> 0.120 ms, 1000 1.601 -> 0.367, 3000 2.343 -> 1.014.
- ?perf=1 now has per-stage marks: food step, foodKeepIn, stepTrans, cluster state, sim loop+parasites, axis+tally, hud text, sim+ui draw.

- t74 full-frame frozen-input iso (update+interact+keepIn, RNG lockstep, births off in mode A): update() path exact, 0/300 divergence once fuse/birth frames excluded; those differ only by JS-side mixShape/newShape/Cell-ctor Math.random draws (Rust reports births/fusions via the sim log, shapes replay in JS unpack) - a harness RNG-lockstep artifact, not live bias (live sim_step reseeds from Math.random every frame). Statistical trajectories (t74 B, births on, 40 states x 15 frames, N=75): merge -1.5%, fuse -2.5%, birth +1.9%, eaten -3.0%, death +1.3%, hit -3.3%; dense (30x15, N=150): merge 0.0%, birth +0.2%, death +0.2%. Per-state swings ±60%: chaotic. VERDICT: no systematic merge/fuse deficit; the live ~12% was 2-repeat run variance (wasm repeats themselves 221 vs 243 avg cells).
- sim.rs new_kid: a one-step birth burst over the JS +256 headroom silently dropped kids after parents' energy was already spent (and out[0] still counted them). Burst test (cap 302, 40 steps): old binary counted 719 births, kept 2 kids. Root fix: wasm grows the cell buffer (x2, min +256); new exports sim_cap/sim_cells_ptr; ca2.js simW re-anchors cap+pointer after each step. Fixed binary: 379 births all kept, cap grew 302 -> 1208. Debug instrumentation (rng_n/trace) stripped. Step bench (node, N=400, 300 steps, interact-heavy): before ~2.20 ms, after ~2.25 ms (noise; no regression).

- spores food step (foodMode 5) -> wasm/src/spores.rs (stepSporesW in ca2.js, JS stepSpores kept as fallback). Port covers maturation/burst/mote drift/landing/spawn; object identity and food[] membership stay in JS (same contract as swarm.rs). Behavioral check (node, 500 spores, 400 frames): populations 965 wasm vs 962 JS, burst 110 vs 117, settled 480 vs 452, born 1248 vs 1256, 0 NaN, 0 out-of-bounds. Bench (node, step only): JS 0.0866 -> wasm 0.0195 ms/frame; live before 1.88 ms EMA (?perf=1, 517 food), live after: olculmedi.

- worms food step (foodMode 4) -> wasm/src/worms.rs (stepWormsW in ca2.js, JS stepWorms kept as fallback). Head wander + follow chain + growth-tick tail growth/fission/spawn in wasm; JS keeps the eaten-link/dissolve pre-pass, object identity, food[] membership and the tick timer. Behavioral check (node, 40 worms, 400 frames): worms 130 vs 133, links 944 vs 950, split 40 vs 43, born 90 vs 93, 0 NaN, chain integrity ok. Bench (node, step only): JS 0.0909 -> wasm 0.0330 ms/frame; live before 1.27 ms EMA (?perf=1, 542 food), live after: olculmedi. Known minor deviation: on a growth tick the JS split can include the just-grown tail link; the wasm port assigns it to the parent (RNG differs anyway).

## Measured JS cost left (sandbox, ms/frame EMA, ?perf=1)
worms food step 1.27 (542 food), spores 1.88 (517 food), axis+tally 1.5-2.0 (drawAxis = canvas, stays JS), stepTrans 0.1-0.8, foodKeepIn 0.05-0.4, buildSources 0.5 ms/s in spores.

## TODO (order)
1. stepParasites, live knob CA, stepTrans -> wasm (spores + worms done; profile first, port by ms share). Remaining JS food pieces: stepFood (mode 1), stepBlobs (mode 2), foodKeepIn 0.05-0.4 ms.
2. buildSources / emitCell.
4. body-plan logic (newShape/mixShape/simSwim) after desktop team finishes.
5. keepIn root cause (boundary/zone=0) hash+diff from desktop team -> port into sim.rs keep_in (zone floor already 0).
6. body-plan distribution comparison (frozen parameters) + f32 metaball difference (~500-700 bytes / 1.8M, max 198 levels): decide f64 path.
Tools: devtools/t70 (interact iso), t71 (CDP profiler, node devtools/t71-prof.js "?perf=1" secs name [preJS]), t72 (keepIn iso), t73 (swarm bench), t74 (full-frame iso: A exact RNG-lockstep, B statistical, C birth-pressure, D debug flags).
