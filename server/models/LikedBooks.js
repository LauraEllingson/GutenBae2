import mongoose from 'mongoose';
const LikedBookSchema = new mongoose.Schema(
  {
    bookId: { type: String, required: true },
    title: { type: String, required: true },
    authors: { type: [String], required: true },
    imageUrl: { type: String, required: true },
    description: { type: String, required: true },
    formats: {
      type: Map,
      of: String,
      default: {},
    }
  },
  { timestamps: true }
);

const LikedBook = mongoose.model('LikedBook', LikedBookSchema);

export default LikedBook; // Default export
