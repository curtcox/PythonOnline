# Turtle in Python Online

Python Online includes an original drawing recorder compatible with common beginner turtle programs. It does not use Tk. Import `turtle` as usual. Drawings animate in Output; choose **Skip animation** or **Replay**, and use Download for SVG or PNG. Drag or pinch the finished SVG to explore it.

```python
import turtle as t
t.color("teal", "gold")
t.begin_fill()
for _ in range(5):
    t.forward(120)
    t.right(144)
t.end_fill()
```

Supported classes are `Turtle`, `Pen`, `RawTurtle`, and `Screen()`. Module functions act on the default turtle.

- Motion: `forward/fd`, `backward/back/bk`, `left/lt`, `right/rt`, `goto/setpos/setposition`, `setx`, `sety`, `setheading/seth`, `home`, `circle(radius, extent, steps)`, `teleport`.
- Pen: `penup/pu/up`, `pendown/pd/down`, `pensize/width`, `pencolor`, `fillcolor`, `color`, `begin_fill`, `end_fill`, `filling`, `dot`, `stamp`, `write`, `hideturtle/ht`, `showturtle/st`, `isvisible`, `shape`, `speed`.
- Queries: `position/pos`, `xcor`, `ycor`, `heading`, `towards`, `distance`, `isdown`, `getscreen`.
- Screen: `bgcolor`, `title`, `setup` (pixel sizes), `screensize`, `tracer`, `update`, `colormode(1.0 or 255)`, `delay`.
- Shapes: `classic`, `arrow`, `turtle`, `circle`, `square`, `triangle`. Stamp shapes are approximate.
- `done`, `mainloop`, `exitonclick`, `bye` return immediately.

Use `speed(0)` or `tracer(0)` to draw instantly. Other speeds control the browser's replay. `tracer` and `delay` are recorded settings; replay approximates standard turtle timing. Screen title is accepted, and `update()` is a no-op because the finished command list is replayed by the browser. `write(move=True)` estimates text width. `teleport` moves without drawing. The turtle cursor itself is hidden; use `stamp()` to leave a visible shape.

Event APIs (`onclick`, `onkey`, `onkeypress`, `onkeyrelease`, `ondrag`, `onrelease`, `ontimer`, `listen`) raise `NotImplementedError`: there is no interactive Tk event loop. Use loops and recursion to produce a drawing. Drawings are limited to 200,000 commands per run. Coordinates use the usual turtle system: origin at the center, positive y upwards, heading 0 to the right.
