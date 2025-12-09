const prisma = require("../config/prisma");

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50, // Giới hạn 50 thông báo gần nhất
    });

    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi lấy thông báo" });
  }
};

// Đánh dấu thông báo đã đọc
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Kiểm tra thông báo có thuộc về user này không
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!notification) {
      return res.status(404).json({ error: "Thông báo không tồn tại" });
    }

    // Cập nhật trạng thái
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json(updatedNotification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi cập nhật thông báo" });
  }
};
