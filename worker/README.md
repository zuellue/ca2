# ca2-presets worker

Live worker: https://ca2-presets.middots.workers.dev/ (Cloudflare, account "abdu", script `ca2-presets`).
Bindings: DB (D1 b9efde01-efb1-4815-a36c-1b38d34af639, table `presets`), PRESETS (legacy KV fallback c4ac476e27e34f5a97fccd733390ebc7). Compatibility date 2026-10-20.

- `index.js` = verbatim backup of the deployed source, fetched read-only via the dash internal API 2026-10-21 (rollback copy).
- Deploy: dash internal API PUT /api/v4/accounts/<acc>/workers/scripts/ca2-presets (multipart: metadata JSON part with bindings + compatibility_date, worker.js module part). GET /content/v2 returns the deployed multipart source.
- Rollback: PUT this index.js back with the same metadata.
- The admin module served by the /admin endpoint (owner 21 Oct: admin code must never be publicly fetchable) is intentionally NOT in this public repo; it lives only in the deployed worker and local copies outside git (see .gitignore).
