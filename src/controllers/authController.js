// backend/src/controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Penduduk } = require("../models"); // ← PENTING: Import dari index.js
const sendEmail = require("../utils/emailSender");
const otpCache = new Map();

// Register
// --- LOGIKA REGISTER (JALAN TENGAH: BEBAS DAFTAR TAPI ANTI-DOUBLE NIK) ---
exports.register = async (req, res) => {
  try {
    // Kita ambil semua data dari form register
    const {
      nik,
      email,
      password,
      nama_lengkap,
      tempat_lahir,
      tanggal_lahir,
      jenis_kelamin,
      alamat,
      rt,
      rw,
      no_kk,
    } = req.body;

    // 1. Cek email sudah digunakan atau belum
    const existingUserEmail = await User.findOne({ where: { email } });
    if (existingUserEmail) {
      return res.status(400).json({
        success: false,
        message: "Email sudah terdaftar. Silakan gunakan email lain.",
      });
    }

    // 2. Cek apakah NIK ini sudah ada di tabel Penduduk
    let penduduk = await Penduduk.findOne({ where: { nik } });

    if (penduduk) {
      // 3. (CEK KEPEMILIKAN AKUN) Kalau NIK ada, pastikan belum dipakai akun lain
      const existingUserNik = await User.findOne({
        where: { id_penduduk: penduduk.id_penduduk },
      });
      if (existingUserNik) {
        return res.status(400).json({
          success: false,
          message: "NIK ini sudah memiliki akun. Silakan langsung Login.",
        });
      }
    } else {
      // KARENA VALIDASI NOMOR 2 DIHAPUS:
      // Kalau NIK belum ada, kita buatkan data Penduduk baru secara otomatis
      penduduk = await Penduduk.create({
        nik,
        nama_lengkap,
        tempat_lahir,
        tanggal_lahir,
        jenis_kelamin,
        alamat_lengkap: alamat
          ? `${alamat} RT ${rt || "0"} RW ${rw || "0"}`
          : "-",
        agama: req.body.agama || "Islam",
        status_perkawinan: req.body.status_kawin || "Belum Kawin",
        pekerjaan: req.body.pekerjaan || "-",
      });
    }

    // 4. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Buat user dan hubungkan ke ID Penduduk
    const user = await User.create({
      id_penduduk: penduduk.id_penduduk,
      email,
      password: hashedPassword,
      role: "user",
    });

    res.status(201).json({
      success: true,
      message: "Registrasi berhasil! Silakan login.",
      data: {
        id_user: user.id_user,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("❌ Register error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat registrasi",
      error: error.message,
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 Login attempt:", email);

    // Cek user dengan include penduduk
    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: Penduduk,
          as: "penduduk",
        },
      ],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah",
      });
    }

    // Cek status akun
    if (user.status_akun !== "active") {
      return res.status(401).json({
        success: false,
        message: "Akun Anda tidak aktif",
      });
    }

    // Verifikasi password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah",
      });
    }

    // Update last login
    await user.update({ last_login: new Date() });

    // Generate token
    const token = jwt.sign(
      { id: user.id_user, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" },
    );

    console.log("✅ Login successful for:", email);

    // Kirim data user lengkap dengan penduduk
    const userData = {
      id_user: user.id_user,
      email: user.email,
      role: user.role,
      status_akun: user.status_akun,
      penduduk: user.penduduk,
    };

    res.json({
      success: true,
      message: "Login berhasil",
      data: {
        user: userData,
        token,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat login",
      error: error.message,
    });
  }
};

// Get Profile
exports.getProfile = async (req, res) => {
  try {
    console.log("📋 Getting profile for user ID:", req.user.id_user);

    const user = await User.findByPk(req.user.id_user, {
      include: [
        {
          model: Penduduk,
          as: "penduduk",
          required: false,
        },
      ],
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    console.log("✅ Profile found for:", user.email);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("❌ Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data profil",
      error: error.message,
    });
  }
};

// Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const { nama_lengkap, email, alamat_lengkap, pekerjaan } = req.body;

    const user = await User.findByPk(req.user.id_user);

    // Update email jika berubah
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email sudah digunakan",
        });
      }
      await user.update({ email });
    }

    // Update data penduduk
    if (user.id_penduduk) {
      const penduduk = await Penduduk.findByPk(user.id_penduduk);
      const updateData = {};
      if (nama_lengkap) updateData.nama_lengkap = nama_lengkap;
      if (alamat_lengkap) updateData.alamat_lengkap = alamat_lengkap; // ✅ Field sesuai DB
      if (pekerjaan) updateData.pekerjaan = pekerjaan;
      await penduduk.update(updateData);
    }

    res.json({
      success: true,
      message: "Profil berhasil diupdate",
    });
  } catch (error) {
    console.error("❌ Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal update profil",
      error: error.message,
    });
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findByPk(req.user.id_user);

    // Verifikasi password lama
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Password lama salah",
      });
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    res.json({
      success: true,
      message: "Password berhasil diubah",
    });
  } catch (error) {
    console.error("❌ Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengubah password",
      error: error.message,
    });
  }
};

