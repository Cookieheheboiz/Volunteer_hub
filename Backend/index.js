const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs"); // Để mã hóa mật khẩu
const jwt = require("jsonwebtoken"); // Để tạo token
const { authMiddleware, checkRole } = require("./middleware/auth");
const prisma = new PrismaClient();
const { Parser } = require("json2csv");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 1. API ĐĂNG KÝ
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    // Kiểm tra xem email đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email đã tồn tại" });
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Tạo user mới
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash, // Lưu mật khẩu đã mã hóa
        name,
        role, // (EVENT_MANAGER, VOLUNTEER, ADMIN)
      },
    });

    // Không trả về passwordHash
    const { passwordHash: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Đã xảy ra lỗi khi đăng ký" });
  }
});

// 2. API ĐĂNG NHẬP
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Tìm user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ error: "Email hoặc mật khẩu không đúng" });
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.",
      });
    }

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(400).json({ error: "Email hoặc mật khẩu không đúng" });
    }

    // Tạo Token (JWT)
    // Token này sẽ chứa ID và vai trò của user, giúp xác thực các yêu cầu sau này
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET, // Đây là một "mã bí mật"
      { expiresIn: "7d" } // Token hết hạn sau 7 ngày
    );

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Đã xảy ra lỗi khi đăng nhập" });
  }
});

// --- API SỰ KIỆN (Mới) ---

// 1. Tạo Sự kiện mới (Chỉ cho EVENT_MANAGER)
app.post(
  "/api/events",
  authMiddleware, // 1. Yêu cầu đăng nhập
  checkRole(["EVENT_MANAGER"]), // 2. Yêu cầu vai trò là EVENT_MANAGER
  async (req, res) => {
    try {
      const { title, description, location, startTime, endTime } = req.body;
      const creatorId = req.user.userId; // Lấy ID từ token đã giải mã

      const event = await prisma.event.create({
        data: {
          title,
          description,
          location,
          startTime: new Date(startTime), // Đảm bảo chuyển thành kiểu Date
          endTime: new Date(endTime),
          creatorId: creatorId,
        },
      });

      res.status(201).json(event);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Lỗi khi tạo sự kiện" });
    }
  }
);

// 2. Lấy tất cả sự kiện (Công khai, không cần đăng nhập)
app.get("/api/events", async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: {
        status: "APPROVED", // Chỉ lấy các sự kiện đã được duyệt
      },
      include: {
        creator: {
          // Lấy thông tin người tạo
          select: { name: true, email: true },
        },
      },
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi lấy sự kiện" });
  }
});

// 3. Lấy 1 sự kiện theo ID (Công khai)
app.get("/api/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findFirst({
      where: {
        id: id,
        status: "APPROVED",
      },
      include: {
        creator: { select: { name: true, email: true } },
      },
    });

    if (!event) {
      return res
        .status(404)
        .json({ error: "Sự kiện không tồn tại hoặc chưa được duyệt" });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi lấy sự kiện" });
  }
});

// 4. [ADMIN] Duyệt sự kiện
// Admin dùng API này để chuyển trạng thái PENDING -> APPROVED
app.patch(
  "/api/admin/events/:id/approve",
  authMiddleware, // 1. Yêu cầu đăng nhập
  checkRole(["ADMIN"]), // 2. Yêu cầu vai trò ADMIN
  async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.user.userId; // Lấy ID của Admin từ token

      // 1. Tìm sự kiện
      const eventToApprove = await prisma.event.findUnique({
        where: { id },
      });

      // 2. Kiểm tra xem sự kiện có tồn tại và đang chờ duyệt không
      if (!eventToApprove) {
        return res.status(404).json({ error: "Sự kiện không tồn tại" });
      }
      if (eventToApprove.status !== "PENDING") {
        return res
          .status(400)
          .json({ error: "Sự kiện này không ở trạng thái chờ duyệt" });
      }

      // 3. Cập nhật sự kiện
      const updatedEvent = await prisma.event.update({
        where: { id: id },
        data: {
          status: "APPROVED",
          approverId: adminId, // Ghi lại admin nào đã duyệt
        },
      });

      const eventCreator = await prisma.event.findUnique({
        where: { id },
        select: { creatorId: true, title: true },
      });

      if (eventCreator) {
        await createNotification(
          eventCreator.creatorId,
          "EVENT_APPROVED",
          `Sự kiện "${eventCreator.title}" của bạn đã được duyệt!`,
          `/events/${id}` // Link để click vào xem
        );
      }

      res.json(updatedEvent);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Lỗi khi duyệt sự kiện" });
    }
  }
);

