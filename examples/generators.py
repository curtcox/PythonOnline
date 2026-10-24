from itertools import islice, accumulate, count

squares = (n * n for n in count(1))
print("Squares:", list(islice(squares, 10)))
print("Running totals:", list(accumulate(range(1, 11))))
