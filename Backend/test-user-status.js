require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testUserStatus() {
  try {
    console.log("🧪 Testing User Status...\n");

    // Lấy tất cả users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    console.log("📊 Current Users Status:");
    console.log("=" .repeat(80));
    users.forEach((user) => {
      const status = user.isActive ? "✅ ACTIVE" : "❌ BANNED";
      console.log(
        `${status.padEnd(12)} | ${user.role.padEnd(15)} | ${user.name.padEnd(25)} | ${user.email}`
      );
    });
    console.log("=" .repeat(80));

    console.log("\n✅ Total users:", users.length);
    console.log("✅ Active users:", users.filter((u) => u.isActive).length);
    console.log("❌ Banned users:", users.filter((u) => !u.isActive).length);

    console.log("\n💡 To test Ban/Unban:");
    console.log("1. Open http://localhost:3001");
    console.log("2. Login as admin@volunteerhub.com / admin123");
    console.log("3. Go to User Management tab");
    console.log("4. Click Ban/Unban buttons");
    console.log("5. Status should update immediately\n");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testUserStatus();
