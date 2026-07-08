const express = require("express");
const {
  getPlaces,
  getPlaceById,
  createPlace,
  updatePlace,
  deletePlace,
} = require("../controllers/placeController");
const { getReviewsForPlace, createReview } = require("../controllers/reviewController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", getPlaces);
router.get("/:id", getPlaceById);
router.post("/", protect, createPlace);
router.put("/:id", protect, updatePlace);
router.delete("/:id", protect, deletePlace);

// Nested review routes
router.get("/:placeId/reviews", getReviewsForPlace);
router.post("/:placeId/reviews", protect, createReview);

module.exports = router;
