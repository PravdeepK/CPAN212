// controllers/bookController.js
import Book from "../models/book.js";

// Fetch all books
const getAllBooks = async (req, res) => {
  try {
    const books = await Book.find({});
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: "Error fetching books", error });
  }
};

// Fetch all books for the logged-in user
const getUserBooks = async (req, res) => {
  try {
    const books = await Book.find({ created_by_user: req.user.userId });
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: "Error fetching books", error });
  }
};

// Add a new book
const addBook = async (req, res) => {
  try {
    const { title, author, publishers, genres, price, pages } = req.body;

    const newBook = new Book({
      title,
      author,
      publishers,
      genres,
      price,
      pages,
      created_by_user: req.user.userId, // Save the user who created the book
    });

    await newBook.save();
    res.status(201).json(newBook);
  } catch (error) {
    console.error("Error adding book:", error);
    res.status(400).json({ message: "Error adding book", error });
  }
};

// Edit an existing book
const editBook = async (req, res) => {
  try {
    const { title, author, publishers, genres, price, pages } = req.body;
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      { title, author, publishers, genres, price, pages },
      { new: true }
    );
    if (!updatedBook)
      return res.status(404).json({ message: "Book not found" });
    res.json(updatedBook);
  } catch (error) {
    res.status(400).json({ message: "Error updating book", error });
  }
};

// Delete a book
const deleteBook = async (req, res) => {
  try {
    // Find the book by ID
    const book = await Book.findById(req.params.id);
    console.log("got here")


    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    console.log("found book")

    // Check if the logged-in user is the one who created the book
    if (book.created_by_user.toString() !== req.user.userId.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this book" });
    }

    // If the user is authorized, delete the book
    await Book.findByIdAndDelete(req.params.id);

    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting book", error });
  }
};

// Fetch detailed information of a book
const getBookDetails = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json(book);
  } catch (error) {
    res.status(500).json({ message: "Error fetching book details", error });
  }
};

export default {
  getAllBooks,
  getUserBooks,
  addBook,
  editBook,
  deleteBook,
  getBookDetails,
};
