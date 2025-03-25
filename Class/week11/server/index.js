import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";// uninstall

dotenv.config();

// Import routers
import bookRouter from "./routes/book_router.js";
import userRouter from "./routes/user_router.js";

// Initialize app
const app = express();
const PORT = process.env.PORT || 9000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/books", bookRouter); // Protect book routes with JWT authentication
app.use("/api/users", userRouter);

// 404 page (API not found)
app.use((req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// Database connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () =>
      console.log(`Server running on http://localhost:${PORT}`)
    );
  })
  .catch((error) => console.error("MongoDB connection error:", error));
