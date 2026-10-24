import turtle as t
import colorsys
t.speed(0)
for i in range(72):
    t.color(colorsys.hsv_to_rgb(i / 72, 0.75, 0.85))
    t.begin_fill()
    t.forward(200)
    t.left(90)
    t.forward(12)
    t.left(90)
    t.forward(200)
    t.left(185)
    t.end_fill()
