def hanoi(n, start, finish, spare):
    if n:
        yield from hanoi(n - 1, start, spare, finish)
        yield f"Move disk {n}: {start} → {finish}"
        yield from hanoi(n - 1, spare, finish, start)

for move in hanoi(3, "A", "C", "B"):
    print(move)
