

import dotenv from "dotenv";

dotenv.config();

export const serverPort = process.env.PORT || 5000;
export const mongoDbUrl = process.env.MONGODB_URL;

if (!mongoDbUrl) {
  throw new Error("MONGODB_URL is missing from the .env file");
}