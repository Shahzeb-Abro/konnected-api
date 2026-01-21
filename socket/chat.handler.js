import Message from "../models/message.model.js";

export default (io, socket) => {
  const sendPrivateMessage = async ({ toUserId, message }) => {
    const userId = socket.user.id;

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

  const deleteMessageForEveryone = async ({ messageId, toUserId }) => {
    try {
      const message = await Message.findById(messageId);
      const messageAge = Date.now() - new Date(message.createdAt).getTime();
      const MAX_DELETION_TIME = 60 * 60 * 1000; // 1 hour
      if (!message || message.sender.toString() !== socket.user.id) return;

      if (messageAge > MAX_DELETION_TIME)
        return socket.emit("error", {
          message: "Cannot delete message after 1 hour of sending",
        });

      // DB update
      message.content = "This message was deleted";
      message.deletedForEveryone = true;
      await message.save();

      io.to(toUserId).to(socket.user.id).emit("message_deleted_for_everyone", {
        messageId,
      });
    } catch (error) {
      console.error("Error deleting message for everyone: ", { error });
    }
  };

  const deleteMessageForMe = async ({ messageId }) => {
    try {
      await Message.findByIdAndUpdate(messageId, {
        $addToSet: { deletedBy: socket.user.id },
      });

      socket.emit("message_deleted_for_me", { messageId });
    } catch (error) {
      console.error("Error deleting message for me: ", { error });
    }
  };

  const onTypingStart = ({ toUserId }) => {
    socket.to(toUserId).emit("typing_start", { from: socket.user.id });
  };

  const onTypingStop = ({ toUserId }) => {
    socket.to(toUserId).emit("typing_stop", { from: socket.user.id });
  };

  const editMessage = async ({ messageId, newContent, toUserId }) => {
    try {
      const userId = socket.user.id;
      const message = await Message.findById(messageId);
      if (!message) return;

      if (message.sender.toString() !== userId)
        return socket.emit("error", {
          message: "You can only edit your own messages",
        });

      message.content = newContent;
      message.isEdited = true;
      await message.save();

      io.to(toUserId).to(userId).emit("message_edited", {
        messageId,
        newContent,
        updatedAt: message.updatedAt,
      });
    } catch (error) {
      console.error("Error editing message: ", { error });
    }
  };

  const markAsRead = async ({ senderId }) => {
    const userId = socket.user.id;

    try {
      await Message.updateMany(
        { sender: senderId, receiver: userId, seen: false },
        { $set: { seen: true, seenAt: new Date() } },
      );

      io.to(senderId).emit("messages_read", { readerId: userId });
    } catch (error) {
      console.error("Error marking messages as read: ", { error });
    }
  };

  socket.on("private_message", sendPrivateMessage);
  socket.on("typing_start", onTypingStart);
  socket.on("typing_stop", onTypingStop);
  socket.on("delete_message_for_everyone", deleteMessageForEveryone);
  socket.on("delete_message_for_me", deleteMessageForMe);
  socket.on("edit_message", editMessage);
  socket.on("mark_as_read", markAsRead);
};
