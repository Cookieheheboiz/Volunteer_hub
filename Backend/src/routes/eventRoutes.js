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

// POST /api/events/:id/register - Tình nguyện viên đăng ký tham gia sự kiện
router.post(
  "/:id/register",
  authMiddleware,
  checkRole(["VOLUNTEER"]),
  eventController.registerEvent
);

module.exports = router;
