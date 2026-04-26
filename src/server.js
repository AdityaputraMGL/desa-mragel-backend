const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load env variables FIRST
dotenv.config();

// Import database dan models (sudah include associations)
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
// MIDDLEWARE
// ===========================================

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files untuk uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Logging middleware (development only)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

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

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Balaidesa Mragel API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      dashboard: "/api/dashboard",
      pengajuan: "/api/pengajuan",
      pengaduan: "/api/pengaduan",
      penduduk: "/api/penduduk",
      berita: "/api/berita",
      health: "/api/health",
    },
  });
});

// ===========================================
// ERROR HANDLERS
// ===========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);

  // Sequelize validation error
  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: err.errors.map((e) => e.message),
    });
  }

  // Sequelize unique constraint error
  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(400).json({
      success: false,
      message: "Data already exists",
      errors: err.errors.map((e) => e.message),
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ===========================================
// START SERVER
// ===========================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connected successfully");

    // Sync models (development only)
    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ alter: false });
      console.log("✅ Database models synchronized");
    }

    // Start listening
    app.listen(PORT, () => {
      console.log("");
      console.log("=".repeat(60));
      console.log("🚀 BALAIDESA MRAGEL API SERVER");
      console.log("=".repeat(60));
      console.log(`📍 Server URL    : http://localhost:${PORT}`);
      console.log(
        `🌐 Frontend URL  : ${process.env.FRONTEND_URL || "http://localhost:5173"}`,
      );
      console.log(
        `📊 Environment   : ${process.env.NODE_ENV || "development"}`,
      );
      console.log(
        `🗄️  Database      : ${process.env.DB_NAME || "balaidesa_db"}`,
      );
      console.log(`⏰ Started at    : ${new Date().toLocaleString("id-ID")}`);
      console.log("=".repeat(60));
      console.log("");
      console.log("📋 Available endpoints:");
      console.log(`   POST   /api/auth/register`);
      console.log(`   POST   /api/auth/login`);
      console.log(`   GET    /api/auth/profile`);
      console.log(`   GET    /api/dashboard/user`);
      console.log(`   GET    /api/dashboard/admin`);
      console.log(`   GET    /api/pengajuan/my`);
      console.log(`   GET    /api/pengajuan/jenis-surat`);
      console.log(`   POST   /api/pengajuan`);
      console.log(`   GET    /api/health`);
      console.log("");
      console.log("✨ Server is ready to accept requests");
      console.log("");
    });
  } catch (error) {
    console.error("");
    console.error("=".repeat(60));
    console.error("❌ FAILED TO START SERVER");
    console.error("=".repeat(60));
    console.error("Error:", error.message);
    console.error("");
    if (error.original) {
      console.error("Database Error:", error.original.message);
    }
    console.error("=".repeat(60));
    console.error("");
    process.exit(1);
  }
};

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled Rejection:", error);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
