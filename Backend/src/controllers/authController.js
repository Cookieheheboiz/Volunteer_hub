const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

exports.register = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ error: "Email đã tồn tại" });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: { email, passwordHash, name, role },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: "Lỗi đăng ký" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user)
      return res.status(400).json({ error: "Email hoặc mật khẩu sai" });
    if (!user.isActive)
      return res.status(403).json({ error: "Tài khoản bị khóa" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch)
      return res.status(400).json({ error: "Email hoặc mật khẩu sai" });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
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
    res.status(500).json({ error: "Lỗi đăng nhập" });
  }
};