// 👇 --- UPDATE PROFIL KHUSUS ADMIN (Email & Password) --- 👇
exports.updateAdminProfile = async (req, res) => {
  try {
    const { email, passwordLama, passwordBaru } = req.body;
    const user = await User.findByPk(req.user.id_user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Admin tidak ditemukan",
      });
    }

    // 1. Update Email (Jika Berubah)
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email ini sudah digunakan oleh akun lain",
        });
      }
      user.email = email;
    }

    // 2. Update Password (Jika Diisi)
    if (passwordLama && passwordBaru) {
      // Verifikasi password lama dulu
      const isMatch = await bcrypt.compare(passwordLama, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Password lama yang Anda masukkan salah!",
        });
      }

      // Hash password baru
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(passwordBaru, salt);
    }

    // Simpan semua perubahan
    await user.save();

    res.json({
      success: true,
      message: "Profil Admin berhasil diperbarui!",
    });
  } catch (error) {
    console.error("❌ Update Admin Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat update profil",
      error: error.message,
    });
  }
};

// --- LOGIKA FORGOT PASSWORD (OTP) ---
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Cek Email User
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Email tidak terdaftar." });
    }

    // 2. Buat Kode OTP 6 Digit (Acak)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Simpan OTP ke memori sementara (Berlaku 15 menit)
    otpCache.set(email, {
      otp: otp,
      expires: Date.now() + 15 * 60 * 1000, // 15 menit
    });

    // 4. Desain Email OTP
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #2563eb; margin: 0;">Reset Password</h2>
          <p style="color: #666; margin-top: 5px;">Desa Mragel - Lamongan</p>
        </div>
        <p>Halo,</p>
        <p>Kami menerima permintaan untuk mereset password akun Anda. Silakan masukkan kode OTP berikut pada halaman aplikasi:</p>
        <div style="text-align: center; margin: 35px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e40af; background: #eff6ff; padding: 15px 30px; border-radius: 10px; border: 1px dashed #bfdbfe;">
            ${otp}
          </span>
        </div>
        <p style="color: #ef4444; font-size: 13px; text-align: center;"><b>PENTING: Jangan berikan kode ini kepada siapapun!</b></p>
        <p style="color: #888; font-size: 12px; margin-top: 30px; text-align: center;">Kode ini akan kadaluarsa dalam waktu 15 menit.</p>
      </div>
    `;

    // 5. Kirim Email
    const emailSuccess = await sendEmail(
      email,
      "Kode OTP Reset Password - Desa Mragel",
      htmlContent,
    );

    if (emailSuccess) {
      res.json({
        success: true,
        message: "Kode OTP telah dikirim ke email Anda.",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Gagal mengirim email OTP, coba lagi nanti.",
      });
    }
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server.",
    });
  }
};

// --- LOGIKA RESET PASSWORD (VERIFIKASI OTP) ---
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // 1. Cek apakah ada OTP untuk email ini di memori
    const record = otpCache.get(email);
    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Sesi OTP tidak ditemukan. Silakan request ulang kode OTP.",
      });
    }

    // 2. Cek apakah OTP kadaluarsa (lebih dari 15 menit)
    if (Date.now() > record.expires) {
      otpCache.delete(email); // Hapus OTP yang hangus
      return res.status(400).json({
        success: false,
        message: "Kode OTP sudah kadaluarsa. Silakan request ulang.",
      });
    }

    // 3. Cek kecocokan OTP
    if (record.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Kode OTP salah!",
      });
    }

    // 4. Kalau OTP Benar, Hash Password Baru
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 5. Update Password di Database
    await User.update({ password: hashedPassword }, { where: { email } });

    // 6. Bersihkan memori OTP biar aman
    otpCache.delete(email);

    res.json({
      success: true,
      message: "Password berhasil diubah. Silakan login dengan password baru.",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mereset password. Terjadi kesalahan server.",
    });
  }
};
