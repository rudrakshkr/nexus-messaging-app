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
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Users joining room after their own room id
  socket.on("setup", (myUserId) => {
    socket.join(myUserId.toString());
    console.log("User joined their personal socket room:", myUserId);
  })

  // Handle incoming live messages
  socket.on("sendMessage", async (data) => {
    const {text, imageUrl, senderMail, receiverId, tempId} = data;

    try {
      const sender = await prisma.users.findUnique({
        where: {email: senderMail}
      })

      if(!sender) return;

      // Find shared room
      let sharedRoom = await prisma.room.findFirst({
        where: {
          type: 'DIRECT',
          AND: [
            { participants: {some: {userId: sender.id } } },
            { participants: {some: {userId: receiverId } } }
          ]
        }
      })

      // If first ever message between both, then create room
      if(!sharedRoom) {
        sharedRoom = await prisma.room.create({
          data: {
            type: 'DIRECT',
            participants: {
              create: [
                {userId: sender.id},
                {userId: receiverId}
              ]
            }
          }
        })
      }
      // Save message to database
      const savedMessage = await prisma.message.create({
        data: {
          text: text || "",
          imageUrl: imageUrl,
          sender: {
            connect: {id: sender.id}
          },
          room: {
            connect: {id: sharedRoom.id}
          }
        }
      });

      const formattedMessage = {
        id: savedMessage.id,
        text: savedMessage.text,
        imageUrl: savedMessage.imageUrl,
        senderEmail: senderMail,
        avatar: sender.avatar,
        tempId: tempId,
        time: new Date(savedMessage.createdAt).toLocaleTimeString('en-US', { 
            hour: 'numeric', minute: '2-digit', hour12: true 
        })
      }

      // Send it live to both receiver and back to sender
      io.to(receiverId.toString()).to(sender.id.toString()).emit("receiveMessage", formattedMessage);

    } catch(err) {
      console.error("Error saving/sending message:", err);
    }
  })
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