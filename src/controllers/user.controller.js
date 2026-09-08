import fs from "fs";
import User from "../models/user.model.js";
import cloudinary from "../utils/cloudinary.js";

// update user
export const updateUser = async (req, res) => {
  try {
    const userId = req.params.id || req.user.id;
    const allowedFields = [
      "firstName",
      "lastName",
      "phoneNumber",
      "address",
      "designation",
    ];

    const updates = {};
    for (let key of allowedFields) {
      if (Object.hasOwn(req.body, key)) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        status: false,
        message: "No valid fields provided for update",
        data: null,
      });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select("-password -resetOTP -resetOTPExpire");

    if (!updatedUser) {
      return res.status(404).json({
        status: false,
        message: "User not found",
        data: null,
      });
    }

    return res.status(200).json({
      status: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Server error updating user",
      data: error.message,
    });
  }
};

// update avatar
export const updateUserImage = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        status: false,
        message: "No image uploaded",
        data: null,
      });
    }

    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "user_profiles",
      resource_type: "image",
    });

    fs.unlinkSync(req.file.path);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profileImage: uploadResult.secure_url },
      { new: true }
    ).select("-password -resetOTP -resetOTPExpire");

    if (!updatedUser) {
      return res.status(404).json({
        status: false,
        message: "User not found",
        data: null,
      });
    }

    return res.status(200).json({
      status: true,
      message: "Profile image updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update User Image Error:", error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(500).json({
      status: false,
      message: "Server error while updating user image",
      data: error.message,
    });
  }
};

// get user by id
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password -resetOTP -resetOTPExpire");

    if (!user) {
      return res
        .status(400)
        .json({ status: false, message: "User not found", data: null });
    }

    return res.status(200).json({
      status: true,
      message: "Fetch user infomation successfully",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Server error fetching individual user info",
      data: error.message,
    });
  }
};
