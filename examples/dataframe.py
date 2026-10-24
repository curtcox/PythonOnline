import pandas as pd
import matplotlib.pyplot as plt
frame = pd.DataFrame({"Language": ["Python", "JavaScript", "Rust"],
                      "Projects": [12, 8, 5]})
display(frame)
frame.plot.bar(x="Language", y="Projects", color="#167c80", legend=False)
plt.title("Weekend projects")
plt.tight_layout()
