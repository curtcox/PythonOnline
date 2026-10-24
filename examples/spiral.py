import turtle as t
t.speed(0)
t.pensize(2)
colors = ["#167c80", "#e3a72f", "#d96245", "#4d65ae"]
for step in range(100):
    t.pencolor(colors[step % len(colors)])
    t.forward(step * 2)
    t.right(91)
