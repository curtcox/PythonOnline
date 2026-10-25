# Use a function saved under a 256t string, without copying its code.
import t256

# The sample "Save a function for later", saved to HashBin. Open it to read or change it:
# https://curtcox.github.io/PythonOnline/#AAAAAARSol91VecUdbVI0JWpPD5P5VL8NLvxtedwwjen9KYnS3jyfhc2j38Y_DYFXyqFRSPP0xM9v9LKfZLpdUMgnnlptw
ROMAN = "AAAAAARSol91VecUdbVI0JWpPD5P5VL8NLvxtedwwjen9KYnS3jyfhc2j38Y_DYFXyqFRSPP0xM9v9LKfZLpdUMgnnlptw"
# Text of 64 bytes or less is spelled out in its 256t string, so no server is needed.
HELLO = "AAAAAAAebGFtYmRhIG5hbWU6IGYiSGVsbG8sIHtuYW1lfSEi"  # lambda name: f"Hello, {name}!"

roman = t256.function(ROMAN)
for year in [1987, 2026]:
    print(f"roman({year}) = {roman(year)}")

hello = t256.function(HELLO)
print(hello("Ada"))
