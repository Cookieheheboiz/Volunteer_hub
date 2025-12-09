const prisma = require("../config/prisma");

exports.getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Lỗi lấy user" });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: "User không tồn tại" });

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });
    res.json({ message: "Cập nhật thành công", user: updated });
  } catch (error) {
    res.status(500).json({ error: "Lỗi cập nhật" });
  }
};
