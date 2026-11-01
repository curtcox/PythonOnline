# Inspired by Andrej Karpathy's microgpt, with a smaller browser-sized model.
# Source: https://gist.github.com/karpathy/8627fe009c40f57531cb18360106ce95
# Train a real transformer from scratch: scalar autograd, attention, and Adam.
# No downloads: put one training name per line in Program input, then rerun.
import math
import random
import sys

rng = random.Random(42)
names = [line.strip().lower() for line in sys.stdin if line.strip()]
if not names:
    raise ValueError("Add one training name per line in Program input.")
rng.shuffle(names)
characters = sorted(set("".join(names)))
boundary = len(characters)  # One token marks both the start and the end.
vocab_size = boundary + 1
encode = {char: i for i, char in enumerate(characters)}

# Small defaults keep this demonstration quick. For more training, increase
# steps and turn off Auto-run, then press Run (Stop remains available).
width, heads, context, steps = 8, 2, 8, 60
head_size = width // heads


class Value:
    """A scalar that remembers its parents and the local derivatives."""
    __slots__ = ("data", "grad", "parents")

    def __init__(self, data, parents=()):
        self.data, self.grad, self.parents = data, 0.0, parents

    def __add__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        return Value(self.data + other.data, ((self, 1), (other, 1)))

    def __mul__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        return Value(self.data * other.data,
                     ((self, other.data), (other, self.data)))

    def __pow__(self, power):
        return Value(self.data ** power,
                     ((self, power * self.data ** (power - 1)),))

    def exp(self):
        result = math.exp(self.data)
        return Value(result, ((self, result),))

    def log(self):
        return Value(math.log(self.data), ((self, 1 / self.data),))

    def relu(self):
        return Value(max(0, self.data), ((self, float(self.data > 0)),))

    __radd__ = __add__
    __rmul__ = __mul__

    def backward(self):
        ordered, visited = [], set()

        def visit(node):
            if node not in visited:
                visited.add(node)
                for parent, _ in node.parents:
                    visit(parent)
                ordered.append(node)

        visit(self)
        for node in ordered:
            node.grad = 0.0
        self.grad = 1.0
        for node in reversed(ordered):
            for parent, derivative in node.parents:
                parent.grad += node.grad * derivative


def matrix(rows, columns):
    return [[Value(rng.gauss(0, 0.08)) for _ in range(columns)]
            for _ in range(rows)]


weights = {
    "token": matrix(vocab_size, width), "position": matrix(context, width),
    "query": matrix(width, width), "key": matrix(width, width),
    "value": matrix(width, width), "attention": matrix(width, width),
    "expand": matrix(4 * width, width), "contract": matrix(width, 4 * width),
    "output": matrix(vocab_size, width),
}
parameters = [p for layer in weights.values() for row in layer for p in row]


def linear(vector, layer):
    return [sum(a * b for a, b in zip(vector, row)) for row in layer]


def softmax(scores):
    maximum = max(score.data for score in scores)
    exps = [(score + (-maximum)).exp() for score in scores]
    inverse_total = sum(exps) ** -1
    return [value * inverse_total for value in exps]


def normalize(vector):
    scale = (sum(x * x for x in vector) * (1 / len(vector)) + 1e-5) ** -0.5
    return [x * scale for x in vector]


def transformer(token, position, keys, values):
    x = normalize([a + b for a, b in
                   zip(weights["token"][token], weights["position"][position])])
    normalized = normalize(x)
    query = linear(normalized, weights["query"])
    keys.append(linear(normalized, weights["key"]))
    values.append(linear(normalized, weights["value"]))
    attention = []
    # Causal attention: each head can read only the tokens seen so far.
    for head in range(heads):
        indices = range(head * head_size, (head + 1) * head_size)
        scores = [sum(query[j] * key[j] for j in indices) * head_size ** -0.5
                  for key in keys]
        probabilities = softmax(scores)
        attention.extend(sum(p * value[j] for p, value in zip(probabilities, values))
                         for j in indices)
    x = [a + b for a, b in zip(x, linear(attention, weights["attention"]))]
    hidden = [value.relu() for value in linear(normalize(x), weights["expand"])]
    x = [a + b for a, b in zip(x, linear(hidden, weights["contract"]))]
    return linear(x, weights["output"])


print(f"microgpt: {len(names)} names, {vocab_size} tokens, {len(parameters)} parameters")
print(f"Training a one-layer, {heads}-head transformer for {steps} steps.", flush=True)
first_moment, second_moment = [0.0] * len(parameters), [0.0] * len(parameters)
losses = []
for step in range(steps):
    # Reserve space for the end token, even when a name is longer than context.
    name = names[step % len(names)][:context - 1]
    tokens = [boundary] + [encode[char] for char in name] + [boundary]
    keys, values, token_losses = [], [], []
    for position, (token, target) in enumerate(zip(tokens, tokens[1:])):
        probabilities = softmax(transformer(token, position, keys, values))
        token_losses.append(probabilities[target].log() * -1)
    loss = sum(token_losses) * (1 / len(token_losses))
    losses.append(loss.data)
    loss.backward()
    # Adam: smooth the gradient and its square, then correct their initial bias.
    rate = 0.03 * (1 - step / steps)
    for i, parameter in enumerate(parameters):
        gradient = parameter.grad
        first_moment[i] = 0.85 * first_moment[i] + 0.15 * gradient
        second_moment[i] = 0.99 * second_moment[i] + 0.01 * gradient ** 2
        mean = first_moment[i] / (1 - 0.85 ** (step + 1))
        variance = second_moment[i] / (1 - 0.99 ** (step + 1))
        parameter.data -= rate * mean / (variance ** 0.5 + 1e-8)
        parameter.grad = 0.0  # Embeddings absent from the next name stay fresh too.
    if (step + 1) % 20 == 0:
        print(f"Step {step + 1:3d}: mean loss {sum(losses[-20:]) / 20:.3f}", flush=True)

print("Generated names (a short training demo, so expect babble):")
temperature = 0.7  # Lower values favor the most likely next character.
for _ in range(8):
    token, generated, keys, values = boundary, [], [], []
    for position in range(context):
        scores = transformer(token, position, keys, values)
        probabilities = softmax([score * (1 / temperature) for score in scores])
        token = rng.choices(range(vocab_size), [p.data for p in probabilities])[0]
        if token == boundary:
            break
        generated.append(characters[token])
    print("  " + ("".join(generated) or "(empty sample)"))
