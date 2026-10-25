# Standard 256t calls (docs/256t-calls.md). A 256t string names text:
# https://curtcox.github.io/256t.org/
import ast, base64, hashlib

def cid_for(data):
    """The 256t string for bytes: their length, then the bytes or their SHA-512."""
    body = data if len(data) <= 64 else hashlib.sha512(data).digest()
    return base64.urlsafe_b64encode(len(data).to_bytes(6, "big") + body).decode().rstrip("=")

SERVERS = ["https://256t.us/", "https://256t.org/"]

def text_for(cid):
    """Decode inline text or fetch longer text; either way it must match the string."""
    raw = base64.urlsafe_b64decode(cid + "=" * (-len(cid) % 4))
    if int.from_bytes(raw[:6], "big") <= 64:
        candidates = [raw[6:]]
    else:
        candidates = (fetch(server + cid) for server in SERVERS)
    for data in candidates:
        if data is not None and cid_for(data) == cid:
            return data.decode()
    raise ValueError("no text matches " + cid)

def fetch(url):
    try:
        try:
            from pyodide.http import open_url  # in the browser
            return open_url(url).read().encode()
        except ImportError:
            from urllib.request import Request, urlopen
            with urlopen(Request(url, headers={"User-Agent": "Mozilla/5.0"})) as response:
                return response.read()
    except Exception:
        return None

def function_from(statements):
    """Run the setup statements. The last one, a def or an expression, is the function."""
    *setup, last = statements
    scope = {}
    exec(compile(ast.Module(setup, []), "<256t>", "exec"), scope)
    if isinstance(last, (ast.FunctionDef, ast.ClassDef)):
        exec(compile(ast.Module([last], []), "<256t>", "exec"), scope)
        return scope[last.name]
    if not isinstance(last, ast.Expr):
        raise ValueError("function text must end with a def or an expression")
    return eval(compile(ast.Expression(last.value), "<256t>", "eval"), scope)

def parameters_from(call):
    """Parameters are literal call arguments, such as: 6, 7 or "Ada", end="?"."""
    return ([ast.literal_eval(arg) for arg in call.args],
            {item.arg: ast.literal_eval(item.value) for item in call.keywords})

def function_for(cid):
    return function_from(ast.parse(text_for(cid)).body)

def call_256t(cid, parameters_cid=None):
    """Call the function named by cid, with parameters from cid itself or parameters_cid."""
    if parameters_cid is None:
        *setup, last = ast.parse(text_for(cid)).body
        if not (isinstance(last, ast.Expr) and isinstance(last.value, ast.Call)):
            raise ValueError("function and parameters text must end with a call")
        function = function_from(setup + [ast.Expr(last.value.func)])
        call = last.value
    else:
        function = function_for(cid)
        call = ast.parse("f(" + text_for(parameters_cid) + "\n)", mode="eval").body
        if not (isinstance(call, ast.Call) and isinstance(call.func, ast.Name)):
            raise ValueError("parameters text must be call arguments")
    args, kwargs = parameters_from(call)
    return function(*args, **kwargs)

# Only the function comes from a 256t string. This program supplies the parameters.
HELLO = "AAAAAAAebGFtYmRhIG5hbWU6IGYiSGVsbG8sIHtuYW1lfSEi"
HYPOTENUSE = "AAAAAAA3aW1wb3J0IG1hdGgKZGVmIGh5cChhLCBiKToKICAgIHJldHVybiBtYXRoLmh5cG90KGEsIGIpCg"

print("HELLO names:", repr(text_for(HELLO)))
hello = function_for(HELLO)
for name in ["Ada", "Grace", "Guido"]:
    print(" ", hello(name))

print("HYPOTENUSE names:", repr(text_for(HYPOTENUSE)))
hypotenuse = function_for(HYPOTENUSE)
for a, b in [(3, 4), (5, 12), (8, 15)]:
    print(f"  hypotenuse({a}, {b}) = {hypotenuse(a, b)}")
