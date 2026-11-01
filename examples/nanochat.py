# Inspired by Andrej Karpathy's nanochat: https://github.com/karpathy/nanochat
# An educational pipeline, not a port of nanochat's pretrained GPT model.
# Word tokens and a tiny NumPy neural language model replace BPE and PyTorch.
# Program input: one question | answer per line. Edit the pairs and rerun.
# The upstream MIT notice is retained below.
import re
import sys
import numpy as np
import matplotlib.pyplot as plt

pairs = []
for line in sys.stdin:
    if not line.strip():
        continue
    question, separator, answer = line.partition("|")
    if not separator or not question.strip() or not answer.strip():
        raise ValueError("Use one question | answer per line in Program input.")
    pairs.append((question.strip(), answer.strip()))
if not pairs:
    raise ValueError("Add question | answer pairs in Program input.")


def words(text):
    return re.findall(r"\w+|[^\w\s]", text.lower())


# Role tokens are separate IDs: ordinary input cannot become a role marker.
vocab = ["<pad>", "<bos>", "<user>", "<assistant>", "<end>"]
vocab += sorted({word for pair in pairs for text in pair for word in words(text)})
pad, bos, user, assistant, end = range(5)
index = {word: i for i, word in enumerate(vocab)}


def encode(text):
    return [index[word] for word in words(text)]


# The model predicts the next token using only a fixed window of past tokens.
# A feed-forward network replaces the larger transformer's causal attention.
# For longer experiments, disable Auto-run before increasing these settings.
context, width, hidden = 10, 8, 32
pretrain_steps, sft_steps = 60, 80
rng = np.random.default_rng(42)
weights = {
    "embedding": rng.normal(0, 0.1, (len(vocab), width)),
    "hidden": rng.normal(0, 0.1, (context * width, hidden)),
    "bias": np.zeros(hidden),
    "output": rng.normal(0, 0.1, (hidden, len(vocab))),
    "output_bias": np.zeros(len(vocab)),
}


def window(tokens):
    return ([pad] * context + tokens)[-context:]


def dataset(chat=False):
    inputs, targets = [], []
    for question, answer in pairs:
        if chat:
            prefix = [bos, user] + encode(question) + [assistant]
            sequence = prefix + encode(answer) + [end]
            first_target = len(prefix)  # Supervise assistant answers only.
        else:
            sequence = [bos] + encode(question) + encode(answer) + [end]
            first_target = 1  # Pretraining predicts every ordinary text token.
        for position in range(first_target, len(sequence)):
            inputs.append(window(sequence[:position]))
            targets.append(sequence[position])
    return np.array(inputs), np.array(targets)


def forward(inputs, temperature=1.0):
    embedded = weights["embedding"][inputs].reshape(len(inputs), -1)
    activation = np.tanh(embedded @ weights["hidden"] + weights["bias"])
    logits = (activation @ weights["output"] + weights["output_bias"]) / temperature
    logits -= logits.max(axis=1, keepdims=True)
    probabilities = np.exp(logits)
    probabilities /= probabilities.sum(axis=1, keepdims=True)
    return embedded, activation, probabilities


def loss(inputs, targets):
    probabilities = forward(inputs)[2]
    return -np.log(probabilities[np.arange(len(targets)), targets] + 1e-12).mean()


def train(inputs, targets, steps):
    # Full-batch cross-entropy backpropagation and Adam, entirely in NumPy.
    first = {key: np.zeros_like(value) for key, value in weights.items()}
    second = {key: np.zeros_like(value) for key, value in weights.items()}
    losses = [loss(inputs, targets)]
    for step in range(1, steps + 1):
        embedded, activation, gradient = forward(inputs)
        gradient[np.arange(len(targets)), targets] -= 1
        gradient /= len(targets)
        gradients = {"output": activation.T @ gradient,
                     "output_bias": gradient.sum(axis=0)}
        back = (gradient @ weights["output"].T) * (1 - activation ** 2)
        gradients["hidden"] = embedded.T @ back
        gradients["bias"] = back.sum(axis=0)
        embedding_gradient = (back @ weights["hidden"].T).reshape(
            len(inputs), context, width)
        gradients["embedding"] = np.zeros_like(weights["embedding"])
        np.add.at(gradients["embedding"], inputs, embedding_gradient)
        for key in weights:
            first[key] = 0.9 * first[key] + 0.1 * gradients[key]
            second[key] = 0.999 * second[key] + 0.001 * gradients[key] ** 2
            mean = first[key] / (1 - 0.9 ** step)
            variance = second[key] / (1 - 0.999 ** step)
            weights[key] -= 0.02 * mean / (np.sqrt(variance) + 1e-8)
        losses.append(loss(inputs, targets))
    return losses


print(f"nanochat mini: {len(pairs)} pairs, {len(vocab)} word/role tokens")
print("Tokenizer -> pretraining -> assistant-only fine-tuning -> generation")
pre_inputs, pre_targets = dataset()
chat_inputs, chat_targets = dataset(chat=True)
pre_losses = train(pre_inputs, pre_targets, pretrain_steps)
print(f"Pretraining loss: {pre_losses[0]:.3f} -> {pre_losses[-1]:.3f}", flush=True)
sft_losses = train(chat_inputs, chat_targets, sft_steps)
print(f"Assistant loss: {sft_losses[0]:.3f} -> {sft_losses[-1]:.3f}")
print("Losses are on training data; this tiny model can memorize, not generalize.")

temperature = 0.5  # Raise this for more varied (and less reliable) replies.
print("\nSampled replies to training questions:")
for question, _ in pairs[:3]:
    tokens = [bos, user] + encode(question) + [assistant]
    generated = []
    for _ in range(24):
        probabilities = forward(np.array([window(tokens)]), temperature)[2][0]
        probabilities[:4] = 0  # Generate words or end, never a new role.
        probabilities /= probabilities.sum()
        token = int(rng.choice(len(vocab), p=probabilities))
        if token == end:
            break
        tokens.append(token)
        generated.append(vocab[token])
    reply = re.sub(r"\s+([^\w\s])", r"\1", " ".join(generated))
    print(f"User: {question}\nAssistant: {reply or '(empty reply)'}")

fig, ax = plt.subplots(figsize=(7, 4))
ax.plot(pre_losses, color="#167c80", label="Pretrain: all text tokens")
ax.plot(range(pretrain_steps, pretrain_steps + sft_steps + 1), sft_losses,
        color="#d96245", label="Fine-tune: assistant tokens only")
ax.axvline(pretrain_steps, color="#78909c", linestyle="--", alpha=0.5)
ax.set(title="nanochat mini: from text to assistant", xlabel="Training step",
       ylabel="Training cross-entropy (nats)", ylim=(0, None))
ax.legend()
ax.grid(alpha=0.2)
fig.tight_layout()
plt.show()

# MIT License
# Copyright (c) 2025 Andrej Karpathy
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.
