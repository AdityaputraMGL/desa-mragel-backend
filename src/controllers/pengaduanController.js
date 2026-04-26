const { Pengaduan, User, Penduduk } = require("../models");
const fs = require("fs");
const path = require("path");

// 1. Buat Pengaduan Baru (User)
exports.createPengaduan = async (req, res) => {
  try {
    const { judul, isi_pengaduan, kategori } = req.body;
    const id_user = req.user.id_user;

    // Cek apakah ada file foto yang diupload
    let foto_bukti = null;
    if (req.file) {
      foto_bukti = req.file.filename;
    }

    // Simpan ke Database
    const newPengaduan = await Pengaduan.create({
      id_user,
      judul,
      isi_pengaduan,
      kategori: kategori || "Umum",
      foto_bukti,
      status: "menunggu",
      tanggapan: null,
    });

    res.status(201).json({
      success: true,
      message: "Pengaduan berhasil dikirim!",
      data: newPengaduan,
    });
  } catch (error) {
    console.error("Error create pengaduan:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengirim pengaduan: " + error.message,
    });
  }
};

// 2. Ambil Semua Pengaduan (Admin)
exports.getAllPengaduanAdmin = async (req, res) => {
  try {
    const data = await Pengaduan.findAll({
      order: [["created_at", "DESC"]],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["email"],
          include: [
            {
              model: Penduduk,
              as: "penduduk",
              attributes: ["nama_lengkap", "nik"],
            },
          ],
        },
      ],
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error("Gagal ambil pengaduan admin:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Ambil Pengaduan Saya (User)
exports.getMyPengaduan = async (req, res) => {
  try {
    const id_user = req.user.id_user;

    const data = await Pengaduan.findAll({
      where: { id_user },
      order: [["created_at", "DESC"]],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["email"],
          include: [
            { model: Penduduk, as: "penduduk", attributes: ["nama_lengkap"] },
          ],
        },
      ],
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error("Gagal ambil pengaduan saya:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Ambil Detail Pengaduan By ID
exports.getPengaduanById = async (req, res) => {
  try {
    const { id } = req.params;

    const pengaduan = await Pengaduan.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["email"],
          include: [
            {
              model: Penduduk,
              as: "penduduk",
              attributes: ["nama_lengkap", "nik"],
            },
          ],
        },
      ],
    });

    if (!pengaduan) {
      return res
        .status(404)
        .json({ success: false, message: "Pengaduan tidak ditemukan" });
    }

    res.json({ success: true, data: pengaduan });
  } catch (error) {
    console.error("Error detail pengaduan:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Update Status & Tanggapan (Admin) + BUKTI FOTO HASIL
exports.updateStatusPengaduan = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tanggapan } = req.body;

    const pengaduan = await Pengaduan.findByPk(id);
    if (!pengaduan)
      return res.status(404).json({ message: "Pengaduan tidak ditemukan" });

    // Cek jika ada foto hasil dari admin yang diupload
    let foto_hasil_baru = pengaduan.foto_hasil;
    if (req.file) {
      foto_hasil_baru = req.file.filename;
    }

    // Update data ke Database
    await pengaduan.update({
      status,
      tanggapan: tanggapan || pengaduan.tanggapan,
      foto_hasil: foto_hasil_baru, // 👈 Simpan foto hasil ke DB
    });

    res.json({
      success: true,
      message: "Status pengaduan berhasil diperbarui",
    });
  } catch (error) {
    console.error("Error update pengaduan:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Hapus Pengaduan
exports.deletePengaduan = async (req, res) => {
  try {
    const { id } = req.params;
    const pengaduan = await Pengaduan.findByPk(id);

    if (!pengaduan)
      return res.status(404).json({ message: "Data tidak ditemukan" });

    // Hapus foto bukti (dari user) jika ada
    if (pengaduan.foto_bukti) {
      const filePathBukti = path.join(
        __dirname,
        "../../public/uploads/pengaduan",
        pengaduan.foto_bukti,
      );
      if (fs.existsSync(filePathBukti)) fs.unlinkSync(filePathBukti);
    }

    // Hapus foto hasil (dari admin) jika ada
    if (pengaduan.foto_hasil) {
      const filePathHasil = path.join(
        __dirname,
        "../../public/uploads/pengaduan",
        pengaduan.foto_hasil,
      );
      if (fs.existsSync(filePathHasil)) fs.unlinkSync(filePathHasil);
    }

    await pengaduan.destroy();
    res.json({ success: true, message: "Pengaduan berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
