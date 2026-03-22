import { json, Router } from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";

import { getUsersForSidebar,getMessagesFunction,sendMessageFunction ,seenMessage, deleteMessage} from "../controllers/message.controller.js";
const router = Router();
router.get('/users',protectedRoute,getUsersForSidebar);
router.get('/:id',protectedRoute,getMessagesFunction);
router.post('/send/:id',protectedRoute,sendMessageFunction);
router.patch('/seen/:id',protectedRoute,seenMessage);
router.delete('/delete',protectedRoute,deleteMessage);
export default router;