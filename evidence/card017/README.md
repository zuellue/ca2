# Card 017: grain comparison target not established

Checked `wasm-bodyplan` at `1ee8a5cc771ad1f1970241fbbaacdc7adfa0a023`.

Run: `node devtools/card017-grain-path-inventory.cjs`

The current `ca2.js` grain caller uses `CA2Grain.render`. `grain.js` creates a WebGL2 context, supplies a GLSL ES 3 fragment shader, and issues a draw call. All Rust modules under `wasm/src` were scanned for grain references: zero hits. The shipped plain and SIMD WASM binaries each expose 63 exports, with no grain-named export. Full export lists and source/binary SHA256 values are in `path-inventory.json`.

This inventory succeeds as a source/export check only. It is **not** a grain parity test, and absence of a grain-named export alone does not prove every generic export is irrelevant. Inspection of the actual source exports found metaball, simulation, food, shape and related computation, not a grain implementation.

Identical-input WASM/JS grain comparisons: **0**. Grain visual parity, device performance and live behavior: **not measured**. A specific second grain implementation and its dispatch must be supplied or the card scope corrected. Do not substitute simulation/metaball parity for grain parity.

No product source, existing project branch, live site or deployment changed. This verification branch adds only the inventory script and its evidence.
