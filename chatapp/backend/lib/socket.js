import { Server } from "socket.io";
import http from 'http';
import setupRaceHandlers from "../src/game/game1/racehandler.js";
import express from 'express';
import { Whiteboard } from "../src/models/whiteboard.model.js";
import { Message } from "../src/models/message.model.js";
import { Group } from "../src/models/group.model.js";
import { GroupMessage } from "../src/models/group.message.model.js";
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173'],
    credentials: true,
  }
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

const userSocketMap = {};
const lastseenMap = {};

export function lastlogin(id) {
  return lastseenMap[id] || null;
}

const roomPresence = {};

// Per-room debounce timers for DB saves
const boardSyncTimers = {};

io.on("connection", socket => {
  console.log("user got connected", socket.id);
  const userId = socket.handshake.query.userId;
  socket.userId = userId;

  if (!userId) {
    console.warn("socket connected without userId");
    return;
  }

  userSocketMap[userId] = socket.id;
  Group.find({ members: userId }).then((groups) => {
  groups.forEach((g) => socket.join(g._id.toString()));
});
socket.on('group:joinRoom', ({groupId}) => {
  socket.join(groupId.toString());
})
socket.on('group:leaveRoom',({groupId}) => {
  socket.leave(groupId.toString());
})
socket.on("group:react", async ({ messageId, emoji, groupId }) => {
  try {
    const msg = await GroupMessage.findById(messageId);
    if (!msg) return;
    const existing = msg.reactions.find((r) => r.userId.toString() === userId);
    if (existing) existing.emoji = emoji;
    else msg.reactions.push({ userId, emoji });
    await msg.save();
    io.to(groupId).emit("group:reactionUpdate", { messageId, reactions: msg.reactions });
  } catch (e) { console.log("group react error", e); }
});


  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  setupRaceHandlers(io, socket, getReceiverSocketId);

  socket.on('disconnect', () => {
    console.log("user got disconnected", socket.id);
    lastseenMap[userId] = Date.now();
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    for (const roomId of socket.rooms) {
      if (!roomPresence[roomId]) continue;
      const user = roomPresence[roomId].get(userId);
      roomPresence[roomId].delete(userId);

      socket.to(roomId).emit("whiteboard:userLeft", {
        userId,
        name: user?.name || "Someone",
        profilePic: user?.profilePic || null,
        users: Array.from(roomPresence[roomId].values()),
      });
    }
  });
  socket.on("markAsSeen", async ({ senderId, receiverId }) => {
    try {
      await Message.updateMany(
        { senderId, receiverId, isSeen: false },
        { $set: { isSeen: true } }
      );
      const senderSocketId = userSocketMap[senderId];
      const receiverSocketId = userSocketMap[receiverId];
      if (senderSocketId) io.to(senderSocketId).emit("messagesSeen", { senderId, receiverId });
      if (receiverSocketId) io.to(receiverSocketId).emit("messagesSeen", { senderId, receiverId });
    } catch (error) {
      console.log("markAsSeen error", error);
    }
  });

  socket.on("typing", ({ senderId, receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) io.to(receiverSocketId).emit("userTyping", senderId);
  });

  socket.on('stopTyping', ({ senderId, receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) io.to(receiverSocketId).emit('userStopTyping', senderId);
  });

  socket.on("reactMessage", async ({ messageId, emoji, userId }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) return;
      const existing = message.reactions.find(r => r.userId.toString() === userId);
      if (existing) {
        existing.emoji = emoji;
      } else {
        message.reactions.push({ userId, emoji });
      }
      await message.save();
      const senderSocketId = userSocketMap[message.senderId];
      const receiverSocketId = userSocketMap[message.receiverId];
      if (senderSocketId) io.to(senderSocketId).emit("messageReactionUpdate", { messageId: message._id, reactions: message.reactions });
      if (receiverSocketId) io.to(receiverSocketId).emit("messageReactionUpdate", { messageId: message._id, reactions: message.reactions });
    } catch (error) {
      console.log("reaction error", error);
    }
  });

  // ─── WHITEBOARD INVITE ────────────────────────────────────────
  socket.on("sendWhiteboardInvite", ({ senderId, receiverIds }) => {
    const roomId = "wb_" + Date.now();
    console.log("ROOM CREATED:", roomId);
    receiverIds.forEach((id) => {
      const receiverSocketId = userSocketMap[id];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("whiteboardInvite", { roomId, senderId });
      }
    });
    socket.emit("whiteboardCreated", { roomId });
  });

  // ─── WHITEBOARD JOIN + LOAD ───────────────────────────────────
  socket.on("whiteboard:join", async ({ roomId, name, profilePic }) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} (${name}) joined room ${roomId}`);

    // Track presence
    if (!roomPresence[roomId]) roomPresence[roomId] = new Map();
    roomPresence[roomId].set(userId, { userId, name, profilePic });

    // Notify others that this user joined
    socket.to(roomId).emit("whiteboard:userJoined", {
      userId,
      name,
      profilePic,
      users: Array.from(roomPresence[roomId].values()),
    });

    // Send the current presence list to the joining user
    socket.emit("whiteboard:presenceList", Array.from(roomPresence[roomId].values()));

    // Load canvas data
    try {
      const board = await Whiteboard.findOne({ roomId });
      if (board && Array.isArray(board.canvasData)) {
        socket.emit("whiteboard:load", board.canvasData);
      } else {
        await Whiteboard.findOneAndUpdate({ roomId }, { canvasData: [] }, { upsert: true });
        socket.emit("whiteboard:load", []);
      }
    } catch (err) {
      console.log("whiteboard join error", err);
      socket.emit("whiteboard:load", []);
    }
  });

  // ─── WHITEBOARD UPDATE ────────────────────────────────────────
  socket.on("whiteboard:update", ({ roomId, canvasData }) => {
    // Volatile: each update has full state, so dropped packets are harmless
    // — prevents queue build-up that causes jitter/latency
    socket.volatile.to(roomId).emit("whiteboard:receive", canvasData);

    // Debounced DB save
    if (boardSyncTimers[roomId]) clearTimeout(boardSyncTimers[roomId]);
    boardSyncTimers[roomId] = setTimeout(async () => {
      try {
        await Whiteboard.findOneAndUpdate({ roomId }, { canvasData }, { upsert: true });
        console.log(`Board ${roomId} saved to DB`);
      } catch (err) {
        console.log("Whiteboard DB save error:", err);
      }
      delete boardSyncTimers[roomId];
    }, 2000);
  });
  socket.on("whiteboard:leave", ({ roomId }) => {
    if (!roomPresence[roomId]) return;
    const user = roomPresence[roomId].get(userId);
    roomPresence[roomId].delete(userId);
    socket.leave(roomId);

    socket.to(roomId).emit("whiteboard:userLeft", {
      userId,
      name: user?.name || "Someone",
      profilePic: user?.profilePic || null,
      users: Array.from(roomPresence[roomId].values()),
    });
  });
   
  socket.on('cursor:move', (data) => {
 
    socket.volatile.to(data.roomId).emit('cursor:move', {
      ...data,
      userId: socket.userId,
    });
  });


});

export { io, app, server };
