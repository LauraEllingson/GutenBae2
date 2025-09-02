import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import UserModel from "./models/User.js";
import jwt from "jsonwebtoken";
import LikedBook from './models/LikedBooks.js';
import Review from "./models/Review.js";



const app = express();
app.use(express.json());
app.use(cors({
  origin: ["https://gutenbae2.onrender.com", "http://localhost:5173"],
  credentials: true
}));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.json({ error: "All fields are required" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new UserModel({ name, email, password: hashedPassword });
  try {
    await newUser.save();
    res.json({ message: "User registered" });
  } catch (err) {
    res.json({ error: "Error registering user" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await UserModel.findOne({ email });
  if (!user) return res.status(400).json({ error: "User not found" });
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: "Wrong password" });
  const token = jwt.sign({ _id: user._id, name: user.name }, process.env.JWT_ACCESS_SECRET, { expiresIn: "1h" });
  res.json({ message: "Login successful", token, name: user.name });
});

const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ error: "Access denied" });
  jwt.verify(token.split(" ")[1], process.env.JWT_ACCESS_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = decoded;
    next();
  });
};

app.post("/verify-token", authenticateToken, (req, res) => {
  res.json({ user: req.user });
});
// GET /reviews/:bookId (public)
app.get("/reviews/:bookId", async (req, res) => {
  try {
    const bookId = Number(req.params.bookId);
    if (Number.isNaN(bookId)) return res.status(400).json({ message: "Invalid bookId" });
    const reviews = await Review.find({ bookId }).sort({ createdAt: -1 }).lean();
    res.json({ reviews });
  } catch {
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});

// POST /reviews (auth)
app.post("/reviews", authenticateToken, async (req, res) => {
  try {
    const { bookId, rating, text } = req.body;
    const numericBookId = Number(bookId);
    const numericRating = Number(rating);
    if (!numericBookId || !numericRating) {
      return res.status(400).json({ message: "bookId and rating are required" });
    }
    if (numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: "rating must be between 1 and 5" });
    }
    const review = await Review.create({
      bookId: numericBookId,
      userId: req.user._id,
      userName: req.user.name || "",
      rating: numericRating,
      text: (text || "").toString().trim(),
    });
    res.status(201).json({ review });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ message: "You already reviewed this book." });
    }
    res.status(500).json({ message: "Failed to create review" });
  }
});


app.post("/like-book", authenticateToken, async (req, res) => {
  const { bookId, title, authors, imageUrl, description, formats } = req.body;
  const userId = req.user._id;
  try {
    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const alreadyLiked = await LikedBook.findOne({ userId, bookId });
    if (alreadyLiked) return res.status(400).json({ error: "Book already liked" });
    const newLikedBook = new LikedBook({ userId, bookId, title, authors, imageUrl, description, formats });
    await newLikedBook.save();
    user.likedBooks.push(newLikedBook._id);
    await user.save();
    res.json({ message: "Book liked successfully", likedBook: newLikedBook });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to like book" });
  }
});

app.get("/user/liked-book-ids", authenticateToken, async (req, res) => {
  try {
    const likedBooks = await LikedBook.find({ userId: req.user._id }).select("bookId");
    const likedBookIds = likedBooks.map(book => String(book.bookId));
    res.json({ likedBookIds });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch liked book IDs" });
  }
});

app.get("/users/:userId/liked-books", authenticateToken, async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await UserModel.findById(userId).populate("likedBooks");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ likedBooks: user.likedBooks });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch liked books" });
  }
});

app.delete("/like-book/:id", authenticateToken, async (req, res) => {
  const bookId = req.params.id;
  const userId = req.user._id;
  try {
    const user = await UserModel.findById(userId);
    if (!user) return res.json({ error: "User not found" });
    user.likedBooks = user.likedBooks.filter((likedBookId) => likedBookId.toString() !== bookId);
    await user.save();
    await LikedBook.findByIdAndDelete(bookId);
    res.json({ message: "Liked book deleted successfully" });
  } catch (error) {
    res.json({ error: "Failed to delete liked book" });
  }
});

app.get("/liked-book/:id", async (req, res) => {
  const bookId = req.params.id;
  try {
    const book = await LikedBook.findById(bookId);
    if (!book) return res.json({ error: "Book not found" });
    res.json({ book });
  } catch (error) {
    res.json({ error: "Failed to load book details" });
  }
});





const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.static(path.join(__dirname, "../client/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
