
import cloudinary from "../../lib/cloudinary.js";
import { io, getReceiverSocketId } from "../../lib/socket.js";
import { Group } from "../models/group.model.js";
import { GroupMessage } from "../models/group.message.model.js";
export const createGroup = async (req, res) => {
  try {
    console.log(req);
    const { name, memberIds } = req.body;
    const createdBy = req.user._id;
    const members = [...new Set([...memberIds, createdBy.toString()])];
    const group = new Group({ name, members, admins: [createdBy], createdBy });
    await group.save();
    const populated = await group.populate("members", "-password");
     console.log("hi karan from creategroup");
    members.forEach((id) => {
      const socketId = getReceiverSocketId(id.toString());
      if (socketId) io.to(socketId).emit("group:new", populated);
    });
    res.status(201).json({ success: true, group: populated });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getMyGroups = async (req, res) => {
  try {
    console.log(req);
    const groups = await Group.find({ members: req.user._id })
      .populate("members", "-password")
      .sort({ lastMessageTime: -1 });
    res.status(200).json(groups);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const messages = await GroupMessage.find({ groupId })
      .populate("senderId", "fullName profilePic")
      .sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { text, image, video, audio, gif } = req.body;
    const senderId = req.user._id;
    let imageUrl, videoUrl;
    if (image) imageUrl = (await cloudinary.uploader.upload(image)).secure_url;
    if (video) videoUrl = (await cloudinary.uploader.upload(video, { resource_type: "video" })).secure_url;
    const msg = await GroupMessage.create({ groupId, senderId, text, image: imageUrl, video: videoUrl, audio, gif });
    const populated = await msg.populate("senderId", "fullName profilePic");
    await Group.findByIdAndUpdate(groupId, { lastMessage: text || "media", lastMessageTime: new Date() });
    io.to(groupId.toString()).emit("group:newMessage", populated);
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, avatar } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    const isAdmin = group.admins.some((a) => a.toString() === req.user._id.toString());
    if (!isAdmin) return res.status(403).json({ message: "Admins only" });
    if (name) group.name = name;
    if (avatar) group.avatar = (await cloudinary.uploader.upload(avatar)).secure_url;
    await group.save();
    const populated = await group.populate("members", "-password");
    io.to(groupId).emit("group:updated", populated);
    res.status(200).json({ success: true, group: populated });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const addMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const group = await Group.findById(groupId);
    if (!group.admins.some((a) => a.toString() === req.user._id.toString()))
      return res.status(403).json({ message: "Admins only" });
    if (!group.members.some((m) => m.toString() === userId.toString())) group.members.push(userId);
    await group.save();
    const populated = await group.populate("members", "-password");
    io.to(groupId).emit("group:updated", populated);
    const newMemberSocket = getReceiverSocketId(userId);
    if (newMemberSocket) io.to(newMemberSocket).emit("group:new", populated);
    res.status(200).json({ success: true, group: populated });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const removeMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const group = await Group.findById(groupId);
    const requesterId = req.user._id.toString();
    const isAdmin = group.admins.some((a) => a.toString() === requesterId);
    const isSelf = userId === requesterId;
    if (!isAdmin && !isSelf) return res.status(403).json({ message: "Not allowed" });
    group.members = group.members.filter((m) => m.toString() !== userId);
    group.admins = group.admins.filter((a) => a.toString() !== userId);
    await group.save();
    const populated = await group.populate("members", "-password");
    io.to(groupId).emit("group:updated", populated);
    const removedSocket = getReceiverSocketId(userId);
    if (removedSocket) io.to(removedSocket).emit("group:removed", { groupId });
    res.status(200).json({ success: true, group: populated });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const makeAdmin = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const group = await Group.findById(groupId);
    if (!group.admins.some((a) => a.toString() === req.user._id.toString()))
      return res.status(403).json({ message: "Admins only" });
    if (!group.admins.includes(userId)) group.admins.push(userId);
    await group.save();
    const populated = await group.populate("members", "-password");
    io.to(groupId).emit("group:updated", populated);
    res.status(200).json({ success: true, group: populated });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteGroupMessage = async (req, res) => {
  try {
    const { id } = req.body;
    const msg = await GroupMessage.findById(id);
    if (!msg) return res.status(404).json({ message: "Not found" });
    if (msg.senderId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not your message" });
    msg.isDeleted = true;
    await msg.save();
    io.to(msg.groupId.toString()).emit("group:messageDeleted", id);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};