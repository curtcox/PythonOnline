import turtle as t
t.speed(0)
t.color("#407ca0")
t.penup()
t.goto(-180, 100)
t.pendown()
def edge(length, depth):
    if depth == 0:
        t.forward(length)
    else:
        for turn in (60, -120, 60, 0):
            edge(length / 3, depth - 1)
            t.left(turn)
for _ in range(3):
    edge(360, 3)
    t.right(120)
