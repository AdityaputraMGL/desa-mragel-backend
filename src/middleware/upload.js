const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const path = require("path");

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    let folder = "temp";

    if (file.fieldname === "file_surat" || file.fieldname === "file_hasil") {
      folder = "surat";
    } else if (
      file.fieldname === "foto_bukti" ||
      file.fieldname === "foto_hasil"
    ) {
      folder = "pengaduan";
    } else if (
      file.fieldname === "foto_berita" ||
      file.fieldname === "gambar"
    ) {
      folder = "berita";
    } else if (file.fieldname === "file_ktp" || file.fieldname === "file_kk") {
      folder = "syarat";
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, "_");
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

    return {
      folder: folder,
      public_id: `${sanitizedName}-${uniqueSuffix}`,
      resource_type: "auto",
      format: ext.replace(".", "") || undefined, // ✅ Tambahkan baris ini
    };
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Tipe file tidak didukung. Hanya JPG, PNG, GIF, PDF, DOC, DOCX yang diperbolehkan.",
      ),
      false,
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Ukuran file terlalu besar. Maksimal 5MB.",
      });
    }
    return res.status(400).json({
      success: false,
      message: "Error upload file.",
      error: err.message,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "Error upload file.",
    });
  }

  next();
};

module.exports = upload;
module.exports.handleUploadError = handleUploadError;
