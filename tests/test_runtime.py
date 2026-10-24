import importlib.util
from pathlib import Path
import sys
import unittest

root = Path(__file__).parents[1] / 'src/py'
sys.path.insert(0, str(root))
import runtime
import turtle


class RuntimeTests(unittest.TestCase):
    def setUp(self):
        self.items = []
        runtime.prepare('Ada\n42\n', self.items.append)

    def tearDown(self):
        runtime.restore()

    def text(self):
        return ''.join(item.get('text', '') for item in self.items)

    def test_input_echo_and_eof(self):
        self.assertEqual(input('Name: '), 'Ada')
        self.assertEqual(input(), '42')
        with self.assertRaisesRegex(EOFError, 'Input box'):
            input()
        self.assertEqual(self.text(), 'Name: Ada\n42\n')

    def test_sys_stdin(self):
        self.assertEqual(list(sys.stdin), ['Ada\n', '42\n'])

    def test_display_dispatch(self):
        class Both:
            def _repr_html_(self):
                return '<b>first</b>'

            def _repr_svg_(self):
                return 'second'
        runtime.display(Both(), runtime.SVG('<svg/>'), runtime.Markdown('**hi**'), runtime.Image(b'PNG'), 123)
        self.assertEqual([item['type'] for item in self.items[:4]], ['html', 'svg', 'markdown', 'png'])
        self.assertEqual(self.items[3]['data'], 'UE5H')
        self.assertIn('123', self.text())

    def test_ipython_helpers(self):
        from IPython.display import HTML, SVG, Markdown, Image, display
        display(HTML('hi'), SVG('<svg/>'), Markdown('# title'), Image(b'jpg', format='jpeg'))
        self.assertEqual([item['type'] for item in self.items], ['html', 'svg', 'markdown', 'jpeg'])

    def test_metadata(self):
        self.assertEqual(runtime.dependencies('print(1)'), [])
        self.assertEqual(runtime.dependencies('# /// script\n# dependencies = ["a", "b>=1"]\n# ///\nprint(1)'), ['a', 'b>=1'])
        for source in ('# /// script\n# dependencies = []', '# /// script\n# dependencies = "a"\n# ///', '# /// script\n# dependencies = [\n# ///'):
            with self.subTest(source=source), self.assertRaises(ValueError):
                runtime.dependencies(source)

    def test_fresh_namespace(self):
        first = runtime.prepare('', self.items.append)
        first['secret'] = 123
        turtle.forward(10)
        second = runtime.prepare('', self.items.append)
        self.assertNotIn('secret', second)
        self.assertEqual(turtle.Screen().commands, [])
