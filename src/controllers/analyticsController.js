const asyncHandler = require("express-async-handler");
const Place = require("../models/Place");
const Review = require("../models/Review");
const User = require("../models/User");

// @route GET /api/analytics/overview
// Admin-only dashboard summary
const getOverview = asyncHandler(async (req, res) => {
  const [totalPlaces, totalReviews, totalUsers, topPlaces, categoryBreakdown] = await Promise.all([
    Place.countDocuments(),
    Review.countDocuments(),
    User.countDocuments(),
    Place.find().sort({ avgRating: -1 }).limit(5).select("name avgRating reviewCount category"),
    Place.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
  ]);

  res.json({
    success: true,
    data: {
      totals: { totalPlaces, totalReviews, totalUsers },
      topPlaces,
      categoryBreakdown,
    },
  });
});

// @route GET /api/analytics/reviews-over-time?days=30
const getReviewsOverTime = asyncHandler(async (req, res) => {
  const days = Number(req.query.days) || 30;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const trend = await Review.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({ success: true, data: trend });
});

module.exports = { getOverview, getReviewsOverTime };
