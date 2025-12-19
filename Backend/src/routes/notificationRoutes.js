const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { authMiddleware } = require("../middleware/auth");

// GET /api/notifications - Lấy danh sách thông báo của user đang đăng nhập
router.get("/", authMiddleware, notificationController.getNotifications);

// PATCH /api/notifications/:id/read - Đánh dấu thông báo đã đọc
router.patch("/:id/read", authMiddleware, notificationController.markAsRead);

// PATCH /api/notifications/read-all - Đánh dấu tất cả thông báo đã đọc
router.patch("/read-all", authMiddleware, notificationController.markAllAsRead);

// DELETE /api/notifications/:id - Xóa thông báo
router.delete("/:id", authMiddleware, notificationController.deleteNotification);

module.exports = router;
