module.exports = (sequelize, DataTypes) => {
  const Berita = sequelize.define(
    "Berita",
    {
      id_berita: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      judul: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      kategori: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      isi_berita: {
        // Kita sepakati namanya 'isi_berita' ya
        type: DataTypes.TEXT,
        allowNull: false,
      },
      penulis: {
        type: DataTypes.STRING(100),
        defaultValue: "Admin Desa",
      },
      gambar: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      tanggal_posting: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "tb_berita",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );

  return Berita;
};
