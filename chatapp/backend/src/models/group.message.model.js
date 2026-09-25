import mongoose from "mongoose";
const groupMessageSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String },
    image: { type: String },
    video: { type: String },
    audio: { type: String, default: null },
    gif: { type: String, default: null },
    isDeleted: { type: Boolean, default: false },
    reactions: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, emoji: String }],
  },
  { timestamps: true }
);

export const GroupMessage = mongoose.model("GroupMessage", groupMessageSchema);