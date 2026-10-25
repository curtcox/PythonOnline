# Python Online

Static GitHub Pages Python IDE. No build step or backend. Work directly on `main` and use the existing deployment workflow. Do not add server-side Python execution or third-party API keys.

## Contracts

- Pin Pyodide and its npm package to 314.0.7 (CPython 3.14.2). CDN prefix lives in `src/python-core.js` and `scripts/update-offline.mjs`. Use a module worker and import `pyodide.mjs`; this version does not support classic workers. The loader imports `pyodide.asm.mjs`.
- Python runs only inside `src/python-worker.js`. Never execute user code on the main thread. Remove inherited storage getters and shadow worker `caches`, `indexedDB`, `importScripts`, `Worker`, and `SharedWorker` before any program runs.
- Text is inert textContent/text nodes. Rich HTML/Markdown uses an iframe with an empty sandbox attribute, no scripts, no same-origin permission, and a restrictive CSP. Arbitrary SVG is an image; only our validated turtle/QR code creates inline SVG.
- Auto-run debounce is 750 ms; its 5-second execution limit starts after dependencies. Manual execution has no hard limit and always offers Stop. Busy superseded workers must be terminated; ignore stale worker events.
- Reset `__main__`, argv, cwd, stdin, turtle and figures each run. Clear the Python bridge module cache every run so output never targets a prior run. Keep all Python environment code in real importable `src/py/*.py` files.
- `input()` consumes and echoes Program input lines. Source, stdin, and Auto-run settings must survive sharing, local restore, and OAuth redirects.
- HashBin envelope: `format: hashbin-diagram`, `version: 1`, `type: python`, `src`, `python: {stdin, autorun}`. Limit 5 MiB. Registered public client ID is `app_2eabd9ad-8b90-4635-accd-7583e5241f96`, configured in `index.html`; do not invent a replacement. Return URL is exactly `https://curtcox.github.io/PythonOnline/`.
- Plain scripts expose globals in browsers and CommonJS exports in Node. Avoid a bundler. Retain vendor and lineage licenses.
- Service worker caches only project scope and pinned runtime/package URLs; prefix caches with `pythononline-`. Installs are atomic and updates preserve editor work.
- Mobile at <=760 px width or <=500 px height uses Output/Code/Input tabs, More controls, and >=40 px action buttons. Input text is >=16 px on mobile.

## Maintenance and validation

1. Edit samples in both `src/examples.js` and `examples/*.py`.
2. `npm run gallery` executes real Pyodide and regenerates previews/fingerprints. Internet is needed for gallery packages, its PyPI sample, and saved programs the 256t samples fetch. `src/py/t256.py` resolves 256t strings; keep `examples/saved/`, `examples/256t-save.py`, and `tests/fixtures/256t/` in sync (the Python tests check it).
3. Run `python3 -m unittest discover -s tests`, `TEST_PACKAGES=1 npm test`, and relevant browser coverage.
4. After changing shipped assets, run `npm run offline`, then `npm run check`.
5. Browser tests: `npm run test:browser`; use `BROWSER=firefox` or `BROWSER=webkit`; `FULL_GALLERY=1` tests every gallery URL. Install Playwright browsers first. Node package wheels are cached in ignored `.pyodide-cache`.

## Publishing to HashBin from the shell

Use the registered **Claude Code publisher** client for HashBin saves made by an agent, such as new or changed saved programs for the 256t samples. Do not use the page's client for this.

- Client ID: `app_1932999d-125c-4cf6-bf56-806d6df1fa3a`. Redirect URI: exactly `http://127.0.0.1:8765/callback`.
- OAuth is PKCE against `https://hashbin.org`. Listen on `127.0.0.1:8765` and open `/oauth/authorize` with scope `content:write balance:read`. Use `open` to show it in the user's default browser, where the user signs in and approves; never enter credentials. Exchange the code at `POST /oauth/token` as JSON with `grant_type`, `client_id`, `code`, `redirect_uri` and `code_verifier`.
- Publish exactly as Save to HashBin does. `POST /api/content` with a Bearer token and multipart field `content`, as `application/json` named `diagram.json`, whose body is `HashBinDocuments.serialize({src, python: {stdin: '', autorun: true}})`. The returned CID must equal the one the samples use.
- Saves spend the user's balance. Before publishing, get prices from `/api/balance`, `/api/account/settings` (`default_retention_months`) and `POST /api/payments/calculate` (`{size_bytes, retention_months}`), and confirm the total with the user.
- Keep tokens out of the repo and output, and delete them afterwards. After publishing, check that `https://256t.us/<cid>` matches `tests/fixtures/256t/<cid>`. The same documents are mirrored in the 256t.org repository (`examples/python-online-*.json`, `cids/`; its R2 upload workflow is dispatched manually).

Deployment and tests remain separate workflows. Do not claim a deployment succeeded without checking the workflow or live page. HashBin registration and switching Pages to GitHub Actions are account setup actions; report them if still needed.
