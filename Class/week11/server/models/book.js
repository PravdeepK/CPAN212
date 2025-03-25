import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "A book must have a title"],
      trim: true,
    },
    author: {
      type: String,
      required: [true, "A book must have an author"],
      trim: true,
    },
    publishers: {
      type: [String],
      required: [true, "A book must have at least one publisher"],
    },
    genres: {
      type: [String],
      required: [true, "A book must have at least one genre"],
    },
    price: {
      type: Number,
      required: [true, "A book must have a price"],
      min: [0, "Price cannot be negative"],
    },
    pages: {
      type: Number,
      required: [true, "A book must have a page count"],
      min: [1, "A book must have at least one page"],
    },
    created_by_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const Book = mongoose.model("Book", bookSchema);

export default Book;
