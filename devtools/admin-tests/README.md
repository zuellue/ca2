# Verified-admin interaction checks

The authenticated module is intentionally loaded from ignored `worker/admin-module.js`, not checked into public assets. Place the exact module being released there. No real code or token is needed: these tests inject the module with the literal test code `TEST`.

Run `node devtools/admin-tests/desktop.js`, `mobile.js`, `host.js`, and `motion.js`. The fixture HTML files are test-only. Tests block the live preset endpoint before navigating. Save tests replace fetch with a successful local mock, so no global preset is written. The frame loop is stopped after initial rendering to isolate UI timing from simulation load; this is not a performance or simulation test.

Checks cover real mouse hit-testing and all four hover words, shared local save validation, logout, touch-first reveal then second-tap activation, moving the authenticated widget to a desktop preview host, and sampled retained-letter movement. Screenshots are written to `/tmp/admin-*.png`; inspect them as part of release review. Native mobile hardware and Safari are not covered by the headless Chrome device emulation.
