const PrivateMessage = require("./models/privateMessage");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");

// --- NEW: Import 'http' and 'socket.io' ---
const http = require("http");
const { Server } = require("socket.io");
const Message = require("./models/Message");

const app = express();

// --- NEW: Create an HTTP server from the Express app ---
const server = http.createServer(app);

// --- NEW: Initialize Socket.IO and configure CORS for it ---
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for simplicity. In production, you'd restrict this.
    methods: ["GET", "POST"],
  },
});

// Connect to Database
connectDB();

// Init Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Define Routes (This remains the same)
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/alumni", require("./routes/alumni"));

// Default route for testing
app.get("/", (req, res) => {
  res.send("API is running...");
});

// // --- FINAL Socket.IO Logic (with Persistence & User Tracking) ---
// const onlineUsers = {};

// io.on("connection", async (socket) => {
//   console.log("✅ A user connected to chat", socket.id);

//   // --- 1. Load and send previous messages to the newly connected user ---
//   try {
//     const messages = await Message.find().sort({ timestamp: 1 }).limit(50); // Get last 50 messages
//     socket.emit("load old messages", messages);
//   } catch (err) {
//     console.error("Error fetching messages:", err);
//   }

//   // --- 2. Handle user connection and online list ---
//   socket.on("user connected", (user) => {
//     onlineUsers[socket.id] = { id: user.userId, name: user.userName };
//     io.emit("update user list", Object.values(onlineUsers));
//   });

//   socket.on("request user info", () => {
//     if (onlineUsers[socket.id]) {
//       io.emit("update user list", Object.values(onlineUsers));
//     }
//   });

//   // --- 3. Handle new chat messages ---
//   socket.on("chat message", async (msg) => {
//     // Create a new message document
//     const newMessage = new Message({
//       senderName: msg.name,
//       text: msg.text,
//     });
//     // Save the message to the database
//     await newMessage.save();
//     // Broadcast the message to all clients
//     io.emit("chat message", { name: msg.name, text: msg.text });
//   });

//   // --- 4. Handle disconnection ---
//   socket.on("disconnect", () => {
//     console.log("❌ User disconnected from chat", socket.id);
//     delete onlineUsers[socket.id];
//     io.emit("update user list", Object.values(onlineUsers));
//   });
// });

// --- FINAL Socket.IO Logic (with Persistence & Reliable User Tracking) ---
// const onlineUsers = {};
// // const Message = require('./models/Message');

// io.on('connection', async (socket) => {
//     console.log('✅ A user connected to chat', socket.id);

//     // Function to broadcast the updated user list to everyone
//     const updateUserList = () => {
//         io.emit('update user list', Object.values(onlineUsers));
//     };

//     // Load and send previous messages to the newly connected user
//     try {
//         const messages = await Message.find().sort({ timestamp: 1 }).limit(50);
//         socket.emit('load old messages', messages);
//     } catch (err) {
//         console.error('Error fetching messages:', err);
//     }

//     // When a user provides their info after connecting
//     socket.on('user connected', (user) => {
//         onlineUsers[socket.id] = { id: user.userId, name: user.userName };
//         updateUserList(); // Send the updated list
//     });

//     // Handle new chat messages
//     socket.on('chat message', async (msg) => {
//         const newMessage = new Message({ senderName: msg.name, text: msg.text });
//         await newMessage.save();
//         io.emit('chat message', { name: msg.name, text: msg.text });
//     });

//     // Handle disconnection
//     socket.on('disconnect', () => {
//         console.log('❌ User disconnected from chat', socket.id);
//         delete onlineUsers[socket.id];
//         updateUserList(); // Send the updated list
//     });
// });
// --- FINAL Socket.IO Logic (with Private Chat Persistence) ---
const onlineUsers = {};
// const Message = require("./models/Message");
// const PrivateMessage = require("./models/PrivateMessage"); // Make sure this is required

io.on("connection", async (socket) => {
  console.log("✅ A user connected to chat", socket.id);

  const updateUserList = () =>
    io.emit("update user list", Object.values(onlineUsers));

  // Load old GLOBAL messages for the global chat
  try {
    const messages = await Message.find().sort({ timestamp: 1 }).limit(50);
    socket.emit("load old messages", messages);
  } catch (err) {
    console.error("Error fetching global messages:", err);
  }

  // Handle user connection
  socket.on("user connected", (user) => {
    onlineUsers[socket.id] = { id: user.userId, name: user.userName };
    updateUserList();
  });

  // Handle Global chat messages
  socket.on("chat message", async (msg) => {
    const newMessage = new Message({ senderName: msg.name, text: msg.text });
    await newMessage.save();
    io.emit("chat message", { name: msg.name, text: msg.text });
  });

  // --- NEW: Load Private Chat History ---
  socket.on("load private history", async ({ userId, partnerId }) => {
    try {
      const history = await PrivateMessage.find({
        $or: [
          { from: userId, to: partnerId },
          { from: partnerId, to: userId },
        ],
      }).sort({ timestamp: 1 });
      socket.emit("private history loaded", { partnerId, history });
    } catch (err) {
      console.error("Error fetching private history:", err);
    }
  });

  // --- UPDATED: Handle Private Messages (with saving) ---
  socket.on("private message", async ({ to, text }) => {
    const sender = onlineUsers[socket.id];
    if (!sender) return;

    const newMessage = new PrivateMessage({ from: sender.id, to, text });
    await newMessage.save();

    const messagePayload = {
      from: sender.id,
      to,
      fromName: sender.name,
      text,
      timestamp: newMessage.timestamp,
    };

    let recipientSocketId = Object.keys(onlineUsers).find(
      (sid) => onlineUsers[sid].id === to
    );
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("private message", messagePayload);
    }
    socket.emit("private message", messagePayload);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("❌ User disconnected from chat", socket.id);
    delete onlineUsers[socket.id];
    updateUserList();
  });
});

const PORT = process.env.PORT || 5000;

// --- NEW: Start the server using the 'http' instance, not the 'app' instance ---
server.listen(PORT, () => console.log(`Server started on port ${PORT} `));
