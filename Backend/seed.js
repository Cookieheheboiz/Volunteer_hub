require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function seedData() {
  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("123456", salt);

    // Tạo users
    const users = await Promise.all([
      prisma.user.upsert({
        where: { email: "manager1@test.com" },
        update: {},
        create: {
          email: "manager1@test.com",
          passwordHash,
          name: "Manager Nguyễn Văn A",
          role: "EVENT_MANAGER",
          isActive: true,
        },
      }),
      prisma.user.upsert({
        where: { email: "manager2@test.com" },
        update: {},
        create: {
          email: "manager2@test.com",
          passwordHash,
          name: "Manager Trần Thị B",
          role: "EVENT_MANAGER",
          isActive: true,
        },
      }),
      prisma.user.upsert({
        where: { email: "volunteer1@test.com" },
        update: {},
        create: {
          email: "volunteer1@test.com",
          passwordHash,
          name: "Volunteer Lê Văn C",
          role: "VOLUNTEER",
          isActive: true,
        },
      }),
      prisma.user.upsert({
        where: { email: "volunteer2@test.com" },
        update: {},
        create: {
          email: "volunteer2@test.com",
          passwordHash,
          name: "Volunteer Phạm Thị D",
          role: "VOLUNTEER",
          isActive: true,
        },
      }),
      prisma.user.upsert({
        where: { email: "volunteer3@test.com" },
        update: {},
        create: {
          email: "volunteer3@test.com",
          passwordHash,
          name: "Volunteer Hoàng Văn E",
          role: "VOLUNTEER",
          isActive: false, // User bị khóa
        },
      }),
    ]);

    console.log(`✅ Created ${users.length} users`);

    // Tạo events
    const events = await Promise.all([
      prisma.event.create({
        data: {
          title: "Sự kiện tình nguyện giúp đỡ nhà mồ hôi học",
          description: "Giúp đỡ trẻ em nghèo học tập tốt hơn",
          location: "Hà Nội",
          startTime: new Date("2025-01-15T08:00:00"),
          endTime: new Date("2025-01-15T17:00:00"),
          status: "PENDING",
          creatorId: users[0].id,
        },
      }),
      prisma.event.create({
        data: {
          title: "Sự kiện tình nguyện giúp đỡ người già",
          description: "Chăm sóc người cao tuổi tại viện dưỡng lão",
          location: "TP Hồ Chí Minh",
          startTime: new Date("2025-01-20T08:00:00"),
          endTime: new Date("2025-01-20T16:00:00"),
          status: "PENDING",
          creatorId: users[1].id,
        },
      }),
      prisma.event.create({
        data: {
          title: "Sự kiện tình nguyện vệ sinh môi trường",
          description: "Dọn dẹp công viên và bãi biển",
          location: "Đà Nẵng",
          startTime: new Date("2025-02-01T06:00:00"),
          endTime: new Date("2025-02-01T12:00:00"),
          status: "APPROVED",
          creatorId: users[0].id,
        },
      }),
    ]);

    console.log(`✅ Created ${events.length} events`);
    console.log("\n📊 Summary:");
    console.log(`- Total users: ${users.length}`);
    console.log(`- EVENT_MANAGER: 2`);
    console.log(`- VOLUNTEER: 3`);
    console.log(`- Pending events: 2`);
    console.log(`- Approved events: 1`);
    console.log("\n🔑 Login credentials:");
    console.log("Admin: admin@volunteerhub.com / admin123");
    console.log("Manager: manager1@test.com / 123456");
    console.log("Volunteer: volunteer1@test.com / 123456");
  } catch (error) {
    console.error("❌ Error seeding data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedData();
