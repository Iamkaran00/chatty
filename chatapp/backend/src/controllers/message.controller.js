import User from "../models/user.model.js";
import { Message } from "../models/message.model.js";
import cloudinary from "../../lib/cloudinary.js";
import fs from "fs";
import { getReceiverSocketId, io } from "../../lib/socket.js";
export const getUsersForSidebar = async (req, res) => {
  try {

    const loggedInUserId = req.user._id;

    const users = await User.find({
      _id: { $ne: loggedInUserId }
    }).select("-password");

    const usersWithChatInfo = await Promise.all(

      users.map(async (user) => {

        const lastMessage = await Message.findOne({
          $or: [
            { senderId: loggedInUserId, receiverId: user._id },
            { senderId: user._id, receiverId: loggedInUserId }
          ]
        })
          .sort({ createdAt: -1 });

        const unreadCount = await Message.countDocuments({
          senderId: user._id,
          receiverId: loggedInUserId,
          isSeen: false
        });

        return {
          ...user.toObject(),
          lastMessage: lastMessage ? lastMessage.text : "",
          lastMessageTime: lastMessage ? lastMessage.createdAt : null,
          unreadCount
        };

      })

    );

    usersWithChatInfo.sort((a, b) => {

      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;

      return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);

    });

    res.status(200).json(usersWithChatInfo);

  } catch (error) {

    console.log("sidebar error", error);

    res.status(500).json({
      message: "Sidebar error"
    });

  }
};
export const deleteMessage = async (req, res) => {
  try {
    const msgId = req.body.id;
    const message = await Message.findById(msgId);
    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message Not Found"
      });
    }
    message.isDeleted = true;
    await message.save();
    // const deleted = await Message.deleteOne({ _id: msgId });
    const senderSocketId = getReceiverSocketId(message.senderId);
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageDeleted", msgId);

    }
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", msgId);
    }
    res.status(200).json({
      success: true,
      message: 'Message Deleted',
    })

  } catch (error) {
    console.log("hi deleet");
    console.log("An error occurred:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
export const getMessagesFunction = async (req, res) => {
  try {
    //sender is me here 
    const { id: userToChatId } = req.params;
    const senderId = req.user._id;
    const messages = await Message.find({
      $or: [
        {
          senderId: senderId,
          receiverId: userToChatId,
        },
        { senderId: userToChatId, receiverId: senderId },
      ],
    }).sort({ createdAt: 1 })
    return res.status(200).json(messages);
  } catch (error) {
    console.log("Internal Server Error");
    return res.status(500).json({
      success: false,
      message: "error in 2nd function of message controller",
    });
  }
};
export const sendMessageFunction = async (req, res) => {
  try {
    const { text, image, video, audio, gif, whiteboardRoomId } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    let imageUrl;
    if (image) {

      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }
    let vidurl
    if (video) {
      const uploadResponseforVid = await cloudinary.uploader.upload(video, { resource_type: 'video' });
      vidurl = uploadResponseforVid.secure_url;
      console.log(vidurl, 'hi url');
    }
    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      video: vidurl,
      audio,
      gif,
      whiteboardRoomId

    })
    await newMessage.save();
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }
    res.status(201).json(
      newMessage
    )
  } catch (error) {
    console.log('error in sendMessage', error.message);
    res.status(500).json({ error: "internal server error" });
  }
}
export const seenMessage = async (req, res) => {
  try {
    const { senderId } = req.params;
    const receiverId = req.user._id;
    if (!senderId || !receiverId) {
      return res.status(400).json({ message: "Request cannot approve for some reason" })

    }
    console.log("hi kaise hot");
    const result = await Message.updateMany({ senderId, receiverId, isSeen: false }, { $set: { isSeen: true } })
    return res.status(200).json({
      message: "message marked as seen",

    })
  } catch (error) {
    console.log("An error occured", error);
    console.log("An Error occured in seen message");
    return res.status(500).json({ message: "Internal server error" });
  }

}
