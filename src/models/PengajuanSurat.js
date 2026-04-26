const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
// Hapus import User agar tidak bentrok
// const User = require("./User");

const PengajuanSurat = sequelize.define(
  "PengajuanSurat",
  {
    id_pengajuan: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_user: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    jenis_surat: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    keterangan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("menunggu", "diproses", "selesai", "ditolak"),
      defaultValue: "menunggu",
    },
    file_ktp: {
      type: DataTypes.STRING,
      allowNull: true, // Boleh kosong (opsional)
    },
    file_kk: {
      type: DataTypes.STRING,
      allowNull: true, // Boleh kosong (opsional)
    },
    file_hasil: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "tb_pengajuan_surat",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

// --- BAGIAN INI WAJIB DIHAPUS/KOMENTAR ---
// (Karena sudah diurus oleh index.js)
// PengajuanSurat.belongsTo(User, { foreignKey: "id_user", as: "user" });
// -----------------------------------------

module.exports = PengajuanSurat;
