const { Berita } = require("../models"); // Pastikan ini terimport benar
const fs = require("fs");
const path = require("path");

// 1. GET ALL BERITA
exports.getAllBerita = async (req, res) => {
  try {
    const berita = await Berita.findAll({
      order: [["created_at", "DESC"]],
    });
    res.json({ success: true, data: berita });
  } catch (error) {
    console.error("Error get berita:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. GET BERITA BY ID
exports.getBeritaById = async (req, res) => {
  try {
    const berita = await Berita.findByPk(req.params.id);
    if (!berita)
      return res
        .status(404)
        .json({ success: false, message: "Berita tidak ditemukan" });
    res.json({ success: true, data: berita });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. CREATE BERITA (Sesuai dengan Model Baru)
exports.createBerita = async (req, res) => {
  try {
    // Ambil data dari Form Frontend
    const { judul, kategori, isi_berita, penulis } = req.body;

    // Handle Upload Gambar
    let gambar = null;
    if (req.file) {
      gambar = req.file.path;
    }

    // Simpan ke Database
    const newBerita = await Berita.create({
      judul,
      kategori,
      isi_berita, // Pastikan ini sama dengan di Model
      penulis: penulis || "Admin Desa",
      gambar,
      tanggal_posting: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Berita berhasil ditambahkan",
      data: newBerita,
    });
  } catch (error) {
    console.error("Error create berita:", error);
    res.status(500).json({
      success: false,
      message: "Gagal membuat berita: " + error.message,
    });
  }
};

// 4. UPDATE BERITA
exports.updateBerita = async (req, res) => {
  try {
    const { id } = req.params;
    const { judul, kategori, isi_berita, penulis } = req.body;

    const berita = await Berita.findByPk(id);
    if (!berita)
      return res.status(404).json({ message: "Berita tidak ditemukan" });

    let updateData = { judul, kategori, isi_berita, penulis };

    if (req.file) {
      // Hapus foto lama jika ada
      if (berita.gambar) {
        const oldPath = path.join(
          __dirname,
          "../../uploads/berita",
          berita.gambar,
        );
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.gambar = req.file.path;
    }

    await berita.update(updateData);
    res.json({ success: true, message: "Berita berhasil diupdate" });
  } catch (error) {
    console.error("Error update berita:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. DELETE BERITA
exports.deleteBerita = async (req, res) => {
  try {
    const { id } = req.params;
    const berita = await Berita.findByPk(id);

    if (!berita)
      return res.status(404).json({ message: "Berita tidak ditemukan" });

    if (berita.gambar) {
      const filePath = path.join(
        __dirname,
        "../../uploads/berita",
        berita.gambar,
      );
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await berita.destroy();
    res.json({ success: true, message: "Berita berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
