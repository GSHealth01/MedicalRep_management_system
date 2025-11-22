const { config } = require("./config/env");
const { prisma } = require("../lib/prisma");
const { seedAdminUser } = require("./seeds/adminSeed");
const app = require("./app");

(async () => {
  // Initialize Prisma connection
  await prisma.$connect();
  console.log("Connected to PostgreSQL database via Prisma");

  await seedAdminUser();

  app.listen(config.PORT, () => {
    console.log(`API listening on :${config.PORT}`);
  });
})();