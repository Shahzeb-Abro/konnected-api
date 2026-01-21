import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    fileType: {
      type: String,
      enum: ["image", "video", "document"],
      required: true,
    },
    publicId: String,
    metaData: {
      name: String,
      size: Number,
      mimeType: String,
    },
  },
  {
    timestamps: true,
  },
);

const Attachment = mongoose.model("Attachment", attachmentSchema);
export default Attachment;
