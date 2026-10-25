import contextlib
import io
from pathlib import Path
import runpy
import unittest

examples = Path(__file__).parents[1] / 'examples'


def run(name):
    out = io.StringIO()
    with contextlib.redirect_stdout(out):
        scope = runpy.run_path(str(examples / f'{name}.py'))
    return scope, out.getvalue()


class Calls256tTests(unittest.TestCase):
    def test_function_only(self):
        _, out = run('256t-function')
        self.assertIn('Hello, Grace!', out)
        self.assertIn('hypotenuse(5, 12) = 13.0', out)

    def test_function_and_parameters(self):
        _, out = run('256t-call')
        self.assertIn('result: 42', out)
        self.assertIn('result: Hi Ada?', out)

    def test_separate_function_and_parameters(self):
        _, out = run('256t-apply')
        self.assertRegex(out, r'TOTAL +14 +18')
        self.assertIn('JOIN with TODAY: 2026-10-25', out)
        self.assertIn('As one string: 3 1 4 1 5', out)

    def test_helpers_match_across_samples(self):
        sources = [(examples / f'256t-{name}.py').read_text() for name in ('function', 'call', 'apply')]
        blocks = {source[:source.index('\n# ', source.index('def call_256t'))] for source in sources}
        self.assertEqual(len(blocks), 1)

    def test_text_forms(self):
        scope, _ = run('256t-apply')
        cid = lambda text: scope['cid_for'](text.encode())
        self.assertEqual(scope['function_for'](cid('import math\nmath.gcd'))(12, 18), 6)
        self.assertEqual(scope['call_256t'](cid('def f(a, b=1):\n    return a - b\nf(9, b=4)')), 5)
        self.assertEqual(scope['call_256t'](cid('lambda **kw: sorted(kw)'), cid('b=1, a=2')), ['a', 'b'])
        with self.assertRaises(ValueError):
            scope['call_256t'](cid('lambda x: x'), cid('__import__("os")'))
        with self.assertRaises(ValueError):
            scope['call_256t'](cid('lambda x: x'), cid('1), print(2'))
        with self.assertRaises(ValueError):
            scope['call_256t'](cid('lambda x: x'))
        long_text = 'lambda: ' + ' + '.join(['0'] * 30)
        module = scope['text_for'].__globals__
        module['fetch'] = lambda url: long_text.encode() if url.startswith('https://256t.org/') else b'wrong'
        self.assertEqual(scope['function_for'](cid(long_text))(), 0)
        module['fetch'] = lambda url: None
        with self.assertRaisesRegex(ValueError, 'no text matches'):
            scope['text_for'](cid(long_text))


if __name__ == '__main__':
    unittest.main()
