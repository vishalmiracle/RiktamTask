const mongoose = require("mongoose");
const connectionOptions = {
  dbName: `GroupChat`,
};
mongoose.connect("mongodb+srv://user1:user1@cluster0.b7yothp.mongodb.net/", connectionOptions);
mongoose.Promise = global.Promise;

module.exports = {

  GroupChat:require("../models/groupChat.model"),
  Users:require("../models/user.model"),
  Groups:require("../models/group.model"),
  isValidId,
};

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}
