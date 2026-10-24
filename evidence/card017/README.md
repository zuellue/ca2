# Card 017: grain wasm/js parity - PASSED byte-equal

Base: wasm-bodyplan 1ee8a5cc771ad1f1970241fbbaacdc7adfa0a023.

Second grain implementation in Rust/wasm (wasm/src/grain.rs -> ca2core-grain.wasm, new
artifact; default ca2core.wasm / ca2core-simd.wasm untouched, no glue/dispatch/deploy change).
Port of the JS CPU reference devtools/card017/grain-cpu.js (sha256-verified byte-identical to
card246 @ 6f743af00's grain-cpu.js, itself a port of the grain.js GLSL path). Float semantics
mirrored: every Math.fround is an f32 cast at the same expression point, all other arithmetic
f64, byte store replicates Uint8ClampedArray (clamp + round half to even).

Gate: node devtools/card017/t-grain-parity.js - identical inputs to both implementations,
10 cases (zero-amount, color, mono+skew, full softness, debug, premultiplied overlay,
res-adapt low/high height branches, bucket257, dpr2) over deterministic LCG images with
noise+gradient+checker (luma zones, texture variance, motion, chroma all exercised).

Result (evidence/card017/parity.json): PARITY-BYTE-EQUAL - 0 differing bytes in every case,
each implementation byte-stable across repeats, negative control differs (6635 bytes).
exp/pow paths included: Rust libm and V8 fdlibm measured bit-identical here, not assumed.

Not covered / not claimed: GPU (GLSL) vs wasm parity (card246 measured GPU-vs-JS-CPU byte
differences - texture sampling/contraction; that remains the GPU comparison lane), alpha
sources, production-sized canvases, real-device runs, speed, production readiness. The wasm
grain has no production dispatch; this card is the parity verification only.
