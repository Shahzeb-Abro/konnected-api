import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import registerChatHandler from "./chat.handler.js";

export const initSocket = (server, pubClient, subClient) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.adapter(createAdapter(pubClient, subClient));

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId) socket.join(userId);

    console.log(`User ${userId} connected via socket ${socket.id}`);

    // Register chat event handlers
    registerChatHandler(io, socket);

    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected from socket ${socket.id}`);
    });

    return io;
  });
};
