const express = require("express");
const router = express.Router();
const pengajuanController = require("../controllers/pengajuanController");
const { verifyToken, isAdmin } = require("../middleware/auth");
const uploadSyarat = require("../middleware/uploadSyarat");

// 👇 FIX 1: KITA IMPORT MIDDLEWARE UPLOAD YANG SUDAH KITA PERBAIKI 👇
const upload = require("../middleware/upload");

// --- 1. ROUTE SPESIFIK (Taruh Paling Atas) ---
// Supaya tidak tertabrak dengan route /:id

// Get Riwayat Pengajuan Saya (User)
router.get("/", verifyToken, pengajuanController.getUserPengajuan);
router.get("/my", verifyToken, pengajuanController.getUserPengajuan); // Alias

// Get Daftar Jenis Surat
router.get("/jenis/list", verifyToken, pengajuanController.getJenisSurat);
router.get("/jenis-surat", verifyToken, pengajuanController.getJenisSurat); // Alias

// --- 2. ROUTE ADMIN (Khusus Admin/Petugas) ---

// Get Semua Pengajuan (Admin)
router.get(
  "/admin/all",
  verifyToken,
  isAdmin,
  pengajuanController.getAllPengajuan || pengajuanController.getUserPengajuan,
);

// Untuk Warga Upload Pengajuan (KTP & KK dibiarkan pakai uploadSyarat)
router.post(
  "/",
  verifyToken,
  uploadSyarat.fields([
    { name: "file_ktp", maxCount: 1 },
    { name: "file_kk", maxCount: 1 },
  ]),
  pengajuanController.createPengajuan,
);

// Get Statistik (Admin)
router.get(
  "/admin/statistics",
  verifyToken,
  isAdmin,
  pengajuanController.getStatistics || ((req, res) => res.json([])),
);

router.get(
  "/admin/stats",
  verifyToken,
  isAdmin,
  pengajuanController.getStatistics,
);

// Cetak Surat PDF (Bisa diakses User & Admin)
router.get("/cetak/:id", verifyToken, pengajuanController.cetakSurat);

// 👇 FIX 2: UBAH uploadSyarat MENJADI upload DI SINI 👇
// Update Status Pengajuan (Admin)
router.put(
  "/:id/status",
  verifyToken,
  isAdmin,
  upload.single("file_hasil"), // <--- SEKARANG DIA AKAN MASUK KE FOLDER SURAT
  pengajuanController.updateStatusPengajuan ||
    pengajuanController.updatePengajuanStatus,
);

// Hapus Pengajuan
router.delete(
  "/:id",
  verifyToken,
  pengajuanController.deletePengajuan ||
    ((req, res) => res.json({ message: "Deleted" })),
);

// Get Detail Pengajuan by ID
router.get("/:id", verifyToken, pengajuanController.getPengajuanById);

router.get("/:id/download", verifyToken, pengajuanController.downloadFile);

module.exports = router;