// --- API TÌNH NGUYỆN VIÊN (Mới) ---

// 5. [VOLUNTEER] Đăng ký tham gia sự kiện
app.post(
  "/api/events/:id/register",
  authMiddleware, // 1. Yêu cầu đăng nhập
  checkRole(["VOLUNTEER"]), // 2. Yêu cầu vai trò VOLUNTEER
  async (req, res) => {
    try {
      const { id: eventId } = req.params; // Lấy ID sự kiện từ URL
      const volunteerId = req.user.userId; // Lấy ID user (volunteer) từ token

      // 1. Kiểm tra xem sự kiện có tồn tại và đã được duyệt chưa
      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          status: "APPROVED", // Chỉ cho đăng ký sự kiện đã được duyệt
        },
      });

      if (!event) {
        return res
          .status(404)
          .json({ error: "Sự kiện không tồn tại hoặc chưa được duyệt" });
      }

      // 2. Kiểm tra xem user này đã đăng ký sự kiện này chưa
      // (Schema của bạn đã có @@unique, nhưng ta nên kiểm tra thủ công để báo lỗi đẹp hơn)
      const existingRegistration = await prisma.eventRegistration.findUnique({
        where: {
          // Cú pháp này dùng cho khóa tổng hợp @@unique([userId, eventId])
          userId_eventId: {
            userId: volunteerId,
            eventId: eventId,
          },
        },
      });

      if (existingRegistration) {
        return res.status(400).json({ error: "Bạn đã đăng ký sự kiện này" });
      }

      // 3. Tạo đăng ký mới
      const newRegistration = await prisma.eventRegistration.create({
        data: {
          userId: volunteerId,
          eventId: eventId,
          status: "REGISTERED",
        },
      });

      res.status(201).json(newRegistration);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Lỗi khi đăng ký sự kiện" });
    }
  }
);

// 6. Đăng bài viết mới vào sự kiện
app.post("/api/events/:id/posts", authMiddleware, async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const { content } = req.body;
    const authorId = req.user.userId;

    // Kiểm tra sự kiện tồn tại
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: "Sự kiện không tồn tại" });

    const post = await prisma.post.create({
      data: {
        content,
        eventId,
        authorId,
      },
    });
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi đăng bài" });
  }
});

// 7. Lấy danh sách bài viết của sự kiện (bao gồm Comment và Like)
app.get("/api/events/:id/posts", async (req, res) => {
  try {
    const { id: eventId } = req.params;

    const posts = await prisma.post.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" }, // Bài mới nhất lên đầu
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } }, // Lấy info người đăng
        comments: {
          include: {
            author: { select: { id: true, name: true } }, // Lấy info người comment
          },
          orderBy: { createdAt: "asc" },
        },
        likes: true, // Lấy danh sách like
        _count: {
          select: { likes: true, comments: true }, // Đếm số like và comment
        },
      },
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi lấy bài viết" });
  }
});

// 8. Bình luận vào bài viết
app.post("/api/posts/:id/comments", authMiddleware, async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { content } = req.body;
    const authorId = req.user.userId;

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        authorId,
      },
    });
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi bình luận" });
  }
});

