const asyncHandler = require("express-async-handler");
const Place = require("../models/Place");

// @route GET /api/places
// Supports ?search=&category=&city=&page=&limit=
const getPlaces = asyncHandler(async (req, res) => {
  const { search, category, city, page = 1, limit = 20 } = req.query;

  const query = {};
  if (search) query.$text = { $search: search };
  if (category) query.category = category;
  if (city) query["location.city"] = new RegExp(city, "i");

  const skip = (Number(page) - 1) * Number(limit);

  const [places, total] = await Promise.all([
    Place.find(query).sort({ avgRating: -1 }).skip(skip).limit(Number(limit)),
    Place.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: places,
    pagination: { page: Number(page), limit: Number(limit), total },
  });
});

// @route GET /api/places/:id
const getPlaceById = asyncHandler(async (req, res) => {
  const place = await Place.findById(req.params.id);
  if (!place) {
    res.status(404);
    throw new Error("Place not found");
  }
  res.json({ success: true, data: place });
});

// @route POST /api/places
const createPlace = asyncHandler(async (req, res) => {
  const { name, description, category, location, tags, images } = req.body;

  if (!name || !category) {
    res.status(400);
    throw new Error("Name and category are required");
  }

  const place = await Place.create({
    name,
    description,
    category,
    location,
    tags,
    images,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: place });
});

// @route PUT /api/places/:id
const updatePlace = asyncHandler(async (req, res) => {
  const place = await Place.findById(req.params.id);
  if (!place) {
    res.status(404);
    throw new Error("Place not found");
  }

  const isOwner = place.createdBy?.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to update this place");
  }

  Object.assign(place, req.body);
  await place.save();

  res.json({ success: true, data: place });
});

// @route DELETE /api/places/:id
const deletePlace = asyncHandler(async (req, res) => {
  const place = await Place.findById(req.params.id);
  if (!place) {
    res.status(404);
    throw new Error("Place not found");
  }

  const isOwner = place.createdBy?.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to delete this place");
  }

  await place.deleteOne();
  res.json({ success: true, message: "Place deleted" });
});

module.exports = { getPlaces, getPlaceById, createPlace, updatePlace, deletePlace };
