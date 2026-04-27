const { PengajuanSurat, User, Penduduk } = require("../models");
const { Op } = require("sequelize");
const { generatePDF } = require("../utils/pdfGenerator");
const fs = require("fs");
const path = require("path");
const { kirimNotifikasi } = require("../utils/emailService");

// 1. Get All Pengajuan (Untuk Admin)
exports.getAllPengajuan = async (req, res) => {
  try {
    const data = await PengajuanSurat.findAll({
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
      order: [["created_at", "DESC"]],
    });

    // Format response agar sesuai dengan Frontend
    res.json({
      success: true,
      data: data,
      pagination: { total: data.length }, // Dummy pagination biar frontend gak error
    });
  } catch (error) {
    console.error("Error getAllPengajuan:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get User Pengajuan (Fix Tanggal)
exports.getUserPengajuan = async (req, res) => {
  try {
    const id_user = req.user.id_user;

    const rawData = await PengajuanSurat.findAll({
      where: { id_user },
      order: [["created_at", "DESC"]],
    });

    const data = rawData.map((item) => ({
      ...item.dataValues,

      jenisSurat: {
        nama_surat: item.jenis_surat || "Surat Keterangan",
      },

      nomor_pengajuan: "SRT-" + String(item.id_pengajuan).padStart(4, "0"),

      // FIX TANGGAL - kirim dalam format ISO
      tanggal_pengajuan: item.created_at,
      tanggal: item.created_at,
      created_at: item.created_at,
    }));

    res.json({
      success: true,
      data: data,
      pagination: { total: data.length },
    });
  } catch (error) {
    console.error("Error getUserPengajuan:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Create Pengajuan (VERSI BERSIH FINAL)
exports.createPengajuan = async (req, res) => {
  try {
    const { id_jenis_surat, keperluan, data_surat } = req.body;
    const id_user = req.user.id_user;
    const { sequelize } = require("../models");

    // 1. TANGKAP NAMA FILE
    const fileKtp =
      req.files?.["file_ktp"]?.[0].path ||
      req.files?.["file_ktp"]?.[0].secure_url ||
      null;
    const fileKk =
      req.files?.["file_kk"]?.[0].path ||
      req.files?.["file_kk"]?.[0].secure_url ||
      null;

    // 2. CARI NAMA SURAT
    const [results] = await sequelize.query(
      `SELECT nama_surat FROM tb_jenis_surat WHERE id_jenis_surat = '${id_jenis_surat}' LIMIT 1`,
    );
    const namaSurat =
      results.length > 0 ? results[0].nama_surat : "Surat Keterangan";

    // 3. UNBOXING JSON DATA SURAT
    let extraData = {};
    if (data_surat) {
      try {
        extraData =
          typeof data_surat === "string" ? JSON.parse(data_surat) : data_surat;
      } catch (e) {
        console.error("Gagal parse data_surat:", e);
      }
    }

    const {
      alamat_tujuan,
      alamat_tujuan_pindah,
      penghasilan,
      gaji,
      nama_almarhum,
      usaha,
      jenis_usaha,
    } = extraData;

    // 4. LOGIKA KETERANGAN
    let isiKeterangan = keperluan;
    if (alamat_tujuan || alamat_tujuan_pindah) {
      const tujuan = alamat_tujuan || alamat_tujuan_pindah;
      isiKeterangan = `Pindah ke ${tujuan}`;
    } else if (penghasilan || gaji) {
      isiKeterangan = `Penghasilan: ${penghasilan || gaji}`;
    } else if (nama_almarhum) {
      isiKeterangan = `Nama Almarhum: ${nama_almarhum}`;
    } else if (usaha || jenis_usaha) {
      isiKeterangan = usaha || jenis_usaha;
    }

    // 5. SIMPAN KE DATABASE
    await PengajuanSurat.create({
      id_user,
      jenis_surat: namaSurat,
      keterangan: isiKeterangan || "-",
      status: "menunggu",
      file_ktp: fileKtp,
      file_kk: fileKk,
    });

    res.status(201).json({
      success: true,
      message: "Surat berhasil diajukan beserta lampiran!",
    });
  } catch (error) {
    console.error("Error createPengajuan:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Get All Pengajuan (Untuk Admin Panel List)
exports.getAllPengajuan = async (req, res) => {
  try {
    const rawData = await PengajuanSurat.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["email"],
          include: [
            {
              model: Penduduk,
              as: "penduduk",
              // ✅ FIX: Ganti "alamat" jadi "alamat_lengkap"
              attributes: [
                "nama_lengkap",
                "nik",
                "pekerjaan",
                "alamat_lengkap",
              ],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // --- ADAPTOR KHUSUS ADMIN PANEL ---
    const data = rawData.map((item) => ({
      ...item.dataValues,

      // 1. FIX TANGGAL (Admin mencari field 'tanggal', bukan 'created_at')
      tanggal: item.created_at,
      created_at: item.created_at,

      // 2. FIX JENIS SURAT (Kirim dua format: String & Object biar aman)
      jenis_surat: item.jenis_surat || "Surat Keterangan",
      jenisSurat: {
        nama_surat: item.jenis_surat || "Surat Keterangan",
      },

      // 3. FIX NOMOR SURAT
      nomor_pengajuan: "SRT-" + String(item.id_pengajuan).padStart(4, "0"),

      // 4. FIX DATA PEMOHON
      nama_pemohon:
        item.user?.penduduk?.nama_lengkap || item.user?.email || "Tanpa Nama",
      nik: item.user?.penduduk?.nik || "-",
    }));

    res.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("Error getAllAdmin:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Get Pengajuan By ID (FIX FINAL: Include File KTP, KK & File Hasil)
exports.getPengajuanById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await PengajuanSurat.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["email"],
          include: [
            {
              model: Penduduk,
              as: "penduduk",
              attributes: [
                "nama_lengkap",
                "nik",
                "pekerjaan",
                "alamat_lengkap",
              ],
            },
          ],
        },
      ],
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Data tidak ditemukan",
      });
    }

    const formatTanggal = (date) => {
      if (!date) return "-";
      const d = new Date(date);
      if (isNaN(d.getTime())) return "-";
      const options = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      return d.toLocaleDateString("id-ID", options);
    };

    const formattedData = {
      id_pengajuan: item.id_pengajuan,
      nomor_pengajuan: "SRT-" + String(item.id_pengajuan).padStart(4, "0"),
      jenis_surat: item.jenis_surat || "Surat Keterangan",
      jenisSurat: {
        id: item.id_pengajuan,
        nama_surat: item.jenis_surat || "Surat Keterangan",
      },
      status: item.status,
      tanggal: item.created_at,
      tanggal_pengajuan: item.created_at,
      tanggal_formatted: formatTanggal(item.created_at),
      created_at: item.created_at,
      keperluan: item.keterangan || "-",
      keterangan: item.keterangan || "-",
      file_ktp: item.file_ktp,
      file_kk: item.file_kk,

      file_hasil: item.file_hasil,

      user: item.user
        ? {
            email: item.user.email,
            penduduk: item.user.penduduk
              ? {
                  nama_lengkap: item.user.penduduk.nama_lengkap,
                  nik: item.user.penduduk.nik,
                  pekerjaan: item.user.penduduk.pekerjaan || "-",
                  alamat: item.user.penduduk.alamat_lengkap || "-",
                }
              : null,
          }
        : null,
      details: [
        { label: "Jenis Surat", value: item.jenis_surat || "Surat Keterangan" },
        { label: "Keperluan", value: item.keterangan || "-" },
        { label: "NIK Pemohon", value: item.user?.penduduk?.nik || "-" },
        {
          label: "Nama Pemohon",
          value: item.user?.penduduk?.nama_lengkap || "-",
        },
        { label: "Pekerjaan", value: item.user?.penduduk?.pekerjaan || "-" },
        { label: "Alamat", value: item.user?.penduduk?.alamat_lengkap || "-" },
        { label: "Email", value: item.user?.email || "-" },
        { label: "Tanggal Pengajuan", value: formatTanggal(item.created_at) },
        { label: "Status", value: item.status.toUpperCase() },
      ],
    };

    res.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error getPengajuanById:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 6. Delete Pengajuan
exports.deletePengajuan = async (req, res) => {
  try {
    const { id } = req.params;
    const surat = await PengajuanSurat.findByPk(id);
    if (!surat)
      return res.status(404).json({ message: "Data tidak ditemukan" });

    await surat.destroy();
    res.json({ success: true, message: "Data berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Get Statistics (UPDATE: Group By Jenis Surat)
exports.getStatistics = async (req, res) => {
  try {
    const { sequelize } = require("../models"); // Butuh ini buat hitung Group By

    // 1. Hitung Status Dasar
    const total = await PengajuanSurat.count();
    const menunggu = await PengajuanSurat.count({
      where: { status: "menunggu" },
    });
    const diproses = await PengajuanSurat.count({
      where: { status: "diproses" },
    });
    const selesai = await PengajuanSurat.count({
      where: { status: "selesai" },
    });
    const ditolak = await PengajuanSurat.count({
      where: { status: "ditolak" },
    });

    // 2. Hitung Surat Terlaris (Group By Jenis)
    const byJenisSuratRaw = await PengajuanSurat.findAll({
      attributes: [
        "jenis_surat",
        [sequelize.fn("COUNT", sequelize.col("id_pengajuan")), "jumlah"],
      ],
      group: ["jenis_surat"],
      order: [[sequelize.col("jumlah"), "DESC"]], // Urutkan dari yang terbanyak
      limit: 8, // Ambil top 5 saja biar grafik gak penuh
    });

    // Format data biar enak dibaca Frontend
    const byJenisSurat = byJenisSuratRaw.map((item) => ({
      name: item.getDataValue("jenis_surat") || "Lainnya",
      jumlah: parseInt(item.getDataValue("jumlah")),
    }));

    res.json({
      success: true,
      data: {
        total,
        menunggu,
        diproses,
        selesai,
        ditolak,
        byJenisSurat, // <-- Data Grafik Batang
      },
    });
  } catch (error) {
    console.error("Error getStatistics:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Get Jenis Surat
exports.getJenisSurat = async (req, res) => {
  try {
    const { sequelize } = require("../models");
    const [daftarSurat] = await sequelize.query(
      "SELECT id_jenis_surat, nama_surat, kode_surat FROM tb_jenis_surat WHERE status_aktif = 'aktif' ORDER BY id_jenis_surat ASC",
    );

    res.json({
      success: true,
      data: daftarSurat,
    });
  } catch (error) {
    console.error("Error getJenisSurat:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Update Status Pengajuan (DENGAN JARING PENANGKAP FILE SUPER KUAT)
exports.updateStatusPengajuan = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, catatan } = req.body;

    // Validasi status
    const validStatus = ["menunggu", "diproses", "selesai", "ditolak"];
    if (!validStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Status tidak valid. Gunakan: menunggu, diproses, selesai, atau ditolak",
      });
    }

    // 1. Cari pengajuan BESERTA DATA USER (Penting buat dapat email!)
    const pengajuan = await PengajuanSurat.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["email"], // Kita butuh emailnya
        },
      ],
    });

    if (!pengajuan) {
      return res.status(404).json({
        success: false,
        message: "Pengajuan tidak ditemukan",
      });
    }

    // 👇 BULLETPROOF FILE CATCHER 👇
    // Mau filenya dikirim lewat .single() atau .any(), pasti ketangkap!
    let uploadedFile = req.file;
    if (!uploadedFile && req.files) {
      if (Array.isArray(req.files)) {
        uploadedFile = req.files[0];
      } else if (req.files["file_hasil"]) {
        uploadedFile = req.files["file_hasil"][0];
      } else if (req.files["file_surat"]) {
        uploadedFile = req.files["file_surat"][0];
      }
    }

    if (status === "selesai" && uploadedFile) {
      pengajuan.file_hasil = uploadedFile.path || uploadedFile.secure_url;
    }
    // 👆 SELESAI PENANGKAP FILE 👆

    // 2. Update status di Database
    pengajuan.status = status;
    if (catatan) {
      pengajuan.keterangan = catatan;
    }
    await pengajuan.save();

    // 3. KIRIM NOTIFIKASI EMAIL (Async - Biarkan berjalan di background)
    // Hanya kirim kalau status 'selesai' atau 'ditolak'
    if (status === "selesai" || status === "ditolak") {
      const emailUser = pengajuan.user?.email;
      const namaSurat = pengajuan.jenis_surat || "Surat Keterangan";

      if (emailUser) {
        // Panggil fungsi kirim email tanpa await agar response tidak lelet
        kirimNotifikasi(emailUser, status, namaSurat, catatan);
      }
    }

    res.json({
      success: true,
      message: `Status berhasil diubah menjadi ${status}.`,
      data: pengajuan,
    });
  } catch (error) {
    console.error("Error updateStatus:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 10. CETAK SURAT PDF (UPDATE FINAL: DENGAN TANDA TANGAN)
exports.cetakSurat = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Ambil Data Pengajuan
    const pengajuan = await PengajuanSurat.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          include: [{ model: Penduduk, as: "penduduk" }],
        },
      ],
    });

    if (!pengajuan)
      return res.status(404).json({ message: "Pengajuan tidak ditemukan" });
    const penduduk = pengajuan.user?.penduduk;
    if (!penduduk)
      return res.status(404).json({ message: "Data penduduk tidak ditemukan" });

    // 2. Helper Format Tanggal
    const formatDate = (dateString) => {
      if (!dateString) return "-";
      return new Date(dateString).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    };

    // 3. Helper Pembersih Keterangan
    const cleanKeterangan = (text) => {
      if (!text) return "-";
      return text
        .replace("Pindah ke ", "")
        .replace("Penghasilan ", "")
        .replace("Nama Almarhum ", "");
    };

    // --- 👇 LOGIKA TANDA TANGAN (BARU) 👇 ---
    let ttdImage = null;
    let showTtd = false;

    // Cek apakah status sudah SELESAI
    if (pengajuan.status === "selesai") {
      try {
        // Cari file gambar di folder src/assets
        const imagePath = path.join(__dirname, "../assets/ttd_kades.jpeg");

        // Cek kalau file ada
        if (fs.existsSync(imagePath)) {
          // Baca file dan ubah jadi format Base64
          const bitmap = fs.readFileSync(imagePath);
          const base64 = bitmap.toString("base64");
          ttdImage = `data:image/png;base64,${base64}`;
          showTtd = true;
        } else {
          console.warn("⚠️ File ttd_kades.jpeg tidak ditemukan di src/assets!");
        }
      } catch (err) {
        console.error("❌ Gagal memuat gambar TTD:", err);
      }
    }
    // --- 👆 SELESAI LOGIKA TANDA TANGAN 👆 ---

    // 4. SIAPKAN DATA UNTUK PDF
    const dataSurat = {
      nomor_surat: String(pengajuan.id_pengajuan).padStart(3, "0"),
      tahun: new Date().getFullYear(),
      nama_lengkap: penduduk.nama_lengkap,
      nik: penduduk.nik,
      tempat_lahir: penduduk.tempat_lahir || "-",
      tanggal_lahir: formatDate(penduduk.tanggal_lahir),
      jenis_kelamin: penduduk.jenis_kelamin,
      pekerjaan: penduduk.pekerjaan || "-",
      alamat: penduduk.alamat_lengkap || "-",
      tanggal_cetak: formatDate(new Date()),
      keterangan_tambahan: cleanKeterangan(pengajuan.keterangan),
      keterangan_usaha: cleanKeterangan(pengajuan.keterangan),
      keperluan: "Persyaratan Administrasi",

      // Kirim Data TTD ke Template
      ttd_image: ttdImage, // String Base64 gambar
      show_ttd: showTtd, // true/false
      nama_kades: "JOKO SAMPURNO", // Ganti nama sesuai Kades Asli
      nip_kades: "-", // Isi NIP jika ada
    };

    // 5. PILIH TEMPLATE
    let templateName = "surat_domisili";
    const jenisSurat = (pengajuan.jenis_surat || "").toLowerCase();

    if (jenisSurat.includes("usaha") || jenisSurat.includes("sku"))
      templateName = "surat_usaha";
    else if (jenisSurat.includes("tidak mampu") || jenisSurat.includes("sktm"))
      templateName = "surat_sktm";
    else if (jenisSurat.includes("skck")) templateName = "surat_pengantar_skck";
    else if (jenisSurat.includes("kematian") || jenisSurat.includes("mati"))
      templateName = "surat_kematian";
    else if (jenisSurat.includes("pindah")) templateName = "surat_pindah";
    else if (jenisSurat.includes("penghasilan") || jenisSurat.includes("gaji"))
      templateName = "surat_penghasilan";
    else if (jenisSurat.includes("domisili")) templateName = "surat_domisili";

    console.log(
      `🖨️ Cetak PDF: ID=${id} | Template=${templateName} | TTD=${showTtd ? "ADA" : "TIDAK"}`,
    );

    // 6. Generate PDF
    const pdfBuffer = await generatePDF(templateName, dataSurat);

    // 7. Kirim Response
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${templateName}-${penduduk.nama_lengkap}.pdf`,
      "Content-Length": pdfBuffer.length,
    });
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error("Error cetakSurat:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mencetak surat",
      error: error.message,
    });
  }
};
