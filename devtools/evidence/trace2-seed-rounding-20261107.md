# TRACE2 seed rounding (CA-29): two ulp sources named; Math.hypot aligned to Rust hyp() in ca2.js

Date: 2026-11-07. Branch: ca/187-js-rust-alignment. Follows trace2-noise-floor-20261107.md.

## Named seed ops
1. Math.hypot(a,b) vs Rust hyp() = (a*a+b*b).sqrt() (sim.rs:67). Math.hypot scales to
   avoid overflow and rounds differently from the sqrt form on ~37% of uniform draws
   (measured over 2e6 pairs, last-ulp diffs). sim.rs uses the sqrt form everywhere.
2. Crowd-channel pow: JS Math.pow(1-cg, ek2) / Math.pow(1-crowdRel, ek2) (ca2.js crowd
   gain/release) vs Rust powf (sim.rs:221-222). libm pow implementations differ by ulps;
   no JS builtin matches Rust powf bit-exactly. Residual, recorded as known noise source.

## Isolation experiments (TRACE2 aligned-RNG per-cell diff, STEPS=200)
- Baseline (pre-patch): first divergence step 26 (1.29e-9); bit-exact horizon 58 steps;
  1px crossing step 76 (see trace2-noise-floor-20261107.md).
- HYSQRT=1 probe (harness flag: Math.hypot -> sqrt form globally): first divergence ~39.
- ZERO=crowdGain,crowdRel (pow channel frozen): first divergence ~78.
- HYSQRT=1 + ZERO=crowdGain,crowdRel: NO divergence > 1e-9 in 200 steps - fully bit-exact.
  The two named sources are the complete seed set on this path.
(mkState draws from Math.random unseeded, so the exact first-divergence step varies
run to run, 26-39 across the runs above; the channel attribution is stable.)

## Patch (ca2.js, flag-free JS->Rust alignment)
Replaced Math.hypot(a,b) with (Math.sqrt((a)*(a)+(b)*(b))) at the 9 call sites in the
sim-path functions (update x6, interact x1, checkSurvival x1, limit x1) - 1:1 Rust hyp().
Render/separator/UI call sites untouched (not in the engine path).

## Verification
- Regressions vs served binary (54f02eee): default 800x4 PASS, EAT 400x2 PASS,
  BIRTH 800x4 PASS, BIRTH=1 LOGCHK=1 200x4 PASS (kind1/kind3 exact, kind2 6077 <= 13789),
  BOUND PASS (maxAbsDiff 0), FULLST30 PASS.
- Teeth: CA_JS budget-reset mutation still FAILs FULLST30 with the gap2 signature.
- TRACE2 post-patch: first divergence in the velocity channel at ~1e-8..1e-9 around steps
  27-39 (residual pow seed), same chaotic amplification as before; distribution parity
  (FULLST) unaffected.
- Residual: the crowd pow channel remains a ~1-ulp noise source (CA-30, optional: port
  Rust's libm pow bit-exactly to JS - not worth it; FULLST distribution tolerance is the
  right gate past the bit-exact horizon).

## CORRECTION (2026-11-07, CA-30 follow-up)
The 'crowd pow' attribution above is imprecise: kg/kr/edk pow inputs are CONSTANTS and
Math.pow matches the served binary on all of them (BOUND bit-exact); ZERO=crowdGain
skips the whole crowd feedback block. The residual seed is a rare (~0.04%/draw)
transcendental mismatch on a varying input, most likely cos/sin argument reduction -
see rustpow-port-20261107.md. The hypot finding and patch stand as written.
