const express = require("express");
const router = express.Router();
const beritaController = require("../controllers/beritaController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// --- SETUP MULTER (UPLOAD GAMBAR) ---
// Pastikan folder ini ada
const uploadDir = path.join(__dirname, "../../uploads/berita");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Rename file biar unik (misal: berita-17283928.jpg)
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "berita-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Maksimal 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Hanya boleh upload gambar (jpg, jpeg, png, webp)!"));
  },
});

// --- DEFINISI ROUTES ---

// 1. Get Semua Berita (Public)
router.get("/", beritaController.getAllBerita);

// 2. Get Detail Berita (Public)
router.get("/:id", beritaController.getBeritaById);

// 3. Tambah Berita (Admin Only - perlu middleware auth nanti, sementara kita buka dulu)
// 'gambar' adalah nama field di form frontend nanti
router.post("/", upload.single("gambar"), beritaController.createBerita);

// 4. Update Berita
router.put("/:id", upload.single("gambar"), beritaController.updateBerita);

// 5. Hapus Berita
router.delete("/:id", beritaController.deleteBerita);

module.exports = router;
