const mongoose = require("mongoose");

const groupChatModel = mongoose.Schema(
  {
    roomId: {
      type: String,
    },
    message: { type: String },
    senderId: { type: String },
    like: { type: [String] },
    timestamp: {
      type: Number,
    },
    isActive:{type:Boolean}
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("GroupChat", groupChatModel);
