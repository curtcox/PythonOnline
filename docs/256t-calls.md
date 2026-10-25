# Saved functions and 256t strings

Save a function from Python Online once. Later programs can then use it by its 256t string, without copying its code or data.

1. Write a program that defines the function. See the sample **Save a function for later**.
2. Choose **Save to HashBin**. After the save, the HashBin box shows the program's 256t string, and the page URL ends with `#` and the same string.
3. In any later program, `import t256` and pass that string, or the whole saved link, to `t256.function` or `t256.call`.

A [256t](https://curtcox.github.io/256t.org/) string, or CID, names text by its length and its SHA-512 hash. It is about 94 characters: hard to read, but easy to store, paste, and pass around. Saving the same text again gives the same string. Text of 64 bytes or less is spelled out in the string itself, so it needs no server.

## Three kinds of text

| Text | Form | Example |
|------|------|---------|
| Function | Python. Earlier statements, such as imports, run first. The last statement, a `def` or an expression, is the function. A final `if __name__ == "__main__":` block is skipped, so it can hold a demo. | `examples/256t-save.py`<br>`lambda name: f"Hello, {name}!"` |
| Parameters | Call arguments as written between parentheses. Values are literals only, so parameters are data rather than code. Comments are allowed. | `examples/saved/pi-30.py`<br>`6, h=7` |
| Function and parameters | Function text whose last statement calls the function with literal arguments. | `examples/saved/top-words.py`<br>`(lambda w, h: w * h)(6, 7)` |

## Calls

| Case | Call | Sample |
|------|------|--------|
| Only the function comes from a 256t string | `t256.function(ROMAN)(2026)` | **A function from 256t** |
| One 256t string names the function and its parameters | `t256.call(TOP_WORDS)` | **Function and parameters from 256t** |
| The function and parameters come from different 256t strings | `t256.call(SUMMARY, PI_30)` | **Mix 256t functions and parameters** |

The built-in `t256` module also provides these functions:

- `t256.text(cid)` returns the text a string names. Inline text is decoded. Longer text is fetched from `t256.SERVERS`: first `https://256t.us/`, where HashBin serves saved content, then `https://256t.org/`. The first text matching the hash is returned. Otherwise it raises `ValueError`. Each string is fetched at most once while the page stays open.
- `t256.source(cid)` returns `text`, unwrapping the `src` of a program saved from Python Online.
- `t256.parameters(cid)` returns `(args, kwargs)`.
- `t256.cid(text)` computes the 256t string for some text.

The module is one plain Python file, [`src/py/t256.py`](../src/py/t256.py). Copy it to use saved functions outside Python Online.

## The samples' saved programs

The samples use four programs saved exactly as **Save to HashBin** stores them, with empty Program input and Auto-run on. Their sources are `examples/256t-save.py` and `examples/saved/*.py`. Open a sample's `https://curtcox.github.io/PythonOnline/#…` link to read a saved program. Saving one again from those sources reproduces its 256t string. Copies are kept on 256t.org so the samples keep working after HashBin retention ends. Test copies are in `tests/fixtures/256t/`.

A matching 256t string proves the text has not changed. It does not prove the text is safe. Saved functions run as ordinary Python, so use only 256t strings you trust. In Python Online, programs run in the sandboxed worker.
