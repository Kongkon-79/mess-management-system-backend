import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const extname = /^\.(jpeg|jpg|png|webp)$/.test(
      path.extname(file.originalname).toLowerCase()
    );
    // Clients may send application/octet-stream for real images.
    // Validate the file signature after Multer writes the upload.
    if (extname) return cb(null, true);
    const error = new Error("Only image files (jpeg, jpg, png, webp) are allowed");
    error.code = "INVALID_IMAGE_TYPE";
    cb(error);
  },
});

export const validateUploadedImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const header = Buffer.alloc(12);
    const file = await fs.promises.open(req.file.path, "r");
    let bytesRead;
    try {
      ({ bytesRead } = await file.read(header, 0, header.length, 0));
    } finally {
      await file.close();
    }

    const jpeg = bytesRead >= 3 && header.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
    const png = bytesRead >= 8 && header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const webp = bytesRead >= 12 && header.toString("ascii", 0, 4) === "RIFF" && header.toString("ascii", 8, 12) === "WEBP";

    if (jpeg || png || webp) {
      req.file.mimetype = jpeg ? "image/jpeg" : png ? "image/png" : "image/webp";
      return next();
    }

    await fs.promises.unlink(req.file.path);
    const error = new Error("The uploaded file is not a JPEG, PNG, or WebP image. Export it as one of these formats and try again.");
    error.code = "INVALID_IMAGE_TYPE";
    return next(error);
  } catch (error) {
    return next(error);
  }
};

export const handleUploadError = (error, req, res, next) => {
  if (!(error instanceof multer.MulterError) && error.code !== "INVALID_IMAGE_TYPE") {
    return next(error);
  }
  return res.status(400).json({
    status: false,
    message: error.code === "LIMIT_FILE_SIZE"
      ? "Image size must not exceed 20 MB"
      : error.code === "LIMIT_UNEXPECTED_FILE"
        ? "Upload exactly one image using the avatar field"
        : error.message,
    data: null,
  });
};

export default upload;
