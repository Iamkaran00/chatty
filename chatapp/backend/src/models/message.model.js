import mongoose from "mongoose";
const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
    video: {
      type: String,
    },
    isSeen: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    reactions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        emoji: String,
      },
    ],
    audio: {
      type: String,
      default: null,
    },
    gif : {
        type : String,
        default : null
    },
    gameRoomId : {
      type : String,default : null,
    },
    gamePlayed : {
      type : Boolean,
      default : false,
    }
  },

  {
    timestamps: true,
  },
);
export const Message = mongoose.model("Message", messageSchema);
