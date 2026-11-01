# A small adaptation of Andrej Karpathy's minbpe (MIT, copyright 2024 Andrej).
# Source: https://github.com/karpathy/minbpe
# Basic byte-pair encoding: no regex splitting or special tokens.
# The original license is retained at the end of this file.
from collections import Counter
import sys


def merge(tokens, pair, new_id):
    result, i = [], 0
    while i < len(tokens):
        if tuple(tokens[i:i + 2]) == pair:
            result.append(new_id)
            i += 2
        else:
            result.append(tokens[i])
            i += 1
    return result


text = sys.stdin.read().strip()
if not text:
    raise ValueError("Add some training text in Program input.")
tokens = list(text.encode("utf-8"))
vocab = {i: bytes([i]) for i in range(256)}
merges = {}
print("Learning byte-pair merges:")
for new_id in range(256, 264):  # Try allowing more than eight merges.
    counts = Counter(zip(tokens, tokens[1:]))
    if not counts:
        break
    pair = max(counts, key=counts.get)
    if counts[pair] < 2:
        break
    merges[pair] = new_id
    vocab[new_id] = vocab[pair[0]] + vocab[pair[1]]
    tokens = merge(tokens, pair, new_id)
    print(f"  {new_id}: {vocab[new_id]!r} ({counts[pair]} pairs)")


def encode(text):
    tokens = list(text.encode("utf-8"))
    # Apply learned merges in training order, never by token length.
    while len(tokens) > 1:
        pairs = zip(tokens, tokens[1:])
        pair = min(pairs, key=lambda pair: merges.get(pair, float("inf")))
        if pair not in merges:
            break
        tokens = merge(tokens, pair, merges[pair])
    return tokens


def decode(tokens):
    # Join the bytes before decoding: a token may be only part of a UTF-8 character.
    return b"".join(vocab[token] for token in tokens).decode("utf-8")


encoded = encode(text)
print(f"\nUTF-8 bytes: {len(text.encode('utf-8'))}; BPE tokens: {len(encoded)}")
print("Token IDs:", encoded)
print("Round trip:", decode(encoded) == text)
print("Decoded:", decode(encoded))

# MIT License
# Copyright (c) 2024 Andrej
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
