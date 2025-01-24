import path from "path";
import express from "express";
import multer from "multer";
import cloudinary from "../utils/cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const router = express.Router();

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const filetypes = /jpe?g|png|webp/;
  const mimetypes = /image\/jpe?g|image\/png|image\/webp/;

  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  if (filetypes.test(extname) && mimetypes.test(mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Images only"), false);
  }
};

const upload = multer({ storage, fileFilter });
const uploadSingleImage = upload.single("image");

router.post("/", (req, res) => {
  uploadSingleImage(req, res, async (err) => {
    if (err) {
      return res.status(400).send({ message: err.message });
    } else if (req.file) {
      try {
        const result = await cloudinary.uploader.upload_stream(
          { resource_type: "image" },
          (error, result) => {
            if (error) {
              return res.status(500).send({ message: error.message });
            }
            res.status(200).send({
              message: "Image uploaded successfully",
              image: result.secure_url,
            });
          }
        );
        result.end(req.file.buffer);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    } else {
      res.status(400).send({ message: "No image file provided" });
    }
  });
});

export default router;
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads",
    format: async (req, file) => "png", // supports promises as well
    public_id: (req, file) => file.originalname,
  },
});

const uploadWithCloudinary = multer({ storage: cloudinaryStorage });

router.post("/cloudinary", uploadWithCloudinary.single("image"), (req, res) => {
  if (req.file) {
    res.status(200).send({
      message: "Image uploaded successfully",
      image: req.file.path,
    });
  } else {
    res.status(400).send({ message: "No image file provided" });
  }
});