/* Python Online samples; keep examples/*.py in sync. Adaptations retain source credits and licenses. */
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
      "docs": "docs/turtle.html"
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
      "docs": "docs/turtle.html"
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
      "docs": "docs/turtle.html"
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
      "docs": "docs/turtle.html"
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
      "docs": "docs/turtle.html"
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
      "docs": "docs/turtle.html"
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
      "id": "micrograd",
      "title": "Learn a line with micrograd",
      "label": "Learn a line with micrograd",
      "tags": [
        "karpathy",
        "machine-learning",
        "matplotlib"
      ],
      "src": "# A small adaptation of Andrej Karpathy's micrograd (MIT, copyright 2020).\n# Source: https://github.com/karpathy/micrograd\n# Only addition, multiplication, and backpropagation are needed for this fit.\n# The original license is retained at the end of this file.\nimport matplotlib.pyplot as plt\n\n\nclass Value:\n    def __init__(self, data, children=()):\n        self.data = float(data)\n        self.grad = 0.0\n        self.children = children\n        self._backward = lambda: None\n\n    def __add__(self, other):\n        other = other if isinstance(other, Value) else Value(other)\n        out = Value(self.data + other.data, (self, other))\n\n        def backward():\n            self.grad += out.grad\n            other.grad += out.grad\n\n        out._backward = backward\n        return out\n\n    def __mul__(self, other):\n        other = other if isinstance(other, Value) else Value(other)\n        out = Value(self.data * other.data, (self, other))\n\n        def backward():\n            self.grad += other.data * out.grad\n            other.grad += self.data * out.grad\n\n        out._backward = backward\n        return out\n\n    __radd__ = __add__\n    __rmul__ = __mul__\n\n    def backward(self):\n        ordered, visited = [], set()\n\n        def visit(node):\n            if node not in visited:\n                visited.add(node)\n                for child in node.children:\n                    visit(child)\n                ordered.append(node)\n\n        visit(self)\n        # Reset the entire graph so another backward() gives fresh gradients.\n        for node in ordered:\n            node.grad = 0.0\n        self.grad = 1.0\n        for node in reversed(ordered):\n            node._backward()\n\n\n# Learn y = weight * x + bias. Try changing the target values.\nxs = [-2, -1, 0, 1, 2]\nys = [-3, -1, 1, 3, 5]\nweight, bias = Value(0), Value(0)\nlosses = []\nfor step in range(40):\n    errors = [weight * x + bias + (-y) for x, y in zip(xs, ys)]\n    loss = sum(error * error for error in errors) * (1 / len(xs))\n    losses.append(loss.data)\n    loss.backward()\n    weight.data -= 0.1 * weight.grad\n    bias.data -= 0.1 * bias.grad\n\nprint(f\"Learned: y = {weight.data:.3f} x + {bias.data:.3f}\")\nprint(f\"Mean squared error: {losses[0]:.3f} -> {losses[-1]:.8f}\")\nfig, (fit, learning) = plt.subplots(1, 2, figsize=(8, 4))\nfit.scatter(xs, ys, color=\"#d96245\", label=\"Training points\")\nfit.plot(xs, [weight.data * x + bias.data for x in xs],\n         color=\"#167c80\", label=\"Learned line\")\nfit.set(title=\"micrograd: learning a line\", xlabel=\"x\", ylabel=\"y\")\nfit.legend()\nlearning.semilogy(losses, color=\"#167c80\")\nlearning.set(title=\"Backpropagation at work\", xlabel=\"Training step\",\n             ylabel=\"Mean squared error\")\nfig.tight_layout()\nplt.show()\n\n# The MIT License (MIT)\n# Copyright (c) 2020 Andrej Karpathy\n#\n# Permission is hereby granted, free of charge, to any person obtaining a copy\n# of this software and associated documentation files (the \"Software\"), to deal\n# in the Software without restriction, including without limitation the rights\n# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n# copies of the Software, and to permit persons to whom the Software is\n# furnished to do so, subject to the following conditions:\n#\n# The above copyright notice and this permission notice shall be included in\n# all copies or substantial portions of the Software.\n#\n# THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\n# THE SOFTWARE.\n",
      "stdin": "",
      "description": "Adapted from Andrej Karpathy’s micrograd: build automatic differentiation and watch gradient descent fit a line.",
      "docs": "https://github.com/karpathy/micrograd"
    },
    {
      "id": "makemore",
      "title": "Make more names",
      "label": "Make more names",
      "tags": [
        "karpathy",
        "machine-learning",
        "text",
        "matplotlib"
      ],
      "src": "# Inspired by Andrej Karpathy's makemore (MIT, copyright 2022).\n# Source: https://github.com/karpathy/makemore\n# A count-based bigram model replaces PyTorch; Program input is the dataset.\n# The original license is retained at the end of this file.\nimport random\nimport sys\nimport matplotlib.pyplot as plt\n\nnames = [line.strip().lower() for line in sys.stdin if line.strip()]\nif not names:\n    raise ValueError(\"Add one training name per line in Program input.\")\n\n# Token 0 marks both the start and end; other tokens represent characters.\ncharacters = [None] + sorted(set(\"\".join(names)))\nindex = {character: i for i, character in enumerate(characters)}\ncounts = [[0 for _ in characters] for _ in characters]\nfor name in names:\n    tokens = [0] + [index[character] for character in name] + [0]\n    for left, right in zip(tokens, tokens[1:]):\n        counts[left][right] += 1\n\n# A little smoothing lets the model sample previously unseen pairs too.\nprobabilities = []\nfor row in counts:\n    smoothed = [count + 0.1 for count in row]\n    probabilities.append([count / sum(smoothed) for count in smoothed])\n\nrng = random.Random(42)\nprint(f\"Trained on {len(names)} names; {len(characters)} tokens (including boundary).\")\nprint(\"New names from next-character probabilities:\")\nfor _ in range(8):\n    token, generated = 0, []\n    for _ in range(16):\n        token = rng.choices(range(len(characters)), probabilities[token])[0]\n        if token == 0:\n            break\n        generated.append(characters[token])\n    else:\n        generated.append(\"…\")  # Keep even a long sampled name bounded.\n    print(\"  \" + (\"\".join(generated) or \"(empty sample)\"))\n\nfig, ax = plt.subplots(figsize=(7, 5))\nimage = ax.imshow(probabilities, cmap=\"YlGnBu\", vmin=0, vmax=1)\nlabels = [\"·\"] + characters[1:]\nax.set_xticks(range(len(labels)), labels)\nax.set_yticks(range(len(labels)), labels)\nax.set(title=\"makemore: what character comes next?\",\n       xlabel=\"Next character (· = end)\", ylabel=\"Current character (· = start)\")\nfig.colorbar(image, ax=ax, label=\"Probability\")\nfig.tight_layout()\nplt.show()\n\n# MIT License\n# Copyright (c) 2022 Andrej Karpathy\n#\n# Permission is hereby granted, free of charge, to any person obtaining a copy\n# of this software and associated documentation files (the \"Software\"), to deal\n# in the Software without restriction, including without limitation the rights\n# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n# copies of the Software, and to permit persons to whom the Software is\n# furnished to do so, subject to the following conditions:\n#\n# The above copyright notice and this permission notice shall be included in\n# all copies or substantial portions of the Software.\n#\n# THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\n# THE SOFTWARE.\n",
      "stdin": "anna\nanne\nannie\nada\nava\nava\nella\nelle\nellen\nemma\nemily\nmia\nmila\nlily\nlila\nliam\nnoah\nnora\nolivia\noliver\n",
      "description": "Inspired by Andrej Karpathy’s makemore: learn character pairs from Program input, generate names, and plot their probabilities.",
      "docs": "https://github.com/karpathy/makemore"
    },
    {
      "id": "minbpe",
      "title": "Build a byte-pair tokenizer",
      "label": "Build a byte-pair tokenizer",
      "tags": [
        "karpathy",
        "machine-learning",
        "text"
      ],
      "src": "# A small adaptation of Andrej Karpathy's minbpe (MIT, copyright 2024 Andrej).\n# Source: https://github.com/karpathy/minbpe\n# Basic byte-pair encoding: no regex splitting or special tokens.\n# The original license is retained at the end of this file.\nfrom collections import Counter\nimport sys\n\n\ndef merge(tokens, pair, new_id):\n    result, i = [], 0\n    while i < len(tokens):\n        if tuple(tokens[i:i + 2]) == pair:\n            result.append(new_id)\n            i += 2\n        else:\n            result.append(tokens[i])\n            i += 1\n    return result\n\n\ntext = sys.stdin.read().strip()\nif not text:\n    raise ValueError(\"Add some training text in Program input.\")\ntokens = list(text.encode(\"utf-8\"))\nvocab = {i: bytes([i]) for i in range(256)}\nmerges = {}\nprint(\"Learning byte-pair merges:\")\nfor new_id in range(256, 264):  # Try allowing more than eight merges.\n    counts = Counter(zip(tokens, tokens[1:]))\n    if not counts:\n        break\n    pair = max(counts, key=counts.get)\n    if counts[pair] < 2:\n        break\n    merges[pair] = new_id\n    vocab[new_id] = vocab[pair[0]] + vocab[pair[1]]\n    tokens = merge(tokens, pair, new_id)\n    print(f\"  {new_id}: {vocab[new_id]!r} ({counts[pair]} pairs)\")\n\n\ndef encode(text):\n    tokens = list(text.encode(\"utf-8\"))\n    # Apply learned merges in training order, never by token length.\n    while len(tokens) > 1:\n        pairs = zip(tokens, tokens[1:])\n        pair = min(pairs, key=lambda pair: merges.get(pair, float(\"inf\")))\n        if pair not in merges:\n            break\n        tokens = merge(tokens, pair, merges[pair])\n    return tokens\n\n\ndef decode(tokens):\n    # Join the bytes before decoding: a token may be only part of a UTF-8 character.\n    return b\"\".join(vocab[token] for token in tokens).decode(\"utf-8\")\n\n\nencoded = encode(text)\nprint(f\"\\nUTF-8 bytes: {len(text.encode('utf-8'))}; BPE tokens: {len(encoded)}\")\nprint(\"Token IDs:\", encoded)\nprint(\"Round trip:\", decode(encoded) == text)\nprint(\"Decoded:\", decode(encoded))\n\n# MIT License\n# Copyright (c) 2024 Andrej\n#\n# Permission is hereby granted, free of charge, to any person obtaining a copy\n# of this software and associated documentation files (the \"Software\"), to deal\n# in the Software without restriction, including without limitation the rights\n# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n# copies of the Software, and to permit persons to whom the Software is\n# furnished to do so, subject to the following conditions:\n#\n# The above copyright notice and this permission notice shall be included in\n# all copies or substantial portions of the Software.\n#\n# THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\n# THE SOFTWARE.\n",
      "stdin": "banana bandana banana bandana! café café\n",
      "description": "Adapted from Andrej Karpathy’s minbpe: merge frequent byte pairs and round-trip UTF-8 text from Program input.",
      "docs": "https://github.com/karpathy/minbpe"
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
      "id": "shiny",
      "title": "Shiny reactive totals",
      "label": "Shiny reactive totals",
      "tags": [
        "shiny",
        "reactive",
        "packages",
        "display"
      ],
      "stdin": "3\n5\n",
      "description": "Use Shiny reactive values to recalculate a shopping total and render a static table. Change Program input and rerun. Requires internet.",
      "docs": "https://shiny.posit.co/py/api/core/reactive.calc.html",
      "src": "# /// script\n# dependencies = [\"shiny==1.6.3\", \"shinychat==0.1.0\", \"starlette==0.50.0\"]\n# ///\nfrom shiny import reactive, ui\nfrom IPython.display import HTML, display\n\n# Explore Shiny's reactive engine without starting a web server.\n# Change the two quantities in Program input, then run again.\n# Full interactive Shiny apps use Shinylive: https://shinylive.io/py/\nquantity = reactive.value(0)\nprice = 12\n\n@reactive.calc\ndef total():\n    return quantity() * price\n\nprint(\"Shiny: reactive shopping totals\")\nrows = []\nfor _ in range(2):\n    count = int(input(\"Quantity: \"))\n    quantity.set(count)\n    with reactive.isolate():\n        amount = total()\n    print(f\"Total: ${amount}\")\n    rows.append(ui.tags.tr(ui.tags.td(str(count)), ui.tags.td(f\"${amount}\")))\n\n# Shiny's HTML tags escape their text; this output is a static snapshot.\ndisplay(HTML(str(ui.tags.table(\n    ui.tags.tr(ui.tags.th(\"Quantity\"), ui.tags.th(\"Total at $12 each\")),\n    *rows,\n))))\n"
    },
    {
      "id": "gradio",
      "title": "Gradio greetings",
      "label": "Gradio greetings",
      "tags": [
        "gradio",
        "input",
        "packages"
      ],
      "stdin": "Ada\nGrace\n",
      "description": "Run a Gradio Interface pipeline using Program input, without launching a web server. Change the names and rerun. Requires internet.",
      "docs": "https://www.gradio.app/docs/gradio/interface",
      "src": "# /// script\n# dependencies = [\"gradio==6.9.0\", \"httpcore==1.0.9\", \"starlette==0.50.0\"]\n# ///\nimport os\nos.environ[\"GRADIO_ANALYTICS_ENABLED\"] = \"False\"\nimport gradio as gr\n\n# Run a real Gradio Interface's input/function/output pipeline locally.\n# Change the names in Program input, then run again.\n# Full interactive widgets use Gradio Lite: https://www.gradio.app/playground\nasync def greet(name):\n    return f\"Hello, {name.strip() or 'Python learner'}!\"\n\ndemo = gr.Interface(\n    fn=greet,\n    inputs=gr.Textbox(label=\"Name\"),\n    outputs=gr.Textbox(label=\"Greeting\"),\n    # The simple logger avoids multiprocessing, unavailable in browsers.\n    flagging_callback=gr.SimpleCSVLogger(),\n    flagging_mode=\"never\",\n    analytics_enabled=False,\n)\n\nprint(\"Gradio: a greeting interface\")\nfor _ in range(2):\n    name = input(\"Name: \")\n    result = await demo.process_api(0, [name])\n    print(result[\"data\"][0])\n# No launch(): Python Online shows the results without a web server.\n"
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
      "id": "256t-save",
      "title": "Save a function for later",
      "label": "Save a function for later",
      "tags": [
        "256t",
        "functions"
      ],
      "src": "# Save this program with Save to HashBin. The HashBin box then shows its 256t string,\n# which names roman(). Any later program can use roman() without copying this code:\n#     import t256\n#     roman = t256.function(\"<the 256t string>\")\n# The sample \"A function from 256t\" does exactly that with this program's 256t string.\n\ndef roman(number):\n    \"\"\"Write a positive integer in Roman numerals.\"\"\"\n    numerals = [(1000, \"M\"), (900, \"CM\"), (500, \"D\"), (400, \"CD\"),\n                (100, \"C\"), (90, \"XC\"), (50, \"L\"), (40, \"XL\"),\n                (10, \"X\"), (9, \"IX\"), (5, \"V\"), (4, \"IV\"), (1, \"I\")]\n    letters = \"\"\n    for value, numeral in numerals:\n        count, number = divmod(number, value)\n        letters += numeral * count\n    return letters\n\n# This demo runs only when this program runs, not when another program uses roman().\nif __name__ == \"__main__\":\n    for year in [1987, 2026]:\n        print(f\"roman({year}) = {roman(year)}\")\n",
      "stdin": "",
      "description": "Write a function to save to HashBin. Its 256t string then lets any program use it without its code.",
      "docs": "docs/256t-calls.html"
    },
    {
      "id": "256t-function",
      "title": "A function from 256t",
      "label": "A function from 256t",
      "tags": [
        "256t",
        "functions"
      ],
      "src": "# Use a function saved under a 256t string, without copying its code.\nimport t256\n\n# The sample \"Save a function for later\", saved to HashBin. Open it to read or change it:\n# https://curtcox.github.io/PythonOnline/#AAAAAARSol91VecUdbVI0JWpPD5P5VL8NLvxtedwwjen9KYnS3jyfhc2j38Y_DYFXyqFRSPP0xM9v9LKfZLpdUMgnnlptw\nROMAN = \"AAAAAARSol91VecUdbVI0JWpPD5P5VL8NLvxtedwwjen9KYnS3jyfhc2j38Y_DYFXyqFRSPP0xM9v9LKfZLpdUMgnnlptw\"\n# Text of 64 bytes or less is spelled out in its 256t string, so no server is needed.\nHELLO = \"AAAAAAAebGFtYmRhIG5hbWU6IGYiSGVsbG8sIHtuYW1lfSEi\"  # lambda name: f\"Hello, {name}!\"\n\nroman = t256.function(ROMAN)\nfor year in [1987, 2026]:\n    print(f\"roman({year}) = {roman(year)}\")\n\nhello = t256.function(HELLO)\nprint(hello(\"Ada\"))\n",
      "stdin": "",
      "description": "Use a saved function by its 256t string, with parameters from this program. Requires internet.",
      "docs": "docs/256t-calls.html"
    },
    {
      "id": "256t-call",
      "title": "Function and parameters from 256t",
      "label": "Function and parameters from 256t",
      "tags": [
        "256t",
        "functions"
      ],
      "src": "# One 256t string names a function and its parameters. t256.call runs its last line.\nimport t256\n\n# A program saved to HashBin from examples/saved/top-words.py:\n# https://curtcox.github.io/PythonOnline/#AAAAAAIVLgqOwaRWadzTxEYFXUW_6ip-1Gyvg3yZp-nKnrKze7oX8dtwt_YUy_Qjcdg7tSqZEghefrf3jaQCKqwgHbh1xQ\nTOP_WORDS = \"AAAAAAIVLgqOwaRWadzTxEYFXUW_6ip-1Gyvg3yZp-nKnrKze7oX8dtwt_YUy_Qjcdg7tSqZEghefrf3jaQCKqwgHbh1xQ\"\nAREA = \"AAAAAAAaKGxhbWJkYSB3LCBoOiB3ICogaCkoNiwgNyk\"  # (lambda w, h: w * h)(6, 7)\n\nfor name, saved in [(\"TOP_WORDS\", TOP_WORDS), (\"AREA\", AREA)]:\n    print(f\"{name} ends with: {t256.source(saved).splitlines()[-1]}\")\n    print(\"  result:\", t256.call(saved))\n",
      "stdin": "",
      "description": "Call a saved program whose last line calls its function with parameters. Requires internet.",
      "docs": "docs/256t-calls.html"
    },
    {
      "id": "256t-apply",
      "title": "Mix 256t functions and parameters",
      "label": "Mix 256t functions and parameters",
      "tags": [
        "256t",
        "functions"
      ],
      "src": "# Functions and parameters from different 256t strings combine freely.\nimport t256\n\n# Saved to HashBin from examples/saved/summary.py and examples/saved/pi-30.py:\n# https://curtcox.github.io/PythonOnline/#AAAAAAH9K9YJb-XC6frC32PnyXEisiwJAaUKjdUJZzVhkE7kcxbCpNjsEC6KO7Dx8aEV2YHr03Vkf0e0LSwvAAnMlD0dRA\nSUMMARY = \"AAAAAAH9K9YJb-XC6frC32PnyXEisiwJAaUKjdUJZzVhkE7kcxbCpNjsEC6KO7Dx8aEV2YHr03Vkf0e0LSwvAAnMlD0dRA\"\n# https://curtcox.github.io/PythonOnline/#AAAAAAD9N0ULMrrMFhuVpqN5TZa_UP1vTrDDym8k3lIwu4aHC7NbkP1ER-ViAIjVMvhTBW2ibhDOeD-IPgYqBh7R0-5t5A\nPI_30 = \"AAAAAAD9N0ULMrrMFhuVpqN5TZa_UP1vTrDDym8k3lIwu4aHC7NbkP1ER-ViAIjVMvhTBW2ibhDOeD-IPgYqBh7R0-5t5A\"\nTOTAL = \"AAAAAAATbGFtYmRhICp4czogc3VtKHhzKQ\"  # lambda *xs: sum(xs)\nLARGEST = \"AAAAAAATbGFtYmRhICp4czogbWF4KHhzKQ\"  # lambda *xs: max(xs)\nPI_5 = \"AAAAAAANMywgMSwgNCwgMSwgNQ\"  # 3, 1, 4, 1, 5\n\nfunctions = {\"TOTAL\": TOTAL, \"LARGEST\": LARGEST, \"SUMMARY\": SUMMARY}\nparameters = {\"PI_5\": PI_5, \"PI_30\": PI_30}\nprint(\" \" * 8, *(f\"{name:12}\" for name in parameters))\nfor name, function in functions.items():\n    print(f\"{name:8}\", *(f\"{t256.call(function, p)!s:12}\" for p in parameters.values()))\n\n# Keyword parameters work too.\nJOIN = \"AAAAAAArbGFtYmRhICp4cywgc2VwPSIgIjogc2VwLmpvaW4obWFwKHN0ciwgeHMpKQ\"  # lambda *xs, sep=\" \": sep.join(map(str, xs))\nTODAY = \"AAAAAAAVMjAyNiwgMTAsIDI1LCBzZXA9Ii0i\"  # 2026, 10, 25, sep=\"-\"\nprint(\"JOIN with TODAY:\", t256.call(JOIN, TODAY))\n",
      "stdin": "",
      "description": "Combine saved functions with parameters saved under other 256t strings. Requires internet.",
      "docs": "docs/256t-calls.html"
    }
  ]
};
if (typeof module !== "undefined") module.exports = PythonExamples; else globalThis.PythonExamples = PythonExamples;
