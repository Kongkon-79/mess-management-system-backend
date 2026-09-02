import { v2 as cloudinary } from "cloudinary";
import {
  cloudeName,
  cloudinaryApiKey,
  cloudinaryApiSecret,
} from "../config/config.js";

cloudinary.config({
  cloud_name: `${cloudeName}`,
  api_key: cloudinaryApiKey,
  api_secret: `${cloudinaryApiSecret}`,
});

export default cloudinary;
