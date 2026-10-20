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

## Measured JS cost left (sandbox, ms/frame EMA, ?perf=1)
worms food step 1.27 (542 food), spores 1.88 (517 food), axis+tally 1.5-2.0 (drawAxis = canvas, stays JS), stepTrans 0.1-0.8, foodKeepIn 0.05-0.4, buildSources 0.5 ms/s in spores.

## TODO (order)
1. merge/fuse low ~12%: full-frame frozen-input comparison including update() (interact alone is clean). Suspects: update() speed dynamics / contact rate, cluster dissolve (JS), sym pairing pack/unpack, count_slots excludes REM-marked cells (JS clusterSize counts dead-not-yet-spliced).
2. worms/spores steps, stepParasites, live knob CA, stepTrans -> wasm (profile first, port by ms share).
3. buildSources / emitCell.
4. body-plan logic (newShape/mixShape/simSwim) after desktop team finishes.
5. keepIn root cause (boundary/zone=0) hash+diff from desktop team -> port into sim.rs keep_in (zone floor already 0).
6. body-plan distribution comparison (frozen parameters) + f32 metaball difference (~500-700 bytes / 1.8M, max 198 levels): decide f64 path.
Tools: devtools/t70 (interact iso), t71 (CDP profiler, node devtools/t71-prof.js "?perf=1" secs name [preJS]), t72 (keepIn iso), t73 (swarm bench).
