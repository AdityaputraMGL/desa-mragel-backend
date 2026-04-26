const { JenisSurat } = require("./src/models"); // Sesuaikan path jika models ada di dalam src

async function testConnection() {
  try {
    console.log("🔍 Mencoba mengambil data JenisSurat...");

    // Coba ambil semua data tanpa filter
    const surat = await JenisSurat.findAll();

    console.log("✅ Berhasil!");
    console.log(`📊 Ditemukan: ${surat.length} data surat.`);

    if (surat.length > 0) {
      console.log("📝 Contoh data pertama:", surat[0].nama_surat);
    } else {
      console.log("⚠️ Tabel terbaca tapi KOSONG.");
    }
  } catch (error) {
    console.error("❌ ERROR:", error.message);
    console.error("Detail:", error);
  }
}

testConnection();
