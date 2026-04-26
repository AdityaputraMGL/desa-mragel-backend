const express = require("express");
const router = express.Router();
const pendudukController = require("../controllers/pendudukController");
const { verifyToken, isAdmin } = require("../middleware/auth");

console.log("=== CEK DEBUG CONTROLLER ===");
console.log("Isi Controller:", pendudukController);
console.log("Fungsi getAllPenduduk:", pendudukController.getAllPenduduk);
console.log("============================");

// 1. Ambil Semua Data Penduduk
router.get("/", verifyToken, pendudukController.getAllPenduduk);

// 2. Ambil Detail Penduduk by ID
router.get("/:id", verifyToken, pendudukController.getPendudukById);

// 3. Tambah Penduduk Baru (Hanya Admin)
router.post("/", verifyToken, isAdmin, pendudukController.createPenduduk);

// 4. Update Data Penduduk (Hanya Admin)
router.put("/:id", verifyToken, isAdmin, pendudukController.updatePenduduk);

// 5. Hapus Penduduk (Hanya Admin)
router.delete("/:id", verifyToken, isAdmin, pendudukController.deletePenduduk);

module.exports = router;
