const express = require("express");
const router = express.Router();
const pengaduanController = require("../controllers/pengaduanController");

// 👇 FIX 1: Sesuaikan pemanggilan auth dengan sistem Abang
const { verifyToken, isAdmin } = require("../middleware/auth");

// 👇 FIX 2: Pastikan middleware upload ini namanya sudah benar sesuai yang Abang punya
// (Kalau nama file Abang uploadSyarat.js, ubah jadi require("../middleware/uploadSyarat"))
const upload = require("../middleware/upload");

// Semua route di bawah ini WAJIB Login
router.use(verifyToken);

// --- ROUTE USER ---

// 1. Kirim Pengaduan Baru (Pakai Foto)
router.post(
  "/",
  upload.single("foto_bukti"),
  pengaduanController.createPengaduan,
);

// 2. Lihat Riwayat Sendiri
// (PENTING: Path ini harus '/my-pengaduan' biar cocok sama Frontend)
router.get("/my-pengaduan", pengaduanController.getMyPengaduan);

// --- ROUTE ADMIN/PETUGAS ---

// 3. Admin: Lihat Semua Pengaduan Masuk
router.get("/admin/all", isAdmin, pengaduanController.getAllPengaduanAdmin);

// 4. Admin: Update Status & Tanggapan & FOTO HASIL
router.put(
  "/:id/status",
  isAdmin,
  upload.single("foto_hasil"), // <--- FOTO HASIL SUDAH SIAP DITANGKAP
  pengaduanController.updateStatusPengaduan,
);

// 5. Admin: Hapus Pengaduan
router.delete("/:id", isAdmin, pengaduanController.deletePengaduan);

// --- ROUTE DETAIL (TARUH PALING BAWAH) ---
// 6. Lihat Detail Pengaduan per ID (Dipanggil tombol "Mata")
router.get("/:id", pengaduanController.getPengaduanById);

module.exports = router;
