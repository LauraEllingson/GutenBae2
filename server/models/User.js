import mongoose from 'mongoose';
import LikedBook from './LikedBook.js'; // Import the LikedBook model

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  likedBooks: [{ type: mongoose.Schema.Types.ObjectId, ref: "LikedBook" }], // Reference to the liked books
});

const UserModel = mongoose.model('User', userSchema); // 'users' is the collection name in MongoDB
export default UserModel;
