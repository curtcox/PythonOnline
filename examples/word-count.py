from collections import Counter

words = "the more we learn the more we see the more we wonder".split()
counts = Counter(words)
print({word: count for word, count in counts.items() if count > 1})
print("Unique word lengths:", sorted({len(word) for word in words}))
