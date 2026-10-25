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
2. `npm run gallery` executes real Pyodide and regenerates previews/fingerprints. Internet is needed for gallery packages and its PyPI sample.
3. Run `python3 -m unittest discover -s tests`, `TEST_PACKAGES=1 npm test`, and relevant browser coverage.
4. After changing shipped assets, run `npm run offline`, then `npm run check`.
5. Browser tests: `npm run test:browser`; use `BROWSER=firefox` or `BROWSER=webkit`; `FULL_GALLERY=1` tests every gallery URL. Install Playwright browsers first. Node package wheels are cached in ignored `.pyodide-cache`.

Deployment and tests remain separate workflows. Do not claim a deployment succeeded without checking the workflow or live page. HashBin registration and switching Pages to GitHub Actions are account setup actions; report them if still needed.
