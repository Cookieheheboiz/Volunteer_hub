const prisma = require("../config/prisma");

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
    res.json(events);
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
    res.json(events);
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
    res.json(events);
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

    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi lấy chi tiết sự kiện" });
  }
};

// Tạo sự kiện mới (EVENT_MANAGER)
exports.createEvent = async (req, res) => {
  try {
    const { title, description, location, startTime, endTime } = req.body;
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
        // ✅ THÊM registrations để trả về array rỗng thay vì undefined
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

    res.status(201).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi tạo sự kiện" });
  }
};

// Cập nhật sự kiện (EVENT_MANAGER)
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, location, startTime, endTime } = req.body;
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

    res.json(updatedEvent);
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

    res.status(201).json({ message: "Đăng ký thành công", registration });
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

    // Xóa đăng ký
    await prisma.eventRegistration.delete({
      where: {
        userId_eventId: {
          userId: volunteerId,
          eventId,
        },
      },
    });

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

    res.json({ message: "Đã duyệt đăng ký", registration });
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

    res.json({ message: "Đã từ chối đăng ký", registration });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi từ chối đăng ký" });
  }
};
