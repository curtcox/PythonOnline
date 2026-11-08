# Shared tools migration

The app pins the published Fragment Kit v0.3.3 under `vendor/fragment-kit-v0.3.5`. Its production adapter is `src/fragment-config.mjs` and its single app config is `fragment-kit.config.json`. The registered public client ID stays in the existing HTML meta tag.

URL readers, CID verification, Publish, QR generation and scanning, sharing, drafts, scheduler, offline core, shell, tabs and gallery use the pinned kit. Legacy writers remain enabled until the fleet has v1 readers. The kit's immutable `v2` workflows are independent of the exact runtime version.

Python execution, its opaque and hosted sandbox, the trusted Python helpers, turtle output and t256 remain app-owned. Execution imports the same byte-pinned SDK v0.4.0 as Publish. Unused SDK/cache v0.3.0 and the duplicate SDK v0.4.0 were removed. The app retains the pinned v0.4.0 cache verifier for its package lockfile policy.

Existing `pythononline:work`, `pythononline:previous-work` and local persistence settings remain readable. New recovery history uses `pythononline:work:history`; old history is never overwritten. Incoming links and resumed documents always disable filesystem persistence.

Optional packages live in `pythononline-packages-v1`, outside application readiness. Before old app caches are removed, verified package entries migrate using a verified pinned lockfile. Poisoned entries are never copied or served. Gallery and docs keep their network-first update behavior.

`npm run gallery:python` executes the real engine to update original SVG previews. With the site served, `npm run gallery` exports shared fingerprinted PNG covers. `npm run offline` regenerates all shipped hashes. The deploy remains gated by unit, corpus, shared contracts and actual-engine tests in three browsers.

This document describes the migration source. Current remote rollout and deployment evidence is tracked in Fragment Kit's `todo/rollout-status.md`.

Publish returns already in flight before deployment remain readable for this app’s registered public client. New transactions are app-prefixed; unrelated clients and old credential keys are never read by the compatibility adapter. Consuming a callback removes its legacy transaction.

The registered hosted sandbox allows python.hashbin.page as its parent. Recovery copies keep temporary opaque execution and disable the persistence control, with an explicit link carrying the current program and input to canonical for review. Incoming links still start without persistence. No hosted allowlist or account registration is changed. Canonical live acceptance separately reports the host-injected Cloudflare analytics beacon blocked by CSP; the app policy is not broadened for analytics.
