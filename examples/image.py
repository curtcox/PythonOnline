import numpy as np
from PIL import Image
x, y = np.meshgrid(np.linspace(0, 1, 400), np.linspace(0, 1, 300))
pixels = np.stack([x, y, (np.sin(x * 20) * np.cos(y * 20) + 1) / 2], axis=-1)
display(Image.fromarray((pixels * 255).astype("uint8")))
