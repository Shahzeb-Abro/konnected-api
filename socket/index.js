import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import registerChatHandler from "./chat.handler.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const initSocket = (server, pubClient, subClient, redisClient) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.adapter(createAdapter(pubClient, subClient));

  io.use((socket, next) => {
    const token = socket.handshake.headers.token;
    if (!token) return next(new Error("Cannot authenticate socket connection"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.user.id;

    await redisClient.set(`online_status:${userId}`, "online");
    await User.findByIdAndUpdate(userId, { isOnline: true });

    if (userId) socket.join(userId);

    console.log(
      `User ${userId}: ${socket?.user?.name} connected via socket ${socket.id}`,
    );

    // Register chat event handlers
    registerChatHandler(io, socket);

    socket.on("disconnect", async () => {
      console.log(`User ${userId} disconnected from socket ${socket.id}`);

      const now = new Date();
      await redisClient.del(`online_status:${userId}`);
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: now });
      socket.broadcast.emit("user_status_change", {
        userId,
        isOnline: false,
        lastSeen: now,
      });
    });
  });

  return io;
};
