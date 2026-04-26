const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const authController = require("../controllers/authController");

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// Protected routes
router.get("/profile", auth, authController.getProfile);
router.put("/profile", auth, authController.updateProfile);
router.put("/change-password", auth, authController.changePassword);
router.put("/update-profile", auth, authController.updateAdminProfile);

module.exports = router;
