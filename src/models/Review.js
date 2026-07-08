const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    place: { type: mongoose.Schema.Types.ObjectId, ref: "Place", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, trim: true, maxlength: 2000 },
    sentimentScore: { type: Number, default: null }, // optional AI-derived, -1 to 1
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    flagged: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One review per user per place
reviewSchema.index({ user: 1, place: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
