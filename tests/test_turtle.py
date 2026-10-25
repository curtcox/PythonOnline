import importlib.util
import math
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('online_turtle', Path(__file__).parents[1] / 'src/py/turtle.py')
t = importlib.util.module_from_spec(spec)
spec.loader.exec_module(t)


class TurtleTests(unittest.TestCase):
    def setUp(self):
        self.items = []
        t._reset(self.items.append)

    def test_motion_queries_and_aliases(self):
        pen = t.Turtle()
        pen.fd(10)
        pen.lt(90)
        pen.fd(20)
        self.assertAlmostEqual(pen.xcor(), 10)
        self.assertAlmostEqual(pen.ycor(), 20)
        self.assertEqual(pen.heading(), 90)
        self.assertAlmostEqual(pen.distance((10, 0)), 20)
        self.assertAlmostEqual(pen.towards(10, 0), 270)
        pen.pu()
        pen.setpos(0, 0)
        self.assertFalse(pen.isdown())
        pen.pd()
        pen.seth(180)
        pen.bk(5)
        self.assertAlmostEqual(pen.xcor(), 5)
        pen.setx(20)
        pen.sety(10)
        pen.home()
        self.assertEqual(pen.pos(), (0, 0))
        self.assertEqual(self.items[0]['type'], 'turtle-start')

    def test_circle(self):
        pen = t.Turtle()
        pen.circle(100, 180, 30)
        self.assertAlmostEqual(pen.xcor(), 0, places=8)
        self.assertAlmostEqual(pen.ycor(), 200, places=8)
        self.assertAlmostEqual(pen.heading(), 180)
        t._reset()
        pen = t.Turtle()
        pen.circle(-100, 180)
        self.assertAlmostEqual(pen.ycor(), -200, places=8)

    def test_fill_color_write_stamp(self):
        t.colormode(255)
        t.color((255, 0, 128), (0, 128, 255))
        t.begin_fill()
        for _ in range(3):
            t.forward(30)
            t.left(120)
        self.assertTrue(t.filling())
        t.end_fill()
        t.dot(10)
        t.write('<hello>', align='center', font=('Arial', 16, 'bold'))
        t.shape('turtle')
        self.assertEqual(t.stamp(), 1)
        t.hideturtle()
        self.assertFalse(t.isvisible())
        t.showturtle()
        self.assertTrue(t.isvisible())
        t._finish()
        commands = self.items[-1]['commands']
        self.assertEqual(commands[0]['op'], 'fill')
        self.assertEqual(commands[0]['color'], '#0080ff')
        self.assertEqual(commands[-2]['text'], '<hello>')
        self.assertEqual(commands[-1]['shape'], 'turtle')

    def test_screen_and_teleport(self):
        self.assertIs(t.Screen(), t.Screen())
        t.setup(400, 300)
        t.bgcolor('navy')
        t.tracer(0)
        t.speed(0)
        t.teleport(100, 50)
        t.forward(10)
        t._finish()
        self.assertEqual(self.items[-1]['width'], 400)
        lines = [c for c in t.Screen().commands if c['op'] == 'line']
        self.assertEqual(len(lines), 1)
        self.assertEqual(lines[0]['x1'], 100)
        self.assertEqual(lines[0]['speed'], 0)
        t.done()
        t.mainloop()

    def test_events_and_limits(self):
        for name in ('onclick', 'onkey', 'ontimer', 'listen'):
            with self.subTest(name=name), self.assertRaisesRegex(NotImplementedError, 'docs/turtle.html'):
                getattr(t, name)(lambda: None)
        t.Screen().commands = [{}] * t.MAX_COMMANDS
        with self.assertRaisesRegex(RuntimeError, '200,000'):
            t.forward(1)
        with self.assertRaises(ValueError):
            t.goto(math.inf, 0)
        with self.assertRaises(ValueError):
            t.colormode(2)
