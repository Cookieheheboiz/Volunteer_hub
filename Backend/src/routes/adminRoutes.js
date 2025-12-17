const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authMiddleware, checkRole } = require("../middleware/auth");

// ============ THỐNG KÊ (Mới từ main) ============

// GET /api/admin/stats - Lấy thống kê tổng quan
router.get(
    "/stats",
    authMiddleware,
    checkRole(["ADMIN"]),
    adminController.getStats
);

// ============ QUẢN LÝ SỰ KIỆN ============

// GET /api/admin/events - Lấy tất cả events (bao gồm PENDING, APPROVED, REJECTED) - (Mới từ main)
router.get(
    "/events",
    authMiddleware,
    checkRole(["ADMIN"]),
    adminController.getAllEvents
);

// PATCH /api/admin/events/:id/approve - Duyệt sự kiện
router.patch(
    "/events/:id/approve",
    authMiddleware,
    checkRole(["ADMIN"]),
    adminController.approveEvent
);

// PATCH /api/admin/events/:id/reject - Từ chối sự kiện
router.patch(
    "/events/:id/reject",
    authMiddleware,
    checkRole(["ADMIN"]),
    adminController.rejectEvent
);

// ============ QUẢN LÝ USER ============

// GET /api/admin/users - Lấy danh sách user (có phân trang & lọc)
router.get(
    "/users",
    authMiddleware,
    checkRole(["ADMIN"]),
    adminController.getUsers
);

// PATCH /api/admin/users/:id/toggle-status - Khóa/Mở khóa tài khoản
router.patch(
    "/users/:id/toggle-status",
    authMiddleware,
    checkRole(["ADMIN"]),
    adminController.toggleUserStatus
);

// ============ EXPORT DỮ LIỆU ============

// GET /api/admin/export/events - Export danh sách sự kiện ra CSV
router.get(
    "/export/events",
    authMiddleware,
    checkRole(["ADMIN"]),
    adminController.rejectEvent
);

// ============ EXPORT DỮ LIỆU ============

// GET /api/admin/export/events/csv - Export danh sách sự kiện ra CSV
router.get(
    "/export/events/csv",
    authMiddleware,
    checkRole(["ADMIN"]),
    adminController.exportEventsCSV
);

// GET /api/admin/export/events/json - Export danh sách sự kiện ra JSON
router.get(
    "/export/events/json",
    authMiddleware,
    checkRole(["ADMIN"]),
    adminController.exportEventsJSON
);

// GET /api/admin/export/users/csv - Export danh sách users ra CSV
router.get(
    "/export/users/csv",
    authMiddleware,
    checkRole(["ADMIN"]),
    adminController.exportUsersCSV
);

// GET /api/admin/export/users/json - Export danh sách users ra JSON
router.get(
    "/export/users/json",
    authMiddleware,
    checkRole(["ADMIN"]),
    adminController.exportUsersJSON
);

module.exports = router;