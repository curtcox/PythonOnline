from dataclasses import dataclass

@dataclass
class Book:
    title: str
    pages: int

books = [Book("A Journey", 180), Book("Small Worlds", 240)]
for book in books:
    print(f"{book.title}: {book.pages} pages")
print(f"Total: {sum(book.pages for book in books)} pages")
