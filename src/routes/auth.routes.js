import { Router } from "express";
import { registerUser, loginUser, forgotPassword, verifyOTP, updatePassword, resetPassword } from "../controllers/auth.controller.js";
import { isLoggedIn } from "../middleware/authmiddleware.js";

const router = Router();
router.post("/signup", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/update-password", updatePassword);
router.post("/reset-password", isLoggedIn, resetPassword);
export default router;
