# jsrnd spike: ABI and compatibility (branch wasm-jsrnd-spike, NOT merge-ready)

Scope: Cargo feature `jsrnd`, flag `?jsrnd=1`. Default binaries are built WITHOUT the feature and are not changed by it.

## ABI additions
- Import `env.js_rnd(line:u32)->f64` (feature jsrnd only). Every `rnd01()` in sim.rs calls it; `line` is the Rust call-site line (track_caller), used only for harness diagnostics. JS returns `Math.random()` (the real stream).
- `p` params vec is now 100 f64 (was 96). New slots: `p[96]=P.cellLife`, `p[97]=P.cellLifeVar` (new_kid life draw). `p[98]`,`p[99]` unused/zero. The cursor writer's slots 82..87 and pa widths are not touched.
- Exports: `sim_jsrnd()` (1 when built with the feature), `sim_birth_ptr()` (f64 side buffer, stride 2 = `popD`, `life` per cell row, newborn rows read at index `i*2`), `sim_dbg_ptr()` (now an empty Vec; kept for ABI, debug counters removed).
- `new_kid` in jsrnd mode draws in the JS `Cell()` constructor order: rand2D, popD, sv, hostility, speedModifier, g.spd/app/bnd, g.col x3 (discarded), newShape(null), life. NOT yet covered: the post-constructor overrides of each birth site (divide/repro/eatMerge paths) beyond what the tests below exercise.

## JS consumers (ca2.js)
- `?jsrnd=1`: loads `ca2core-jsrnd-simd.wasm` (SIMD available) or `ca2core-jsrnd.wasm` (`?nosimd=1`), passes `{env:{js_rnd}}`, writes p[96]/p[97] before `sim_step(0,0)` (no seeded draws), builds newborns with `cellFromRow` (popD/life from the birth buffer, no Math.random).
- Without the flag: unchanged path (seeded `sim_step(s0,s1)`, JS `Cell` for newborns). p[96..99] are never written.

## Compatibility measured (live headless, 2026-10-23)
1. Default JS + jsrnd binary renamed to ca2core.wasm: instantiate fails (missing env import) -> `WC.ok=false`, pure JS fallback runs (38 cells, 54 births, no page errors).
2. `?jsrnd=1` JS + a default binary (no sim_birth_ptr/js import): `TypeError: E.sim_birth_ptr is not a function` at the first newborn -> `WC.simOff=true`, JS fallback continues (25-29 cells, births continue, no page errors). Graceful but the wasm sim is lost for that session; serve matching binaries only.
3. Old saves: saved state holds plain Cell properties (popD, life), not wasm rows; newborn materialization only affects cells created after load. Not separately load-tested with a legacy save file (ölçülmedi).

## Tests that cover it
- devtools/shadow-build.js + t150-shadow-live.js (JSRND=1): replay of the recorded js_rnd stream into the JS fallback, per-frame draw count equality, per-cell field compare (ulp tolerance is the diagnostic window.__ULPTOL), newborn popD/life Object.is counters (`nb`).
- Measured so far: 115 newborn popD/life bit-equal, draws recorded == consumed on all non-reset runs; first diffs are float ulp growth. Not whole parity; symbiosis/eatMerge/selection/genome were off.
