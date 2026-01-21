import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],
    content: { type: String, required: true },
    deletedForEveryone: { type: Boolean, default: false },
    deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isEdited: { type: Boolean, default: false },
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Attachment" }],
    messageType: {
      type: String,
      enum: ["text", "media"],
      default: "text",
    },
    seen: { type: Boolean, default: false },
    seenAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
