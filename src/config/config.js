

import dotenv from "dotenv";

dotenv.config();

export const serverPort = process.env.PORT || 5000;
export const mongoDbUrl = process.env.MONGODB_URL;

if (!mongoDbUrl) {
  throw new Error("MONGODB_URL is missing from the .env file");
}

export const cloudeName = process.env.CLOUDINARY_CLOUD_NAME;
export const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY;
export const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudeName || !cloudinaryApiKey || !cloudinaryApiSecret) {
  throw new Error(
    "Cloudinary configuration is missing from the .env file"
  );
}

export const jwtSecret = process.env.JWT_SECRET;
export const jwtExpire = process.env.JWT_EXPIRE || "7h";

if(!jwtSecret || !jwtExpire) {
  throw new Error("JWT configuration is missing from the .env file");
}

export const emailUser = process.env.EMAIL_USER;
export const emailPassword = process.env.EMAIL_PASSWORD;

if (!emailUser || !emailPassword) {
  throw new Error("Email configuration is missing from the .env file");
}
