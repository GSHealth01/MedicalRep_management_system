const { config } = require("./config/env");
const { prisma } = require("../lib/prisma");
const { ensureAdmin } = require("./seed/ensureAdmin");
const app = require("./app");

(async () => {
  // Initialize Prisma connection
  await prisma.$connect();
  console.log("Connected to PostgreSQL database via Prisma");

  await ensureAdmin();

  app.listen(config.PORT, () => {
    console.log(`API listening on :${config.PORT}`);
  });
})();
