# A small adaptation of Andrej Karpathy's micrograd (MIT, copyright 2020).
# Source: https://github.com/karpathy/micrograd
# Only addition, multiplication, and backpropagation are needed for this fit.
# The original license is retained at the end of this file.
import matplotlib.pyplot as plt


class Value:
    def __init__(self, data, children=()):
        self.data = float(data)
        self.grad = 0.0
        self.children = children
        self._backward = lambda: None

    def __add__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data + other.data, (self, other))

        def backward():
            self.grad += out.grad
            other.grad += out.grad

        out._backward = backward
        return out

    def __mul__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data * other.data, (self, other))

        def backward():
            self.grad += other.data * out.grad
            other.grad += self.data * out.grad

        out._backward = backward
        return out

    __radd__ = __add__
    __rmul__ = __mul__

    def backward(self):
        ordered, visited = [], set()

        def visit(node):
            if node not in visited:
                visited.add(node)
                for child in node.children:
                    visit(child)
                ordered.append(node)

        visit(self)
        # Reset the entire graph so another backward() gives fresh gradients.
        for node in ordered:
            node.grad = 0.0
        self.grad = 1.0
        for node in reversed(ordered):
            node._backward()


# Learn y = weight * x + bias. Try changing the target values.
xs = [-2, -1, 0, 1, 2]
ys = [-3, -1, 1, 3, 5]
weight, bias = Value(0), Value(0)
losses = []
for step in range(40):
    errors = [weight * x + bias + (-y) for x, y in zip(xs, ys)]
    loss = sum(error * error for error in errors) * (1 / len(xs))
    losses.append(loss.data)
    loss.backward()
    weight.data -= 0.1 * weight.grad
    bias.data -= 0.1 * bias.grad

print(f"Learned: y = {weight.data:.3f} x + {bias.data:.3f}")
print(f"Mean squared error: {losses[0]:.3f} -> {losses[-1]:.8f}")
fig, (fit, learning) = plt.subplots(1, 2, figsize=(8, 4))
fit.scatter(xs, ys, color="#d96245", label="Training points")
fit.plot(xs, [weight.data * x + bias.data for x in xs],
         color="#167c80", label="Learned line")
fit.set(title="micrograd: learning a line", xlabel="x", ylabel="y")
fit.legend()
learning.semilogy(losses, color="#167c80")
learning.set(title="Backpropagation at work", xlabel="Training step",
             ylabel="Mean squared error")
fig.tight_layout()
plt.show()

# The MIT License (MIT)
# Copyright (c) 2020 Andrej Karpathy
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
