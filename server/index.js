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
import LikedBook from './models/LikedBooks.js'; // Import LikedBook model



const app = express();
app.use(express.json());
app.use(cors());
// Allow requests from frontend
app.use(cors({
  origin: ["https://gutenbae2.onrender.com", "http://localhost:5173"], 
  credentials: true
}));
// MongoDB Connection using environment variable
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

// User Registration
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

// User Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await UserModel.findOne({ email });
  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ error: "Wrong password" });
  }

  // Generate JWT token on successful login
  const token = jwt.sign({ _id: user._id, name: user.name }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "1h",
  });
  

  res.json({ message: "Login successful", token, name: user.name });
});
const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) return res.status(401).json({ error: "Access denied" });

  jwt.verify(token.split(" ")[1], process.env.JWT_ACCESS_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid token" });

    req.user = decoded; // Store decoded token data
    next();
  });
};
app.post("/verify-token", authenticateToken, (req, res) => {
  res.json({ user: req.user });
});
//send liked books to dashboard
app.post("/like-book", authenticateToken, async (req, res) => {
  const { bookId, title, authors, imageUrl, description } = req.body;
  const userId = req.user._id; // Get the userId from the token payload

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the book is already in the likedBooks array
    const bookExists = user.likedBooks.some(book => book.toString() === bookId);
    if (bookExists) {
      return res.status(400).json({ error: "Book already liked" });
    }

    // Create a new LikedBook document
    const newLikedBook = new LikedBook({ bookId, title, authors, imageUrl, description });

    // Save the LikedBook document
    await newLikedBook.save();

    // Add the new LikedBook's _id to the user's likedBooks array
    user.likedBooks.push(newLikedBook._id);
    await user.save();

    res.json({ message: "Book liked successfully", likedBook: newLikedBook });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to like book" });
  }
});



// Route to get the liked books of a user
app.get("/users/:userId/liked-books", authenticateToken, async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await UserModel.findById(userId).populate("likedBooks");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ likedBooks: user.likedBooks });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch liked books" });
  }
});

// delete saved book 
app.delete("/like-book/:id", authenticateToken, async (req, res) => {
  const bookId = req.params.id;
  const userId = req.user._id; // Token must include _id

  try {
    // Find the user by ID
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.json({ error: "User not found" });
    }

    // Remove the liked book's ObjectId from the user's likedBooks array
    user.likedBooks = user.likedBooks.filter(
      (likedBookId) => likedBookId.toString() !== bookId
    );
    await user.save();

    // Delete the liked book document itself
    await LikedBook.findByIdAndDelete(bookId);

    res.json({ message: "Liked book deleted successfully" });
  } catch (error) {
    console.error(error);
    res.json({ error: "Failed to delete liked book" });
  }
});
// get likedbook details to share
app.get("/liked-book/:id", async (req, res) => {
  const bookId = req.params.id;
  
  try {
    const book = await LikedBook.findById(bookId);
    if (!book) {
      return res.json({ error: "Book not found" });
    }
    res.json({ book });
  } catch (error) {
    console.error(error);
    res.json({ error: "Failed to load book details" });
  }
});





// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Serve React static files AFTER API routes
app.use(express.static(path.join(__dirname, "../client/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
});

// Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
