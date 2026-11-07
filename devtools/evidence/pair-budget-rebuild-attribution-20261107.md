# PR #2 pair-budget claim (96-109 px) attributed via sim.rs rebuild (measured 2026-11-07 ~18:03 +03)

Harness: devtools/t133-pair-budget-parity.js (PR #2 head a4745090, unmodified), run as
`WASM_A=<bin> WASM_B=<bin> node devtools/t133-pair-budget-parity.js 1 200 120 10` from repo root,
10 states per variant, 200 cells, box 120. Variants: plain, CL=1, CL=1 ZEROV=1, RING=1.
Toolchain: rustup minimal, cargo 1.99.1, wasm32-unknown-unknown, `cargo build --release` per devtools/WASM-NOTES.md.

Three binaries, worst per-cell displacement (px) over 10 states, cells over the maxSpeed+1 budget (total over states):

| binary | sha256 (8) | plain | CL=1 | CL+ZEROV | RING | over | verdict |
| served test/ca2core.wasm | 54f02eee | 21.8..29.2 | 21.1..28.1 | 20.4..27.0 | 1.0 | 0 | PASS all |
| fresh build of 51dce62 wasm tree (byte-verified f9 source of served) | 0c08ab5e | 19.9..27.0 | 21.1..26.1 | 19.5..28.9 | 1.0 | 550 | FAIL (small-maxSpeed cells exceed ratio) |
| fresh build of branch wasm/src tree (STALE, pre-item-64, no f9 `used` budget code) | 098ef473 | 101.9..108.6 | 99.0..110.9 | 95.6..109.9 | 49.6..57.3 | 318 | FAIL |

Attribution: PR #2's "live /test f9 wasm moves a worst cell ~96-109 px" claim matches the STALE-branch build
(95.6..110.9 px, 40-60 cells over per state), NOT the served binary (cap-bound, 0 over, worst 20-29 px).
The claim measured a build of a pre-f9 source tree that lacks the per-cell displacement budget
(`used` vec, sim.rs pair-resolve clamp). The served binary enforces the budget.

Side finding: the fresh 51dce62 build also fails the budget on small-maxSpeed cells (over 4-24 per state,
worst px still 19-29) while the served binary does not - consistent with the served binary carrying the
later v6/v8b rebuild fixes on top of 51dce62. So 51dce62 is the byte-verified source of the f9 binary only,
not of the current served binary; no source tree in the repo reproduces the served binary exactly.

No source changed; rebuilt binaries were measurement artifacts, not committed.
