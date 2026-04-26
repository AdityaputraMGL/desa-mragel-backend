const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const JenisSurat = sequelize.define(
  "JenisSurat",
  {
    id_jenis_surat: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nama_surat: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    kode_surat: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    // GANTI INI: Gunakan JSON agar format ["Item1", "Item2"] dari database terbaca sebagai Array, bukan String
    persyaratan: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    keterangan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status_aktif: {
      type: DataTypes.ENUM("aktif", "nonaktif"),
      defaultValue: "aktif",
    },
  },
  {
    tableName: "tb_jenis_surat", // Sudah benar sesuai screenshot DB Anda
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

module.exports = JenisSurat;
