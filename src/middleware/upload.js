const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 👇 FIX TERAKHIR: Tambahkan kata "public/" di depan semua nama foldernya 👇
const uploadDirs = [
  "public/uploads/surat",
  "public/uploads/pengaduan",
  "public/uploads/berita",
  "public/uploads/temp",
];

uploadDirs.forEach((dir) => {
  const fullPath = path.join(__dirname, "../../", dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = "public/uploads/temp";

    // 👇 Pastikan ini juga mengarah ke "public/" 👇
    if (file.fieldname === "file_surat" || file.fieldname === "file_hasil") {
      uploadPath = "public/uploads/surat";
    } else if (
      file.fieldname === "foto_bukti" ||
      file.fieldname === "foto_hasil"
    ) {
      uploadPath = "public/uploads/pengaduan";
    } else if (file.fieldname === "foto_berita") {
      uploadPath = "public/uploads/berita";
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, "_");

    cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    image: ["image/jpeg", "image/jpg", "image/png", "image/gif"],
    document: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  };

  const allAllowedTypes = [...allowedTypes.image, ...allowedTypes.document];

  if (allAllowedTypes.includes(file.mimetype)) {
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
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
    return res
      .status(400)
      .json({ success: false, message: err.message || "Error upload file." });
  }

  next();
};

module.exports = upload;
module.exports.handleUploadError = handleUploadError;
