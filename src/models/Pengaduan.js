const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
//const User = require("./User");

const Pengaduan = sequelize.define(
  "Pengaduan",
  {
    id_pengaduan: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_user: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    judul: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isi_pengaduan: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    // 👇 INI DIA LACI YANG KITA TAMBAHKAN 👇
    kategori: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    foto_bukti: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    foto_hasil: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("menunggu", "diproses", "selesai"),
      defaultValue: "menunggu",
    },
    tanggapan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "tb_pengaduan",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

// Setup Relasi
//Pengaduan.belongsTo(User, { foreignKey: "id_user", as: "user" });

module.exports = Pengaduan;
