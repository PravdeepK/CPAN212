import express from "express";
import Book from "../models/book.js";

const router = express.Router();
// 1 fetch all
router.get("/", (req, res) => {
  Book.find().then((results) => {
    res.json(results);
  });
});
// 2 fetch by id
router.get("/:id", (req, res) => {
  Book.findByID(req.params.id).then((results) => {
    res.json(results);
  });
});

export default router;
