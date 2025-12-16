const prisma = require("../config/prisma");
const { Parser } = require("json2csv");

// Lấy danh sách user (có phân trang & lọc)
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.user.count({ where });

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách user" });
  }
};

// Khóa/Mở khóa tài khoản
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: "User không tồn tại" });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });

    res.json({
      message: updatedUser.isActive
        ? "Đã mở khóa tài khoản"
        : "Đã khóa tài khoản",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi cập nhật trạng thái user" });
  }
};

// Duyệt sự kiện
exports.approveEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({ error: "Sự kiện không tồn tại" });
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: { status: "APPROVED" },
    });

    res.json({
      message: "Đã duyệt sự kiện",
      event: updatedEvent,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi duyệt sự kiện" });
  }
};

// Từ chối sự kiện
exports.rejectEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({ error: "Sự kiện không tồn tại" });
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: { status: "REJECTED" },
    });

    res.json({
      message: "Đã từ chối sự kiện",
      event: updatedEvent,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi từ chối sự kiện" });
  }
};

// Export danh sách sự kiện ra CSV
exports.exportEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        creator: {
          select: { name: true, email: true },
        },
      },
    });

    const fields = [
      "id",
      "title",
      "location",
      "status",
      "creator.name",
      "creator.email",
      "startTime",
      "endTime",
    ];
    const parser = new Parser({ fields });
    const csv = parser.parse(events);

    res.header("Content-Type", "text/csv");
    res.attachment("danh_sach_su_kien.csv");
    res.send(csv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi xuất dữ liệu" });
  }
};
