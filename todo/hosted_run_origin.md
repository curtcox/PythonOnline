# Hosted persistent Python home on hashbin.app

Status: implemented, pushed and deployed 2026-10-28; production acceptance is blocked
by HashBin's missing `CLOUDFLARE_ANALYTICS_TOKEN`. The run-service brake correctly refuses
frames until a real current-month measurement can be obtained. HashBin and Pages
deployments succeeded. Linux CI passes Chromium, Firefox and WebKit full gallery suites,
30 Node/package tests, 19 Python tests and consistency checks. Local Chromium/WebKit
also passed; local Firefox's profile launch remains an environment issue.
Runtime pinning, PSL eligibility/submission and Safari retention acceptance remain open.
HashBin implementation and rollout: https://github.com/curtcox/hashbin.org/blob/main/todo/hosted_run_origin.md

## Contract

Keep files between completed runs is an explicit, local preference. Off is the default.
Python still runs only in the HashBin SDK sandbox, never with the editor's origin.
The registered app remains `app_2eabd9ad-8b90-4635-accd-7583e5241f96`.
Its hosted origin is `https://a2eabd9ad8b904635accd7583e5241f96.hashbin.app`.
Its registered embedder is exactly `https://curtcox.github.io`.

Persistence belongs to this app's hosted origin within each top-level-site partition.
Every run there can read or change earlier files. Other apps on curtcox.github.io can
also embed this origin. Store no credentials or secrets. Treat restored files as untrusted.
Browser storage can be evicted; this is not backup or a promise of permanent retention.

Source, stdin and Auto-run keep the existing share/publish envelope. Persistence is never
enabled by a URL, saved document, HashBin callback or imported program. A newly opened
program/share/gallery link starts with opaque mode even when this browser previously
enabled persistence; enabling it for linked code requires a new explicit choice. Link/import handling
also remembers off so restoring that source at the bare URL cannot reuse the old preference.
A failed hosted frame reports an actionable error. Never silently fall back or silently
claim files were saved. Stop, timeouts and superseded runs may lose unflushed writes.

## Implementation

- [x] Vendor the exact HashBin SDK v0.4.0 and cache helper, retain older immutable
      vendor files, and update the loader and SRI assertions.
- [x] Add the exact hosted origin to the editor CSP `frame-src`. Keep the opaque
      bootstrap hash and existing restrictions for ordinary runs and rich output.
- [x] Add a visible `Keep files between runs` preference, explanatory storage warning,
      saved/error status and link-run guard. Keep this setting out of shared documents.
      Recreate the Python client when switching storage modes.
- [x] Extend `PythonSandbox.factory` to choose opaque or hosted explicitly.
      Hosted calls use the real client ID, `runDomain: 'hashbin.app'`, the same
      verified worker/app-source proxy, and the SDK's validated origin handshake.
- [x] Add a small filesystem adapter. For hosted workers only, mount IDBFS at
      `/home/pyodide`, await `FS.syncfs(true)` before installing/running programs,
      and await `FS.syncfs(false)` after each completed run before emitting `done`.
      Surface read/write errors; never report successful persistence on failure.
- [x] Keep trusted `src/py/*.py` modules outside the persisted home (for example
      `/opt/pythononline`), and reinstall them from verified app bytes each worker.
      Stored Python files must not replace the runtime helpers automatically.
- [x] Preserve opaque-mode storage hardening. Hosted mode intentionally retains
      its own IndexedDB capability for IDBFS while still preventing nested worker
      escapes and access to the editor's origin.
- [x] Disable warm spares in persistent mode: preloaded filesystem snapshots can
      overwrite later writes. New workers restore the latest committed home.
      Treat file contents as shared and untrusted; simultaneous tabs can conflict.
- [x] Keep Pyodide pinned to **314.0.7** / CPython 3.14.2. Initially retain the verified
      embedding-page runtime proxy so arbitrary Pyodide packages and offline opaque
      runs keep working. Direct run-origin runtime loading follows verified pinning
      of the exact core files and selected packages; do not use the older 0.27.7
      example in HashBin's original design.
- [x] Update AGENTS/README/help, regenerate docs HTML if help Markdown changes,
      regenerate the offline asset manifest, and run consistency checks.

## HashBin rollout dependencies

- [x] Configure hashbin.app in both production Workers and the SDK default.
- [x] Verify active zone, proxied apex and wildcard DNS, Universal SSL, HTTPS and TLS 1.2.
      Public RDAP confirms registration 2026-10-28 and expiry 2027-10-28 with transfer lock.
      PSL needs a longer registration term and qualifying public usage; no renewal purchase was made.
- [x] Deploy main then run Worker; run-origin deployment/verification is in CI.
- [ ] Configure the missing read-only `CLOUDFLARE_ANALYTICS_TOKEN` GitHub Actions secret,
      redeploy HashBin, and initialize current-month safety evidence using the admin costs
      page. The owner has prepared Cloudflare and GitHub forms for credential entry.
      Do not bypass the brake or install synthetic measurement data.
- [x] Enable hosted mode for Python Online using the owner's session. Verify allowed
      embedders and runtime/request caps. Do not enable unrelated apps for the pilot.
- [ ] Pin Pyodide 314.0.7 core bytes using the existing `scripts/remote-hashes.json`
      upstream hashes. Include `pyodide.mjs`, `pyodide.asm.mjs`,
      `pyodide.asm.wasm`, `python_stdlib.zip` and `pyodide-lock.json`.
      Select distribution packages separately; uncached PyPI downloads remain HTTPS.
      Upload only after retention/price approval under the publisher grant.
- [ ] Submit hashbin.app to the PSL PRIVATE section with the owner contact and _psl TXT
      reference after domain eligibility is verified. Track browser rollout separately.
- [ ] Confirm real Safari seven-day retention and Firefox browser-restart/partitioning
      measurements. Python Online's Linux Firefox integration suite already passes. Local Chromium/WebKit results are already recorded
      by HashBin; they do not establish production Safari retention.

## Acceptance

- [x] Existing CPython/Node tests, package tests, Python unit tests and Chromium/Firefox/WebKit CI browser suites pass.
- [x] With persistence off, worker origin is null and program storage APIs remain hidden.
- [x] With persistence on, origin is the exact app origin, writing a file in one worker
      and reading it in a fresh worker/page reload succeeds.
- [x] No editor localStorage/sessionStorage/DOM is reachable from hosted Python.
- [x] HashBin Chromium/WebKit measurements isolate top-level-site partitions.
- [x] HashBin Chromium/WebKit browser tests verify two enabled app labels cannot read
      or overwrite each other's IndexedDB. Production still enables only Python Online.
- [ ] Live HTTPS pilot acceptance: `npm run test:hosted:live` uses a fresh browser context
      and no account credentials/uploads. It verifies opaque default, hosted origin, file
      restoration across a fresh worker and reload, editor isolation and incoming-link guard;
      saves `test-results/live-hosted.png`. Run after the real cost gate opens.
      `PLAYWRIGHT_EXECUTABLE_PATH` selects an installed Chromium. An optional
      `HOSTED_DNS_ADDRESS` addresses local negative DNS caching without bypassing TLS.
- [x] Incoming share/CID/gallery links cannot enable or reuse persistent execution silently.
- [x] Read/write/quota failures remain visible and do not produce a false saved status.
- [x] Stop and storage-mode switching discard stale messages; no warm spare restores
      an old snapshot; runtime helpers remain outside the persisted tree.
- [x] Opaque offline execution, rich-output sandboxes, publish callbacks and mobile controls
      still work. Verify the deployed Pages workflow and live app before claiming rollout.

