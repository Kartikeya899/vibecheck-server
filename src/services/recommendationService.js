const Review = require("../models/Review");
const Place = require("../models/Place");

/**
 * Step 1: Content-based shortlist.
 * Look at categories/tags the user rated highly (>=4), then find
 * places in those categories the user hasn't reviewed yet.
 */
const getShortlist = async (userId, limit = 15) => {
  const userReviews = await Review.find({ user: userId }).populate("place");

  const likedCategories = new Set();
  const likedTags = new Set();
  const reviewedPlaceIds = new Set();

  userReviews.forEach((r) => {
    reviewedPlaceIds.add(r.place._id.toString());
    if (r.rating >= 4) {
      likedCategories.add(r.place.category);
      (r.place.tags || []).forEach((t) => likedTags.add(t));
    }
  });

  // Cold start: no review history yet, just return top-rated places
  if (likedCategories.size === 0) {
    const topRated = await Place.find({ _id: { $nin: [...reviewedPlaceIds] } })
      .sort({ avgRating: -1 })
      .limit(limit);
    return { candidates: topRated, tasteProfile: null };
  }

  const candidates = await Place.find({
    _id: { $nin: [...reviewedPlaceIds] },
    $or: [
      { category: { $in: [...likedCategories] } },
      { tags: { $in: [...likedTags] } },
    ],
  })
    .sort({ avgRating: -1 })
    .limit(limit);

  return {
    candidates,
    tasteProfile: {
      likedCategories: [...likedCategories],
      likedTags: [...likedTags],
      reviewCount: userReviews.length,
    },
  };
};

/**
 * Step 2: Ask Claude to rank/explain the shortlist given the taste profile.
 * Falls back to the raw shortlist (no explanations) if the API call fails.
 */
const rankWithAI = async (candidates, tasteProfile) => {
  if (!candidates.length) return [];

  // No profile yet (cold start) - just return candidates as-is
  if (!tasteProfile) {
    return candidates.map((p) => ({ place: p, reason: "Popular on VibeCheck" }));
  }

  const candidateSummaries = candidates.map((p) => ({
    id: p._id.toString(),
    name: p.name,
    category: p.category,
    tags: p.tags,
    avgRating: p.avgRating,
  }));

  const prompt = `You are a recommendation engine for a place-discovery app called VibeCheck.

User taste profile:
${JSON.stringify(tasteProfile, null, 2)}

Candidate places:
${JSON.stringify(candidateSummaries, null, 2)}

Rank the top 5 candidates that best match this user's taste. Respond with ONLY a JSON array,
no preamble, no markdown fences, in this exact shape:
[{"id": "<place id>", "reason": "<one sentence, under 15 words>"}]`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    const clean = text.replace(/```json|```/g, "").trim();
    const ranked = JSON.parse(clean);

    const byId = Object.fromEntries(candidates.map((p) => [p._id.toString(), p]));
    return ranked
      .filter((r) => byId[r.id])
      .map((r) => ({ place: byId[r.id], reason: r.reason }));
  } catch (err) {
    console.error("AI ranking failed, falling back to shortlist:", err.message);
    return candidates.slice(0, 5).map((p) => ({ place: p, reason: "Matches your interests" }));
  }
};

const getRecommendationsForUser = async (userId) => {
  const { candidates, tasteProfile } = await getShortlist(userId);
  const ranked = await rankWithAI(candidates, tasteProfile);
  return ranked;
};

module.exports = { getRecommendationsForUser };
