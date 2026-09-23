import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log("Seed skipped: database already has users.");
    return;
  }

  // Sample-data fixtures land in Phase 9 (prisma/sample-data/); this is the
  // conditional-seed wiring the container start relies on until then.
  console.log("Seed placeholder: no sample data yet.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
