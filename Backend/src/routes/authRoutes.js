const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authMiddleware } = require("../middleware/auth");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/google", authController.googleLogin);
router.get("/me", authMiddleware, authController.getMe);

// Thêm route đổi mật khẩu (cần đăng nhập mới đổi được)
router.put("/change-password", authMiddleware, authController.changePassword);
router.put("/profile", authMiddleware, authController.updateProfile);

module.exports = router;
