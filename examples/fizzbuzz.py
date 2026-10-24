for number in range(1, 31):
    print("Fizz" * (number % 3 == 0) + "Buzz" * (number % 5 == 0) or number)
