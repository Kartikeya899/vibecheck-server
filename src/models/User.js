const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    savedPlaces: [{ type: mongoose.Schema.Types.ObjectId, ref: "Place" }],
    preferences: {
      categories: [{ type: String }],
      priceRange: { type: String, enum: ["$", "$$", "$$$", "$$$$"] },
    },
    refreshToken: { type: String, default: null },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    preferences: this.preferences,
  };
};

module.exports = mongoose.model("User", userSchema);