// 9. Thả tim / Bỏ tim (Toggle Like)
app.post("/api/posts/:id/like", authMiddleware, async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user.userId;

    // Kiểm tra xem user đã like chưa
    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    if (existingLike) {
      // Nếu like rồi thì xóa (Unlike)
      await prisma.postLike.delete({
        where: { userId_postId: { userId, postId } },
      });
      return res.json({ message: "Đã bỏ like" });
    } else {
      // Nếu chưa like thì tạo mới (Like)
      await prisma.postLike.create({
        data: { userId, postId },
      });
      return res.status(201).json({ message: "Đã like" });
    }
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi xử lý like" });
  }
});

// --- HÀM TIỆN ÍCH (HELPER) ---
// Hàm này dùng nội bộ, không gọi qua API
async function createNotification(recipientId, type, content, link = null) {
  try {
    await prisma.notification.create({
      data: { recipientId, type, content, link },
    });
  } catch (error) {
    console.error("Lỗi tạo thông báo:", error);
  }
}

// --- API THÔNG BÁO ---

// 10. Lấy danh sách thông báo của User đang đăng nhập
app.get("/api/notifications", authMiddleware, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { recipientId: req.user.userId },
      orderBy: { createdAt: "desc" }, // Mới nhất lên đầu
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Lỗi lấy thông báo" });
  }
});

// 11. Đánh dấu đã đọc
app.patch("/api/notifications/:id/read", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    res.json({ message: "Đã đọc" });
  } catch (error) {
    res.status(500).json({ error: "Lỗi cập nhật" });
  }
});

// --- API QUẢN LÝ USER (ADMIN) ---

// 12. Lấy danh sách User (có phân trang & lọc)
app.get(
  "/api/admin/users",
  authMiddleware,
  checkRole(["ADMIN"]),
  async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          // Chỉ lấy các trường cần thiết, giấu password đi
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Lỗi lấy danh sách user" });
    }
  }
);

// 13. Khóa / Mở khóa tài khoản
app.patch(
  "/api/admin/users/:id/toggle-status",
  authMiddleware,
  checkRole(["ADMIN"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Tìm user để biết trạng thái hiện tại
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return res.status(404).json({ error: "User không tồn tại" });

      // Đảo ngược trạng thái (True -> False và ngược lại)
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { isActive: !user.isActive },
        select: { id: true, email: true, isActive: true }, // Trả về kết quả
      });

      res.json({
        message: updatedUser.isActive
          ? "Đã mở khóa tài khoản"
          : "Đã khóa tài khoản",
        user: updatedUser,
      });
    } catch (error) {
      res.status(500).json({ error: "Lỗi cập nhật trạng thái" });
    }
  }
);

// --- API EXPORT DỮ LIỆU ---

// 14. Export danh sách sự kiện ra CSV
app.get(
  "/api/admin/export/events",
  authMiddleware,
  checkRole(["ADMIN"]),
  async (req, res) => {
    try {
      // 1. Lấy dữ liệu từ DB
      const events = await prisma.event.findMany({
        include: { creator: { select: { name: true, email: true } } }, // Lấy thêm tên người tạo
      });

      // 2. Chuẩn bị dữ liệu cho CSV (Làm phẳng dữ liệu)
      const eventData = events.map((event) => ({
        ID: event.id,
        Ten_Su_Kien: event.title,
        Nguoi_Tao: event.creator.name,
        Email_Nguoi_Tao: event.creator.email,
        Ngay_Bat_Dau: event.startTime.toISOString(),
        Trang_Thai: event.status,
        Dia_Diem: event.location,
      }));

      // 3. Chuyển đổi JSON -> CSV
      const json2csvParser = new Parser();
      const csv = json2csvParser.parse(eventData);

      // 4. Gửi file về cho Client download
      res.header("Content-Type", "text/csv");
      res.attachment("danh_sach_su_kien.csv"); // Tên file khi tải về
      return res.send(csv);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Lỗi xuất dữ liệu" });
    }
  }
);

// Chạy server
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
