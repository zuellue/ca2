# CA-19 FINDING: FULLST crowdPush divergence onset profile (2026-11-07)

Mode: FULLST=1, 100 trials x 4 states (default / ZERO=habitatOn,metallicOn / ZERO=presenceOn / SET=adhesion=.9,.2,.3), 40x160 grid, served wasm. Verdicts from actual harness runs; envVx mean|v| js vs wasm (gate ratio <= 0.35):

| STEPS | verdict | js mean | wasm mean | ratio |
|-------|---------|---------|-----------|-------|
| 10    | PASS    | -       | -         | ~1.0  |
| 12    | PASS    | -       | -         | ~1.0  |
| 13    | PASS    | -       | -         | ~1.0  |
| 14    | FAIL    | 1.0906  | 1.5289    | 1.40  |
| 16    | FAIL    | 0.9209  | 1.2935    | 1.40  |
| 20    | FAIL    | 0.5760  | 0.9966    | 1.73  |
| 24    | FAIL    | 0.3922  | 0.9520    | 2.43  |
| 28    | FAIL    | 0.3832  | 0.8617    | 2.25  |
| 30    | FAIL    | ~0.298  | ~0.734    | ~2.46 |

(12 and 13 passed without printing envV stats, so no means recorded; 10/30 values from CA-15 runs.)

## Reading:
- Onset is SHARP between STEPS=13 and 14 (PASS at 13, FAIL at 14 across all states) - not gradual accumulation. Consistent with a one-time event around step ~13-14 (e.g. a population/energy threshold crossing that first triggers the divergent crowdPush branch), then persists.
- The gap GROWS over time (ratio 1.4 -> 2.5) while js envV decays and wasm decays slower: wasm sustains stronger crowding repulsion - consistent with the served binary's crowdPush having a larger radius, different falloff, or an extra contribution vs both repo sources.
- Feeds CA-7: the divergence is structural (threshold-triggered onset, monotone growth), not noise - a source-aligned rebuild is needed before long-horizon js<->wasm parity is achievable.
