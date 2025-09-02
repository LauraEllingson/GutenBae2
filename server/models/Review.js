import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    bookId: { type: Number, required: true, index: true }, // Gutendex book ID
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userName: { type: String }, // optional, for display
    rating: { type: Number, min: 1, max: 5, required: true },
    text: { type: String, default: "" },
  },
  { timestamps: true }
);

// one review per user per book
ReviewSchema.index({ bookId: 1, userId: 1 }, { unique: true });

const Review = mongoose.model("Review", ReviewSchema);
export default Review;
