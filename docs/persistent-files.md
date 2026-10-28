# Keep files between runs

Open **More** and enable **Keep files between runs** to keep Python files in this
browser after completed runs. This is off by default. Enabling it switches Python
to the app's isolated HashBin run origin on **hashbin.app**; press Run afterward.
The editor's source and Program input continue to use the existing local restore
and sharing features.

```python
from pathlib import Path
Path('notes.txt').write_text('Hello from Python')
print(Path('notes.txt').read_text())
```

The working directory is `/home/pyodide`. A completed run saves that directory
before it reports completion. A later worker or page reload restores it. The
storage message says whether opening or saving files failed. If hosted storage is
unavailable, turn this option off explicitly to continue with temporary files;
the app never silently changes storage modes.

## What to keep there

Keep no secrets, credentials or private keys in saved files. Every program run in
this app's hosted sandbox can read, alter or delete earlier files. Other apps on
the same embedding website origin (`curtcox.github.io`) can also frame that run
origin. Treat files loaded from storage as untrusted, including Python modules.
The app installs its own runtime helpers outside the persisted directory.

Browsers partition this data by the top-level site and can remove it through quota
eviction, tracking protection, private browsing or clearing site data. Different
browsers/devices/sites have separate storage. This is not a backup or a guarantee
of long-term Safari retention. Download important files separately. Simultaneous
tabs can overwrite each other's filesystem snapshots.

## Links and interrupted runs

Share, sample, CID and saved-program links always start with temporary files,
even if you previously enabled this option. Review the program before explicitly
enabling persistent files for it. The preference is local and is never included
in shared documents or enabled by their contents.
Opening a linked or imported program also remembers that this option is off, so
restoring that program later at the bare editor URL cannot silently attach saved files.

Stop, the Auto-run time limit, closing the page and superseding a busy run terminate
the worker. They may lose writes that have not reached the completed-run save.
Persistent mode does not preload warm workers with old filesystem snapshots.

Opaque mode remains the default and continues to work with the verified offline
cache. Hosted mode requires the HashBin run service to be available; offline hosted
frames are not provided in this version. Pyodide remains pinned to 314.0.7, and
runtime/app files still come through the editor's verified proxy while direct
HashBin runtime pinning is being rolled out.
