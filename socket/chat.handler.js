import Message from "../models/message.model.js";

export default (io, socket) => {
  const sendPrivateMessage = async ({ toUserId, message }) => {
    const userId = socket.handshake.query.userId;

    try {
      const savedMessage = await Message.create({
        sender: userId,
        receiver: [toUserId],
        content: message,
      });

      io.to(toUserId).emit("private_message", {
        from: userId,
        message,
        _id: savedMessage._id,
        createdAt: savedMessage.createdAt,
      });
    } catch (error) {
      console.error("Error sending private message: ", { error });
    }
  };

  socket.on("private_message", sendPrivateMessage);
};
