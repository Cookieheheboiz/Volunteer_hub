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
<<<<<<< HEAD
        status: "PENDING", // Chờ event manager duyệt
=======
        status: "REGISTERED", // Mặc định là đã đăng ký
>>>>>>> ed166c13b4547a68f99bb0957717d9a78ed13e9f
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
