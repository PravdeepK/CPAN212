// routes/book_router.js
import express from 'express';
import auth from '../middlewares/auth.js';
import bookController from '../controllers/book_controller.js'; // Import controller functions
const router = express.Router();

// Fetch all books for the logged-in user
router.get("/", auth.verifyToken, bookController.getUserBooks); // remove verifyToken

// Fetch all books
router.get("/all", bookController.getAllBooks);

// Add a new book
router.post("/add", auth.verifyToken, bookController.addBook); // remove verifyToken

// Fetch detailed book information
router.get("/details/:id", bookController.getBookDetails);

// Edit an existing book
router.put("/edit/:id", auth.verifyToken, bookController.editBook);  // remove verifyToken

// Delete a book
router.delete("/delete/:id", auth.verifyToken, bookController.deleteBook);  // remove verifyToken



export default router;
