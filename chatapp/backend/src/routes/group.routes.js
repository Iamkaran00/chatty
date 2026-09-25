import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import {
  createGroup, getMyGroups, getGroupMessages, sendGroupMessage,
  updateGroup, addMember, removeMember, makeAdmin, deleteGroupMessage,
} from "../controllers/group.controller.js";

const router = express.Router();

router.post("/create", protectedRoute, createGroup);
router.get("/my-groups", protectedRoute, getMyGroups);
router.get("/:groupId/messages", protectedRoute, getGroupMessages);
router.post("/:groupId/send", protectedRoute, sendGroupMessage);
router.patch("/:groupId/update", protectedRoute, updateGroup);
router.post("/:groupId/add-member", protectedRoute, addMember);
router.post("/:groupId/remove-member", protectedRoute, removeMember);
router.post("/:groupId/make-admin", protectedRoute, makeAdmin);
router.delete("/delete-message", protectedRoute, deleteGroupMessage);

export default router;