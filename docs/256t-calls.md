# Calling functions from 256t strings

A [256t](https://curtcox.github.io/256t.org/) string, or CID, names text. Its first 8 base64url characters give the text's length. Text of 64 bytes or less follows inline. Longer text is represented by its SHA-512 hash and is fetched from a 256t server. The gallery's 256t samples use one standard way to call functions named this way. They are plain Python 3 and also run outside Python Online.

## Three kinds of text

| Text | Form | Examples |
|------|------|----------|
| Function | Python source. Earlier statements, such as imports, run first. The last statement, a `def` or an expression, is the function. | `lambda name: f"Hello, {name}!"`<br>`import math`↵`def hyp(a, b):`↵`    return math.hypot(a, b)` |
| Parameters | Call arguments as written between parentheses. Values are literals only, so parameters are data rather than code. | `6, 7`<br>`"Ada", end="?"` |
| Function and parameters | Function text whose last statement calls the function with parameters text. | `(lambda w, h: w * h)(6, 7)`<br>`def hi(n, end="!"):`↵`    return f"Hi {n}{end}"`↵`hi("Ada", end="?")` |

For an expression function, combined text is `(` + function text + `)(` + parameters text + `)`.

## Calls

| Case | Call | Sample |
|------|------|--------|
| Only the function comes from a 256t string | `function_for(FUNCTION)(arguments...)` | `256t-function` |
| Both come from one 256t string | `call_256t(FUNCTION_AND_PARAMETERS)` | `256t-call` |
| Function and parameters come from different 256t strings | `call_256t(FUNCTION, PARAMETERS)` | `256t-apply` |

Each sample includes the same small helper block, so it can be copied as a whole:

- `cid_for(data)` makes the 256t string for bytes.
- `text_for(cid)` decodes inline text. It fetches longer text from `https://256t.us/` and then `https://256t.org/`. The first text matching the CID is returned. Otherwise it raises `ValueError`.
- `function_for(cid)` evaluates function text in a fresh namespace.
- `call_256t(cid, parameters_cid=None)` reads parameters from `parameters_cid` when given, and otherwise splits the final call of the function text.

A matching CID proves the text has not changed. It does not prove the text is safe. Function text runs as ordinary Python, so call only 256t strings you trust. In Python Online, programs run in the sandboxed worker. The gallery samples use inline text so they render without a network.
