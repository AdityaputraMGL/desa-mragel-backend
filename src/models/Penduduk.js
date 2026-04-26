const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Penduduk = sequelize.define(
  "Penduduk",
  {
    id_penduduk: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nik: {
      type: DataTypes.STRING(16),
      unique: true,
      allowNull: false,
    },
    nama_lengkap: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    tempat_lahir: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    tanggal_lahir: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    jenis_kelamin: {
      type: DataTypes.ENUM("Laki-laki", "Perempuan"),
      allowNull: false,
    },
    alamat_lengkap: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    agama: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    status_perkawinan: {
      type: DataTypes.STRING(20),
      allowNull: true, // Kawin, Belum Kawin, Cerai Hidup, dll
    },
    pekerjaan: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    tableName: "tb_penduduk",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

module.exports = Penduduk;
