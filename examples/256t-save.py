# Save this program with Save to HashBin. The HashBin box then shows its 256t string,
# which names roman(). Any later program can use roman() without copying this code:
#     import t256
#     roman = t256.function("<the 256t string>")
# The sample "A function from 256t" does exactly that with this program's 256t string.

def roman(number):
    """Write a positive integer in Roman numerals."""
    numerals = [(1000, "M"), (900, "CM"), (500, "D"), (400, "CD"),
                (100, "C"), (90, "XC"), (50, "L"), (40, "XL"),
                (10, "X"), (9, "IX"), (5, "V"), (4, "IV"), (1, "I")]
    letters = ""
    for value, numeral in numerals:
        count, number = divmod(number, value)
        letters += numeral * count
    return letters

# This demo runs only when this program runs, not when another program uses roman().
if __name__ == "__main__":
    for year in [1987, 2026]:
        print(f"roman({year}) = {roman(year)}")
