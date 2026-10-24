# Python Online — master plan

A static GitHub Pages site where people write Python programs in the browser and see them run,
the way GraphvizOnline, [ManimOnline](https://curtcox.github.io/ManimOnline/) and
[Gnuplot Online](https://curtcox.github.io/GnuplotOnline/) work for their languages. No server:
CPython runs in the page as WebAssembly (Pyodide), inside a Web Worker.

Published at **https://curtcox.github.io/PythonOnline/**. The GitHub repo is `curtcox/PythonOnline`
and the Pages path follows that casing. The HashBin return URL must match it exactly.

## Decisions (agreed)

| Topic | Decision |
|---|---|
| Language | Python only. No Graphviz, modl or Manim, and no language detector. |
| Engine | **Pyodide 314.0.7** (CPython **3.14.2**, released 2026-09-14), loaded from `https://cdn.jsdelivr.net/pyodide/v314.0.7/full/`, pinned, as ManimOnline loads v0.27.0. Not vendored: the core is ~12 MB and packages are fetched on demand. |
| Publishing | Same `deploy.yml` as ManimOnline/GnuplotOnline: on push to `main`, upload the repo root with `actions/upload-pages-artifact@v3` and deploy with `actions/deploy-pages@v4`. No build step. Deployment is independent of tests. |
| Running | **Auto-run + toggle.** Run after a 750 ms pause in typing (like Graphviz), with a short time limit. An *Auto-run* checkbox (on by default, remembered in localStorage) switches to *Run* / Ctrl+Enter only. *Stop* always available. |
| Output | Console text (stdout/stderr, tracebacks with editor line markers), **matplotlib** figures, **turtle** graphics, and **rich display** (HTML, SVG, PNG/JPEG, Markdown via `display()`). |
| `input()` | **Stdin box.** A *Program input* panel; `input()` and `sys.stdin` read its lines in order. No cross-origin-isolation shim. The input travels with share links and HashBin saves. |
| v1 extras | Offline/PWA, Pyodide packages auto-loaded from imports plus PyPI installs via micropip, Playwright CI on Chromium/Firefox/WebKit, is.gd link shortener. |
| HashBin | The user registers a new "Python Online" app. The code ships with an empty `hashbin-client-id` meta tag until then. |
| Workflow | Direct commits on `main` with frequent pushes, as the user chose for GnuplotOnline. (Say so if you'd rather have a branch + PR per phase.) |

## What I checked before planning

- `cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.js` serves with `access-control-allow-origin: *`.
  `pyodide-lock.json` reports Python 3.14.2, ABI `2026_0`, 357 packages, including
  matplotlib 3.10.8, numpy 2.4.6, pandas 3.0.2, pillow 12.2.0 and micropip 0.11.1.
- Core download: `pyodide.asm.wasm` 9.6 MB + `python_stdlib.zip` 2.5 MB + loader JS. matplotlib
  pulls in numpy, pillow, fonttools, contourpy, kiwisolver and others: roughly 15 MB more, loaded
  only when a program imports it.
- ManimOnline's `ace/` already includes `mode-python.js` and `ext-language_tools.js`, so Python
  highlighting needs no custom mode (GnuplotOnline had to write one).
- Pyodide has no `tkinter`, so the standard-library `turtle` cannot work. We ship our own.
- Without `SharedArrayBuffer` (GitHub Pages cannot send COOP/COEP headers) Pyodide cannot be
  interrupted cooperatively. Stop and timeouts must terminate the worker. That is the same
  model GnuplotOnline uses for runaway scripts.
- `curtcox.github.io` is one origin shared by every Pages project of this account (ManimOnline,
  GnuplotOnline, …). Shared links run arbitrary Python on open, so user code must not reach that
  origin's storage. See **Security** below; this shapes the worker and output design.

## Lineage features to carry over (from GnuplotOnline / ManimOnline / modl)

GnuplotOnline is the most recent, cleanest descendant of ManimOnline and already split the glue
into `src/app.js` + `src/app.css`, so most modules are copied from it and adapted.

1. **Links to docs and gallery.** Toolbar: *Python docs ↗* (https://docs.python.org/3.14/),
   *Tutorial ↗* (https://docs.python.org/3.14/tutorial/), *Pyodide ↗* (https://pyodide.org/en/stable/),
   *Packages ↗* (https://pyodide.org/en/stable/usage/packages-in-pyodide.html) and
   *Sample gallery ↗* (our `gallery.html`). Gallery cards for turtle/matplotlib link to the
   relevant docs page (our turtle subset page, matplotlib's).
2. **Mobile friendly.** Port the `@media (max-width: 760px), (max-height: 500px)` layout:
   *Output / Code / Input* tabs with Output first, a prominent *Run*/*Stop* button, rarely used
   controls behind *More*, 40 px touch targets, 16 px inputs so iOS does not zoom, `100dvh`.
   Pinch/pan on figure and turtle SVGs with `svg-pan-zoom.min.js`.
3. **HashBin load/save.** Copy `src/hashbin.js` and `src/hashbin-panel.js` from GnuplotOnline and
   adapt them (see **HashBin**). `#<cid>` URLs load automatically; source survives the OAuth redirect.
4. **QR code of the URL.** Copy GnuplotOnline's `src/qr.js` (Project Nayuki encoder, MIT notice
   kept) and its dialog: CID link if saved, else the compressed link; SVG/PNG download; warnings for
   local hosts, dense codes (version > 20) and overlong URLs, each suggesting HashBin.
5. From GraphvizOnline: Ace editor, live run on edit (debounced), draggable splitter, hide-editor
   toggle, share-link box, *Download*, GitHub fork ribbon. Keep `LICENSE-graphvizonline`.

## Repository layout

```
.github/workflows/deploy.yml     # copied from GnuplotOnline/ManimOnline unchanged
.github/workflows/test.yml       # unit (node + python) + check + Playwright matrix
index.html                       # editor page markup
gallery.html                     # sample gallery
manifest.webmanifest, icon.svg, icons/   # PWA install
service-worker.js                # offline cache (content-versioned)
offline-assets.js                # files to precache (shared by SW, tests, update script)
ace/                             # trimmed copy: ace.js, mode-python, theme, ext-language_tools, LICENSE
svg-pan-zoom.min.js, LICENSE-svg-pan-zoom
src/app.js, src/app.css          # editor glue and styles
src/python-core.js               # engine-agnostic run logic, used by the worker and by Node tests
src/python-worker.js             # Web Worker: loads Pyodide, runs programs, streams output
src/python-client.js             # main thread: run/stop, timeouts, warm spare worker, restarts
src/py/runtime.py                # installed into the worker: stdin, display(), plt.show hook, reset
src/py/turtle.py                 # our turtle module (records drawing commands)
src/output-view.js               # renders the ordered output stream (text, figures, html, turtle)
src/turtle-player.js             # animates turtle command lists into SVG; exports SVG/PNG
src/traceback.js                 # parses tracebacks -> {line, message} for Ace annotations
src/render-scheduler.js          # copied (debounce + stale-callback guard)
src/share-links.js               # adapted (#, ?compressed=, ?doc=, ?example=, CID)
src/hashbin.js, src/hashbin-panel.js     # adapted / copied
src/qr.js                        # copied from GnuplotOnline
src/export.js                    # downloads: main.py, output.txt, figure SVG/PNG, turtle SVG/PNG
src/examples.js                  # gallery catalog (id, title, tags, source, stdin, docs link)
src/gallery.js, src/gallery.css  # gallery page
src/offline.js                   # SW registration + status (copied)
examples/*.py                    # sample sources (kept in sync with examples.js)
gallery/previews/*.svg           # generated covers, committed
scripts/render-gallery.mjs       # runs samples with Pyodide in Node, writes covers + fingerprints
scripts/update-offline.mjs       # rewrites offline-assets.js with content hashes
scripts/check.mjs                # node --check on every script + consistency checks
tests/*.test.js                  # node --test, real Pyodide via the `pyodide` npm package
tests/test_*.py                  # CPython unittest for turtle.py and runtime.py
tests/browser/all.cjs            # Playwright suite
README.md, AGENTS.md, LICENSE-graphvizonline, todo/master_plan.md
package.json                     # devDependencies only: playwright, pyodide (pinned 314.0.7)
```

Plain `<script>` files with `?v=N` cache busters; modules export via `module.exports`/`globalThis`
so the same files run in the browser and under `node --test`. lz-string comes from cdnjs, as in
the siblings, and is precached. The `.py` files are fetched by the worker and written into
Pyodide's filesystem (`/home/pyodide/_pythononline/`), so they are real Python that CPython unit
tests can import directly.

## Engine design

**Worker (`src/python-worker.js` + `src/python-core.js`)**

- Load: `importScripts(PYODIDE_URL + 'pyodide.js')`, `loadPyodide({ indexURL, stdout/stderr
  batched handlers })`, write `runtime.py` and `turtle.py` into the FS and put that directory
  first on `sys.path` (so `import turtle` gets ours). Post `{type:'ready', ms}`.
- Harden the global scope after load (see **Security**): remove `caches`, `indexedDB`,
  `importScripts` from `self` before any user code runs.
- Message `{ id, source, stdin, mode: 'auto'|'manual' }`:
  1. **Reset.** Fresh `__main__` namespace; drop user-created modules from `sys.modules` (anything
     imported from the working directory); `plt.close('all')` if matplotlib is loaded; reset the
     turtle recorder; re-seed nothing (randomness is the program's business); restore `sys.argv`,
     `os.getcwd()` (`/home/pyodide`) and redirect `sys.stdin` to the provided text.
  2. **Dependencies.**
     - `pyodide.loadPackagesFromImports(source)` for packages in the Pyodide distribution.
     - PEP 723 inline metadata (`# /// script` … `dependencies = [...]` … `# ///`) is parsed and
       installed with `micropip.install` (pure-Python wheels from PyPI). Top-level
       `await micropip.install(...)` in user code also works because we run with `runPythonAsync`.
     - Post `{type:'status', text:'Loading numpy, matplotlib…'}` while this happens. Package
       loading time does not count toward the run time limit.
  3. **Run** `pyodide.runPythonAsync(source, { globals, filename: 'main.py' })`.
  4. **Finish.** Show any matplotlib figures still open (Jupyter-like), flush turtle drawing, and
     post `{type:'done', id, ok, ms, error?}`. Errors carry the formatted traceback with
     runtime frames trimmed.
- **Streaming.** stdout/stderr are posted as batched chunks (every 50 ms or 8 KB) while the program
  runs; the main thread receives them even though the worker is busy. Output is capped at
  1 MB / 20,000 lines per run, then "… output truncated" and further text is dropped (the program
  keeps running).
- **`input()` / stdin.** `sys.stdin` is an `io.StringIO` of the Program input text. `input(prompt)`
  writes the prompt, reads one line and echoes it to the console (so transcripts look like a
  terminal). At end of input it raises `EOFError` with the hint
  "No more program input — add lines in the Input box."

**Rich output (`src/py/runtime.py`)** — the worker posts an ordered stream of items:

| Item | Produced by |
|---|---|
| `text` (stdout/stderr) | `print`, tracebacks |
| `figure` (SVG + PNG) | `plt.show()` (patched), `fig.show()`, open figures at end of run. Backend forced to `agg`; each figure is saved as SVG (vector, the preview) and lazily as PNG at 2× for download. |
| `turtle` (command list) | our `turtle` module, one item per `Screen` at the first draw call |
| `html` / `svg` / `png` / `jpeg` / `markdown` | `display(obj)` (a builtin we inject): tries `_repr_html_`, `_repr_svg_`, `_repr_png_`, `_repr_jpeg_`, `_repr_markdown_`, then `repr`. pandas DataFrames, PIL images and IPython-style `HTML(...)`/`SVG(...)`/`Markdown(...)`/`Image(...)` helpers (in `runtime.py`, also importable as `from IPython.display import ...` via a tiny shim module). |

**turtle (`src/py/turtle.py`)** — a recording implementation of the common beginner API, written
for this project:

- `Turtle`/`Pen`/`RawTurtle`, module-level functions bound to a default turtle, and `Screen()`.
- Motion: `forward/fd`, `back/bk`, `left/lt`, `right/rt`, `goto/setpos/setposition`, `setx`,
  `sety`, `setheading/seth`, `home`, `circle(radius, extent, steps)`, `dot`, `stamp`, `teleport`.
- Pen: `penup/pu/up`, `pendown/pd/down`, `pensize/width`, `pencolor`, `fillcolor`, `color`,
  `begin_fill`/`end_fill`/`filling`, `write(text, align, font)`, `showturtle`/`hideturtle`,
  `shape` (classic/arrow/turtle/circle/square/triangle), `speed`.
- Queries: `position/pos`, `xcor`, `ycor`, `heading`, `towards`, `distance`, `isdown`.
- Screen: `bgcolor`, `title`, `setup`, `screensize`, `tracer`, `update`, `colormode(1.0|255)`,
  `delay`; `done`/`mainloop`/`exitonclick`/`bye` are no-ops. Event APIs (`onclick`, `onkey`,
  `ontimer`, `listen`) raise a clear `NotImplementedError` naming the limitation.
- Records compact commands (`line`, `fill polygon`, `dot`, `text`, `stamp`, `bg`, plus a speed
  marker) with coordinates in turtle space. Command count capped at 200,000.
- `src/turtle-player.js` draws them into an SVG in the Output pane, animated according to
  `speed()` and `tracer()` (speed 0 / `tracer(0)` draws instantly), with *Skip animation*,
  *Replay*, and SVG/PNG export of the final drawing.
- A `docs/turtle.md` page lists the supported subset; turtle gallery cards and the
  `NotImplementedError` messages link to it.

**Client (`src/python-client.js`)**

- One active worker plus **one warm spare** started after the first becomes ready, so Stop/timeout
  swaps workers instantly instead of waiting for Pyodide to reload. (A second Pyodide instance
  costs memory, so on phones — `navigator.deviceMemory < 4` or a mobile UA — the spare is created
  lazily after a termination instead.)
- Each `run()` supersedes the previous one (latest edit wins): if a run is in progress, the
  worker is terminated and replaced by the spare.
- **Time limits.** Auto-run: 5 s of execution, then terminate and show
  "Stopped after 5 s. Auto-run keeps runs short — press Run (Ctrl+Enter) to run without this limit."
  Manual run: no hard limit, with a running timer and *Stop*; a 60 s soft warning.
- Status line: *Loading Python…* (first visit shows download progress), *Loading packages…*,
  *Running 1.2 s…*, *Finished in 0.3 s*, *Stopped*, *Error on line 7*.

**Errors.** `src/traceback.js` finds the last `File "main.py", line N` frame, adds an Ace error
annotation and gutter marker on line N, and makes the traceback line in the console clickable
(jumps to the line). `SyntaxError` uses the reported line/offset. Unlike Graphviz, output from a
failed run is kept (it is useful), followed by the traceback in red.

## Editor page (`index.html`, `src/app.js`)

Toolbar, in order:

- Mobile only: *Output / Code / Input* tabs.
- *Run* (Ctrl/Cmd+Enter) / *Stop*, and the *Auto-run* checkbox.
- *Download* (main.py, output.txt, current figure/turtle as SVG or PNG).
- *Share*, the share URL box and *Shorten link*.
- *QR code*.
- *Save to HashBin*, the CID box and *Load from HashBin*.
- *Python docs ↗*, *Tutorial ↗*, *Pyodide ↗*, *Packages ↗*, *Sample gallery ↗*.
- Python/Pyodide version and offline status.

Layout: editor on the left with the collapsible **Program input** panel beneath it (a textarea with
a line count badge); **Output** on the right, a scrolling list of output items with *Clear* and
*Copy text*. Ace in Python mode with keyword/builtin autocomplete, 4-space soft tabs, and
Ctrl+Enter bound to Run. Editing the stdin box also triggers auto-run.

Default source on first visit: a short program that shows off the range — a function, an f-string,
a loop over `input()` lines from a pre-filled stdin box, and a small turtle or matplotlib flourish
kept lazy so first paint does not wait on matplotlib (turtle is cheap; the default uses turtle).
Unsaved work (source, stdin, auto-run setting) is restored from localStorage (try/catch) unless the
URL carries source.

## Sharing and URLs

Same scheme as the siblings:

| URL form | Meaning |
|---|---|
| `#<url-encoded source>` | Plain source (long form). |
| `?compressed=<lz-string>` | Source compressed with `LZString.compressToEncodedURIComponent`. The default link. |
| `?doc=<lz-string>` | Compressed JSON document (same shape as the HashBin document). Used only when the stdin box is non-empty. |
| `#<cid>` | Load from HashBin (`HashBinDocuments.isCID` tells it apart from source). |
| `?example=<id>` | Load a gallery sample. |
| `?run=0` | Open without auto-running (for links to programs that are slow or noisy). The share box has a "Don't run on open" option. |

*Shorten link* posts to is.gd through AllOrigins, as `ShareClient` does, with the same bounded
timeout and error guidance pointing to HashBin; links is.gd rejects as too long keep the full link.

## HashBin

- `hashbin.js`: keep `HashBinStore` unchanged apart from the transaction-key prefix
  (`pythononline:hashbin:return:`).
- `HashBinDocuments.serialize`/`parse` document shape (same envelope as the siblings, so
  hashbin.org treats them alike):
  ```json
  { "format": "hashbin-diagram", "version": 1, "type": "python",
    "src": "print('hi')", "python": { "stdin": "3\n4\n", "autorun": true } }
  ```
  Plain-text CIDs (a bare `.py`) also load. Unknown `type` values load as plain source. 5 MiB limit
  on source + stdin.
- `hashbin-panel.js`: copy with the same element IDs. Snapshot = `{src, python}`.
- Saving puts `#<cid>` in the address bar; editing turns it back into a source link (same
  fingerprint logic as the siblings).
- **User action:** register the "Python Online" app at https://hashbin.org/developers with return
  URL `https://curtcox.github.io/PythonOnline/` (trailing slash, no `index.html`), then give me the
  public client ID for the meta tag. Until then loading works and saving shows
  "HashBin sign-in needs a registered client ID."

## Security

Shared links and gallery cards run code automatically, on an origin shared with the account's
other Pages apps. The design keeps user code away from anything that matters:

- User Python runs **only in the worker**. Workers have no `localStorage`/`sessionStorage`/DOM,
  so HashBin tokens (sessionStorage) and other apps' localStorage are unreachable.
- After Pyodide loads, the worker deletes `self.caches`, `self.indexedDB` and `self.importScripts`
  (and Pyodide's `js` module therefore cannot reach them), so a malicious link cannot poison the
  service-worker cache or read other apps' IndexedDB. A unit/browser test asserts that
  `import js; js.caches` and `js.indexedDB` are gone.
- The main thread treats worker messages as data: text goes in via `textContent`.
- **HTML** from `display()` renders in an `<iframe sandbox>` (no `allow-scripts`, no
  `allow-same-origin`) via `srcdoc`. With scripts disabled it cannot report its own height, so it
  gets a fixed maximum height with a scrollbar, plus an *Expand* toggle.
- **SVG** (figures, `display(SVG(...))`) renders as `<img src="blob:…">`, which never executes
  scripts; turtle SVG is built by our own code from numeric commands and escaped text.
- Markdown is converted with a tiny escaping converter (headings, emphasis, code, lists, links
  with `rel="noopener"` and `http(s)` only) — no raw HTML passthrough.
- Network access from Python (`pyodide.http.pyfetch`, micropip) is allowed; it is what any web
  page could do, and it is needed for PyPI installs.

## Gallery

About 18 original samples in `src/examples.js` (+ `examples/*.py`), each written for this site,
tagged and searchable:

- *Basics*: hello & f-strings; reading numbers from input (uses the stdin box); FizzBuzz;
  recursion (Towers of Hanoi); classes & dataclasses; generators & itertools; dict/set
  comprehensions with `collections.Counter` word counts; `re` + `json` text processing;
  `asyncio` with `gather`; a text-mode Game of Life printing frames.
- *turtle*: spiral, star, fractal tree, Koch snowflake, colour wheel.
- *matplotlib/numpy/pandas*: line + scatter, histogram, a pandas DataFrame shown with `display()`
  plus a bar chart, an image from a numpy array via PIL.
- *Packages*: a PEP 723 script installing a small pure-Python PyPI package.

`gallery.html` uses the siblings' card grid, search box and tag filter. Covers in
`gallery/previews/<id>.svg` are generated by `node scripts/render-gallery.mjs`, which runs each
sample with the `pyodide` npm package in Node (same version) and renders: the first figure, the
final turtle drawing (via the same `turtle-player.js` code, no animation), or a terminal-style SVG
card of the console output. `--check` verifies source fingerprints without re-running, so CI does
not need to download packages for it. A card links to `./?example=<id>`.

## Offline / PWA

- Pattern from GnuplotOnline: `offline-assets.js` lists every shipped file plus the Pyodide core
  (`pyodide.js`, `pyodide.asm.js`, `pyodide.asm.wasm`, `python_stdlib.zip`, `pyodide-lock.json`)
  and lz-string. The content-versioned `service-worker.js` precaches them and activates only after
  the whole cache is saved. `src/offline.js` shows *Available offline*, *Retry offline setup*, and
  *Update and reload* (source saved first).
- Pyodide packages are cached **on first use** by a cache-first runtime rule for the pinned
  `cdn.jsdelivr.net/pyodide/v314.0.7/` prefix (immutable URLs). A *Make packages available offline*
  button in *More* precaches the packages the gallery uses (numpy, matplotlib + deps, pandas,
  pillow, micropip), with progress. PyPI installs work online only (stated in the UI).
- `manifest.webmanifest`, `icon.svg`, PNG icons (180/192/512) for Add to Home Screen.
- A unit test checks that `offline-assets.js` covers every file referenced by `index.html`,
  `gallery.html`, the worker and the `.py` runtime files.

## Tests

**Python (`python3 -m unittest discover -s tests`, CPython 3.14 in CI)**

- `turtle.py`: command recording for every supported call, `circle` extents/steps, fill polygons,
  colour modes, `write`, heading/position queries, the command cap, and the `NotImplementedError`
  messages for event APIs.
- `runtime.py`: stdin reader and EOF hint, `display()` dispatch order, IPython shim helpers, PEP 723
  parser (valid, malformed, absent).

**Node (`node --test tests/*.test.js`, real Pyodide via the pinned `pyodide` npm package)**

- `python-core`: print streaming in order, chunking and the output cap; traceback line numbers for
  runtime and syntax errors; stdin + `input()` echo; EOFError hint; namespace reset between runs
  (a variable or user module from run 1 is gone in run 2); 30 successive runs; the security
  deletions (`js.caches`, `js.indexedDB` missing); matplotlib figure capture (network, cached in CI).
- `python-client` with a fake worker: superseding runs, auto-run 5 s timeout, Stop, spare-worker swap.
- `traceback`, `share-links` (round trips, `?doc=` with stdin, `?run=0`, CID detection),
  `hashbin` (serialize/parse, limits, plain-text CIDs; ported mocked OAuth/quote/save tests),
  `qr` (copied vectors), `examples` (catalog ↔ `examples/*.py` sync, preview fingerprints),
  `offline-assets` coverage.

**Browser (Playwright `tests/browser/all.cjs`, served by `python3 -m http.server`)**

- Smoke: the default program runs; an edit re-runs; an error marks the gutter; Run/Stop; auto-run
  off; an infinite loop is stopped at 5 s and the next run works immediately (spare worker).
- Output kinds: stdin-driven program; matplotlib figure appears and downloads as SVG/PNG; turtle
  animates, *Skip animation* works, exports; `display()` of a DataFrame renders in a sandboxed
  iframe; a `display(HTML('<script>…'))` payload does not execute.
- Sharing: Share → open in a new page → same source and stdin; QR dialog; mocked is.gd.
- HashBin: mocked OAuth return, quote, save and `#cid` load with stale-load protection.
- Gallery: every card opens and runs without error in the editor.
- Mobile: 375×812 viewport — tabs, *More*, no horizontal scroll, touch-target sizes.
- Offline: after the SW installs, stop the server, reload, and run a stdlib-only program.

**CI (`.github/workflows/test.yml`)**: job 1 runs Python unit tests, `npm test`, `npm run check`
and `render-gallery --check`; a matrix job runs the browser suite on chromium, firefox and webkit,
uploading `test-results/` on failure. Cache npm and the Pyodide package downloads.

## Phases

1. **Skeleton and deploy.** `deploy.yml`, minimal `index.html` that runs a hard-coded program in a
   Pyodide worker and prints the output, `package.json`, README, `LICENSE-graphvizonline`.
   Push and confirm https://curtcox.github.io/PythonOnline/ is live.
   *User action:* Settings → Pages → Source = "GitHub Actions" — or I run
   `gh api -X POST repos/curtcox/PythonOnline/pages -f build_type=workflow` if you approve it.
2. **Editor and engine core.** Ace (Python mode), splitter, editor toggle, render-scheduler,
   worker/client with streaming, stdin box, auto-run toggle, time limits, spare worker, tracebacks
   with gutter markers, status line, localStorage restore, text downloads, security hardening.
3. **Rich output.** `runtime.py`: `display()`, IPython shim, matplotlib capture and figure
   downloads, sandboxed HTML, Markdown; package auto-loading and PEP 723/micropip installs.
4. **turtle.** `turtle.py`, `turtle-player.js`, animation controls, exports, `docs/turtle.md`.
5. **Sharing.** `share-links` (`#`, `?compressed=`, `?doc=`, `?example=`, `?run=0`), share box,
   is.gd shortening, QR dialog.
6. **HashBin.** Port store and panel, document format, `#cid` auto-load, OAuth return, placeholder
   client ID; swap in the real ID once registered.
7. **Mobile layout.** Phone CSS, *Output/Code/Input* tabs, *More*, touch pan/zoom; check WebKit and
   Chromium mobile viewports.
8. **Gallery and docs links.** Samples, `gallery.html`, preview generator, toolbar links.
9. **Offline/PWA.** Asset list + update script, service worker with runtime package caching,
   *Make packages available offline*, manifest and icons, status UI.
10. **Tests, CI and docs.** Unit tests are written alongside each phase; the Playwright suite and
    `test.yml` are finished here, along with README (features, limits, local dev) and a short
    `AGENTS.md` recording the contracts above for future sessions.

Each phase is one or a few commits pushed to `main` (deploying as it goes).

## Licensing notes

- Pyodide (MPL-2.0) and CPython (PSF) are loaded from the CDN unmodified; the README credits both
  and says the site is not affiliated with the Python Software Foundation or Pyodide. Packages
  keep their own licences.
- "Python" is a PSF trademark. The name "Python Online" describes the tool; the README states it
  is unofficial. (Avoid the Python logo; use our own icon.)
- `turtle.py` is our own implementation of the API (the CPython module's PSF-licensed code is not
  copied).
- QR encoder: MIT (Project Nayuki), notice kept in `src/qr.js`. svg-pan-zoom: BSD, keep its
  licence. Ace: BSD, keep `ace/LICENSE`.
- GraphvizOnline lineage: keep `LICENSE-graphvizonline` and the credit.

## Risks and open items

- **First-load size.** ~12 MB before the first run (≈2–5 s on broadband, longer on mobile data);
  matplotlib adds ~15 MB on first import. Mitigations: show progress, start loading the worker
  before Ace finishes, keep the default program stdlib-only (turtle), offline caching afterwards.
- **Memory on phones.** Two Pyodide instances (active + spare) may be too heavy for low-memory
  devices; the spare is lazy there (see Client). Restarts after Stop on those devices take ~1–2 s.
- **Auto-run side effects.** Programs that call web APIs or install packages re-run on every edit.
  The 5 s limit excludes package loading, so micropip installs happen once per worker (cached by
  micropip in-process) — but a fresh worker reinstalls. Documented; users can turn off auto-run,
  and shared links can carry `?run=0`.
- **turtle fidelity.** Our turtle covers the common subset; programs using events or `ontimer`
  animation loops will not work. The error says so and links `docs/turtle.md`.
- **time.sleep.** Blocks the worker (no SAB), so output still streams but sleep-based animations in
  the console behave like batch output. Documented.
- **Pyodide version cadence.** Pyodide now versions after CPython (314.x). Upgrades change the
  CDN prefix in one constant plus `offline-assets.js`; the lock-file ABI changes package URLs, so
  the update script regenerates the optional package list.
- **Future (v2) ideas, not in v1:** multiple files/modules and data-file uploads (as GnuplotOnline
  has), interactive `input()` via a coi-serviceworker shim, matplotlib interactivity, a REPL pane.
