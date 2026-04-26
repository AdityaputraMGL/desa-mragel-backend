const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "newaditya6@gmail.com", // GANTI dengan email Gmail pengirim
    pass: "skgtedbpgmrnicwg", // GANTI dengan App Password 16 digit
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: '"Balaidesa Mragel" <no-reply@balaidesamragel.id>',
      to: to,
      subject: subject,
      html: html,
    });
    console.log("Email terkirim: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Gagal kirim email:", error);
    return false;
  }
};

module.exports = sendEmail;
