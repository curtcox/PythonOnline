# Hosted persistent Python home on hashbin.app

Status: implemented, pushed and deployed 2026-10-28. The owner configured HashBin's
read-only analytics credential; real cost evidence cleared the run brake. Production
HTTPS acceptance passed: opaque default, hosted origin, file persistence across fresh
workers and page reloads, editor isolation and incoming-link guard, with no unexpected
network/CSP failures. HashBin and Pages deployments succeeded. Chromium and Firefox
CI pass; the full local WebKit gallery/offline suite also passes after waiting for
runtime preloads before navigation and forced offline transitions. Final CI confirmation is pending. Node/package
checks pass all 30 tests; Python checks pass all 19 tests. Local Chromium/WebKit functional
suites pass; local Firefox's profile launch remains an environment issue.
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
- [x] The owner configured account-scoped Account Analytics Read as the
      `CLOUDFLARE_ANALYTICS_TOKEN` Actions secret; deployment installed it. An audited real
      measurement (39 requests, less than one cent) cleared the run brake. Rotate the
      token before 2027-01-26. No synthetic evidence or budget override was used.
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

- [x] Existing CPython/Node, package and Python unit tests pass. Chromium/Firefox CI pass;
      WebKit full local integration checks pass after settling runtime preloads before
      gallery navigation/offline transitions. Final CI confirmation is pending.
- [x] With persistence off, worker origin is null and program storage APIs remain hidden.
- [x] With persistence on, origin is the exact app origin, writing a file in one worker
      and reading it in a fresh worker/page reload succeeds.
- [x] No editor localStorage/sessionStorage/DOM is reachable from hosted Python.
- [x] HashBin Chromium/WebKit measurements isolate top-level-site partitions.
- [x] HashBin Chromium/WebKit browser tests verify two enabled app labels cannot read
      or overwrite each other's IndexedDB. Production still enables only Python Online.
- [x] Live HTTPS pilot acceptance: `npm run test:hosted:live` uses a fresh browser context
      and no account credentials/uploads. It verifies opaque default, hosted origin, file
      restoration across a fresh worker and reload, editor isolation and incoming-link guard;
      saves `test-results/live-hosted.png`. Passed against the real cost-gated deployment.
      `PLAYWRIGHT_EXECUTABLE_PATH` selects an installed Chromium. An optional
      `HOSTED_DNS_ADDRESS` addresses local negative DNS caching without bypassing TLS.
- [x] Incoming share/CID/gallery links cannot enable or reuse persistent execution silently.
- [x] Read/write/quota failures remain visible and do not produce a false saved status.
- [x] Stop and storage-mode switching discard stale messages; no warm spare restores
      an old snapshot; runtime helpers remain outside the persisted tree.
- [x] Opaque offline execution, rich-output sandboxes, publish callbacks and mobile controls
      still work. Verify the deployed Pages workflow and live app before claiming rollout.


Production bootstrap patch: SDK v0.4.0 stays immutable. HashBin's v0.4.0 frame now loads
`/frame/v0.4.1.js`, whose literal source survives Wrangler/esbuild name preservation.
The initial serialized function captured an undefined bundler helper; a bundle regression
test now covers it. `no-transform` prevents Cloudflare injecting a beacon forbidden by
the frame CSP. No runtime assets were uploaded or funded during this pilot.

Browser acceptance now waits for active and spare runtime initialization before gallery
navigation and forced offline transitions. This avoids WebKit reporting canceled in-flight
preloads as page errors. Offline reload still constructs a fresh worker and executes Python;
all page errors and unexpected app CSP violations remain failures. DEBUG logs tag errors by phase.

The simulated gallery deployment now derives a fixture cache version from the rewritten
asset hashes. This matches production and prevents a waiting test service worker from
overwriting the open editor's cache. Full Chromium and WebKit gallery/offline suites pass
locally with this fixture; the final Linux matrix verifies the same change.
