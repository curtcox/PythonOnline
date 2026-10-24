live = {(2, 1), (3, 2), (1, 3), (2, 3), (3, 3)}
for frame in range(4):
    print(f"Generation {frame}")
    for y in range(7):
        print("".join("██" if (x, y) in live else "· " for x in range(9)))
    neighbors = {(x + dx, y + dy) for x, y in live
                 for dx in (-1, 0, 1) for dy in (-1, 0, 1)}
    def count(x, y):
        return sum((x + dx, y + dy) in live for dx in (-1, 0, 1)
                   for dy in (-1, 0, 1) if dx or dy)
    live = {(x, y) for x, y in neighbors
            if count(x, y) == 3 or ((x, y) in live and count(x, y) == 2)}
