# Card 246: opt-in second grain implementation and measured mismatch

Base: wasm-bodyplan 1ee8a5cc771ad1f1970241fbbaacdc7adfa0a023.

Added a development-only CPU JavaScript equivalent of the actual grain.js GLSL path. It implements the blue-noise repeat/linear sampling, dihedral transforms, float32 hash, fine/crystal/cloud layers, softness, luma/zone/texture adaptation, monochrome, stock/chroma, debug and premultiplied overlay math. It is NOT Rust or WASM. No production file, dispatch, default, or deployment changed. The copied blue-noise tile comes from the pinned grain.js input.

Run: `python3 devtools/card246/run.py` from the repository root. Uses installed google-chrome headless with SwiftShader, a loopback-only HTTP server and an isolated temporary browser profile. Saves raw per-case GPU/CPU RGBA arrays and an actual page screenshot. No external packages required. Server closes after the run. No hardware performance claim; virtual time makes timing invalid and timing metrics are omitted.

The actual unchanged CA2Grain.render path is invoked with a generated opaque 48x48 gradient/checker input, then readPixels is row-flipped into top-left order. The same bytes, parameters, dimensions, DPR=1 and frame bucket feed the CPU implementation. Eight cases cover amount-zero, color, mono/skew, full softness, debug, premultiplied overlay, res-adapt's low-height branch and bucket257. Every CPU case is repeated and checked deterministic. A nonzero-grain negative control checks both implementations differ from the zero-grain image. These harness controls pass. No approved quality threshold was supplied or invented.

Final comparison: zero/debug/res-adapt exact; color1173 differing bytes/max4/mean0.1363; mono1387/max3/mean0.1631; soft2116/max8/mean0.3387; overlay3533/max18/mean0.9817; bucket2571187/max3/mean0.1372. Each case has9216 bytes. These are raw RGBA byte differences, not perceptual quality scores. Overlay is compared before browser compositing, not an end-to-end overlay visual equivalence assertion.

Byte parity is NOT passed. Bounded identical-input comparison and a second implementation now exist, but exact hash/texture/float arithmetic across paths still differs. No claim of real-device visual quality, all-parameter coverage, speed suitability, or production readiness. A CPU implementation is a development reference, not a recommended runtime replacement.

Initial output is preserved separately in comparison-initial.json: a left-association error in two CPU hash expressions caused larger differences (overlay max125/debug max226). The source correction restores GLSL left-to-right addition grouping before the final run; no threshold tuning. Initial timings are zero and invalid under virtual time. comparison.json is the final corrected result.

Visual inspection: comparison.png was opened and inspected. All six labeled color/mono/overlay tiles render in aligned GPU/CPU pairs with matching broad gradients and checker structure. Differences remain measurable. This is a tiny synthetic SwiftShader fixture, not an aesthetic grain acceptance or device screenshot.

Not covered: alpha-source behavior, DPR>1, all resolution profile branches, real animation/motion, production-sized canvases, hardware GPU/browser differences, WASM implementation, end-to-end overlay composite, quality approval.
