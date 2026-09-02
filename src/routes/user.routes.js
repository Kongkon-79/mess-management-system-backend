import { Router } from "express";
import {
  forgotPassword,
  getUserById,
  loginUser,
  registerUser,
  resetPassword,
  updatePassword,
  updateUser,
  updateUserImage,
  verifyOTP,
} from "../controllers/user.controller.js";
import { isLogegdin } from "../middleware/authmiddleware.js";
import upload from "../middleware/multer.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = Router();

router.route("/signup").post(registerUser);
router.route("/login").post(loginUser);
router.route("/forgot-password").post(forgotPassword);
router.route("/verify-otp").post(verifyOTP);
router.route("/update-password").post(updatePassword);
router.route("/reset-password").post(isLogegdin, isAdmin, resetPassword);
router.route("/update-user/:id").put(isLogegdin, isAdmin, updateUser);
router
  .route("/update-avatar")
  .post(isLogegdin, isAdmin, upload.single("avatar"), updateUserImage);
router.route("/:id").get(getUserById);

export default router;
