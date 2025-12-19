const prisma = require("../config/prisma");
const { Parser } = require("json2csv");

// ============ PHẦN CỦA MAIN (Dashboard Stats) ============
// Lấy thống kê tổng quan cho admin dashboard
exports.getStats = async (req, res) => {
  try {
    // Đếm tổng số users
    const totalUsers = await prisma.user.count();

    // Đếm số event đã được approve
    const approvedEvents = await prisma.event.count({
      where: { status: "APPROVED" },
    });

    // Đếm số event đang pending
    const pendingEvents = await prisma.event.count({
      where: { status: "PENDING" },
    });

    // Đếm theo role
    const usersByRole = await prisma.user.groupBy({
      by: ["role"],
      _count: true,
    });

    // Đếm user active vs banned
    const activeUsers = await prisma.user.count({
      where: { isActive: true },
    });

    const bannedUsers = await prisma.user.count({
      where: { isActive: false },
    });

    res.json({
      totalUsers,
      approvedEvents,
      pendingEvents,
      activeUsers,
      bannedUsers,
      usersByRole: usersByRole.reduce((acc, curr) => {
        acc[curr.role] = curr._count;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi lấy thống kê" });
  }
};

// Lấy tất cả events (bao gồm PENDING, APPROVED, REJECTED)
exports.getAllEvents = async (req, res) => {
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
    res.status(500).json({ error: "Lỗi khi lấy danh sách sự kiện" });
  }
};

// ============ PHẦN GỘP (User List) ============
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
        avatarUrl: true, // Giữ lại từ main để hiển thị avatar
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.user.count({ where });

    // Map isActive to status for frontend (Giữ logic của main để frontend hiển thị đẹp hơn)
    const mappedUsers = users.map((user) => ({
      ...user,
      status: user.isActive ? "ACTIVE" : "BANNED",
    }));

    res.json({
      users: mappedUsers,
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
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        avatarUrl: true, // Giữ lại
      },
    });

    res.json({
      message: updatedUser.isActive
        ? "Đã mở khóa tài khoản"
        : "Đã khóa tài khoản",
      user: {
        ...updatedUser,
        status: updatedUser.isActive ? "ACTIVE" : "BANNED",
      },
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

// ============ EXPORT DỮ LIỆU ============

// Export danh sách sự kiện ra CSV
exports.exportEventsCSV = async (req, res) => {
  try {
    const { status } = req.query; // Filter by status if needed
    
    const where = {};
    if (status) where.status = status;

    const events = await prisma.event.findMany({
      where,
      include: {
        creator: {
          select: { name: true, email: true },
        },
        registrations: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Flatten data for CSV
    const flattenedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      status: event.status,
      creatorName: event.creator?.name || 'N/A',
      creatorEmail: event.creator?.email || 'N/A',
      startTime: event.startTime,
      endTime: event.endTime,
      maxParticipants: event.maxParticipants,
      currentParticipants: event.registrations?.length || 0,
      createdAt: event.createdAt,
    }));

    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Title', value: 'title' },
      { label: 'Description', value: 'description' },
      { label: 'Location', value: 'location' },
      { label: 'Status', value: 'status' },
      { label: 'Creator Name', value: 'creatorName' },
      { label: 'Creator Email', value: 'creatorEmail' },
      { label: 'Start Time', value: 'startTime' },
      { label: 'End Time', value: 'endTime' },
      { label: 'Max Participants', value: 'maxParticipants' },
      { label: 'Current Participants', value: 'currentParticipants' },
      { label: 'Created At', value: 'createdAt' },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(flattenedEvents);

    res.header("Content-Type", "text/csv; charset=utf-8");
    res.attachment(`events_${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi xuất dữ liệu CSV" });
  }
};

// Export danh sách sự kiện ra JSON
exports.exportEventsJSON = async (req, res) => {
  try {
    const { status } = req.query; // Filter by status if needed
    
    const where = {};
    if (status) where.status = status;

    const events = await prisma.event.findMany({
      where,
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
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.header("Content-Type", "application/json; charset=utf-8");
    res.attachment(`events_${Date.now()}.json`);
    res.json({
      exportedAt: new Date().toISOString(),
      totalEvents: events.length,
      events: events,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi xuất dữ liệu JSON" });
  }
};

// Export danh sách users ra CSV
exports.exportUsersCSV = async (req, res) => {
  try {
    const { role, status } = req.query; // Filter by role and status if needed
    
    const where = {};
    if (role) where.role = role;
    if (status) {
      where.isActive = status === 'ACTIVE';
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            createdEvents: true,
            registrations: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Flatten data for CSV
    const flattenedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.isActive ? 'ACTIVE' : 'BANNED',
      createdEvents: user._count?.createdEvents || 0,
      registrations: user._count?.registrations || 0,
      createdAt: user.createdAt,
    }));

    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Name', value: 'name' },
      { label: 'Email', value: 'email' },
      { label: 'Role', value: 'role' },
      { label: 'Status', value: 'status' },
      { label: 'Created Events', value: 'createdEvents' },
      { label: 'Registrations', value: 'registrations' },
      { label: 'Created At', value: 'createdAt' },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(flattenedUsers);

    res.header("Content-Type", "text/csv; charset=utf-8");
    res.attachment(`users_${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi xuất dữ liệu users CSV" });
  }
};

// Export danh sách users ra JSON
exports.exportUsersJSON = async (req, res) => {
  try {
    const { role, status } = req.query; // Filter by role and status if needed
    
    const where = {};
    if (role) where.role = role;
    if (status) {
      where.isActive = status === 'ACTIVE';
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        createdAt: true,
        createdEvents: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        registrations: {
          select: {
            id: true,
            event: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Map isActive to status for consistency
    const mappedUsers = users.map(user => ({
      ...user,
      status: user.isActive ? "ACTIVE" : "BANNED"
    }));

    res.header("Content-Type", "application/json; charset=utf-8");
    res.attachment(`users_${Date.now()}.json`);
    res.json({
      exportedAt: new Date().toISOString(),
      totalUsers: users.length,
      users: mappedUsers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi xuất dữ liệu users JSON" });
  }
};
