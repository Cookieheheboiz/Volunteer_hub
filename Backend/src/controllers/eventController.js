const prisma = require("../config/prisma");
const {
  createNotification,
  createBulkNotifications,
} = require("../utils/notificationHelper");

// Helper function để map registrations
const mapRegistrations = (registrations) => {
  if (!registrations) return [];
  return registrations.map((reg) => ({
    ...reg,
    // Sử dụng updatedAt cho các đăng ký đã được duyệt (ngày duyệt)
    // Sử dụng createdAt cho đăng ký đang pending (ngày đăng ký)
    registeredAt: reg.status === "PENDING" ? reg.createdAt : reg.updatedAt,
  }));
};

// Helper function để map event với registrations
const mapEventWithRegistrations = (event) => {
  if (!event) return null;
  return {
    ...event,
    registrations: mapRegistrations(event.registrations),
  };
};

// Lấy tất cả sự kiện đã được duyệt
exports.getAllEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { status: "APPROVED" },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        registrations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    const mappedEvents = events.map(mapEventWithRegistrations);
    res.json(mappedEvents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách sự kiện" });
  }
};

// Lấy TẤT CẢ sự kiện (cho Admin)
exports.getAllEventsForAdmin = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        registrations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    const mappedEvents = events.map(mapEventWithRegistrations);
    res.json(mappedEvents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách sự kiện cho admin" });
  }
};

