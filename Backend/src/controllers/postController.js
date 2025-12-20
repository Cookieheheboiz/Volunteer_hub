const prisma = require("../config/prisma");
const { createNotification, createBulkNotifications } = require("../utils/notificationHelper");

exports.createPost = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const { content } = req.body;
    const authorId = req.user.userId;

    // Kiểm tra sự kiện có tồn tại không
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: {
          where: {
            status: { in: ["APPROVED", "ATTENDED"] }, // Chỉ gửi cho người đã được duyệt
          },
          select: {
            userId: true,
          },
        },
      },
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
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    // Gửi thông báo cho tất cả người đã đăng ký sự kiện (trừ tác giả)
    const registeredUserIds = event.registrations
      .map((reg) => reg.userId)
      .filter((userId) => userId !== authorId); // Không gửi cho chính mình

    if (registeredUserIds.length > 0) {
      await createBulkNotifications(
        registeredUserIds,
        "NEW_POST",
        `${post.author.name} đã đăng bài viết mới trong sự kiện "${event.title}"`,
        `/events/${eventId}`
      );
    }

    res.status(201).json({ ...post, likedBy: [], comments: [] });
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
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        likes: {
          select: {
            userId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedPosts = posts.map((post) => ({
      ...post,
      likedBy: post.likes.map((like) => like.userId),
    }));

    res.json(formattedPosts);
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
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: "Bài viết không tồn tại" });
    }

    // Tạo bình luận
    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: userId,
        postId,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    // Tạo thông báo cho tác giả bài viết (nếu không phải chính mình comment)
    if (post.authorId !== userId) {
      await createNotification(
        post.authorId,
        "NEW_COMMENT",
        `${comment.author.name} đã bình luận vào bài viết của bạn`,
        `/post/${postId}`
      );
    }

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
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: "Bài viết không tồn tại" });
    }

    // Kiểm tra đã like chưa
    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingLike) {
      // Nếu đã like thì bỏ like
      await prisma.postLike.delete({
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
      const like = await prisma.postLike.create({
        data: {
          userId,
          postId,
        },
      });

      // Lấy thông tin người like
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      // Tạo thông báo cho tác giả bài viết (nếu không phải chính mình like)
      if (post.authorId !== userId) {
        await createNotification(
          post.authorId,
          "POST_LIKE",
          `${user.name} đã thích bài viết của bạn`,
          `/post/${postId}`
        );
      }

      return res.status(201).json({ message: "Đã thích", like });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi thao tác like" });
  }
};
