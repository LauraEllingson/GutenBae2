import dotenv from "dotenv";
dotenv.config();
// Compatibility shim for Node versions where SlowBuffer is not exposed the same way
// Some older packages expect require('buffer').SlowBuffer to exist. If it's missing
// define it as an alias to Buffer so those packages don't crash on import.
import { Buffer as NodeBuffer } from 'buffer';
if (!NodeBuffer.SlowBuffer) {
  NodeBuffer.SlowBuffer = NodeBuffer;
}
// Fail-fast if required environment variables are missing (helps catch config issues early)
const requiredEnv = ["MONGO_URI", "JWT_ACCESS_SECRET"];
const missing = requiredEnv.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(", ")}. Please set them in server/.env or your environment.`);
  process.exit(1);
}
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import UserModel from "./models/User.js";
// jsonwebtoken can pull in packages that assume SlowBuffer exists. We import it
// dynamically after ensuring the compatibility shim above is applied.
const jwtModule = await import('jsonwebtoken');
const jwt = jwtModule.default || jwtModule;
import LikedBook from './models/LikedBooks.js';
import Review from "./models/Review.js";



const app = express();
app.use(express.json());
app.use(cors({
  origin: ["https://gutenbae2.onrender.com", "http://localhost:5173"],
  credentials: true
}));

// Create HTTP server and attach socket.io for real-time events
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ["https://gutenbae2.onrender.com", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
});

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
  let authHeader = req.header("Authorization") || req.header('authorization');
  if (!authHeader) return res.status(401).json({ error: "Access denied" });
  // Accept either 'Bearer <token>' or just the token
  const parts = authHeader.split(" ");
  const token = parts.length === 1 ? parts[0] : parts[1];
  if (!token) return res.status(401).json({ error: "Access denied" });
  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = decoded;
    next();
  });
};

app.post("/verify-token", authenticateToken, async (req, res) => {
  try {
    // req.user currently contains the decoded JWT payload (id + name). Return the full user record
    const user = await UserModel.findById(req.user._id).select("name email").lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: { _id: user._id, name: user.name, email: user.email } });
  } catch (e) {
    console.error('verify-token lookup failed', e);
    res.status(500).json({ error: 'Failed to verify token' });
  }
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
    // validate paragraph count (max 3 paragraphs)
    const textStr = (text || "").toString().trim();
    const paragraphs = textStr.length === 0 ? 0 : textStr.split(/\n\s*\n/).filter(Boolean).length;
    if (paragraphs > 3) {
      return res.status(400).json({ message: "Review may contain at most 3 paragraphs." });
    }
    const review = await Review.create({
      bookId: numericBookId,
      userId: req.user._id,
      userName: req.user.name || "",
      rating: numericRating,
      text: (text || "").toString().trim(),
    });
    // Emit real-time event for the new review so connected clients can update
    try { io.emit('review-updated', { bookId: numericBookId, review }); } catch (e) { console.error('Socket emit failed', e); }
    res.status(201).json({ review });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ message: "You already reviewed this book." });
    }
    res.status(500).json({ message: "Failed to create review" });
  }
});

// PUT /reviews/:id (auth) - update a review (only owner)
app.put("/reviews/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, text } = req.body;
    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: "rating must be between 1 and 5" });
    }
    // validate paragraph count (max 3 paragraphs)
    const textStr = (text || "").toString().trim();
    const paragraphs = textStr.length === 0 ? 0 : textStr.split(/\n\s*\n/).filter(Boolean).length;
    if (paragraphs > 3) {
      return res.status(400).json({ message: "Review may contain at most 3 paragraphs." });
    }
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    if (review.userId.toString() !== req.user._id) return res.status(403).json({ message: "Forbidden" });
    review.rating = numericRating;
    review.text = (text || "").toString().trim();
    await review.save();
    // Emit real-time event for updated review
    try { io.emit('review-updated', { bookId: review.bookId, review }); } catch (e) { console.error('Socket emit failed', e); }
    res.json({ review });
  } catch (e) {
    res.status(500).json({ message: "Failed to update review" });
  }
});

// DELETE /reviews/:id (auth) - delete a review (only owner)
app.delete("/reviews/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    if (review.userId.toString() !== req.user._id) return res.status(403).json({ message: "Forbidden" });
    const bookId = review.bookId;
    await Review.findByIdAndDelete(id);
    // Emit real-time event for deleted review
    try { io.emit('review-deleted', { bookId, reviewId: id }); } catch (e) { console.error('Socket emit failed', e); }
    res.json({ message: "Review deleted" });
  } catch (e) {
    res.status(500).json({ message: "Failed to delete review" });
  }
});

// GET /users/:userId/reviews (auth) - get all reviews by a user
app.get("/users/:userId/reviews", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
  // ensure the requester is the same user (or allow admins in future)
  const requesterId = String(req.user._id || req.user.id || req.user._id);
  if (requesterId !== String(userId)) return res.status(403).json({ message: "Forbidden" });
    const reviews = await Review.find({ userId }).lean();
    res.json({ reviews });
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch user reviews" });
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

// DELETE /users/:id (auth) - delete a user account and cascade delete their data
app.delete("/users/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
  // only allow users to delete their own account
  if (String(req.user._id) !== String(id)) return res.status(403).json({ message: "Forbidden" });

    const user = await UserModel.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // delete liked books belonging to this user
    try {
      await LikedBook.deleteMany({ userId: user._id });
    } catch (e) {
      console.error('Failed to delete liked books for user', e);
    }

    // find and delete reviews authored by this user; emit deleted events
    try {
      const userReviews = await Review.find({ userId: user._id }).lean();
      const reviewIds = userReviews.map((r) => r._id);
      await Review.deleteMany({ userId: user._id });
      // emit review-deleted events for each deleted review so public pages update
      try {
        userReviews.forEach((r) => {
          io.emit('review-deleted', { bookId: r.bookId, reviewId: r._id });
        });
      } catch (e) {
        console.error('Failed to emit review-deleted events', e);
      }
    } catch (e) {
      console.error('Failed to delete user reviews', e);
    }

    // finally delete the user
    await UserModel.findByIdAndDelete(id);

    res.json({ message: 'User account and related data deleted' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// POST /users/:id/change-password (auth) - allow users to change their current password
app.post("/users/:id/change-password", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Both current and new passwords are required.' });
    // only allow users to change their own password
    if (String(req.user._id) !== String(id)) return res.status(403).json({ message: 'Forbidden' });
    const user = await UserModel.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });
    // basic validation for new password length
    if (typeof newPassword !== 'string' || newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (e) {
    console.error('Failed to change password', e);
    res.status(500).json({ message: 'Failed to change password' });
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

// Health endpoint to check server and MongoDB connection state
app.get('/health', (req, res) => {
  const readyState = mongoose.connection.readyState; // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({ status: 'ok', mongo: { readyState, state: states[readyState] || 'unknown' } });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Server (with sockets) running on port ${PORT}`));
