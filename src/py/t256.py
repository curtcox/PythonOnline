"""Use Python saved under 256t strings, such as programs saved to HashBin from Python Online.

A 256t string (https://curtcox.github.io/256t.org/) names text by its length and, for
text over 64 bytes, its SHA-512 hash. Shorter text is spelled out in the string itself.
Pass a 256t string or a saved link such as https://curtcox.github.io/PythonOnline/#<cid>.

- Function text is Python whose last statement, a def or an expression, is the function.
  A trailing ``if __name__ == "__main__":`` block is skipped, so it can hold a demo.
- Parameters text is literal call arguments, as written between parentheses: 6, h=7
- Function and parameters text is function text whose last statement calls the function
  with literal arguments.

    import t256
    t256.function(ROMAN)(2026)     # only the function comes from a 256t string
    t256.call(TOP_WORDS)           # one string names the function and its parameters
    t256.call(SUMMARY, PI_30)      # the function and parameters come from different strings
"""
import ast
import base64
import functools
import hashlib
import json
import re

__all__ = ['SERVERS', 'cid', 'text', 'source', 'function', 'parameters', 'call']

# HashBin serves saved content from 256t.us. Any 256t server works, since text is verified.
SERVERS = ['https://256t.us/', 'https://256t.org/']
_CID = re.compile(r'[A-Za-z0-9_-]{8,94}')
_MAIN = "__name__ == '__main__'"


def cid(data):
    """The 256t string for text or bytes."""
    if isinstance(data, str):
        data = data.encode()
    body = data if len(data) <= 64 else hashlib.sha512(data).digest()
    return base64.urlsafe_b64encode(len(data).to_bytes(6, 'big') + body).decode().rstrip('=')


def _name(reference):
    candidate = reference.strip().rstrip('/').replace('#', '/').rsplit('/', 1)[-1]
    if not _CID.fullmatch(candidate):
        raise ValueError(f'Not a 256t string or saved link: {reference!r}')
    return candidate


def _fetch(url):
    try:
        try:
            from pyodide.http import open_url  # Python Online and other browsers
        except ImportError:
            from urllib.request import Request, urlopen
            with urlopen(Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=20) as response:
                return response.read()
        return open_url(url).read().encode()
    except Exception:
        return None


@functools.cache  # The text named by a 256t string never changes.
def text(reference):
    """The text a 256t string names: decoded inline, or fetched and checked against its hash."""
    name = _name(reference)
    raw = base64.urlsafe_b64decode(name + '=' * (-len(name) % 4))
    if int.from_bytes(raw[:6], 'big') <= 64:
        candidates = [raw[6:]]
    else:
        candidates = (_fetch(server + name) for server in SERVERS)
    for data in candidates:
        if data is not None and cid(data) == name:
            return data.decode()
    raise ValueError(f'No 256t server returned text matching {name}')


def source(reference):
    """Python source named by a 256t string, unwrapping programs saved from Python Online."""
    value = text(reference)
    try:
        document = json.loads(value)
    except ValueError:
        return value
    if (isinstance(document, dict) and document.get('format') == 'hashbin-diagram'
            and document.get('type') == 'python' and isinstance(document.get('src'), str)):
        return document['src']
    return value


def _statements(reference):
    statements = [statement for statement in ast.parse(source(reference)).body
                  if not (isinstance(statement, ast.If) and ast.unparse(statement.test) == _MAIN)]
    if not statements:
        raise ValueError(f'{_name(reference)} names no Python statements')
    return statements


def _function(statements, label):
    *setup, last = statements
    scope = {'__name__': 't256'}
    exec(compile(ast.Module(setup, []), label, 'exec'), scope)
    if isinstance(last, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
        exec(compile(ast.Module([last], []), label, 'exec'), scope)
        return scope[last.name]
    if not isinstance(last, ast.Expr):
        raise ValueError(f'{label} must end with a def or an expression')
    return eval(compile(ast.Expression(last.value), label, 'eval'), scope)


def _arguments(call):
    return ([ast.literal_eval(argument) for argument in call.args],
            {keyword.arg: ast.literal_eval(keyword.value) for keyword in call.keywords})


def function(reference):
    """The function that function text names."""
    return _function(_statements(reference), 't256:' + _name(reference))


def parameters(reference):
    """The (args, kwargs) that parameters text names."""
    call = ast.parse('f(' + source(reference) + '\n)', mode='eval').body
    if not (isinstance(call, ast.Call) and isinstance(call.func, ast.Name)):
        raise ValueError(f'{_name(reference)} is not call arguments')
    return _arguments(call)


def call(function_reference, parameters_reference=None):
    """Call a function from a 256t string, with parameters from it or from another one."""
    if parameters_reference is not None:
        args, kwargs = parameters(parameters_reference)
        return function(function_reference)(*args, **kwargs)
    *setup, last = _statements(function_reference)
    if not (isinstance(last, ast.Expr) and isinstance(last.value, ast.Call)):
        raise ValueError(f'{_name(function_reference)} must end with a call')
    args, kwargs = _arguments(last.value)
    return _function(setup + [ast.Expr(last.value.func)], 't256:' + _name(function_reference))(*args, **kwargs)
