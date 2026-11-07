# CA-30: bit-exact Rust-libm pow port (verified vs wasm32 powf); residual TRACE2 seed attribution

Date: 2026-11-07. Branch: ca/187-js-rust-alignment. Follows trace2-seed-rounding-20261107.md.

## Delivered
- `rustPow`: a JS port of rust-lang/libm pow (FreeBSD e_pow.c), embedded in
  devtools/t70-interact-iso-served.js behind the `POWRUST=1` probe flag (overrides Math.pow
  for the generated JS engine). Includes fdlibm scalbn.
- VERIFIED bit-exact: 0 mismatches on 200k domain inputs against a Rust 1.99.1
  wasm32-unknown-unknown build of f64::powf (oracle: /tmp/powwasm.wasm pow_bits, rustc -O
  --target wasm32-unknown-unknown). Math.pow mismatches the same oracle on 4.5% of inputs.
- NOTE: x86_64-native rustc powf is NOT this algorithm (glibc pow, ~10% mismatch) - only
  wasm32-target oracles count for engine parity.

## What this implies about the SERVED binary (54f02eee)
- The served binary's cos/sin match V8's Math.cos/Math.sin on every aligned-RNG draw the
  TRACE2 harness has produced (steps 0-30 bit-exact = ~2400 rand2D draws, zero mismatches).
  A 1.99.1-built wasm differs from V8 on ~50% of cos/sin inputs, so the served binary was
  built with an OLDER toolchain whose libm cos/sin are V8/fdlibm-compatible.
- All constant-input pows in the sim path (0.88^1.002, 0.98^1.002, 0.75^1.002) agree
  between Math.pow, rustPow, and the served binary (BOUND mode stays bit-exact with plain
  Math.pow while exercising the crowd channel). The CA-29 'crowd pow' attribution was
  therefore imprecise: ZERO=crowdGain,crowdRel skips the whole crowd feedback block, not
  just the pow calls.

## Residual seed (OPEN)
With hypot aligned (CA-29 patch) the TRACE2 aligned-RNG run stays bit-exact ~27-39 steps
(exact step varies with the unseeded mkState), then a 1-ulp seed lands in the CROWD value
(first observed diffs: crowd ~1 ulp, then envV/velocity/energy amplified downstream).
All basic ops in the crowd path are IEEE-exact and the code is textually 1:1, so the seed
is a rare transcendental mismatch on a varying input - prime suspect: a cos/sin draw where
the served binary's old-libm argument reduction disagrees with V8 near a multiple of pi/2
(a ~= k*pi/2), consistent with a ~0.04% per-draw mismatch rate (first hit at ~step 30 over
~2400 draws). The served binary's pow may equally differ from both Math.pow and rustPow on
rare varying inputs - but the only varying-input pows in FULLST are none (kg/kr/edk inputs
are constant), which leaves cos/sin as the only varying transcendental on this path.
CA-31 queued: oracle mode (single-cell pack, p[56]=0, measure wasm-implied cos(a)/sin(a)
per draw) to name the exact input and libm variant; the oracle needs the harness's real P
set (synthetic minimal params trigger organic()/survival side effects - first naive
attempt poisoned the cell).

## Status
POWRUST=1 stays a harness probe flag (verified, committed). No ca2.js change for pow:
Math.pow matches the served binary on every constant input the sim uses, and swapping in
rustPow would IMPORT 1.99.1 behavior the served binary predates.
