const prisma = require("../config/prisma");

/**
 * Tạo thông báo cho người dùng
 * @param {string} recipientId - ID người nhận thông báo
 * @param {string} type - Loại thông báo
 * @param {string} content - Nội dung thông báo
 * @param {string} link - Đường dẫn liên quan (optional)
 */
async function createNotification(recipientId, type, content, link = null) {
  try {
    const notification = await prisma.notification.create({
      data: {
        recipientId,
        type,
        content,
        link,
        isRead: false,
      },
    });
    return notification;
  } catch (error) {
    console.error("Lỗi khi tạo thông báo:", error);
    return null;
  }
}

/**
 * Tạo thông báo cho nhiều người dùng cùng lúc
 * @param {string[]} recipientIds - Mảng ID người nhận
 * @param {string} type - Loại thông báo
 * @param {string} content - Nội dung thông báo
 * @param {string} link - Đường dẫn liên quan (optional)
 */
async function createBulkNotifications(recipientIds, type, content, link = null) {
  try {
    const notifications = recipientIds.map((recipientId) => ({
      recipientId,
      type,
      content,
      link,
      isRead: false,
    }));

    const result = await prisma.notification.createMany({
      data: notifications,
    });
    return result;
  } catch (error) {
    console.error("Lỗi khi tạo thông báo hàng loạt:", error);
    return null;
  }
}

module.exports = {
  createNotification,
  createBulkNotifications,
};
