# Inspired by Andrej Karpathy's makemore (MIT, copyright 2022).
# Source: https://github.com/karpathy/makemore
# A count-based bigram model replaces PyTorch; Program input is the dataset.
# The original license is retained at the end of this file.
import random
import sys
import matplotlib.pyplot as plt

names = [line.strip().lower() for line in sys.stdin if line.strip()]
if not names:
    raise ValueError("Add one training name per line in Program input.")

# Token 0 marks both the start and end; other tokens represent characters.
characters = [None] + sorted(set("".join(names)))
index = {character: i for i, character in enumerate(characters)}
counts = [[0 for _ in characters] for _ in characters]
for name in names:
    tokens = [0] + [index[character] for character in name] + [0]
    for left, right in zip(tokens, tokens[1:]):
        counts[left][right] += 1

# A little smoothing lets the model sample previously unseen pairs too.
probabilities = []
for row in counts:
    smoothed = [count + 0.1 for count in row]
    probabilities.append([count / sum(smoothed) for count in smoothed])

rng = random.Random(42)
print(f"Trained on {len(names)} names; {len(characters)} tokens (including boundary).")
print("New names from next-character probabilities:")
for _ in range(8):
    token, generated = 0, []
    for _ in range(16):
        token = rng.choices(range(len(characters)), probabilities[token])[0]
        if token == 0:
            break
        generated.append(characters[token])
    else:
        generated.append("…")  # Keep even a long sampled name bounded.
    print("  " + ("".join(generated) or "(empty sample)"))

fig, ax = plt.subplots(figsize=(7, 5))
image = ax.imshow(probabilities, cmap="YlGnBu", vmin=0, vmax=1)
labels = ["·"] + characters[1:]
ax.set_xticks(range(len(labels)), labels)
ax.set_yticks(range(len(labels)), labels)
ax.set(title="makemore: what character comes next?",
       xlabel="Next character (· = end)", ylabel="Current character (· = start)")
fig.colorbar(image, ax=ax, label="Probability")
fig.tight_layout()
plt.show()

# MIT License
# Copyright (c) 2022 Andrej Karpathy
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
