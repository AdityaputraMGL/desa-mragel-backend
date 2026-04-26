const nodemailer = require("nodemailer");

// 1. Setting Akun Pengirim (Transporter)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "kantordesamragel@gmail.com", // ⚠️ GANTI DENGAN EMAIL ABANG
    pass: "xydommxszscxqgia", // ⚠️ GANTI DENGAN APP PASSWORD TADI
  },
});

// 2. Fungsi Kirim Email Notifikasi
exports.kirimNotifikasi = async (
  emailPenerima,
  status,
  namaSurat,
  catatan = "",
) => {
  try {
    let subject = "";
    let htmlContent = "";

    // A. Template Email DITERIMA / SELESAI
    if (status === "selesai") {
      subject = `✅ Surat Anda Telah Terbit! - ${namaSurat}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #10B981;">Permohonan Surat Disetujui! 🎉</h2>
          <p>Halo,</p>
          <p>Kabar gembira! Pengajuan surat Anda untuk <b>"${namaSurat}"</b> telah selesai diproses dan disetujui oleh Admin Desa.</p>
          <hr>
          <p><strong>Status:</strong> <span style="color: #10B981; font-weight: bold;">SELESAI</span></p>
          <p>Silakan login ke aplikasi untuk mengunduh surat digital Anda, atau datang ke Balai Desa jika memerlukan stempel basah.</p>
          <br>
          <p>Terima kasih,<br>Sistem Pelayanan Desa Mragel</p>
        </div>
      `;
    }
    // B. Template Email DITOLAK
    else if (status === "ditolak") {
      subject = `❌ Mohon Maaf, Pengajuan Ditolak - ${namaSurat}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #EF4444;">Pengajuan Perlu Perbaikan ⚠️</h2>
          <p>Halo,</p>
          <p>Mohon maaf, pengajuan surat <b>"${namaSurat}"</b> Anda belum dapat kami proses saat ini.</p>
          <hr>
          <p><strong>Status:</strong> <span style="color: #EF4444; font-weight: bold;">DITOLAK</span></p>
          <p><strong>Alasan Penolakan:</strong></p>
          <p style="background-color: #FEF2F2; padding: 10px; border-left: 4px solid #EF4444;">
            ${catatan || "Data persyaratan kurang lengkap atau tidak sesuai."}
          </p>
          <p>Silakan perbaiki data Anda dan ajukan ulang.</p>
          <br>
          <p>Terima kasih,<br>Sistem Pelayanan Desa Mragel</p>
        </div>
      `;
    }

    // C. Kirim Email
    if (subject) {
      await transporter.sendMail({
        from: '"Pelayanan Desa Mragel" <no-reply@desamragel.com>',
        to: emailPenerima,
        subject: subject,
        html: htmlContent,
      });
      console.log(`📧 Email notifikasi berhasil dikirim ke: ${emailPenerima}`);
    }
  } catch (error) {
    console.error("❌ Gagal mengirim email:", error);
    // Kita tidak throw error agar tidak mengganggu proses update status di database
  }
};
