import mongoose from 'mongoose';

const LikedBookSchema = new mongoose.Schema(
  {
    bookId: { type: String, required: true },
    title: { type: String, required: true },
    authors: { type: String, required: true },
    imageUrl: { type: String, required: true },
    description: { type: String, required: true },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

const LikedBook = mongoose.model('LikedBook', LikedBookSchema); // Collection name for liked books
export default LikedBook;

