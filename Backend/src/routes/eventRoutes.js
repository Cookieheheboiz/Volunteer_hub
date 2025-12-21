const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
const { authMiddleware, checkRole } = require("../middleware/auth");

// GET /api/events - Lấy danh sách sự kiện đã được duyệt (Công khai)
router.get("/", eventController.getAllEvents);

// GET /api/events/admin/all - Lấy tất cả sự kiện (Chỉ ADMIN)
router.get(
  "/admin/all",
  authMiddleware,
  checkRole(["ADMIN"]),
  eventController.getAllEventsForAdmin
);

// GET /api/events/my/events - Lấy danh sách sự kiện của manager (Cần auth)
router.get(
  "/my/events",
  authMiddleware,
  checkRole(["EVENT_MANAGER"]),
  eventController.getMyEvents
);

// GET /api/events/:id - Lấy chi tiết 1 sự kiện (Công khai)
router.get("/:id", eventController.getEventById);

// POST /api/events - Tạo sự kiện mới (Chỉ EVENT_MANAGER)
router.post(
  "/",
  authMiddleware,
  checkRole(["EVENT_MANAGER"]),
  eventController.createEvent
);

// PUT /api/events/:id - Cập nhật sự kiện (Chỉ EVENT_MANAGER)
router.put(
  "/:id",
  authMiddleware,
  checkRole(["EVENT_MANAGER"]),
  eventController.updateEvent
);

// DELETE /api/events/:id - Xóa sự kiện (Chỉ EVENT_MANAGER)
router.delete(
  "/:id",
  authMiddleware,
  checkRole(["EVENT_MANAGER"]),
  eventController.deleteEvent
);

// POST /api/events/:id/register - Tình nguyện viên đăng ký tham gia sự kiện
router.post(
  "/:id/register",
  authMiddleware,
  checkRole(["VOLUNTEER"]),
  eventController.registerEvent
);

// DELETE /api/events/:id/register - Hủy đăng ký tham gia sự kiện
router.delete(
  "/:id/register",
  authMiddleware,
  checkRole(["VOLUNTEER"]),
  eventController.cancelRegistration
);

// PATCH /api/events/:id/registrations/:userId/approve - Duyệt đăng ký
router.patch(
  "/:id/registrations/:userId/approve",
  authMiddleware,
  checkRole(["EVENT_MANAGER"]),
  eventController.approveRegistration
);

// PATCH /api/events/:id/registrations/:userId/reject - Từ chối đăng ký
router.patch(
  "/:id/registrations/:userId/reject",
  authMiddleware,
  checkRole(["EVENT_MANAGER"]),
  eventController.rejectRegistration
);

// PATCH /api/events/:id/registrations/:userId/attended - Đánh dấu hoàn thành
router.patch(
  "/:id/registrations/:userId/attended",
  authMiddleware,
  checkRole(["EVENT_MANAGER"]),
  eventController.markAttended
);

// GET /api/events/:id/registrations/export/csv - Export danh sách đăng ký ra CSV
router.get(
  "/:id/registrations/export/csv",
  authMiddleware,
  checkRole(["EVENT_MANAGER"]),
  eventController.exportEventRegistrationsCSV
);

module.exports = router;
