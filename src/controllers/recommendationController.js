const asyncHandler = require("express-async-handler");
const { getRecommendationsForUser } = require("../services/recommendationService");

// @route GET /api/recommendations
const getRecommendations = asyncHandler(async (req, res) => {
  const recommendations = await getRecommendationsForUser(req.user._id);
  res.json({ success: true, data: recommendations });
});

module.exports = { getRecommendations };
