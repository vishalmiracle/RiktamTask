const mongoose = require("mongoose");

const groupModel = mongoose.Schema(
  {
    roomId: {
      type: String,
    },
    groupName: { type: String },
    creatorId: { type: String },
    participants:{type:[String]},
    timestamp: {
      type: Number,
    },
    isActive:{type:Boolean}
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Group", groupModel);