// Lấy danh sách sự kiện của người tạo (EVENT_MANAGER)
exports.getMyEvents = async (req, res) => {
  try {
    const creatorId = req.user.userId;
    const events = await prisma.event.findMany({
      where: { creatorId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        registrations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    const mappedEvents = events.map(mapEventWithRegistrations);
    res.json(mappedEvents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách sự kiện của bạn" });
  }
};

// Lấy chi tiết 1 sự kiện
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findFirst({
      where: { id, status: "APPROVED" },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        registrations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      return res
        .status(404)
        .json({ error: "Sự kiện không tồn tại hoặc chưa được duyệt" });
    }

    const mappedEvent = mapEventWithRegistrations(event);
    res.json(mappedEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi lấy chi tiết sự kiện" });
  }
};

// Tạo sự kiện mới (EVENT_MANAGER)
exports.createEvent = async (req, res) => {
  try {
    const { title, description, location, startTime, endTime, imageUrl } =
      req.body;
    const creatorId = req.user.userId;

    const event = await prisma.event.create({
      data: {
        title,
        description,
        location,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        creatorId,
        status: "PENDING", // Chờ admin duyệt
        imageUrl,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        // Thêm registrations để trả về array rỗng thay vì undefined
        registrations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    // Gửi thông báo cho tất cả admin về sự kiện mới cần duyệt
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { id: true },
    });

    if (admins.length > 0) {
      const adminIds = admins.map((admin) => admin.id);
      await createBulkNotifications(
        adminIds,
        "EVENT_PENDING",
        `New event "${title}" is pending approval`,
        `/admin/events/${event.id}`
      );
    }

    const mappedEvent = mapEventWithRegistrations(event);
    res.status(201).json(mappedEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi tạo sự kiện" });
  }
};

// Cập nhật sự kiện (EVENT_MANAGER)
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, location, startTime, endTime, imageUrl } =
      req.body;
    const userId = req.user.userId;

    // Kiểm tra sự kiện tồn tại và thuộc về user này
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return res.status(404).json({ error: "Sự kiện không tồn tại" });
    }

    if (existingEvent.creatorId !== userId) {
      return res
        .status(403)
        .json({ error: "Bạn không có quyền chỉnh sửa sự kiện này" });
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        title,
        description,
        location,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        imageUrl,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        registrations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    const mappedEvent = mapEventWithRegistrations(updatedEvent);
    res.json(mappedEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi cập nhật sự kiện" });
  }
};

// Xóa sự kiện (EVENT_MANAGER)
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Kiểm tra sự kiện tồn tại và thuộc về user này
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return res.status(404).json({ error: "Sự kiện không tồn tại" });
    }

    if (existingEvent.creatorId !== userId) {
      return res
        .status(403)
        .json({ error: "Bạn không có quyền xóa sự kiện này" });
    }

    // Xóa các bản ghi liên quan (nếu cần, ví dụ: registrations, posts)
    // Prisma có thể cấu hình cascade delete, nhưng ở đây ta xóa thủ công hoặc để Prisma lo nếu schema đã set
    // Giả sử schema đã set onDelete: Cascade cho các relation

    await prisma.event.delete({
      where: { id },
    });

    res.json({ message: "Xóa sự kiện thành công" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi xóa sự kiện" });
  }
};

// Đăng ký tham gia sự kiện (VOLUNTEER)
exports.registerEvent = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const volunteerId = req.user.userId;

    // Kiểm tra sự kiện có tồn tại và đã được duyệt chưa
    const event = await prisma.event.findFirst({
      where: { id: eventId, status: "APPROVED" },
    });

    if (!event) {
      return res
        .status(404)
        .json({ error: "Sự kiện không tồn tại hoặc chưa được duyệt" });
    }

    // Kiểm tra đã đăng ký chưa
    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: {
        userId_eventId: {
          userId: volunteerId,
          eventId,
        },
      },
    });

    if (existingRegistration) {
      return res.status(400).json({ error: "Bạn đã đăng ký sự kiện này rồi" });
    }

    // Tạo đăng ký mới
    const registration = await prisma.eventRegistration.create({
      data: {
        userId: volunteerId,
        eventId,
        status: "PENDING", // Chờ event manager duyệt
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Tạo thông báo cho Event Manager
    await createNotification(
      event.creatorId,
      "NEW_REGISTRATION",
      `${registration.user.name} has registered for the event "${event.title}"`,
      `/manager/dashboard?eventId=${eventId}`
    );

    const mappedRegistration = {
      ...registration,
      registeredAt: registration.createdAt,
    };

    res
      .status(201)
      .json({
        message: "Đăng ký thành công",
        registration: mappedRegistration,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi đăng ký sự kiện" });
  }
};
// Hủy đăng ký tham gia sự kiện (VOLUNTEER)
exports.cancelRegistration = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const volunteerId = req.user.userId;

    // Kiểm tra sự kiện có tồn tại không
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({ error: "Sự kiện không tồn tại" });
    }

    // Kiểm tra xem sự kiện đã diễn ra chưa
    if (new Date(event.startTime) < new Date()) {
      return res.status(400).json({
        error: "Không thể hủy đăng ký khi sự kiện đang hoặc đã diễn ra",
      });
    }

    // Kiểm tra đã đăng ký chưa
    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: {
        userId_eventId: {
          userId: volunteerId,
          eventId,
        },
      },
    });

    if (!existingRegistration) {
      return res.status(400).json({ error: "Bạn chưa đăng ký sự kiện này" });
    }

    // Lấy thông tin user trước khi xóa
    const user = await prisma.user.findUnique({
      where: { id: volunteerId },
      select: { name: true },
    });

    // Xóa đăng ký
    await prisma.eventRegistration.delete({
      where: {
        userId_eventId: {
          userId: volunteerId,
          eventId,
        },
      },
    });

    // Tạo thông báo cho Event Manager
    await createNotification(
      event.creatorId,
      "CANCELLED_REGISTRATION",
      `${user.name} has cancelled their registration for the event "${event.title}"`,
      `/manager/dashboard?eventId=${eventId}`
    );

    res.json({ message: "Hủy đăng ký thành công" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi hủy đăng ký" });
  }
};
// Duyệt đăng ký (EVENT_MANAGER)
exports.approveRegistration = async (req, res) => {
  try {
    const { id: eventId, userId } = req.params;
    const managerId = req.user.userId;

    // Kiểm tra quyền sở hữu event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || event.creatorId !== managerId) {
      return res
        .status(403)
        .json({ error: "Bạn không có quyền quản lý sự kiện này" });
    }

    const registration = await prisma.eventRegistration.update({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      data: { status: "APPROVED" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Tạo thông báo cho Volunteer
    await createNotification(
      userId,
      "EVENT_APPROVED",
      `Your registration for the event "${event.title}" has been approved`,
      `/volunteer/dashboard?eventId=${eventId}`
    );

    const mappedRegistration = {
      ...registration,
      registeredAt: registration.createdAt,
    };

    res.json({
      message: "Registration approved",
      registration: mappedRegistration,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi duyệt đăng ký" });
  }
};

// Từ chối đăng ký (EVENT_MANAGER)
exports.rejectRegistration = async (req, res) => {
  try {
    const { id: eventId, userId } = req.params;
    const managerId = req.user.userId;

    // Kiểm tra quyền sở hữu event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || event.creatorId !== managerId) {
      return res
        .status(403)
        .json({ error: "Bạn không có quyền quản lý sự kiện này" });
    }

    const registration = await prisma.eventRegistration.update({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      data: { status: "REJECTED" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Tạo thông báo cho Volunteer
    await createNotification(
      userId,
      "EVENT_APPROVED",
      `Your registration for the event "${event.title}" has been rejected`,
      `/volunteer/dashboard?eventId=${eventId}`
    );

    const mappedRegistration = {
      ...registration,
      registeredAt: registration.createdAt,
    };

    res.json({
      message: "Registration rejected",
      registration: mappedRegistration,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi từ chối đăng ký" });
  }
};

// Đánh dấu tham gia/hoàn thành sự kiện (EVENT_MANAGER)
exports.markAttended = async (req, res) => {
  try {
    const { id: eventId, userId } = req.params;
    const managerId = req.user.userId;

    // Kiểm tra quyền sở hữu event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || event.creatorId !== managerId) {
      return res
        .status(403)
        .json({ error: "Bạn không có quyền quản lý sự kiện này" });
    }

    // Kiểm tra registration tồn tại
    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (!existingRegistration) {
      return res.status(404).json({ error: "Không tìm thấy đăng ký" });
    }

    // Chỉ cho phép đánh dấu ATTENDED nếu registration đã được APPROVED
    if (existingRegistration.status !== "APPROVED") {
      return res.status(400).json({
        error: "Chỉ có thể đánh dấu hoàn thành cho đăng ký đã được duyệt",
      });
    }

    const registration = await prisma.eventRegistration.update({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      data: { status: "ATTENDED" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Tạo thông báo cho Volunteer
    await createNotification(
      userId,
      "EVENT_REMINDER",
      `You have completed participation in the event "${event.title}". Thank you!`,
      `/volunteer/dashboard?eventId=${eventId}`
    );

    const mappedRegistration = {
      ...registration,
      registeredAt: registration.createdAt,
    };

    res.json({
      message: "Completion confirmed",
      registration: mappedRegistration,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi đánh dấu hoàn thành" });
  }
};

// Export CSV danh sách người đăng ký sự kiện (EVENT_MANAGER)
exports.exportEventRegistrationsCSV = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const managerId = req.user.userId;
    const { status } = req.query; // Filter by status if needed

    // Kiểm tra event có tồn tại và thuộc quyền quản lý của manager này
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        creatorId: managerId,
      },
      include: {
        registrations: {
          where: status ? { status } : {},
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found or unauthorized" });
    }

    // Tạo CSV content
    const csvHeaders = [
      "Volunteer Name",
      "Email",
      "Registration Date",
      "Status",
      "Last Updated",
    ];

    const csvRows = event.registrations.map((reg) => {
      const registrationDate = new Date(reg.createdAt).toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
      const updatedDate = new Date(reg.updatedAt).toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Escape special characters for CSV
      const escape = (text) => {
        if (text === null || text === undefined) return "";
        const str = String(text);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      return [
        escape(reg.user.name),
        escape(reg.user.email),
        escape(registrationDate),
        escape(reg.status),
        escape(updatedDate),
      ].join(",");
    });

    const csvContent = [csvHeaders.join(","), ...csvRows].join("\n");

    // Set headers for file download
    const timestamp = new Date().toISOString().split("T")[0];
    const fileName = `${event.title.replace(
      /[^a-z0-9]/gi,
      "_"
    )}_registrations_${timestamp}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    // Add BOM for Excel UTF-8 support
    res.send("\uFEFF" + csvContent);
  } catch (error) {
    console.error("Error exporting registrations CSV:", error);
    res.status(500).json({ error: "Lỗi khi xuất file CSV" });
  }
};
