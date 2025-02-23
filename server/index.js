import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import UserModel from "./models/User.js";

const app = express();
app.use(express.json());
app.use(cors());

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
    return res.json({ error: "User not found" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.json({ error: "Wrong password" });
  }

  res.json({ message: "Login successful" });
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
