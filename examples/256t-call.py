# One 256t string names a function and its parameters. t256.call runs its last line.
import t256

# A program saved to HashBin from examples/saved/top-words.py:
# https://curtcox.github.io/PythonOnline/#AAAAAAIVLgqOwaRWadzTxEYFXUW_6ip-1Gyvg3yZp-nKnrKze7oX8dtwt_YUy_Qjcdg7tSqZEghefrf3jaQCKqwgHbh1xQ
TOP_WORDS = "AAAAAAIVLgqOwaRWadzTxEYFXUW_6ip-1Gyvg3yZp-nKnrKze7oX8dtwt_YUy_Qjcdg7tSqZEghefrf3jaQCKqwgHbh1xQ"
AREA = "AAAAAAAaKGxhbWJkYSB3LCBoOiB3ICogaCkoNiwgNyk"  # (lambda w, h: w * h)(6, 7)

for name, saved in [("TOP_WORDS", TOP_WORDS), ("AREA", AREA)]:
    print(f"{name} ends with: {t256.source(saved).splitlines()[-1]}")
    print("  result:", t256.call(saved))
