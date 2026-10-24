count = int(input("How many numbers? "))
numbers = [float(input("Number: ")) for _ in range(count)]
print(f"Total: {sum(numbers):g}")
print(f"Average: {sum(numbers) / count:g}")
