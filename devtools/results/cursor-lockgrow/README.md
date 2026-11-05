# Cursor lock growth: bounded qualification

Product ca2.js SHA256: 2b3abd3a7e1b7fa0fdb307db470e30748744b6e7f127114ac68c4f750dcdf328
Product Git blob: 449617535a636022ec7107332eb5a963ca8fb124
Base: d7e6626cd200f29b984d861463fe2b437ef30348
Original product commits: 32b4817, 093f7aa, e995a03. Consolidated without their withdrawn test iterations.

The numeric run used t-lockgrow-consumed-v35.js (SHA256 8d808666b24aceee78850495e4e5f75066a75ff2cfa4e25c5da9ecbc1668328e), harness.js (c52a48adc7b6142a19ca0c34367b798cf7a662ef86f650306d22dea7ade61187), and this product. Its 12 assertions passed. Actual reviewed samples show growth and eased return under a forced cursorSize=0.8/cursorLockMs=4000 singleton fixture and real CDP pointer input.

The visual run used t-lockgrow-shot2.js (727209deda7d169700010f619180adeb1b9968ac2b8eafbde5e5b321f45129f6), the same helper and product. Actual pixels were independently inspected: the blue ring grows then returns, fully visible near (605,231). Bracket states preserve singleton radius 36.417, config and pointer; grown radius 41.832 to 41.862, returned 29.161 to 29.144. The capture log labels CAPTURED, not a whole-product PASS.

The normal t-lockgrow.js includes a later known-failure-priority correction. Its source and replayed verdict controls were checked; no new real-render run is claimed for that later predicate change. Earlier consumed numeric script is retained separately for exact provenance. Source-to-run association was recorded by the test operator; no independent HTTP request trace was captured.

Scope: forced-config singleton real-pointer numeric and visual behavior only. The fixture reasserts configuration and world inputs, not ring output. Normal profile seeding, cell-switch behavior, Safari, mobile, separator behavior and production are not qualified. This branch does not promote stable/main or alter the deployed selector. No historical files or branches are deleted.
