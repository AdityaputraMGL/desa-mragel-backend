const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Konfigurasi Cloudinary (Pastikan Env sudah diisi di Vercel)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Setting Storage Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "balaidesa_syarat", // Folder di dashboard Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "pdf", "doc", "docx"],
    // Khusus PDF/Doc perlu setting raw agar tidak rusak
    resource_type: "auto",
  },
});

const uploadSyarat = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Maksimal 5MB
});

module.exports = uploadSyarat;
