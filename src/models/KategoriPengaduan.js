const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const KategoriPengaduan = sequelize.define(
  "KategoriPengaduan",
  {
    id_kategori: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nama_kategori: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    deskripsi: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status_aktif: {
      type: DataTypes.ENUM("aktif", "nonaktif"),
      defaultValue: "aktif",
    },
  },
  {
    tableName: "tb_kategori_pengaduan",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

module.exports = KategoriPengaduan;
