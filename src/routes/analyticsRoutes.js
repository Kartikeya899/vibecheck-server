const express = require("express");
const { getOverview, getReviewsOverTime } = require("../controllers/analyticsController");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/overview", protect, requireRole("admin"), getOverview);
router.get("/reviews-over-time", protect, requireRole("admin"), getReviewsOverTime);

module.exports = router;
