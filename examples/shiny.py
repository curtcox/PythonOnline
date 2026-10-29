# /// script
# dependencies = ["shiny==1.6.3", "shinychat==0.1.0", "starlette==0.50.0"]
# ///
from shiny import reactive, ui
from IPython.display import HTML, display

# Explore Shiny's reactive engine without starting a web server.
# Change the two quantities in Program input, then run again.
# Full interactive Shiny apps use Shinylive: https://shinylive.io/py/
quantity = reactive.value(0)
price = 12

@reactive.calc
def total():
    return quantity() * price

print("Shiny: reactive shopping totals")
rows = []
for _ in range(2):
    count = int(input("Quantity: "))
    quantity.set(count)
    with reactive.isolate():
        amount = total()
    print(f"Total: ${amount}")
    rows.append(ui.tags.tr(ui.tags.td(str(count)), ui.tags.td(f"${amount}")))

# Shiny's HTML tags escape their text; this output is a static snapshot.
display(HTML(str(ui.tags.table(
    ui.tags.tr(ui.tags.th("Quantity"), ui.tags.th("Total at $12 each")),
    *rows,
))))
