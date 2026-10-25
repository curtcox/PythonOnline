/* Original Python Online samples; keep examples/*.py in sync. */
const PythonExamples = {
  "catalog": [
    {
      "id": "welcome",
      "title": "Hello, Python",
      "label": "Hello, Python",
      "tags": [
        "basics",
        "turtle"
      ],
      "src": "def greet(name):\n    return f\"Hello, {name}!\"\n\nfor _ in range(3):\n    print(greet(input(\"Your name: \")))\n\nimport turtle as t\nt.speed(0)\nt.color(\"#167c80\")\nfor side in range(36):\n    t.forward(100)\n    t.left(170)\nprint(\"Try changing the angle or the names below.\")\n",
      "stdin": "Ada\nGrace\nGuido\n",
      "description": "Functions, f-strings, input, and a little turtle flourish.",
      "docs": "docs/turtle.md"
    },
    {
      "id": "input-numbers",
      "title": "Add it up",
      "label": "Add it up",
      "tags": [
        "basics",
        "input"
      ],
      "src": "count = int(input(\"How many numbers? \"))\nnumbers = [float(input(\"Number: \")) for _ in range(count)]\nprint(f\"Total: {sum(numbers):g}\")\nprint(f\"Average: {sum(numbers) / count:g}\")\n",
      "stdin": "4\n10\n20\n30\n40\n",
      "description": "Read a list of numbers from Program input.",
      "docs": "https://docs.python.org/3.14/"
    },
    {
      "id": "fizzbuzz",
      "title": "FizzBuzz",
      "label": "FizzBuzz",
      "tags": [
        "basics"
      ],
      "src": "for number in range(1, 31):\n    print(\"Fizz\" * (number % 3 == 0) + \"Buzz\" * (number % 5 == 0) or number)\n",
      "stdin": "",
      "description": "A familiar loop with a compact Python twist.",
      "docs": "https://docs.python.org/3.14/"
    },
    {
      "id": "hanoi",
      "title": "Towers of Hanoi",
      "label": "Towers of Hanoi",
      "tags": [
        "basics",
        "recursion"
      ],
      "src": "def hanoi(n, start, finish, spare):\n    if n:\n        yield from hanoi(n - 1, start, spare, finish)\n        yield f\"Move disk {n}: {start} \u2192 {finish}\"\n        yield from hanoi(n - 1, spare, finish, start)\n\nfor move in hanoi(3, \"A\", \"C\", \"B\"):\n    print(move)\n",
      "stdin": "",
      "description": "Solve a classic puzzle with a recursive generator.",
      "docs": "https://docs.python.org/3.14/"
    },
    {
      "id": "dataclasses",
      "title": "A tiny bookshelf",
      "label": "A tiny bookshelf",
      "tags": [
        "basics",
        "classes"
      ],
      "src": "from dataclasses import dataclass\n\n@dataclass\nclass Book:\n    title: str\n    pages: int\n\nbooks = [Book(\"A Journey\", 180), Book(\"Small Worlds\", 240)]\nfor book in books:\n    print(f\"{book.title}: {book.pages} pages\")\nprint(f\"Total: {sum(book.pages for book in books)} pages\")\n",
      "stdin": "",
      "description": "Model a bookshelf with a dataclass.",
      "docs": "https://docs.python.org/3.14/"
    },
    {
      "id": "generators",
      "title": "Infinite sequences",
      "label": "Infinite sequences",
      "tags": [
        "basics",
        "generators"
      ],
      "src": "from itertools import islice, accumulate, count\n\nsquares = (n * n for n in count(1))\nprint(\"Squares:\", list(islice(squares, 10)))\nprint(\"Running totals:\", list(accumulate(range(1, 11))))\n",
      "stdin": "",
      "description": "Take finite slices from an infinite sequence.",
      "docs": "https://docs.python.org/3.14/"
    },
    {
      "id": "word-count",
      "title": "Words that count",
      "label": "Words that count",
      "tags": [
        "basics",
        "collections"
      ],
      "src": "from collections import Counter\n\nwords = \"the more we learn the more we see the more we wonder\".split()\ncounts = Counter(words)\nprint({word: count for word, count in counts.items() if count > 1})\nprint(\"Unique word lengths:\", sorted({len(word) for word in words}))\n",
      "stdin": "",
      "description": "Explore dictionaries, sets, and Counter.",
      "docs": "https://docs.python.org/3.14/"
    },
    {
      "id": "regex-json",
      "title": "Find and format",
      "label": "Find and format",
      "tags": [
        "basics",
        "text"
      ],
      "src": "import re\nimport json\n\ntext = \"Ada: 42, Grace: 57, Katherine: 91\"\nrecords = [{\"name\": name, \"score\": int(score)}\n           for name, score in re.findall(r\"(\\w+): (\\d+)\", text)]\nprint(json.dumps(records, indent=2))\n",
      "stdin": "",
      "description": "Turn unstructured text into JSON.",
      "docs": "https://docs.python.org/3.14/"
    },
    {
      "id": "asyncio",
      "title": "Together with asyncio",
      "label": "Together with asyncio",
      "tags": [
        "basics",
        "async"
      ],
      "src": "import asyncio\n\nasync def task(name, delay):\n    await asyncio.sleep(delay)\n    return f\"{name} finished\"\n\nresults = await asyncio.gather(task(\"first\", 0.1), task(\"second\", 0.2))\nprint(\"\\n\".join(results))\n",
      "stdin": "",
      "description": "Top-level await and concurrent coroutines.",
      "docs": "https://docs.python.org/3.14/"
    },
    {
      "id": "life",
      "title": "Game of Life",
      "label": "Game of Life",
      "tags": [
        "basics",
        "simulation"
      ],
      "src": "live = {(2, 1), (3, 2), (1, 3), (2, 3), (3, 3)}\nfor frame in range(4):\n    print(f\"Generation {frame}\")\n    for y in range(7):\n        print(\"\".join(\"\u2588\u2588\" if (x, y) in live else \"\u00b7 \" for x in range(9)))\n    neighbors = {(x + dx, y + dy) for x, y in live\n                 for dx in (-1, 0, 1) for dy in (-1, 0, 1)}\n    def count(x, y):\n        return sum((x + dx, y + dy) in live for dx in (-1, 0, 1)\n                   for dy in (-1, 0, 1) if dx or dy)\n    live = {(x, y) for x, y in neighbors\n            if count(x, y) == 3 or ((x, y) in live and count(x, y) == 2)}\n",
      "stdin": "",
      "description": "Watch a glider move across four printed generations.",
      "docs": "https://docs.python.org/3.14/"
    },
    {
      "id": "spiral",
      "title": "Growing spiral",
      "label": "Growing spiral",
      "tags": [
        "turtle"
      ],
      "src": "import turtle as t\nt.speed(0)\nt.pensize(2)\ncolors = [\"#167c80\", \"#e3a72f\", \"#d96245\", \"#4d65ae\"]\nfor step in range(100):\n    t.pencolor(colors[step % len(colors)])\n    t.forward(step * 2)\n    t.right(91)\n",
      "stdin": "",
      "description": "A four-color spiral made from a single loop.",
      "docs": "docs/turtle.md"
    },
    {
      "id": "star",
      "title": "Star trail",
      "label": "Star trail",
      "tags": [
        "turtle"
      ],
      "src": "import turtle as t\nt.speed(6)\nt.color(\"#b45c35\", \"#f5ca72\")\nt.begin_fill()\nfor _ in range(5):\n    t.forward(180)\n    t.right(144)\nt.end_fill()\n",
      "stdin": "",
      "description": "Draw and fill a five-pointed star.",
      "docs": "docs/turtle.md"
    },
    {
      "id": "tree",
      "title": "Fractal tree",
      "label": "Fractal tree",
      "tags": [
        "turtle",
        "recursion"
      ],
      "src": "import turtle as t\nt.speed(0)\nt.left(90)\nt.penup()\nt.goto(0, -220)\nt.pendown()\ndef branch(length):\n    if length < 7:\n        return\n    t.pensize(max(1, length / 15))\n    t.color(\"#287653\" if length < 30 else \"#73503c\")\n    t.forward(length)\n    t.left(26)\n    branch(length * 0.72)\n    t.right(52)\n    branch(length * 0.72)\n    t.left(26)\n    t.penup()\n    t.backward(length)\n    t.pendown()\nbranch(110)\n",
      "stdin": "",
      "description": "Recursion grows a branching canopy.",
      "docs": "docs/turtle.md"
    },
    {
      "id": "koch",
      "title": "Koch snowflake",
      "label": "Koch snowflake",
      "tags": [
        "turtle",
        "recursion"
      ],
      "src": "import turtle as t\nt.speed(0)\nt.color(\"#407ca0\")\nt.penup()\nt.goto(-180, 100)\nt.pendown()\ndef edge(length, depth):\n    if depth == 0:\n        t.forward(length)\n    else:\n        for turn in (60, -120, 60, 0):\n            edge(length / 3, depth - 1)\n            t.left(turn)\nfor _ in range(3):\n    edge(360, 3)\n    t.right(120)\n",
      "stdin": "",
      "description": "Build a snowflake by repeating a tiny rule.",
      "docs": "docs/turtle.md"
    },
    {
      "id": "color-wheel",
      "title": "A wheel of color",
      "label": "A wheel of color",
      "tags": [
        "turtle"
      ],
      "src": "import turtle as t\nimport colorsys\nt.speed(0)\nfor i in range(72):\n    t.color(colorsys.hsv_to_rgb(i / 72, 0.75, 0.85))\n    t.begin_fill()\n    t.forward(200)\n    t.left(90)\n    t.forward(12)\n    t.left(90)\n    t.forward(200)\n    t.left(185)\n    t.end_fill()\n",
      "stdin": "",
      "description": "Use RGB tuples and HSV to explore color.",
      "docs": "docs/turtle.md"
    },
    {
      "id": "waves",
      "title": "Waves and samples",
      "label": "Waves and samples",
      "tags": [
        "matplotlib",
        "numpy"
      ],
      "src": "import numpy as np\nimport matplotlib.pyplot as plt\nx = np.linspace(0, 2 * np.pi, 200)\nfig, ax = plt.subplots(figsize=(7, 4))\nax.plot(x, np.sin(x), color=\"#167c80\", label=\"sin(x)\")\nax.scatter(x[::12], np.cos(x[::12]), color=\"#d96245\", label=\"cos(x)\")\nax.set(title=\"Waves and samples\", xlabel=\"x\", ylabel=\"value\")\nax.legend()\nax.grid(alpha=0.2)\nplt.show()\n",
      "stdin": "",
      "description": "Combine a smooth curve with sampled points.",
      "docs": "https://matplotlib.org/stable/"
    },
    {
      "id": "histogram",
      "title": "A thousand rolls",
      "label": "A thousand rolls",
      "tags": [
        "matplotlib",
        "numpy"
      ],
      "src": "import numpy as np\nimport matplotlib.pyplot as plt\nrng = np.random.default_rng(42)\nrolls = rng.integers(1, 7, size=(1000, 2)).sum(axis=1)\nplt.hist(rolls, bins=np.arange(1.5, 13), color=\"#167c80\", edgecolor=\"white\")\nplt.title(\"Sum of two dice \u00b7 1,000 rolls\")\nplt.xlabel(\"Total\")\nplt.ylabel(\"Frequency\")\n",
      "stdin": "",
      "description": "A reproducible experiment with two dice.",
      "docs": "https://matplotlib.org/stable/"
    },
    {
      "id": "dataframe",
      "title": "A table and a chart",
      "label": "A table and a chart",
      "tags": [
        "pandas",
        "matplotlib",
        "display"
      ],
      "src": "import pandas as pd\nimport matplotlib.pyplot as plt\nframe = pd.DataFrame({\"Language\": [\"Python\", \"JavaScript\", \"Rust\"],\n                      \"Projects\": [12, 8, 5]})\ndisplay(frame)\nframe.plot.bar(x=\"Language\", y=\"Projects\", color=\"#167c80\", legend=False)\nplt.title(\"Weekend projects\")\nplt.tight_layout()\n",
      "stdin": "",
      "description": "Display a pandas DataFrame and plot it.",
      "docs": "https://matplotlib.org/stable/"
    },
    {
      "id": "image",
      "title": "Pixels from numbers",
      "label": "Pixels from numbers",
      "tags": [
        "numpy",
        "pillow",
        "display"
      ],
      "src": "import numpy as np\nfrom PIL import Image\nx, y = np.meshgrid(np.linspace(0, 1, 400), np.linspace(0, 1, 300))\npixels = np.stack([x, y, (np.sin(x * 20) * np.cos(y * 20) + 1) / 2], axis=-1)\ndisplay(Image.fromarray((pixels * 255).astype(\"uint8\")))\n",
      "stdin": "",
      "description": "Create a colorful image from NumPy arrays.",
      "docs": "https://docs.python.org/3.14/"
    },
    {
      "id": "packages",
      "title": "A little help from PyPI",
      "label": "A little help from PyPI",
      "tags": [
        "packages"
      ],
      "src": "# /// script\n# dependencies = [\"humanize==4.14.0\"]\n# ///\nimport humanize\nprint(humanize.intcomma(123456789))\nprint(humanize.naturalsize(123456789))\n",
      "stdin": "",
      "description": "Install a pure-Python package with PEP 723 metadata. Requires internet.",
      "docs": "https://docs.python.org/3.14/"
    },
    {
      "id": "rich-display",
      "title": "Rich output",
      "label": "Rich output",
      "tags": [
        "display"
      ],
      "src": "from IPython.display import HTML, SVG, Markdown, display\n\ndisplay(Markdown(\"## Hello, rich output\\n**Python** can show more than text.\"))\ndisplay(HTML(\"<table><tr><th>Feature</th><th>Status</th></tr><tr><td>Sandboxed HTML</td><td>Ready</td></tr></table>\"))\ndisplay(SVG('<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"300\" height=\"100\"><circle cx=\"150\" cy=\"50\" r=\"40\" fill=\"#167c80\"/></svg>'))\n",
      "stdin": "",
      "description": "Markdown, a table, and a vector image in one ordered stream.",
      "docs": "https://docs.python.org/3.14/"
    },
    {
      "id": "256t-function",
      "title": "A function from 256t",
      "label": "A function from 256t",
      "tags": [
        "256t",
        "functions"
      ],
      "src": "# Standard 256t calls (docs/256t-calls.md). A 256t string names text:\n# https://curtcox.github.io/256t.org/\nimport ast, base64, hashlib\n\ndef cid_for(data):\n    \"\"\"The 256t string for bytes: their length, then the bytes or their SHA-512.\"\"\"\n    body = data if len(data) <= 64 else hashlib.sha512(data).digest()\n    return base64.urlsafe_b64encode(len(data).to_bytes(6, \"big\") + body).decode().rstrip(\"=\")\n\nSERVERS = [\"https://256t.us/\", \"https://256t.org/\"]\n\ndef text_for(cid):\n    \"\"\"Decode inline text or fetch longer text; either way it must match the string.\"\"\"\n    raw = base64.urlsafe_b64decode(cid + \"=\" * (-len(cid) % 4))\n    if int.from_bytes(raw[:6], \"big\") <= 64:\n        candidates = [raw[6:]]\n    else:\n        candidates = (fetch(server + cid) for server in SERVERS)\n    for data in candidates:\n        if data is not None and cid_for(data) == cid:\n            return data.decode()\n    raise ValueError(\"no text matches \" + cid)\n\ndef fetch(url):\n    try:\n        try:\n            from pyodide.http import open_url  # in the browser\n            return open_url(url).read().encode()\n        except ImportError:\n            from urllib.request import Request, urlopen\n            with urlopen(Request(url, headers={\"User-Agent\": \"Mozilla/5.0\"})) as response:\n                return response.read()\n    except Exception:\n        return None\n\ndef function_from(statements):\n    \"\"\"Run the setup statements. The last one, a def or an expression, is the function.\"\"\"\n    *setup, last = statements\n    scope = {}\n    exec(compile(ast.Module(setup, []), \"<256t>\", \"exec\"), scope)\n    if isinstance(last, (ast.FunctionDef, ast.ClassDef)):\n        exec(compile(ast.Module([last], []), \"<256t>\", \"exec\"), scope)\n        return scope[last.name]\n    if not isinstance(last, ast.Expr):\n        raise ValueError(\"function text must end with a def or an expression\")\n    return eval(compile(ast.Expression(last.value), \"<256t>\", \"eval\"), scope)\n\ndef parameters_from(call):\n    \"\"\"Parameters are literal call arguments, such as: 6, 7 or \"Ada\", end=\"?\".\"\"\"\n    return ([ast.literal_eval(arg) for arg in call.args],\n            {item.arg: ast.literal_eval(item.value) for item in call.keywords})\n\ndef function_for(cid):\n    return function_from(ast.parse(text_for(cid)).body)\n\ndef call_256t(cid, parameters_cid=None):\n    \"\"\"Call the function named by cid, with parameters from cid itself or parameters_cid.\"\"\"\n    if parameters_cid is None:\n        *setup, last = ast.parse(text_for(cid)).body\n        if not (isinstance(last, ast.Expr) and isinstance(last.value, ast.Call)):\n            raise ValueError(\"function and parameters text must end with a call\")\n        function = function_from(setup + [ast.Expr(last.value.func)])\n        call = last.value\n    else:\n        function = function_for(cid)\n        call = ast.parse(\"f(\" + text_for(parameters_cid) + \"\\n)\", mode=\"eval\").body\n        if not (isinstance(call, ast.Call) and isinstance(call.func, ast.Name)):\n            raise ValueError(\"parameters text must be call arguments\")\n    args, kwargs = parameters_from(call)\n    return function(*args, **kwargs)\n\n# Only the function comes from a 256t string. This program supplies the parameters.\nHELLO = \"AAAAAAAebGFtYmRhIG5hbWU6IGYiSGVsbG8sIHtuYW1lfSEi\"\nHYPOTENUSE = \"AAAAAAA3aW1wb3J0IG1hdGgKZGVmIGh5cChhLCBiKToKICAgIHJldHVybiBtYXRoLmh5cG90KGEsIGIpCg\"\n\nprint(\"HELLO names:\", repr(text_for(HELLO)))\nhello = function_for(HELLO)\nfor name in [\"Ada\", \"Grace\", \"Guido\"]:\n    print(\" \", hello(name))\n\nprint(\"HYPOTENUSE names:\", repr(text_for(HYPOTENUSE)))\nhypotenuse = function_for(HYPOTENUSE)\nfor a, b in [(3, 4), (5, 12), (8, 15)]:\n    print(f\"  hypotenuse({a}, {b}) = {hypotenuse(a, b)}\")\n",
      "stdin": "",
      "description": "Call a function whose text a 256t string names; this program supplies the parameters.",
      "docs": "docs/256t-calls.md"
    },
    {
      "id": "256t-call",
      "title": "Function and parameters from 256t",
      "label": "Function and parameters from 256t",
      "tags": [
        "256t",
        "functions"
      ],
      "src": "# Standard 256t calls (docs/256t-calls.md). A 256t string names text:\n# https://curtcox.github.io/256t.org/\nimport ast, base64, hashlib\n\ndef cid_for(data):\n    \"\"\"The 256t string for bytes: their length, then the bytes or their SHA-512.\"\"\"\n    body = data if len(data) <= 64 else hashlib.sha512(data).digest()\n    return base64.urlsafe_b64encode(len(data).to_bytes(6, \"big\") + body).decode().rstrip(\"=\")\n\nSERVERS = [\"https://256t.us/\", \"https://256t.org/\"]\n\ndef text_for(cid):\n    \"\"\"Decode inline text or fetch longer text; either way it must match the string.\"\"\"\n    raw = base64.urlsafe_b64decode(cid + \"=\" * (-len(cid) % 4))\n    if int.from_bytes(raw[:6], \"big\") <= 64:\n        candidates = [raw[6:]]\n    else:\n        candidates = (fetch(server + cid) for server in SERVERS)\n    for data in candidates:\n        if data is not None and cid_for(data) == cid:\n            return data.decode()\n    raise ValueError(\"no text matches \" + cid)\n\ndef fetch(url):\n    try:\n        try:\n            from pyodide.http import open_url  # in the browser\n            return open_url(url).read().encode()\n        except ImportError:\n            from urllib.request import Request, urlopen\n            with urlopen(Request(url, headers={\"User-Agent\": \"Mozilla/5.0\"})) as response:\n                return response.read()\n    except Exception:\n        return None\n\ndef function_from(statements):\n    \"\"\"Run the setup statements. The last one, a def or an expression, is the function.\"\"\"\n    *setup, last = statements\n    scope = {}\n    exec(compile(ast.Module(setup, []), \"<256t>\", \"exec\"), scope)\n    if isinstance(last, (ast.FunctionDef, ast.ClassDef)):\n        exec(compile(ast.Module([last], []), \"<256t>\", \"exec\"), scope)\n        return scope[last.name]\n    if not isinstance(last, ast.Expr):\n        raise ValueError(\"function text must end with a def or an expression\")\n    return eval(compile(ast.Expression(last.value), \"<256t>\", \"eval\"), scope)\n\ndef parameters_from(call):\n    \"\"\"Parameters are literal call arguments, such as: 6, 7 or \"Ada\", end=\"?\".\"\"\"\n    return ([ast.literal_eval(arg) for arg in call.args],\n            {item.arg: ast.literal_eval(item.value) for item in call.keywords})\n\ndef function_for(cid):\n    return function_from(ast.parse(text_for(cid)).body)\n\ndef call_256t(cid, parameters_cid=None):\n    \"\"\"Call the function named by cid, with parameters from cid itself or parameters_cid.\"\"\"\n    if parameters_cid is None:\n        *setup, last = ast.parse(text_for(cid)).body\n        if not (isinstance(last, ast.Expr) and isinstance(last.value, ast.Call)):\n            raise ValueError(\"function and parameters text must end with a call\")\n        function = function_from(setup + [ast.Expr(last.value.func)])\n        call = last.value\n    else:\n        function = function_for(cid)\n        call = ast.parse(\"f(\" + text_for(parameters_cid) + \"\\n)\", mode=\"eval\").body\n        if not (isinstance(call, ast.Call) and isinstance(call.func, ast.Name)):\n            raise ValueError(\"parameters text must be call arguments\")\n    args, kwargs = parameters_from(call)\n    return function(*args, **kwargs)\n\n# One 256t string names both the function and its parameters: text ending in a call.\nAREA = \"AAAAAAAaKGxhbWJkYSB3LCBoOiB3ICogaCkoNiwgNyk\"\nGREETING = \"AAAAAABAZGVmIGhpKG4sIGVuZD0iISIpOgogICAgcmV0dXJuIGYiSGkge259e2VuZH0iCmhpKCJBZGEiLCBlbmQ9Ij8iKQ\"\n\nfor name, cid in [(\"AREA\", AREA), (\"GREETING\", GREETING)]:\n    print(f\"{name} names:\", repr(text_for(cid)))\n    print(\"  result:\", call_256t(cid))\n",
      "stdin": "",
      "description": "One 256t string names a function and its parameters; call it.",
      "docs": "docs/256t-calls.md"
    },
    {
      "id": "256t-apply",
      "title": "Mix 256t functions and parameters",
      "label": "Mix 256t functions and parameters",
      "tags": [
        "256t",
        "functions"
      ],
      "src": "# Standard 256t calls (docs/256t-calls.md). A 256t string names text:\n# https://curtcox.github.io/256t.org/\nimport ast, base64, hashlib\n\ndef cid_for(data):\n    \"\"\"The 256t string for bytes: their length, then the bytes or their SHA-512.\"\"\"\n    body = data if len(data) <= 64 else hashlib.sha512(data).digest()\n    return base64.urlsafe_b64encode(len(data).to_bytes(6, \"big\") + body).decode().rstrip(\"=\")\n\nSERVERS = [\"https://256t.us/\", \"https://256t.org/\"]\n\ndef text_for(cid):\n    \"\"\"Decode inline text or fetch longer text; either way it must match the string.\"\"\"\n    raw = base64.urlsafe_b64decode(cid + \"=\" * (-len(cid) % 4))\n    if int.from_bytes(raw[:6], \"big\") <= 64:\n        candidates = [raw[6:]]\n    else:\n        candidates = (fetch(server + cid) for server in SERVERS)\n    for data in candidates:\n        if data is not None and cid_for(data) == cid:\n            return data.decode()\n    raise ValueError(\"no text matches \" + cid)\n\ndef fetch(url):\n    try:\n        try:\n            from pyodide.http import open_url  # in the browser\n            return open_url(url).read().encode()\n        except ImportError:\n            from urllib.request import Request, urlopen\n            with urlopen(Request(url, headers={\"User-Agent\": \"Mozilla/5.0\"})) as response:\n                return response.read()\n    except Exception:\n        return None\n\ndef function_from(statements):\n    \"\"\"Run the setup statements. The last one, a def or an expression, is the function.\"\"\"\n    *setup, last = statements\n    scope = {}\n    exec(compile(ast.Module(setup, []), \"<256t>\", \"exec\"), scope)\n    if isinstance(last, (ast.FunctionDef, ast.ClassDef)):\n        exec(compile(ast.Module([last], []), \"<256t>\", \"exec\"), scope)\n        return scope[last.name]\n    if not isinstance(last, ast.Expr):\n        raise ValueError(\"function text must end with a def or an expression\")\n    return eval(compile(ast.Expression(last.value), \"<256t>\", \"eval\"), scope)\n\ndef parameters_from(call):\n    \"\"\"Parameters are literal call arguments, such as: 6, 7 or \"Ada\", end=\"?\".\"\"\"\n    return ([ast.literal_eval(arg) for arg in call.args],\n            {item.arg: ast.literal_eval(item.value) for item in call.keywords})\n\ndef function_for(cid):\n    return function_from(ast.parse(text_for(cid)).body)\n\ndef call_256t(cid, parameters_cid=None):\n    \"\"\"Call the function named by cid, with parameters from cid itself or parameters_cid.\"\"\"\n    if parameters_cid is None:\n        *setup, last = ast.parse(text_for(cid)).body\n        if not (isinstance(last, ast.Expr) and isinstance(last.value, ast.Call)):\n            raise ValueError(\"function and parameters text must end with a call\")\n        function = function_from(setup + [ast.Expr(last.value.func)])\n        call = last.value\n    else:\n        function = function_for(cid)\n        call = ast.parse(\"f(\" + text_for(parameters_cid) + \"\\n)\", mode=\"eval\").body\n        if not (isinstance(call, ast.Call) and isinstance(call.func, ast.Name)):\n            raise ValueError(\"parameters text must be call arguments\")\n    args, kwargs = parameters_from(call)\n    return function(*args, **kwargs)\n\n# Functions and parameters come from different 256t strings, so any can be combined.\nTOTAL = \"AAAAAAATbGFtYmRhICp4czogc3VtKHhzKQ\"\nLARGEST = \"AAAAAAATbGFtYmRhICp4czogbWF4KHhzKQ\"\nJOIN = \"AAAAAAArbGFtYmRhICp4cywgc2VwPSIgIjogc2VwLmpvaW4obWFwKHN0ciwgeHMpKQ\"\nPI = \"AAAAAAANMywgMSwgNCwgMSwgNQ\"\nE = \"AAAAAAAKMiwgNywgMSwgOA\"\nTODAY = \"AAAAAAAVMjAyNiwgMTAsIDI1LCBzZXA9Ii0i\"\n\nfunctions = {\"TOTAL\": TOTAL, \"LARGEST\": LARGEST, \"JOIN\": JOIN}\nparameters = {\"PI\": PI, \"E\": E}\nfor name, cid in {**functions, **parameters}.items():\n    print(f\"{name:8} names {text_for(cid)}\")\nprint()\nprint(\" \" * 8, *(f\"{name:10}\" for name in parameters))\nfor name, function in functions.items():\n    print(f\"{name:8}\", *(f\"{call_256t(function, p)!s:10}\" for p in parameters.values()))\nprint(\"JOIN with TODAY:\", call_256t(JOIN, TODAY))\n\n# The same call as a single 256t string: \"(\" + function text + \")(\" + parameters text + \")\"\ncombined = cid_for(f\"({text_for(JOIN)})({text_for(PI)})\".encode())\nprint(\"As one string:\", call_256t(combined))\n",
      "stdin": "",
      "description": "Call functions named by some 256t strings with parameters named by others.",
      "docs": "docs/256t-calls.md"
    }
  ]
};
if (typeof module !== "undefined") module.exports = PythonExamples; else globalThis.PythonExamples = PythonExamples;
