require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed process...\n");

  // Xóa dữ liệu cũ (theo thứ tự để tránh lỗi foreign key)
  console.log("🗑️  Clearing old data...");
  await prisma.notification.deleteMany();
  await prisma.postLike.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.eventRegistration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Old data cleared\n");

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const password123 = await bcrypt.hash("123456", salt);
  const passwordAdmin = await bcrypt.hash("admin123", salt);

  // Tạo Users
  console.log("👥 Creating users...");
  const admin = await prisma.user.create({
    data: {
      email: "admin@volunteerhub.com",
      passwordHash: passwordAdmin,
      name: "Admin System",
      role: "ADMIN",
      isActive: true,
    },
  });

  const manager1 = await prisma.user.create({
    data: {
      email: "manager1@test.com",
      passwordHash: password123,
      name: "Nguyễn Văn Quản Lý",
      role: "EVENT_MANAGER",
      isActive: true,
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      email: "manager2@test.com",
      passwordHash: password123,
      name: "Trần Thị Thu Hà",
      role: "EVENT_MANAGER",
      isActive: true,
    },
  });

  const volunteer1 = await prisma.user.create({
    data: {
      email: "volunteer1@test.com",
      passwordHash: password123,
      name: "Lê Văn Tình Nguyện",
      role: "VOLUNTEER",
      isActive: true,
    },
  });

  const volunteer2 = await prisma.user.create({
    data: {
      email: "volunteer2@test.com",
      passwordHash: password123,
      name: "Phạm Thị Mai",
      role: "VOLUNTEER",
      isActive: true,
    },
  });

  const volunteer3 = await prisma.user.create({
    data: {
      email: "volunteer3@test.com",
      passwordHash: password123,
      name: "Hoàng Minh Tuấn",
      role: "VOLUNTEER",
      isActive: true,
    },
  });

  const volunteer4 = await prisma.user.create({
    data: {
      email: "volunteer4@test.com",
      passwordHash: password123,
      name: "Vũ Thị Lan",
      role: "VOLUNTEER",
      isActive: false, // User bị ban
    },
  });

  console.log(`✅ Created ${7} users`);

  // Tạo Events
  console.log("\n📅 Creating events...");
  
  const event1 = await prisma.event.create({
    data: {
      title: "Chiến dịch Mùa hè xanh 2025",
      description: "Tham gia các hoạt động tình nguyện mùa hè tại vùng cao. Các hoạt động bao gồm: xây nhà tình thương, dạy học cho trẻ em, khám bệnh miễn phí.",
      location: "Hà Giang",
      startTime: new Date("2025-07-01T08:00:00"),
      endTime: new Date("2025-07-15T17:00:00"),
      status: "APPROVED",
      creatorId: manager1.id,
      approverId: admin.id,
    },
  });

  const event2 = await prisma.event.create({
    data: {
      title: "Hiến máu nhân đạo",
      description: "Chương trình hiến máu nhân đạo tại trường Đại học. Mỗi đơn vị máu bạn hiến tặng có thể cứu sống 3 người.",
      location: "Đại học Công nghệ - ĐHQGHN",
      startTime: new Date("2025-12-25T07:00:00"),
      endTime: new Date("2025-12-25T16:00:00"),
      status: "PENDING",
      creatorId: manager1.id,
    },
  });

  const event3 = await prisma.event.create({
    data: {
      title: "Dọn rác bảo vệ môi trường biển",
      description: "Cùng nhau dọn rác, làm sạch bãi biển Sầm Sơn. Mang theo găng tay và tinh thần tích cực!",
      location: "Bãi biển Sầm Sơn, Thanh Hóa",
      startTime: new Date("2026-01-10T06:00:00"),
      endTime: new Date("2026-01-10T11:00:00"),
      status: "PENDING",
      creatorId: manager2.id,
    },
  });

  const event4 = await prisma.event.create({
    data: {
      title: "Xuân tình nguyện 2026",
      description: "Mang Tết đến với trẻ em vùng cao. Tặng quà, tổ chức vui chơi và giao lưu văn hóa.",
      location: "Sơn La",
      startTime: new Date("2026-01-20T08:00:00"),
      endTime: new Date("2026-01-25T17:00:00"),
      status: "APPROVED",
      creatorId: manager2.id,
      approverId: admin.id,
    },
  });

  const event5 = await prisma.event.create({
    data: {
      title: "Chương trình đào tạo kỹ năng tình nguyện",
      description: "Khóa học về kỹ năng làm việc nhóm, giao tiếp và tổ chức sự kiện cho tình nguyện viên.",
      location: "Hội trường A1, ĐHQGHN",
      startTime: new Date("2025-12-28T13:00:00"),
      endTime: new Date("2025-12-28T17:00:00"),
      status: "ONGOING",
      creatorId: manager1.id,
      approverId: admin.id,
    },
  });

  console.log(`✅ Created ${5} events`);

  // Tạo Event Registrations
  console.log("\n📝 Creating event registrations...");
  
  await prisma.eventRegistration.create({
    data: {
      userId: volunteer1.id,
      eventId: event1.id,
      status: "APPROVED",
    },
  });

  await prisma.eventRegistration.create({
    data: {
      userId: volunteer2.id,
      eventId: event1.id,
      status: "APPROVED",
    },
  });

  await prisma.eventRegistration.create({
    data: {
      userId: volunteer3.id,
      eventId: event1.id,
      status: "PENDING",
    },
  });

  await prisma.eventRegistration.create({
    data: {
      userId: volunteer1.id,
      eventId: event2.id,
      status: "PENDING",
    },
  });

  await prisma.eventRegistration.create({
    data: {
      userId: volunteer2.id,
      eventId: event4.id,
      status: "APPROVED",
    },
  });

  await prisma.eventRegistration.create({
    data: {
      userId: volunteer3.id,
      eventId: event5.id,
      status: "ATTENDED",
    },
  });

  await prisma.eventRegistration.create({
    data: {
      userId: volunteer1.id,
      eventId: event5.id,
      status: "ATTENDED",
    },
  });

  console.log(`✅ Created ${7} event registrations`);

  // Tạo Posts
  console.log("\n📰 Creating posts...");
  
  const post1 = await prisma.post.create({
    data: {
      content: "Rất vui được tham gia chương trình Mùa hè xanh! Đây là trải nghiệm tuyệt vời 🌟",
      eventId: event1.id,
      authorId: volunteer1.id,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      content: "Các bạn tình nguyện viên đã làm việc rất chăm chỉ hôm nay. Cảm ơn tất cả mọi người! ❤️",
      eventId: event1.id,
      authorId: manager1.id,
    },
  });

  const post3 = await prisma.post.create({
    data: {
      content: "Buổi đào tạo hôm nay rất bổ ích. Học được nhiều kỹ năng mới! 💪",
      eventId: event5.id,
      authorId: volunteer3.id,
    },
  });

  console.log(`✅ Created ${3} posts`);

  // Tạo Comments
  console.log("\n💬 Creating comments...");
  
  await prisma.comment.create({
    data: {
      content: "Đúng vậy, mình cũng rất thích chương trình này!",
      postId: post1.id,
      authorId: volunteer2.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: "Cảm ơn các bạn đã tham gia nhiệt tình 🙏",
      postId: post2.id,
      authorId: admin.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: "Hẹn gặp lại ở chương trình tiếp theo nhé!",
      postId: post3.id,
      authorId: volunteer1.id,
    },
  });

  console.log(`✅ Created ${3} comments`);

  // Tạo Post Likes
  console.log("\n❤️  Creating post likes...");
  
  await prisma.postLike.create({
    data: {
      userId: volunteer1.id,
      postId: post2.id,
    },
  });

  await prisma.postLike.create({
    data: {
      userId: volunteer2.id,
      postId: post1.id,
    },
  });

  await prisma.postLike.create({
    data: {
      userId: volunteer3.id,
      postId: post1.id,
    },
  });

  await prisma.postLike.create({
    data: {
      userId: manager1.id,
      postId: post3.id,
    },
  });

  console.log(`✅ Created ${4} post likes`);

  // Tạo Notifications
  console.log("\n🔔 Creating notifications...");
  
  await prisma.notification.create({
    data: {
      type: "EVENT_APPROVED",
      content: "Sự kiện 'Chiến dịch Mùa hè xanh 2025' của bạn đã được phê duyệt!",
      isRead: true,
      link: `/events/${event1.id}`,
      recipientId: manager1.id,
    },
  });

  await prisma.notification.create({
    data: {
      type: "NEW_REGISTRATION",
      content: "Lê Văn Tình Nguyện đã đăng ký tham gia sự kiện 'Hiến máu nhân đạo'",
      isRead: false,
      link: `/events/${event2.id}/registrations`,
      recipientId: manager1.id,
    },
  });

  await prisma.notification.create({
    data: {
      type: "NEW_POST",
      content: "Có bài viết mới trong sự kiện 'Chiến dịch Mùa hè xanh 2025'",
      isRead: false,
      link: `/events/${event1.id}/posts`,
      recipientId: volunteer2.id,
    },
  });

  await prisma.notification.create({
    data: {
      type: "EVENT_REMINDER",
      content: "Nhắc nhở: Sự kiện 'Chương trình đào tạo kỹ năng tình nguyện' sắp diễn ra!",
      isRead: false,
      link: `/events/${event5.id}`,
      recipientId: volunteer1.id,
    },
  });

  console.log(`✅ Created ${4} notifications`);

  // Tổng kết
  console.log("\n" + "=".repeat(60));
  console.log("🎉 SEED COMPLETED SUCCESSFULLY!");
  console.log("=".repeat(60));
  console.log("\n📊 Summary:");
  console.log(`   • Users: 7 (1 Admin, 2 Managers, 4 Volunteers)`);
  console.log(`   • Events: 5 (2 Approved, 2 Pending, 1 Ongoing)`);
  console.log(`   • Registrations: 7`);
  console.log(`   • Posts: 3`);
  console.log(`   • Comments: 3`);
  console.log(`   • Likes: 4`);
  console.log(`   • Notifications: 4`);
  
  console.log("\n🔑 Login Credentials:");
  console.log("   ┌─────────────────────────────────────────────┐");
  console.log("   │ Admin:                                      │");
  console.log("   │   Email: admin@volunteerhub.com             │");
  console.log("   │   Password: admin123                        │");
  console.log("   ├─────────────────────────────────────────────┤");
  console.log("   │ Manager:                                    │");
  console.log("   │   Email: manager1@test.com                  │");
  console.log("   │   Password: 123456                          │");
  console.log("   ├─────────────────────────────────────────────┤");
  console.log("   │ Volunteer:                                  │");
  console.log("   │   Email: volunteer1@test.com                │");
  console.log("   │   Password: 123456                          │");
  console.log("   └─────────────────────────────────────────────┘");
  console.log("\n✨ Database is ready to use!\n");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
