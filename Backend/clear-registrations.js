const prisma = require("./src/config/prisma");

async function main() {
  await prisma.eventRegistration.deleteMany({});
  console.log("Deleted all registrations");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
