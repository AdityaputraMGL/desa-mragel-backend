const { PengajuanSurat, Pengaduan, User, Penduduk } = require("../models");
const { Op } = require("sequelize");

// --- DASHBOARD UNTUK USER (WARGA) ---
exports.getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.id_user;

    // 1. STATISTIK SURAT
    const pengajuanRaw = await PengajuanSurat.findAll({
      where: { id_user: userId },
    });

    const statsPengajuan = {
      total: pengajuanRaw.length,
      menunggu: pengajuanRaw.filter((p) => p.status === "menunggu").length,
      diproses: pengajuanRaw.filter((p) => p.status === "diproses").length,
      selesai: pengajuanRaw.filter((p) => p.status === "selesai").length,
      ditolak: pengajuanRaw.filter((p) => p.status === "ditolak").length,
    };

    // 2. STATISTIK PENGADUAN
    const pengaduanRaw = await Pengaduan.findAll({
      where: { id_user: userId },
    });

    const statsPengaduan = {
      total: pengaduanRaw.length,
      menunggu: pengaduanRaw.filter((p) => p.status === "menunggu").length,
      diproses: pengaduanRaw.filter((p) => p.status === "diproses").length,
      selesai: pengaduanRaw.filter((p) => p.status === "selesai").length,
      sedang_ditangani: pengaduanRaw.filter((p) => p.status === "diproses")
        .length,
    };

    // 3. AKTIVITAS TERBARU (GABUNGAN)

    // a. Ambil Surat (Ambil agak banyak biar aman saat disortir nanti)
    const recentSurat = await PengajuanSurat.findAll({
      where: { id_user: userId },
      order: [["created_at", "DESC"]],
      limit: 10,
    });

    // b. Ambil Pengaduan (Ambil agak banyak juga)
    const recentPengaduan = await Pengaduan.findAll({
      where: { id_user: userId },
      order: [["created_at", "DESC"]],
      limit: 10,
    });

    // c. Format Data Surat
    const formattedSurat = recentSurat.map((item) => ({
      type: "pengajuan",
      title: item.jenis_surat || "Surat Keterangan",
      status: item.status,
      // Cek kedua kemungkinan nama field tanggal
      date: item.created_at || item.createdAt,
      nomor: `SRT-${String(item.id_pengajuan).padStart(4, "0")}`,
    }));

    // d. Format Data Pengaduan
    const formattedPengaduan = recentPengaduan.map((item) => ({
      type: "pengaduan",
      // Cek field judul (kadang namanya beda-beda di db)
      title:
        item.judul ||
        item.judul_laporan ||
        item.isi_laporan ||
        "Pengaduan Masyarakat",
      status: item.status,
      // Cek kedua kemungkinan nama field tanggal
      date: item.created_at || item.createdAt,
      nomor: `ADU-${String(item.id_pengaduan).padStart(4, "0")}`,
    }));

    // e. Gabung, Urutkan Tanggal, dan Ambil 10 Teratas
    const allActivities = [...formattedSurat, ...formattedPengaduan]
      .sort((a, b) => new Date(b.date) - new Date(a.date)) // Paling baru di atas
      .slice(0, 10); // Kita tampilkan 10 biar pengaduan yg agak lama tetap kelihatan

    // 4. KIRIM RESPONSE
    res.json({
      success: true,
      data: {
        statistics: {
          pengajuan: statsPengajuan,
          pengaduan: statsPengaduan,
        },
        activities: allActivities,
      },
    });
  } catch (error) {
    console.error("User Dashboard Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- DASHBOARD UNTUK ADMIN (Biarkan Tetap Sama) ---
exports.getAdminDashboard = async (req, res) => {
  try {
    const totalPenduduk = await Penduduk.count();
    const totalUser = await User.count();

    const totalSurat = await PengajuanSurat.count();
    const suratMenunggu = await PengajuanSurat.count({
      where: { status: "menunggu" },
    });
    const suratSelesai = await PengajuanSurat.count({
      where: { status: "selesai" },
    });
    const suratDitolak = await PengajuanSurat.count({
      where: { status: "ditolak" },
    });

    const totalPengaduan = await Pengaduan.count();
    const pengaduanBaru = await Pengaduan.count({
      where: { status: "menunggu" },
    });

    res.json({
      success: true,
      data: {
        overview: { penduduk: totalPenduduk, user: totalUser },
        surat: {
          total: totalSurat,
          menunggu: suratMenunggu,
          selesai: suratSelesai,
          ditolak: suratDitolak,
        },
        pengaduan: { total: totalPengaduan, baru: pengaduanBaru },
      },
    });
  } catch (error) {
    console.error("Admin Dashboard Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
