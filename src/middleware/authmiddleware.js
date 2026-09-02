import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const isLogegdin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: false,
        message: "Access denied. Login please",
        data: null,
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      return res.status(401).json({
        status: false,
        message: "Invalid token or user no longer exists",
        data: null,
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      status: false,
      message: "Invalid or expired token.",
      data: error.message,
    });
  }
};
