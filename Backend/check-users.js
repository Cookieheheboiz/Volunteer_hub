const prisma = require("./src/config/prisma");

async function main() {
  const count = await prisma.user.count();
  console.log(`Total users: ${count}`);
  const users = await prisma.user.findMany({ take: 5 });
  console.log("Sample users:", users);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
