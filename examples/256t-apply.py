# Functions and parameters from different 256t strings combine freely.
import t256

# Saved to HashBin from examples/saved/summary.py and examples/saved/pi-30.py:
# https://curtcox.github.io/PythonOnline/#AAAAAAH9K9YJb-XC6frC32PnyXEisiwJAaUKjdUJZzVhkE7kcxbCpNjsEC6KO7Dx8aEV2YHr03Vkf0e0LSwvAAnMlD0dRA
SUMMARY = "AAAAAAH9K9YJb-XC6frC32PnyXEisiwJAaUKjdUJZzVhkE7kcxbCpNjsEC6KO7Dx8aEV2YHr03Vkf0e0LSwvAAnMlD0dRA"
# https://curtcox.github.io/PythonOnline/#AAAAAAD9N0ULMrrMFhuVpqN5TZa_UP1vTrDDym8k3lIwu4aHC7NbkP1ER-ViAIjVMvhTBW2ibhDOeD-IPgYqBh7R0-5t5A
PI_30 = "AAAAAAD9N0ULMrrMFhuVpqN5TZa_UP1vTrDDym8k3lIwu4aHC7NbkP1ER-ViAIjVMvhTBW2ibhDOeD-IPgYqBh7R0-5t5A"
TOTAL = "AAAAAAATbGFtYmRhICp4czogc3VtKHhzKQ"  # lambda *xs: sum(xs)
LARGEST = "AAAAAAATbGFtYmRhICp4czogbWF4KHhzKQ"  # lambda *xs: max(xs)
PI_5 = "AAAAAAANMywgMSwgNCwgMSwgNQ"  # 3, 1, 4, 1, 5

functions = {"TOTAL": TOTAL, "LARGEST": LARGEST, "SUMMARY": SUMMARY}
parameters = {"PI_5": PI_5, "PI_30": PI_30}
print(" " * 8, *(f"{name:12}" for name in parameters))
for name, function in functions.items():
    print(f"{name:8}", *(f"{t256.call(function, p)!s:12}" for p in parameters.values()))

# Keyword parameters work too.
JOIN = "AAAAAAArbGFtYmRhICp4cywgc2VwPSIgIjogc2VwLmpvaW4obWFwKHN0ciwgeHMpKQ"  # lambda *xs, sep=" ": sep.join(map(str, xs))
TODAY = "AAAAAAAVMjAyNiwgMTAsIDI1LCBzZXA9Ii0i"  # 2026, 10, 25, sep="-"
print("JOIN with TODAY:", t256.call(JOIN, TODAY))
