const mongoose = require("mongoose");

const placeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: {
      type: String,
      required: true,
      enum: ["restaurant", "cafe", "travel", "nightlife", "outdoor", "other"],
    },
    location: {
      address: { type: String },
      city: { type: String },
      country: { type: String },
      lat: { type: Number },
      lng: { type: Number },
    },
    tags: [{ type: String, trim: true }],
    images: [{ type: String }],
    avgRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

placeSchema.index({ name: "text", description: "text", tags: "text" });
placeSchema.index({ "location.lat": 1, "location.lng": 1 });

module.exports = mongoose.model("Place", placeSchema);
