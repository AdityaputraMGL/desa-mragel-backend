const sequelize = require("../config/database");
const { DataTypes } = require("sequelize"); // 👈 WAJIB ADA: Buat model Berita yang baru

// 1. Import Model Lama (Yang formatnya 'Jomblo'/Langsung)
const User = require("./User");
const Penduduk = require("./Penduduk");
const PengajuanSurat = require("./PengajuanSurat");
const Pengaduan = require("./Pengaduan");

// 2. Import Model Berita (Format Baru: Function)
// Karena Berita.js tadi kita ubah jadi function, kita harus "panggil" dia
const BeritaModel = require("./Berita");
const Berita = BeritaModel(sequelize, DataTypes);

const db = {};
db.sequelize = sequelize;

// 3. Masukkan SEMUA Model ke object db
db.User = User;
db.Penduduk = Penduduk;
db.PengajuanSurat = PengajuanSurat;
db.Pengaduan = Pengaduan;
db.Berita = Berita; // 👈 INI YANG TADI HILANG!

// ===========================================
// DEFINISI RELASI
// ===========================================

// 1. Relasi User <-> Penduduk
User.belongsTo(Penduduk, { foreignKey: "id_penduduk", as: "penduduk" });
Penduduk.hasOne(User, { foreignKey: "id_penduduk", as: "user" });

// 2. Relasi Pengajuan Surat <-> User
PengajuanSurat.belongsTo(User, { foreignKey: "id_user", as: "user" });
User.hasMany(PengajuanSurat, { foreignKey: "id_user", as: "pengajuan_surat" });

// 3. Relasi Pengaduan <-> User
Pengaduan.belongsTo(User, { foreignKey: "id_user", as: "user" });
User.hasMany(Pengaduan, { foreignKey: "id_user", as: "pengaduan" });

// 4. Relasi Berita (Opsional, kalau mau disambung ke User penulis)
// Berita.belongsTo(User, { foreignKey: 'penulis', as: 'author' });

module.exports = db;
