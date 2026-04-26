// src/routes/dashboardRoutes.js
const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { authenticate, authorize } = require("../middleware/auth");

// All dashboard routes require authentication
router.use(authenticate);

// User dashboard
router.get("/user", dashboardController.getUserDashboard);

// Admin dashboard (admin & petugas only)
router.get(
  "/admin",
  authorize(["admin", "petugas"]),
  dashboardController.getAdminDashboard,
);

module.exports = router;
