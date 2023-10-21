const express = require("express");
const { Server } = require("socket.io");
const app = express();
app.use(express.json());
const http = require("http");
const cors = require("cors");
app.use(cors());
const bcrypt = require("bcrypt");
const saltRounds = 10;
const short = require("shortid");

const server = http.createServer(app);

const db = require("./_helpers/db");
const groupChat = db.GroupChat;
const users = db.Users;
const groups = db.Groups;

const io = new Server(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  socket.on("joinRoom", async (roomId) => {
    socket.join(roomId);

    try {
      // Retrieve entire message history from the database for the specific room
      const messages = await groupChat.find({ roomId });
      socket.emit("messageHistory", messages);
    } catch (error) {
      console.error("Error fetching message history:", error);
    }
  });
});

io.on("disconnect", (socket) => {
  console.log("User disconnected", stream.id);
});

app.post("/api/sendMessage", async (req, res) => {
  const { roomId, message, senderId } = req.body;

  try {
    if (senderId != undefined) {
      const newMessage = {
        roomId,
        message,
        senderId,
        timestamp: Date.now(),
        like: [],
      };

      const chat = new groupChat(newMessage);
      const result = await chat.save();

      // Broadcast the new message to all clients in the same room
      io.to(roomId).emit("message", {
        _id: result._id,
        createdAt: result.createdAt,
        updatedOn: result.updatedOn,
        isActive: true,
        ...newMessage,
      });

      // Send the saved message back in the response
      return res.status(200).json({
        _id: result._id,
        createdAt: result.createdAt,
        updatedOn: result.updatedOn,
        isActive: true,
        ...newMessage,
      });
    }
  } catch (error) {
    console.error("Error saving message:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/createUser", async (req, res) => {
  const { userId, password, firstName, lastName, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const existingUsers = await users.find({ userId: userId });
    if (existingUsers.length == 0) {
      const userInput = {
        userId,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        timestamp: Date.now(),
      };
      const user = new users({ isActive: true, ...userInput });
      const result = await user.save();
      delete userInput.password;
      return res.status(200).json({
        data: {
          _id: result._id,
          createdAt: result.createdAt,
          updatedOn: result.updatedOn,
          isActive: true,
          ...userInput,
        },
        message: `User ${userInput.firstName} created successfully`,
      });
    } else {
      return res
        .status(200)
        .json({ message: `User already exists ${existingUsers[0].userId}` });
    }
  } catch (error) {
    console.error("Error saving message:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/getUserList", async (req, res) => {
  const users = await users.find({}, { password: 0 });
  try {
    return res
      .status(200)
      .json({ data: { ...users }, message: "Users fetched succesfully" });
  } catch (error) {
    console.error("Error saving message:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/login", async (req, res) => {
  const { userId, password } = req.body;

  const existingUser = await users.findOne({ userId: userId });
  if (existingUser) {
    const isPasswordMatch = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (isPasswordMatch) {
      res
        .status(200)
        .json({ message: "Login successful!", user: existingUser });
    } else {
      res.status(401).json({ message: "Invalid username or password" });
    }
  } else {
    res.status(401).json({ message: "Invalid username or password" });
  }
});

// Groups

app.post("/api/createGroup", async (req, res) => {
  const { groupName, creatorId, participants } = req.body;

  const groupInput = {
    roomId: short.generate(),
    groupName,
    participants,
    creatorId,
    timestamp: Date.now(),
    isActive: true,
  };
  const group = new groups({ ...groupInput });
  const result = await group.save();
  io.emit("groupCreated", {
    _id: result._id,
    createdAt: result.createdAt,
    updatedOn: result.updatedOn,
    isActive: true,
    ...groupInput,
  });
  return res.status(200).json({
    data: {
      _id: result._id,
      createdAt: result.createdAt,
      updatedOn: result.updatedOn,
      isActive: true,
      ...groupInput,
    },
    message: `Group ${groupInput.groupName} created successfully`,
  });
});

app.get("/api/getGroupList/:groupId", async (req, res) => {
  const roomId = req.params.groupId;
  var groupList = [];
  if (roomId == 0) {
    groupList = await groups.find();
  } else {
    groupList = await groups.find({ participants: { $in: [roomId] } });
  }

  return res.status(200).json({
    data: groupList,
    message: "Group list fetched successfully",
  });
});

app.get("/api/getGroupList/:groupId", async (req, res) => {
  const roomId = req.params.groupId;
  var groupList = [];
  if (roomId == 0) {
    groupList = await groups.find();
  } else {
    groupList = await groups.find({ participants: { $in: [roomId] } });
  }

  return res.status(200).json({
    data: groupList,
    message: "Group list fetched successfully",
  });
});

app.get("/api/getGroupListForUser/:userId", async (req, res) => {
  const userId = req.params.userId;

  const groupList = await groups.find({ participants: { $in: [userId] } });

  return res.status(200).json({
    data: groupList,
    message: "Group list fetched successfully",
  });
});


//add participant in group or remove
app.patch("/api/addParticipants", async (req, res) => {
  const { participants, roomId, add } = req.body; // Assuming emails is an array of email addresses sent in the request body

  try {
    // Find the group by roomId and update the participants array with the new emails
    var query;
    if (add)
      query = {
        $push: { participants: { $each: participants } },
        timestamp: Date.now(),
      };
    else query = { $pull: { participants: { $in: participants } } , timestamp: Date.now()};
    const updatedGroup = await groups.findOneAndUpdate(
      { roomId: roomId },
      query, // $each allows pushing multiple values
      { new: true } // To return the updated document
    );

    if (updatedGroup) {
      res.json(updatedGroup);
    } else {
      res.status(404).json({ message: "Group not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//delete group
app.delete("/api/deleteGroup/:roomId", async (req, res) => {
  const roomId = req.params.roomId;

  try {
    // Find the group by roomId and remove it from the database
    const deletedGroup = await groups.findOneAndDelete({ roomId: roomId });

    if (deletedGroup) {
      res.json({ message: "Group deleted successfully", deletedGroup });
    } else {
      res.status(404).json({ message: "Group not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

server.listen(4001, () => {
  console.log("server started at 4001");
});
