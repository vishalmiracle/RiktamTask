const { Server }= require('socket.io');
const io = new Server(
    {
        cors: {
        origin: '*',
      }
    }
);
const db = require("./../_helpers/db");

var Socket = {
    emit: function (event, room, data) {
        // console.log(event, data);
        io.sockets.in(room).emit(event, data);
    },
    // to:function (room){}
};

io.on("connection", (socket) => {
    socket.on("joinRoom", async (roomId) => {
      socket.join(roomId);
  
      try {
        // Retrieve entire message history from the database for the specific room
        const messages = await db.GroupChat.find({ roomId })
        // console.log(roomId, messages);
        socket.emit("messageHistory", messages);
      } catch (error) {
        console.error("Error fetching message history:", error);
      }
    });
  });
  
  io.on("disconnect", (socket) => {
    console.log("User disconnected", stream.id);
  });

exports.Socket = Socket;
exports.io = io;