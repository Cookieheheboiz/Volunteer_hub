const prisma = require("../config/prisma");

exports.createPost = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const { content } = req.body;
    const authorId = req.user.userId;

    // Kiểm tra sự kiện có tồn tại không
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({ error: "Sự kiện không tồn tại" });
    }

    // Tạo bài viết
    const post = await prisma.post.create({
      data: {
        content,
        authorId,
        eventId,
      },
      include: {
        author: {
          select: { name: true, email: true },
        },
      },
    });

    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi tạo bài viết" });
  }
};

// Lấy danh sách bài viết của sự kiện
exports.getPostsByEvent = async (req, res) => {
  try {
    const { id: eventId } = req.params;

    const posts = await prisma.post.findMany({
      where: { eventId },
      include: {
        author: {
          select: { name: true, email: true },
        },
        comments: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        likes: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi lấy bài viết" });
  }
};

// Thêm bình luận vào bài viết
exports.addComment = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    // Kiểm tra bài viết có tồn tại không
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ error: "Bài viết không tồn tại" });
    }

    // Tạo bình luận
    const comment = await prisma.comment.create({
      data: {
        content,
        userId,
        postId,
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi thêm bình luận" });
  }
};

// Toggle like (thả tim hoặc bỏ tim)
exports.toggleLike = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user.userId;

    // Kiểm tra bài viết có tồn tại không
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ error: "Bài viết không tồn tại" });
    }

    // Kiểm tra đã like chưa
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingLike) {
      // Nếu đã like thì bỏ like
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });

      return res.json({ message: "Đã bỏ thích" });
    } else {
      // Nếu chưa like thì tạo like mới
      const like = await prisma.like.create({
        data: {
          userId,
          postId,
        },
      });

      return res.status(201).json({ message: "Đã thích", like });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi thao tác like" });
  }
};
