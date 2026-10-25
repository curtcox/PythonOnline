# Python Online

Write Python in your browser and see it run: [Python Online](https://curtcox.github.io/PythonOnline/) · [sample gallery](https://curtcox.github.io/PythonOnline/gallery.html).

A static, build-free GitHub Pages app. CPython **3.14.2** runs as WebAssembly through **Pyodide 314.0.7**, in a dedicated Web Worker. No Python execution server, account, or API key is required.

- Ace editor with Python completion, a draggable divider, error annotations, and Ctrl/Cmd+Enter to run.
- Auto-run after a 750 ms pause; execution stops after 5 seconds. Turn Auto-run off or press Run for manual execution with a running timer, a 60 second reminder, and Stop.
- Program input supplies `input()` and `sys.stdin`. Inputs are echoed like a terminal; exhausted input explains how to add more lines.
- Ordered console, matplotlib SVG/PNG figures, turtle drawings with replay and skip controls, pandas tables, Pillow images, HTML, SVG, and Markdown.
- Packages from the Pyodide distribution load from imports. Pure-Python PyPI packages can be installed with `await micropip.install(...)` or PEP 723 metadata.
- Share source and input in compressed links, opt out of running on open, shorten through is.gd, or export a QR code. HashBin loads CIDs and supports authenticated saves.
- Download source, console text, figures, and turtle SVG/PNG. Phone layouts have Output / Code / Input tabs and More controls.
- Installable PWA, atomic offline setup, and first-use package caching. Optional gallery-package caching makes NumPy, matplotlib, pandas, Pillow, and micropip available offline.

## Local development

```sh
npm ci
npm run serve
# Open http://localhost:8000/
```

The site itself needs no Node build. Node is used for tests and preview maintenance. The first browser run downloads about 12 MB of pinned runtime assets. Matplotlib and its dependencies download on first import. Unsaved source, input, and Auto-run are stored locally unless a shared URL overrides them.

```sh
python3 -m unittest discover -s tests
npm test
TEST_PACKAGES=1 npm test       # also exercises real matplotlib; downloads on first use
npm run gallery               # runs all 24 samples with pinned Pyodide; requires internet for PyPI
npm run offline               # regenerate after changing any shipped file
npm run check                 # JS syntax, source/preview fingerprints, offline content hashes
npx playwright install chromium firefox webkit
npm run test:browser
BROWSER=firefox npm run test:browser
BROWSER=webkit FULL_GALLERY=1 npm run test:browser
```

Browser tests start their own HTTP server, serve the exact pinned npm runtime and downloaded wheels as a local CDN mirror, and exercise real workers, timing, rich output, sharing, mobile layout, and offline reload. Run `npm run gallery` first to populate `.pyodide-cache`. CI runs Python and Node checks plus a Chromium/Firefox/WebKit matrix independently of deployment. Local test screenshots go into ignored `test-results/`.

## Programs and packages

```python
name = input("Name: ")
print(f"Hello, {name}!")

from IPython.display import HTML, Markdown, display
display(HTML("<b>It works.</b>"))
display(Markdown("## A heading\n**Bold** and `code`"))
```

Matplotlib uses the noninteractive Agg backend. `plt.show()`, `fig.show()`, and figures left open at program completion produce SVG previews and 2× PNG downloads. PNGs are captured with each figure so download works after a worker has been stopped. This is a deliberate eager-capture tradeoff; there is no server-side figure session.

```python
# /// script
# dependencies = ["humanize==4.14.0"]
# ///
import humanize
print(humanize.naturalsize(123456789))
```

The [turtle subset](docs/turtle.md) supports beginner drawing programs, loops, fills, text, circles, stamps, multiple turtles, and recursion. Event-based Tk programs are unsupported. Turtle timing and stamp shapes are approximations; there is no live cursor. A drawing is limited to 200,000 commands. Markdown supports escaped headings, inline emphasis/code, simple lists, and HTTP(S) links.

Each run gets a fresh `__main__`, reset stdin and turtle state, closed figures, default argv/working directory, and removal of imported working-directory modules. Installed packages and files remain inside the worker until Stop/replacement. Stop kills the worker because GitHub Pages cannot provide the headers needed for cooperative interruption. Desktop devices keep a warm spare; low-memory/mobile devices restart lazily. Auto-run's limit starts after dependency loading, so installing a package may take longer than five seconds. `time.sleep()` blocks Python's worker, but the page remains responsive. Console text is capped at 1 MiB or 20,000 lines.

Python code has network access, including `pyfetch` and PyPI installs. Auto-run may repeat network side effects; turn it off when needed. PyPI installations require an internet connection even after the app is available offline.

## Shared URLs and HashBin

Supported URLs are `#<encoded source>`, `?compressed=<lz-string>`, `?doc=<compressed JSON>` for source/input/settings, `?example=<id>`, and `#<cid>`. Add `?run=0` to suppress the initial run. QR uses a saved CID link when the editor still matches that save; otherwise it includes the current document.

HashBin documents use this envelope; bare `.py` content also loads:

```json
{"format":"hashbin-diagram","version":1,"type":"python","src":"print(input())","python":{"stdin":"hello\n","autorun":true}}
```

Saves use the user's HashBin balance and retention settings. A quote is displayed before saving. OAuth tokens stay in sessionStorage; the source snapshot survives the redirect. Source plus input is limited to 5 MiB, including the JSON envelope.

**HashBin registration:** “Python Online” is registered with public client ID `app_2eabd9ad-8b90-4635-accd-7583e5241f96`, configured in the `hashbin-client-id` meta tag in `index.html`. Its return URL is **`https://curtcox.github.io/PythonOnline/`** (case-sensitive, trailing slash). Choose **Save to HashBin** to connect your account, then review the quote before saving. If the registration changes, update the meta tag and run `npm run offline`.

## Worker and output boundaries

Python runs only in a worker, without the DOM or localStorage/sessionStorage. Worker CacheStorage, IndexedDB, importScripts, and nested-worker constructors are made unavailable before user code starts, including their inherited getters. Output messages are treated as data. Text uses text nodes, HTML and Markdown use script-disabled opaque sandboxed iframes with a restrictive CSP, arbitrary SVG uses inert blob images, and turtle SVG is generated from escaped text and validated numeric coordinates. These measures isolate rendered output and direct storage APIs; Python still has the network access described above. Do not treat this tool as a hardened hostile-code sandbox.

The service worker handles only this project's scope and pinned CDN URLs. It precaches the complete app and Pyodide core atomically. The pinned engine requires module workers and ships `pyodide.asm.mjs` (the plan anticipated a classic worker and `.js` loader). Updates offer **Update and reload**, preserving source first. CDN failures leave the previous complete cache available.

## Deployment

Pushes to `main` deploy the repository root through `.github/workflows/deploy.yml`; there is no build step, and test failures do not gate deployment. Enable **Settings → Pages → Source → GitHub Actions**. The public path and HashBin return URL must retain `PythonOnline` casing. Tests are a separate workflow. Do not commit `node_modules`, package caches, or test results.

## Credits and licenses

This unofficial tool is not affiliated with the Python Software Foundation or Pyodide. Python is a PSF trademark; the app uses its own icon. CPython is PSF-licensed and Pyodide is MPL-2.0; both are loaded unmodified from the pinned CDN, and packages retain their own licenses.

The editor and interface lineage comes from GraphvizOnline, ManimOnline, and GnuplotOnline. See [LICENSE-graphvizonline](LICENSE-graphvizonline). Ace is BSD-licensed ([notice](ace/LICENSE)); svg-pan-zoom is BSD-licensed ([notice](LICENSE-svg-pan-zoom)); the QR encoder is Project Nayuki's MIT-licensed implementation, with its notice retained in `src/qr.js`. lz-string's notice is in `vendor/LICENSE-lz-string`. `src/py/turtle.py` is an original implementation, not a copy of CPython's Tk module.
