import numpy as np
import matplotlib.pyplot as plt
x = np.linspace(0, 2 * np.pi, 200)
fig, ax = plt.subplots(figsize=(7, 4))
ax.plot(x, np.sin(x), color="#167c80", label="sin(x)")
ax.scatter(x[::12], np.cos(x[::12]), color="#d96245", label="cos(x)")
ax.set(title="Waves and samples", xlabel="x", ylabel="value")
ax.legend()
ax.grid(alpha=0.2)
plt.show()
