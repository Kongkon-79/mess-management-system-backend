

// import mongoose from "mongoose";
// import { mongoDbUrl } from "./config.js";

// export const connectDb = async () => {
//   try {
//     await mongoose.connect(mongoDbUrl);
//     console.log("MongoDB connected successfully");
//   } catch (error) {
//     console.error("MongoDB connection failed:", error.message);
//     process.exit(1);
//   }
// };

import mongoose from "mongoose";
import dns from "node:dns";
import { mongoDbUrl } from "./config.js";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

export const connectDb = async () => {
  try {
    await mongoose.connect(mongoDbUrl);

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};