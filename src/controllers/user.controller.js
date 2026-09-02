import nodemailer from "nodemailer";
import fs from "fs";
import { emailPassword, emailUser } from "../config/config.js";
import User from "../models/user.model.js";
import cloudinary from "../utils/cloudinary.js";

// signup user
export const registerUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      address,
      designation,
      role,
      password,
    } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        status: false,
        message: "First Name, Last Name, Email and Password are required",
        data: null,
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        status: false,
        message: "Email already exists",
        data: null,
      });
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      phoneNumber,
      address,
      designation,
      role,
      password,
    });

    return res.status(201).json({
      status: true,
      message: "User registered successfully",
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        address: user.address,
        designation: user.designation,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Server error during registration",
      data: error.message,
    });
  }
};

// login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: false,
        message: "Email and password are required",
        data: null,
      });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
        data: null,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: false,
        message: "Invalid password",
        data: null,
      });
    }

    const token = user.generateJWT();

    res.status(200).json({
      status: true,
      message: "Login successful",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        address: user.address,
        designation: user.designation,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      status: false,
      message: "Server error during login",
      error: error.message,
    });
  }
};

// forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ status: false, message: "Email is required", data: null });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ status: false, message: "User not found", data: null });
    }

    const otp = user.generateOTP();
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });

    const mailOptions = {
      from: `Support <${emailUser}>`,
      to: user.email,
      subject: "Password Reset OTP",
      html: `
        <h2>Your OTP Code</h2>
        <p>Use the following OTP to reset your password:</p>
        <h3>${otp}</h3>
        <p>This OTP will expire in 10 minutes.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      status: true,
      message: "OTP sent successfully to your email",
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error sending OTP",
      data: error.message,
    });
  }
};

// verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        status: false,
        message: "Email and OTP are required",
        data: null,
      });
    }

    const user = await User.findOne({ email });
    if (!user || !user.resetOTP) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid or expired OTP", data: null });
    }

    if (user.resetOTP !== otp) {
      return res
        .status(400)
        .json({ status: false, message: "Incorrect OTP", data: null });
    }

    if (user.resetOTPExpire < Date.now()) {
      return res
        .status(400)
        .json({ status: false, message: "OTP has expired", data: null });
    }

    res.status(200).json({
      status: true,
      message: "OTP verified successfully",
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error verifying OTP",
      data: error.message,
    });
  }
};

// update password
export const updatePassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        status: false,
        message: "All fields are required",
        data: null,
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !user.resetOTP) {
      return res.status(400).json({
        status: false,
        message: "Invalid or expired reset request",
        data: null,
      });
    }

    if (user.resetOTP !== otp) {
      return res.status(400).json({
        status: false,
        message: "Incorrect OTP",
        data: null,
      });
    }

    if (user.resetOTPExpire < Date.now()) {
      return res.status(400).json({
        status: false,
        message: "OTP expired",
        data: null,
      });
    }

    user.password = newPassword;

    user.resetOTP = undefined;
    user.resetOTPExpire = undefined;

    await user.save();

    return res.status(200).json({
      status: true,
      message: "Password reset successful",
      data: null,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Server error resetting password",
      data: error.message,
    });
  }
};

// change password
export const resetPassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        status: false,
        message: "All fields are required",
        data: null,
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: false,
        message: "New password and confirm password do not match",
        data: null,
      });
    }

    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
        data: null,
      });
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({
        status: false,
        message: "Old password is incorrect",
        data: null,
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      status: true,
      message: "Password changed successfully",
      data: null,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Server error while changing password",
      data: error.message,
    });
  }
};

// update user
export const updateUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const allowedFields = [
      "firstName",
      "lastName",
      "phoneNumber",
      "address",
      "designation",
    ];

    const updates = {};
    for (let key of allowedFields) {
      if (req.body[key]) updates[key] = req.body[key];
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
    const user = await User.findById(id);

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
