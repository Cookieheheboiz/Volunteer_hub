const prisma = require("../config/prisma");
exports.getAllEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { status: "APPROVED" },
      include: {
        creator: {
          select: { name: true, email: true },
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

// Lấy chi tiết 1 sự kiện
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findFirst({
      where: { id, status: "APPROVED" },
      include: {
        creator: {
          select: { name: true, email: true },
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
        status: "REGISTERED",
      },
    });

    res.status(201).json({ message: "Đăng ký thành công", registration });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi đăng ký sự kiện" });
  }
};
