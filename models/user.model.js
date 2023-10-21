const mongoose = require("mongoose");

const userModel = mongoose.Schema(
  {
    firstName: { type: String },
    lastName: { type: String },
    userId: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true, },
    timestamp: {
      type: Number,
    },
    isActive: { type: Boolean },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Users", userModel);
