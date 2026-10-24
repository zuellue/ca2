# ca2 grain WebGL2 GLSL module (grain.js)

Source of facts: grain.js read on branch feature/card246-grain-cpu-reference @ 6f743af0
(zuellue/ca2); divergence numbers from queue/20261024-246-ca.md evidence; wasm parity
from queue/20261024-017-ca.md evidence. Documentation only - no runtime change.

## What it is

A self-contained IIFE in grain.js that registers window.CA2Grain and renders photon
film grain in the browser over a 2D canvas. WebGL2 only (GLSL ES 3.00 fragment shader
embedded as a string, one fullscreen triangle-strip pass). If no WebGL2 context is
available the module leaves api.ok = false and does nothing.

Port of photon-grain v3.2.0 "Halide" (goreda/instinct
gor/custody/2026-10-03-default-on-pre-stage-a/photon-grain.lua): fine + crystal +
cloud blue-noise layers, per-tile dihedral decorrelation, 4-tap soft box, luma-adaptive
gain, zone sensitivity, texture-aware density, per-channel RGB with chroma split.
Video-only parts are left out: letterbox gate, HDR gate, resolution profile.

## Inputs

api.render(src, g, bucket, dpr, overlay):

- src: the source 2D canvas. Uploaded as an RGBA/UNSIGNED_BYTE texture (UNPACK_FLIP_Y),
  sampled as HOOKED. Canvas is resized to src.width x src.height when needed.
- g: parameter object. Recognized keys and defaults when omitted:
  amount (1), strength, size (css px, multiplied by dpr, clamped >= 0.3), softness,
  chroma (CHROMA_SPLIT), development, fine / crystal / cloud (layer weights),
  mono (false), skew (0), resAdapt (false), shadow (1.8), mid (1.5), high (2.7),
  fineRatio (0.5), cloudRatio (2.2), debug (false), stock ([0.95, 0.92, 1.05]).
- bucket: the animation frame bucket (GR_ANIM_BUCKET uniform). Decorrelates the grain
  per frame without time-varying uniforms elsewhere.
- dpr: device pixel ratio; scales grain size so cells stay constant in css px.
- overlay: compositing switch (see below).

Other inputs: TEX_BLUENOISE is a 64x64 blue-noise tile embedded as 4096 hex bytes in
the file (R8 texture, LINEAR, REPEAT). api.ok / api.error report setup status.
The context is created with alpha: true so the overlay mode can emit a transparent
grain-only canvas (per the code comment citing the owner, 21 Oct).

## Buckets, overlay, softness

Buckets: the frame bucket enters every hash through mod(frame_bucket, 256), and cell
coordinates are wrapped (mod 512). This is deliberate: the sine-free Hoskins hash
collapses under float32 for large inputs (measured FFT spikes past |p| ~ 1e4), so all
hash inputs are kept small. Advancing the bucket re-seeds tile orientation/offset and
cell amplitude; bucket values above 255 wrap by design (the bucket-257 parity case
exercises exactly that wrap).

Overlay: two output modes from the same grain field gn.
- Composite (overlay off): outc = clamp(color + gn, 0, 1), alpha 1.
- Overlay (overlay on): premultiplied output whose compositing over dst yields
  dst + gn - an exact add. alpha = clamp(8 * max|gn|, 0, 1),
  col = clamp(color + gn / max(a, 1e-3)). The code comment records that the previous
  mapping (col = 0.5 + gn*2, a = 3*|gn|) added a*(0.5-dst) + 6*gn*|gn| instead - a
  different, weaker, tone-skewed grain.

Softness (GRAIN_SOFTNESS): a real 4-tap box low-pass of the SAME field at half-cell
radius, mixed by clamp(softness, 0, 1). It replaces photon's decorrelated second
sample, which kept amplitude and texture identical and made the knob look dead
(measured in the code comments: std 6.00 vs 5.95). Blur actually softens.

## GPU vs CPU divergence numbers (card 246)

Identical-input comparison of the unchanged WebGL2 GLSL path against the opt-in
JavaScript CPU reference (devtools/card246/grain-cpu.js), harness
devtools/card246/compare.html: 8 cases, 48x48 RGBA (9216 bytes/case), same input,
parameters and bucket, SwiftShader, virtual clock (no timing metrics). Base params
{amount 1, strength 3, size 1.2, softness .4, chroma .2, development 1, fine 1,
crystal 1, cloud 1}; default bucket 7.

Byte parity NOT passed. Per case (differing byte metric: max abs byte error / mean):

| case       | extra params            | result                          |
|------------|-------------------------|---------------------------------|
| zero       | amount 0                | exact (0 differing bytes)       |
| color      | base                    | max 4, mean .1363               |
| mono       | mono, skew .1           | max 3, mean .1631               |
| soft       | softness 1              | max 8, mean .3387               |
| debug      | debug                   | exact                           |
| overlay    | overlay flag            | max 18, mean .9817              |
| res-adapt  | resAdapt                | exact                           |
| bucket-257 | bucket 257              | max 3, mean .1372               |

Controls: CPU repeat-identical, grain-enable negative control passes; an initial
larger failure was preserved, with a source correction only for an independently
found GLSL addition-association port bug. Uncovered: alpha output, DPR > 1,
high-height, hardware-GPU and production paths. Card 246's next step is source-level
isolation of the remaining float/texture error before any parity claim; no production
runtime switch.

## Related parity evidence (card 017)

The second CPU-side implementation is Rust/wasm (wasm/src/grain.rs -> artifact
ca2core-grain.wasm) on branch card017-grain-parity @ 454efa48: gate
devtools/card017/t-grain-parity.js vs the same JS CPU reference (byte-identical to
card246's grain-cpu.js, sha256-verified) reports PARITY-BYTE-EQUAL - 0 differing
bytes in all 10 cases (zero/color/mono-skew/soft/debug/overlay/resadapt-low/high/
bucket257/dpr2), both sides repeat-stable, negative control differs 6635 bytes.
GPU-vs-wasm remains the card 246 comparison lane; the GPU byte diffs above are the
standing measurement.
