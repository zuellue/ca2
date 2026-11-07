# CA-15/19 crowdPush alignment probe 1: wall anticipation (2026-11-07, REVERTED)

Found: JS wallPull carries the 73d(1) anticipation block (pre-contact env push ramped over one radius); 51dce62 sim.rs keep_in has NO anticipation, only the contact resolve (carrySide == Rust resolve, verified 1:1).

Probe: removed the anticipation block from JS wallPull on the alignment branch.
- FULLST STEPS=14: FAIL -> PASS (onset no longer at 14).
- FULLST STEPS=22/26/30: still FAIL - wasm sustains envV ~2-2.8x (js mean 0.30-0.48 vs wasm 0.84-1.09). A second mechanism keeps wasm envV alive in long wall-fired runs.
- BIRTH 800x4 REGRESSED: eaten js 8218 wasm 7859 (4.6%), death 8725 vs 8371 (4.2%) - with anticipation, JS matched wasm counters; without it, counters diverge. So anticipation's net effect on counters was bringing JS TOWARD wasm, and the FULLST envV divergence is not (only) the anticipation.

Verdict: anticipation absence in Rust is a real textual divergence but NOT the crowdPush mechanism; patch reverted (branch must stay green). BIRTH 800x4 PASS after revert (confirmed).
Next probe candidates: (a) keep_in/update ordering of the envV decay vs wall injection within a step; (b) crowd-field press source (pr[c] vs sqS timing); (c) the SQS->stepSquash feedback into press; (d) an envV injection site in the app wasm-mode frame outside keep_in (e.g. wallPull on the JS mirror during readback).
