
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import userRouter from "./routes/user.routes.js";
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/v1/users", userRouter);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Mess Management System API is running",
  });
});

export default app;