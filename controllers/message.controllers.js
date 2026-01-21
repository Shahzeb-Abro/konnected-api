import mongoose from "mongoose";
import { catchAsync } from "../utils/catchAsync.js";
import { supabase } from "../utils/supabase.js";
import Attachment from "../models/attachment.model.js";
import Message from "../models/message.model.js";

export const sendMediaMessage = catchAsync(async (req, res, next) => {
  const { toUserId, content } = req.body;
  const files = req.files;
  const userId = req.user.id;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const attachmentData = await Promise.all(
      files.map(async (file) => {
        const fileName = `chat/${userId}/${Date.now()}_${file.originalname}`;

        const { data, error } = await supabase.storage
          .from("attachments")
          .upload(fileName, file.buffer, { contentType: file.mimetype });

        if (error) throw error;

        const publicUrl = supabase.storage
          .from("attachments")
          .getPublicUrl(fileName).data.publicUrl;

        return {
          url: publicUrl,
          fileType: file.mimetype.split("/")[0],
          metaData: {
            name: file.originalname,
            size: file.size,
            mimeType: file.mimetype,
          },
        };
      }),
    );

    const savedAttachments = await Attachment.insertMany(attachmentData, {
      session,
    });
    const attachmentIds = savedAttachments.map((att) => att._id);

    const newMessage = await Message.create(
      [
        {
          sender: userId,
          receiver: [toUserId],
          content: content || "",
          attachments: attachmentIds,
          messageType: attachmentIds.length > 0 ? "media" : "text",
        },
      ],
      { session },
    );

    await session.commitTransaction();

    const populatedMessage = await Message.findById(newMessage[0]._id)
      .populate("sender", "name email")
      .populate("attachments", "_id url fileType metaData createdAt");

    const io = req.app.get("socketio");
    io.to(toUserId).emit("private_message", populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
});
