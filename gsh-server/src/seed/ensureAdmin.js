const bcrypt = require("bcryptjs");
const { prisma } = require("../../lib/prisma");

async function ensureAdmin() {
  // Admin seeding is now handled by src/seeds/adminSeed.js
  // This function is kept for backward compatibility but no longer creates/updates admin
  const admin = await prisma.user.findFirst({
    where: { designation: "ADMIN" }
  });

  if (admin) {
    console.log("Admin user exists.");
  } else {
    console.log("No admin user found. Admin seeding should be handled by seedAdminUser.");
  }
}

module.exports = { ensureAdmin };
