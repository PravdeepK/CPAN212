//imports
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Book from "./models/book.js"; // db.books.functionName()
import book_router from "./routers/book_router.js"



//variables
dotenv.config();
const app = express();
const PORT = process.env.PORT || 6000;

//middlewares
app.use(cors());
app.use(express.json()); //allows json
app.use(express.urlencoded({ extended: true })); //allows html form data

//startup
mongoose.connect(process.env.MONGODB_URL).then(() => {
  console.log("Connected to DB");
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});


app.use("/book", book_router);
//routes
app.get("/", (req, res) => {
  Book.find().then((results) => {
    res.json(results);
  });
});
