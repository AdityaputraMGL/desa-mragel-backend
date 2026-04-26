require("mysql2"); // Paksa bawa supir database
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load env variables
dotenv.config();

// Import database dan models
const { sequelize } = require("./models");

// Import routes
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const pengajuanRoutes = require("./routes/pengajuanRoutes");
const pengaduanRoutes = require("./routes/pengaduanRoutes");
const pendudukRoutes = require("./routes/pendudukRoutes");
const beritaRoutes = require("./routes/beritaRoutes");

const app = express();

// ===========================================
// MIDDLEWARE (KUNCI LOGIN & KONEKSI)
// ===========================================
app.use(
  cors({
    origin: true, // Izinkan semua domain (Vercel Frontend) masuk
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (Arahkan ke folder public/uploads)
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));
app.use("/public", express.static(path.join(__dirname, "../public")));

// ===========================================
// ROUTES
// ===========================================
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/pengajuan-surat", pengajuanRoutes);
app.use("/api/pengajuan", pengajuanRoutes);
app.use("/api/pengaduan", pengaduanRoutes);
app.use("/api/penduduk", pendudukRoutes);
app.use("/api/berita", beritaRoutes);

// Root & Health check untuk Vercel
app.get("/", (req, res) => {
  res.json({
    message: "Balaidesa Mragel API Online",
    version: "1.0.0",
    status: "Ready",
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// ===========================================
// ERROR HANDLERS
// ===========================================
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// ===========================================
// VERCEL ADAPTER (DATABASE CHECK)
// ===========================================
// Di Vercel, kita tidak pakai app.listen(PORT) karena sistemnya Serverless
sequelize
  .authenticate()
  .then(() => console.log("✅ Database connected successfully"))
  .catch((err) => console.error("❌ Database connection error:", err));

// Export app untuk Vercel
module.exports = app;
