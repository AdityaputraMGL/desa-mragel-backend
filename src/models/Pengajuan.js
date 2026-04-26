const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Pengajuan = sequelize.define(
  "Pengajuan",
  {
    id_pengajuan: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_user: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tb_users",
        key: "id_user",
      },
    },
    id_jenis_surat: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tb_jenis_surat",
        key: "id_jenis_surat",
      },
    },
    id_petugas: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "tb_users",
        key: "id_user",
      },
    },
    nomor_pengajuan: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("menunggu", "diproses", "selesai", "ditolak"),
      defaultValue: "menunggu",
    },
    tanggal_pengajuan: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    catatan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "tb_pengajuan",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

module.exports = Pengajuan;
