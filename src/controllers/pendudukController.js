const { Penduduk, User } = require("../models");
const { Op } = require("sequelize");

// 1. Ambil Semua Penduduk
exports.getAllPenduduk = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
      whereClause.nama_lengkap = { [Op.like]: `%${search}%` };
    }

    const { count, rows } = await Penduduk.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: User,
          as: "user",
          attributes: ["email", "role"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Get all penduduk error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Ambil Penduduk by ID
exports.getPendudukById = async (req, res) => {
  try {
    const { id } = req.params;
    const penduduk = await Penduduk.findByPk(id, {
      include: [{ model: User, as: "user", attributes: ["email"] }],
    });

    if (!penduduk)
      return res.status(404).json({ message: "Data tidak ditemukan" });

    res.json({ success: true, data: penduduk });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Tambah Penduduk
exports.createPenduduk = async (req, res) => {
  try {
    const data = req.body;
    const exist = await Penduduk.findOne({ where: { nik: data.nik } });
    if (exist) return res.status(400).json({ message: "NIK sudah terdaftar" });

    const newPenduduk = await Penduduk.create(data);
    res
      .status(201)
      .json({
        success: true,
        message: "Data berhasil disimpan",
        data: newPenduduk,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Update Penduduk
exports.updatePenduduk = async (req, res) => {
  try {
    const { id } = req.params;
    const penduduk = await Penduduk.findByPk(id);
    if (!penduduk)
      return res.status(404).json({ message: "Data tidak ditemukan" });

    await penduduk.update(req.body);
    res.json({ success: true, message: "Data berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Hapus Penduduk
exports.deletePenduduk = async (req, res) => {
  try {
    const { id } = req.params;
    const penduduk = await Penduduk.findByPk(id);
    if (!penduduk)
      return res.status(404).json({ message: "Data tidak ditemukan" });

    await penduduk.destroy();
    res.json({ success: true, message: "Data berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
