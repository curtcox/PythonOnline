"""Python Online's per-run environment and rich display bridge."""
import ast
import inspect
import linecache
import base64
import builtins
import io
import json
import os
import re
import sys
import traceback
import types
import tomllib

_emit = lambda item: None
_original_input = builtins.input
_original_stdout, _original_stderr = sys.stdout, sys.stderr
_original_stdin = sys.stdin
_base_modules = set(sys.modules)


class Output(io.TextIOBase):
    def __init__(self, stream):
        self.stream = stream

    def writable(self):
        return True

    def write(self, text):
        if text:
            _emit({'type': 'text', 'stream': self.stream, 'text': str(text)})
        return len(text)

    def flush(self):
        _emit({'type': 'flush'})


def read_input(prompt=''):
    print(prompt, end='')
    line = sys.stdin.readline()
    if line == '':
        raise EOFError('No more program input — add lines in the Input box.')
    print(line.rstrip('\r\n'))
    return line.rstrip('\r\n')


class HTML:
    def __init__(self, data=''):
        self.data = str(data)

    def _repr_html_(self):
        return self.data


class SVG(HTML):
    _repr_html_ = None

    def _repr_svg_(self):
        return self.data


class Markdown(HTML):
    _repr_html_ = None

    def _repr_markdown_(self):
        return self.data


class Image:
    def __init__(self, data=None, filename=None, format='png'):
        self.data = open(filename, 'rb').read() if filename else data
        self.format = format.lower()

    def _repr_png_(self):
        return self.data if self.format == 'png' else None

    def _repr_jpeg_(self):
        return self.data if self.format in ('jpg', 'jpeg') else None


def display(*objects):
    for obj in objects:
        for kind in ('html', 'svg', 'png', 'jpeg', 'markdown'):
            method = getattr(obj, '_repr_' + kind + '_', None)
            value = method() if callable(method) else None
            if value is not None:
                if isinstance(value, tuple):
                    value = value[0]
                if kind in ('png', 'jpeg') and isinstance(value, bytes):
                    value = base64.b64encode(value).decode('ascii')
                _emit({'type': kind, 'data': str(value)})
                break
        else:
            # Pillow images expose save() rather than IPython representation hooks.
            if obj.__class__.__module__.startswith('PIL.'):
                buffer = io.BytesIO()
                obj.save(buffer, format='PNG')
                _emit({'type': 'png', 'data': base64.b64encode(buffer.getvalue()).decode('ascii')})
            else:
                print(repr(obj))


def install_shim():
    ipython = types.ModuleType('IPython')
    ipython.get_ipython = lambda: None
    ipython.version_info = (9, 0, 0)
    helpers = types.ModuleType('IPython.display')
    for name in ('display', 'HTML', 'SVG', 'Markdown', 'Image'):
        setattr(helpers, name, globals()[name])
    ipython.display = helpers
    sys.modules['IPython'] = ipython
    sys.modules['IPython.display'] = helpers


def dependencies(source):
    match = re.search(r'^# /// script\s*\n(.*?)^# ///\s*$', source, re.M | re.S)
    if not match:
        if re.search(r'^# /// script\s*$', source, re.M):
            raise ValueError('Unclosed PEP 723 script metadata block.')
        return []
    lines = match.group(1).splitlines()
    if any(not line.startswith('#') for line in lines):
        raise ValueError('PEP 723 metadata lines must start with #.')
    metadata = tomllib.loads('\n'.join(line[2:] if line.startswith('# ') else line[1:] for line in lines))
    deps = metadata.get('dependencies', [])
    if not isinstance(deps, list) or any(not isinstance(dep, str) for dep in deps):
        raise ValueError('PEP 723 dependencies must be a list of strings.')
    return deps


def capture_figures(*args, **kwargs):
    plt = sys.modules.get('matplotlib.pyplot')
    if plt is None:
        return
    for number in plt.get_fignums():
        figure = plt.figure(number)
        svg, png = io.StringIO(), io.BytesIO()
        figure.savefig(svg, format='svg', bbox_inches='tight')
        figure.savefig(png, format='png', dpi=figure.dpi * 2, bbox_inches='tight')
        _emit({'type': 'figure', 'svg': svg.getvalue(), 'png': base64.b64encode(png.getvalue()).decode('ascii')})
        plt.close(figure)


def patch_matplotlib():
    if 'matplotlib' not in sys.modules:
        return
    import matplotlib
    matplotlib.use('agg', force=True)
    import matplotlib.pyplot as plt
    from matplotlib.figure import Figure
    plt.show = capture_figures
    Figure.show = lambda self, *args, **kwargs: capture_figures()


def prepare(stdin='', emit=None):
    global _emit
    _emit = emit or (lambda item: None)
    sys.modules.pop('_online_bridge', None)
    plt = sys.modules.get('matplotlib.pyplot')
    if plt is not None:
        plt.close('all')
    for name, module in list(sys.modules.items()):
        path = getattr(module, '__file__', '') or ''
        if name not in _base_modules and path.startswith('/home/pyodide/') and '/_pythononline/' not in path:
            sys.modules.pop(name, None)
    if os.path.isdir('/home/pyodide'):
        os.chdir('/home/pyodide')
    os.environ['MPLBACKEND'] = 'agg'
    sys.argv = ['main.py']
    sys.stdin = io.StringIO(stdin)
    sys.stdout, sys.stderr = Output('stdout'), Output('stderr')
    builtins.input, builtins.display = read_input, display
    for name in ('HTML', 'SVG', 'Markdown', 'Image'):
        setattr(builtins, name, globals()[name])
    install_shim()
    import turtle
    turtle._reset(_emit)
    main = types.ModuleType('__main__')
    main.__file__ = 'main.py'
    sys.modules['__main__'] = main
    return main.__dict__


def finish():
    capture_figures()
    import turtle
    turtle._finish()


def restore():
    sys.stdout, sys.stderr, sys.stdin = _original_stdout, _original_stderr, _original_stdin
    builtins.input = _original_input


def format_error(error):
    frames = traceback.TracebackException.from_exception(error)
    frames.stack = traceback.StackSummary.from_list([frame for frame in frames.stack if frame.filename == 'main.py' or not ('_pythononline' in frame.filename or frame.filename.startswith('<'))])
    return ''.join(frames.format())


async def execute(source, namespace):
    """Catch Python errors before crossing FFI, preserving their exact user traceback."""
    linecache.cache['main.py'] = (len(source), None, source.splitlines(True), 'main.py')
    try:
        code = compile(source, 'main.py', 'exec', flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
        result = eval(code, namespace)
        if inspect.isawaitable(result):
            await result
    except BaseException as error:
        return format_error(error)
    return None


def dependency_spec(source):
    try:
        return json.dumps({'dependencies': dependencies(source)})
    except (ValueError, TypeError) as error:
        return json.dumps({'error': str(error)})
