# A function to call with parameters from another 256t string.
import statistics

def summary(*values, places=1):
    """Describe numbers by their mean and standard deviation."""
    mean = round(statistics.mean(values), places)
    spread = round(statistics.stdev(values), places)
    return f"{mean} ± {spread}"

if __name__ == "__main__":
    print(summary(2, 4, 4, 4, 5, 5, 7, 9))
