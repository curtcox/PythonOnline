import turtle as t
t.speed(0)
t.left(90)
t.penup()
t.goto(0, -220)
t.pendown()
def branch(length):
    if length < 7:
        return
    t.pensize(max(1, length / 15))
    t.color("#287653" if length < 30 else "#73503c")
    t.forward(length)
    t.left(26)
    branch(length * 0.72)
    t.right(52)
    branch(length * 0.72)
    t.left(26)
    t.penup()
    t.backward(length)
    t.pendown()
branch(110)
