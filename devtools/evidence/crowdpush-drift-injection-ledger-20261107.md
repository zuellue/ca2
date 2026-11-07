# gap2 (CA-15 crowdPush) injection ledger + REAL fresh-build suite (2026-11-07 23:10)

## Correction context
CA-22's "fresh build" table used CA_WASM, which the harness ignores (override is WASM, t70:31) - those rows ran the served binary. Re-run with the real override (this file supersedes):

## REAL fresh 51dce62 build (sha256 0c08ab5e) vs JS - ALL modes FAIL catastrophically:
- default 400x2: hit js 24000 wasm 35600; death js 0 wasm 12800
- EAT 400x2: eaten 6473/9515, merge 9271/1200, fuse 2481/339, death 8954/22654
- BOUND STEPS=10: maxAbsDiff 166.6px (tol 1.6)
- FULLST30: sq mean wasm 64.6, crowd mean 48.2 (physically impossible, sq/crowd in [0,1])

The 51dce62 source is NOT the served binary's engine in any mode. Combined with CA-12 (t133 budget): the served binary is 51dce62 + uncommitted v6/v8b work; no repo source reproduces it. Meanwhile JS==served on every counter mode and keepIn - the JS engine and the served binary are the matched pair, and the repo's Rust source is the orphan.

## Drift-injection ledger (served binary, TRACE=1, 1 trial x 30 steps, envV delta method envV_new - envV_old*edk):
- JS: nx 569 sum 206.9 | ny 807 sum 292.3 (per-event ~0.36)
- served wasm: nx 683 sum 485.1 | ny 783 sum 608.6 (per-event ~0.71-0.78)
Injection COUNTS are comparable; per-event MAGNITUDE is ~2.0-2.2x in the served binary.
cpush = crowdPush * min(1,crowd) * ms * 0.5: crowdPush (0.3) and speedOf are textually identical JS vs 51dce62, so the 2x lives in the uncommitted v6/v8b changes (crowd-at-pressed-cells or the cpush formula itself).

## Behavioral-fit probe (JS-only CA_JS mutation, cpush x2):
- FULLST30: envVx js 0.40 vs wasm 0.77 (was 0.30/0.84) - closer, still FAIL; STEPS=14 still FAIL; STEPS=10 PASS.
- Magnitude scaling alone is NOT the served formula. Blind fitting rejected as unprincipled.

## Status
gap2 alignment is BLOCKED on the true served source (v6/v8b tree) or an owner ruling to behaviorally fit JS to the served binary in the crowdPush path. TRACE=1/DRIFT instrumentation (env-gated) committed to the harness for the next round.
