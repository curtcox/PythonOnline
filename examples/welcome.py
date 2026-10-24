def greet(name):
    return f"Hello, {name}!"

for _ in range(3):
    print(greet(input("Your name: ")))

import turtle as t
t.speed(0)
t.color("#167c80")
for side in range(36):
    t.forward(100)
    t.left(170)
print("Try changing the angle or the names below.")
