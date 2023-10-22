const mongoose = require("mongoose");
const connectionOptions = {
  dbName: `GroupChat`,
};
mongoose.connect(process.env.DB_CRED, connectionOptions);
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
