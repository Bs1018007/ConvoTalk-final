import express from "express";
import { protectRoute } from "../middlewares/ProtectRoute.js";
import {getMessages,getUsersForSidebar,sendMessage,deleteMessage,deleteMessageForMe} from "../Controllers/MessageControllers.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);
router.delete('/:id', protectRoute, deleteMessage); 
router.put('/delete-for-me/:id', protectRoute, deleteMessageForMe); 

export default router;
