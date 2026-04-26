const multer = require("multer");
const path = require("path");

// 1. Konfigurasi Penyimpanan
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Simpan di folder public/uploads/syarat
    cb(null, "public/uploads/syarat");
  },
  filename: (req, file, cb) => {
    // Namai file: TIME-NAMAASLI.ext (Biar gak bentrok)
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// 2. Filter File (Gambar + PDF + Word)
const fileFilter = (req, file, cb) => {
  // Regex untuk ekstensi file
  const allowedExts = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedExts.test(
    path.extname(file.originalname).toLowerCase(),
  );

  // Daftar Mime Types yang diizinkan
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Hanya boleh upload file Gambar (JPG/PNG), PDF, atau Word (DOC/DOCX)!",
      ),
    );
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Maksimal naik jadi 5MB per file
  fileFilter: fileFilter,
});

module.exports = upload;
