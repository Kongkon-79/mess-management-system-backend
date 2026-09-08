import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { emailPassword, emailUser, jwtSecret, jwtExpire } from "../config/config.js";
import User from "../models/user.model.js";
import Auth from "../models/auth.model.js";
// Migrate existing credentials on first use, preserving the existing bcrypt hash.
async function getCredentials(userId) {
  let credentials = await Auth.findOne({ user: userId }).select("+password +resetOTP +resetOTPExpire");
  if (!credentials) {
    const legacy = await User.collection.findOne({ _id: userId });
    if (!legacy?.password) return null;
    try {
      await Auth.updateOne({ user: userId }, { $setOnInsert: {
        user: userId,
        password: legacy.password,
        resetOTP: legacy.resetOTP,
        resetOTPExpire: legacy.resetOTPExpire,
      } }, { upsert: true });
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
    credentials = await Auth.findOne({ user: userId }).select("+password +resetOTP +resetOTPExpire");
  }
  if (credentials) {
    await User.collection.updateOne({ _id: userId }, {
      $unset: { password: "", resetOTP: "", resetOTPExpire: "" },
    });
  }
  return credentials;
}

function generateToken(user) {
  return jwt.sign({ id: user._id, email: user.email, role: user.role }, jwtSecret, { expiresIn: jwtExpire });
}

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
      password,
    } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        status: false,
        message: "First Name, Last Name, Email and Password are required",
        data: null,
      });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ status: false, message: "Password must be at least 6 characters long", data: null });
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
    });

    try {
      await Auth.create({ user: user._id, password });
    } catch (error) {
      await User.findByIdAndDelete(user._id);
      throw error;
    }

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

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
        data: null,
      });
    }

    const credentials = await getCredentials(user._id);
    const isMatch = credentials && await credentials.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: false,
        message: "Invalid password",
        data: null,
      });
    }

    const token = generateToken(user);

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

    const credentials = await getCredentials(user._id);
    if (!credentials) return res.status(400).json({ status: false, message: "Password credentials unavailable", data: null });
    const otp = credentials.generateOTP();
    await credentials.save();

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
    const credentials = user && await getCredentials(user._id);
    if (!credentials || !credentials.resetOTP) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid or expired OTP", data: null });
    }

    if (credentials.resetOTP !== otp) {
      return res
        .status(400)
        .json({ status: false, message: "Incorrect OTP", data: null });
    }

    if (!credentials.resetOTPExpire || credentials.resetOTPExpire <= Date.now()) {
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

    const user = await User.findOne({ email });

    const credentials = user && await getCredentials(user._id);
    if (!credentials || !credentials.resetOTP) {
      return res.status(400).json({
        status: false,
        message: "Invalid or expired reset request",
        data: null,
      });
    }

    if (credentials.resetOTP !== otp) {
      return res.status(400).json({
        status: false,
        message: "Incorrect OTP",
        data: null,
      });
    }

    if (!credentials.resetOTPExpire || credentials.resetOTPExpire <= Date.now()) {
      return res.status(400).json({
        status: false,
        message: "OTP expired",
        data: null,
      });
    }

    credentials.password = newPassword;

    credentials.resetOTP = undefined;
    credentials.resetOTPExpire = undefined;

    await credentials.save();

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

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
        data: null,
      });
    }

    const credentials = await getCredentials(user._id);
    const isMatch = credentials && await credentials.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({
        status: false,
        message: "Old password is incorrect",
        data: null,
      });
    }

    credentials.password = newPassword;
    await credentials.save();

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

