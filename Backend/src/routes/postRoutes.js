const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const { authMiddleware } = require("../middleware/auth");

// POST /api/posts/events/:id/posts - Đăng bài viết mới vào sự kiện
router.post("/events/:id/posts", authMiddleware, postController.createPost);

// GET /api/posts/events/:id/posts - Lấy danh sách bài viết của sự kiện
router.get("/events/:id/posts", postController.getPostsByEvent);

// POST /api/posts/:id/comments - Bình luận vào bài viết
router.post("/:id/comments", authMiddleware, postController.addComment);

// POST /api/posts/:id/like - Thả tim hoặc bỏ tim (Toggle)
router.post("/:id/like", authMiddleware, postController.toggleLike);

module.exports = router;
