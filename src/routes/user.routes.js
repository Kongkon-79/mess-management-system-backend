import { Router } from "express";
import { getUserById, updateUser, updateUserImage } from "../controllers/user.controller.js";
import { isLoggedIn, isSelfOrAdmin } from "../middleware/authmiddleware.js";
import upload from "../middleware/multer.js";

const router = Router();
router.use(isLoggedIn);
router.put("/update-user/:id", isSelfOrAdmin, updateUser);
router.post("/update-avatar", upload.single("avatar"), updateUserImage);
router.get("/:id", isSelfOrAdmin, getUserById);
export default router;
