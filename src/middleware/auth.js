// src/middleware/auth.js
const jwt = require("jsonwebtoken");
const { User } = require("../models");

/**
 * Middleware untuk autentikasi JWT
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Akses ditolak. Token tidak ditemukan.",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("🔐 Decoded token:", decoded);

    // Find user
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User tidak ditemukan.",
      });
    }

    if (user.status_akun !== "active") {
      return res.status(401).json({
        success: false,
        message: "Akun tidak aktif.",
      });
    }

    // Attach user to request
    req.user = {
      id_user: user.id_user,
      email: user.email,
      role: user.role,
      id_penduduk: user.id_penduduk,
    };

    req.token = token;

    console.log("✅ Auth successful for:", req.user.email);

    next();
  } catch (error) {
    console.error("❌ Auth error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token tidak valid.",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token sudah kadaluarsa.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Autentikasi gagal.",
      error: error.message,
    });
  }
};

/**
 * Middleware untuk otorisasi berdasarkan role
 * @param {Array} roles - Array of allowed roles
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login first.",
      });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses ke resource ini.",
        requiredRoles: roles,
        yourRole: req.user.role,
      });
    }

    next();
  };
};

// Export dengan nama yang konsisten
module.exports = {
  authenticate,
  authorize,
  auth: authenticate,
  verifyToken: authenticate,
  checkRole: authorize,
  isAdmin: authorize(["admin"]),
};
