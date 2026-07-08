const asyncHandler = require("express-async-handler");
const Review = require("../models/Review");
const Place = require("../models/Place");

// Recalculate a place's avgRating and reviewCount from its reviews
const recomputePlaceRating = async (placeId) => {
  const stats = await Review.aggregate([
    { $match: { place: placeId } },
    { $group: { _id: "$place", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const update = stats.length
    ? { avgRating: Math.round(stats[0].avgRating * 10) / 10, reviewCount: stats[0].count }
    : { avgRating: 0, reviewCount: 0 };

  await Place.findByIdAndUpdate(placeId, update);
};

// @route GET /api/places/:placeId/reviews
const getReviewsForPlace = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ place: req.params.placeId })
    .populate("user", "name")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: reviews });
});

// @route POST /api/places/:placeId/reviews
const createReview = asyncHandler(async (req, res) => {
  const { rating, text } = req.body;
  const { placeId } = req.params;

  if (!rating) {
    res.status(400);
    throw new Error("Rating is required");
  }

  const place = await Place.findById(placeId);
  if (!place) {
    res.status(404);
    throw new Error("Place not found");
  }

  const existing = await Review.findOne({ user: req.user._id, place: placeId });
  if (existing) {
    res.status(409);
    throw new Error("You have already reviewed this place");
  }

  const review = await Review.create({
    user: req.user._id,
    place: placeId,
    rating,
    text,
  });

  await recomputePlaceRating(place._id);

  res.status(201).json({ success: true, data: review });
});

// @route PUT /api/reviews/:id
const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  if (review.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to edit this review");
  }

  const { rating, text } = req.body;
  if (rating) review.rating = rating;
  if (text !== undefined) review.text = text;
  await review.save();

  await recomputePlaceRating(review.place);

  res.json({ success: true, data: review });
});

// @route DELETE /api/reviews/:id
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  const isOwner = review.user.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to delete this review");
  }

  const placeId = review.place;
  await review.deleteOne();
  await recomputePlaceRating(placeId);

  res.json({ success: true, message: "Review deleted" });
});

module.exports = { getReviewsForPlace, createReview, updateReview, deleteReview };
