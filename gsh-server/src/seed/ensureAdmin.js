const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function ensureAdmin() {
  const hasAdmin = await User.exists({ role: "ADMIN" });
  if (hasAdmin) {
    console.log("Admin already present. Skipping admin seed.");
    return;
  }

  const name = process.env.ADMIN_NAME || "System Admin";
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD || "ChangeMe#123";

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await User.create({
    name,
    email,
    passwordHash,
    role: "ADMIN"
  });

  console.log(`Admin seeded → ${admin.email}`);
}

module.exports = { ensureAdmin };
