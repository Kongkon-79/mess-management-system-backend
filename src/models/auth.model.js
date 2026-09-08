import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";

const authSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    resetOTP: { type: String, select: false },
    resetOTPExpire: { type: Date, select: false },
  },
  { timestamps: true },
);

authSchema.pre("save", async function () {
  if (this.isModified("password"))
    this.password = await bcrypt.hash(this.password, 10);
});

authSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

authSchema.methods.generateOTP = function () {
  const otp = randomInt(100000, 1000000).toString();
  this.resetOTP = otp;
  this.resetOTPExpire = new Date(Date.now() + 10 * 60 * 1000);
  return otp;
};

export default mongoose.model("Auth", authSchema);
