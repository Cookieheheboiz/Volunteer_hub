const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Middleware chính để xác thực token
const authMiddleware = (req, res, next) => {
  try {
    // 1. Lấy token từ header "Authorization"
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Không có token, không được phép" });
    }

    // Token có dạng "Bearer [token]", chúng ta chỉ lấy phần [token]
    const token = authHeader.split(" ")[1];

    // 2. Giải mã token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Gắn thông tin user vào `req` để các hàm sau sử dụng
    req.user = decoded; // { userId: '...', role: '...' }

    next(); // Chuyển tiếp request đến API tiếp theo
  } catch (error) {
    res.status(401).json({ error: "Token không hợp lệ" });
  }
};

// Middleware phụ để kiểm tra vai trò (Role)
// Chúng ta truyền vào một mảng các vai trò được phép (ví dụ: ['ADMIN', 'EVENT_MANAGER'])
const checkRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Không có quyền truy cập" });
  }
  next();
};

module.exports = { authMiddleware, checkRole };
