require("dotenv").config({path: ".env"});
const express = require("express");
const http = require("http")
const path = require("node:path");
const cors = require("cors");
const indexRouter = require("./routes/indexRouter.js");

const CustomNotFoundError = require('./errors/CustomNotFoundError.js');

const prisma = require("./lib/prisma.js")

const app = express();
app.use(cors());
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.urlencoded({extended: true}));
app.use(express.json());

const frontend_url = process.env.FRONTEND_URL || "http://localhost:5175"

// Initialise socket connection
const {Server} = require('socket.io');
const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 1e8,
  cors: {
    origin: frontend_url,  
    methods: ["GET", "POST"]
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("joinRoom", (roomId) => {
    socket.join(`room_${roomId}`);
    console.log(`User ${socket.id} joined live room ${roomId}`);
  })

  // Users joining room after their own room id
  socket.on("setup", async (myUserId) => {
    socket.join(`user_${myUserId}`);
    
    try {
      const userRooms = await prisma.roomParticipant.findMany({
        where: {userId: parseInt(myUserId)},
        select: {roomId: true}
      })

      userRooms.forEach((participant) => {
        socket.join(`room_${participant.roomId}`);
      })

      console.log(`User ${myUserId} joined personal room and ${userRooms.length} active chats.`);
    } catch(err) {
      console.error("Error joining rooms on setup:", err);
    }
  })

  // Handle incoming live messages
  socket.on("sendMessage", async (data) => {
    const {text, imageUrl, senderEmail, roomId, tempId} = data;

    try {
      const sender = await prisma.users.findUnique({
        where: {email: senderEmail}
      })

      if(!sender) return;

      // Save the message directly to room
      const savedMessage = await prisma.message.create({
        data: {
          text: text || "",
          imageUrl: imageUrl,
          sender: {
            connect: {id: sender.id}
          },
          room: {
            connect: {id: roomId}
          }
        }
      });

      const formattedMessage = {
        id: savedMessage.id,
        text: savedMessage.text,
        imageUrl: savedMessage.imageUrl,
        senderEmail: senderEmail,
        fullname: sender.fullname,
        avatar: sender.avatar,
        tempId: tempId,
        roomId: roomId,
        time: new Date(savedMessage.createdAt).toLocaleTimeString('en-US', { 
            hour: 'numeric', minute: '2-digit', hour12: true 
        })
      }

      // Broadcast to entire room at once
      io.to(`room_${roomId}`).emit("receiveMessage", formattedMessage);

    } catch(err) {
      console.error("Error saving/sending message:", err);
    }
  })

  // Typing indicators
  socket.on("typing", ({roomId, fullname}) => {
    socket.to(`room_${roomId}`).emit("userTyping", {fullname})
  });

  socket.on("stopTyping", ({roomId, fullname}) => {
    socket.to(`room_${roomId}`).emit("userStoppedTyping", {fullname});
  });

  // Disconnect
  socket.on("disconnect", () => console.log(`User disconnected: ${socket.id}`));
})

const assetsPath = path.join(__dirname, "public");
app.use(express.static(assetsPath));

app.use("/", indexRouter);

app.use((err, req, res, next) => {
  if (!(err instanceof CustomNotFoundError)) {
    console.error(err);
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).send(`${err.name}: ${err.message}`);
});

server.listen(3000, (error) => {
    if(error) {
        throw error;
    }
    console.log("Listening on PORT 3000");
})