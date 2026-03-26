import mongoose from "mongoose";

const whiteboardSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    canvasData: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

export const Whiteboard = mongoose.model("Whiteboard", whiteboardSchema);