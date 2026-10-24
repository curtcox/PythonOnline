import numpy as np
import matplotlib.pyplot as plt
rng = np.random.default_rng(42)
rolls = rng.integers(1, 7, size=(1000, 2)).sum(axis=1)
plt.hist(rolls, bins=np.arange(1.5, 13), color="#167c80", edgecolor="white")
plt.title("Sum of two dice · 1,000 rolls")
plt.xlabel("Total")
plt.ylabel("Frequency")
