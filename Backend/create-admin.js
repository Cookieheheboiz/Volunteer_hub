require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = "admin@volunteerhub.com";
    const password = "admin123";
    const name = "Admin";

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      console.log("✅ Admin already exists!");
      console.log("Email:", email);
      console.log("Password:", password);
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const admin = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: "ADMIN",
        isActive: true,
      },
    });

    console.log("✅ Admin account created successfully!");
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("Role:", admin.role);
  } catch (error) {
    console.error("❌ Error creating admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
