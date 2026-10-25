import contextlib
import io
import json
from pathlib import Path
import runpy
import sys
import unittest
from unittest import mock
import urllib.error

root = Path(__file__).parents[1]
sys.path.insert(0, str(root / 'src/py'))
import t256

fixtures = Path(__file__).parent / 'fixtures/256t'
requested = []


def serve(request, timeout=None):
    """Serve checked-in copies of saved programs, as 256t.us serves HashBin content."""
    requested.append(request.full_url)
    server, cid = request.full_url.rsplit('/', 1)
    if server != 'https://256t.us' or not (fixtures / cid).exists():
        raise urllib.error.HTTPError(request.full_url, 404, 'Not Found', {}, None)
    return io.BytesIO((fixtures / cid).read_bytes())


def saved(path):
    """The document Python Online's Save to HashBin stores for a program."""
    return json.dumps({'format': 'hashbin-diagram', 'version': 1, 'type': 'python', 'src': Path(path).read_text(),
                       'python': {'stdin': '', 'autorun': True}}, ensure_ascii=False, separators=(',', ':'))


class T256Tests(unittest.TestCase):
    def setUp(self):
        t256.text.cache_clear()
        requested.clear()
        patcher = mock.patch('urllib.request.urlopen', serve)
        patcher.start()
        self.addCleanup(patcher.stop)

    def run_sample(self, name):
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            runpy.run_path(str(root / 'examples' / f'{name}.py'), run_name='__main__')
        return out.getvalue()

    def test_fixtures_are_the_saved_programs(self):
        sources = ['examples/256t-save.py', *sorted(str(path.relative_to(root)) for path in (root / 'examples/saved').iterdir())]
        self.assertEqual({t256.cid(saved(root / source)) for source in sources}, {path.name for path in fixtures.iterdir()})

    def test_function_only(self):
        out = self.run_sample('256t-function')
        self.assertIn('roman(2026) = MMXXVI', out)
        self.assertIn('Hello, Ada!', out)

    def test_function_and_parameters(self):
        out = self.run_sample('256t-call')
        self.assertIn("result: [('the', 4), ('fox', 2), ('dog', 2)]", out)
        self.assertIn('result: 42', out)

    def test_separate_function_and_parameters(self):
        out = self.run_sample('256t-apply')
        self.assertRegex(out, r'TOTAL +14 +141')
        self.assertRegex(out, r'SUMMARY +2.8 ± 1.8 +4.7 ± 2.5')
        self.assertIn('JOIN with TODAY: 2026-10-25', out)

    def test_saved_demo_runs_only_as_its_own_program(self):
        self.assertIn('roman(1987) = MCMLXXXVII', self.run_sample('256t-save'))
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            roman = t256.function(t256.cid(saved(root / 'examples/256t-save.py')))
        self.assertEqual((roman(4), out.getvalue()), ('IV', ''))

    def test_each_text_is_fetched_once(self):
        summary = t256.cid(saved(root / 'examples/saved/summary.py'))
        for _ in range(3):
            t256.call(summary, t256.cid('1, 2, 3'))
        self.assertEqual(requested, ['https://256t.us/' + summary])

    def test_saved_links_and_other_servers(self):
        text = 'lambda: ' + ' + '.join(['1'] * 30)
        name = t256.cid(text)
        with mock.patch.object(t256, '_fetch', lambda url: text.encode() if url.startswith('https://256t.org/') else b'wrong'):
            self.assertEqual(t256.function(f'https://curtcox.github.io/PythonOnline/#{name}')(), 30)
        t256.text.cache_clear()
        with mock.patch.object(t256, '_fetch', lambda url: None), self.assertRaisesRegex(ValueError, 'No 256t server'):
            t256.text(name)

    def test_text_forms(self):
        self.assertEqual(t256.function(t256.cid('import math\nmath.gcd'))(12, 18), 6)
        self.assertEqual(t256.call(t256.cid('def f(a, b=1):\n    return a - b\nf(9, b=4)')), 5)
        self.assertEqual(t256.call(t256.cid('lambda **kw: sorted(kw)'), t256.cid('b=1, a=2')), ['a', 'b'])
        self.assertEqual(t256.parameters(t256.cid('# note\n1, "x"')), ([1, 'x'], {}))
        self.assertEqual(t256.source(t256.cid('[1, 2]')), '[1, 2]')
        for bad in ['__import__("os")', '1), print(2', '*range(3)']:
            with self.assertRaises(ValueError):
                t256.call(t256.cid('lambda *x: x'), t256.cid(bad))
        with self.assertRaisesRegex(ValueError, 'must end with a call'):
            t256.call(t256.cid('lambda x: x'))
        with self.assertRaisesRegex(ValueError, 'def or an expression'):
            t256.function(t256.cid('x = 1'))
        with self.assertRaisesRegex(ValueError, 'Not a 256t string'):
            t256.text('not a cid!')


if __name__ == '__main__':
    unittest.main()
