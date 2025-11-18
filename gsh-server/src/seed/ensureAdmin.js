const bcrypt = require("bcryptjs");
const { prisma } = require("../../lib/prisma");

async function ensureAdmin() {
  const hasAdmin = await prisma.user.findFirst({
    where: { designation: "ADMIN" }
  });

  if (hasAdmin) {
    console.log("Admin found. Resetting admin password to ensure correct hash...");
    const passwordHash = await bcrypt.hash("admin123@", 12);
    const securityAnswerHash = await bcrypt.hash("admin123", 10);
    await prisma.user.update({
      where: { email: "admin@gsh.com" },
      data: {
        password: passwordHash,
        security_question: "What is your favorite color?",
        security_answer: securityAnswerHash
      }
    });
    console.log("Admin password and security question reset successfully.");
    return;
  }

  // Check if admin email already exists and delete it if it does
  const existingAdmin = await prisma.user.findUnique({
    where: { email: process.env.ADMIN_EMAIL || "admin@gsh.com" }
  });

  if (existingAdmin) {
    try {
      await prisma.user.delete({
        where: { id: existingAdmin.id }
      });
      console.log("Removed existing admin user with duplicate email.");
    } catch (error) {
      console.log("Could not delete existing admin user, but continuing with seeding.");
    }
  }

  const name = process.env.ADMIN_NAME || "System Admin";
  const email = process.env.ADMIN_EMAIL || "admin@gsh.com";
  const password = process.env.ADMIN_PASSWORD || "ChangeMe#123";

  const passwordHash = await bcrypt.hash(password, 12);

  // First create an agency if it doesn't exist
  let agency = await prisma.agency.findFirst({
    where: { name: "Default Agency" }
  });

  if (!agency) {
    agency = await prisma.agency.create({
      data: { name: "Default Agency" }
    });
  }

  // Create a range if it doesn't exist
  let range = await prisma.range.findFirst({
    where: { name: "Default Range", agency_id: agency.id }
  });

  if (!range) {
    range = await prisma.range.create({
      data: {
        name: "Default Range",
        agency_id: agency.id
      }
    });
  }

  // Create a team if it doesn't exist
  let team = await prisma.team.findFirst({
    where: { name: "Admin Team", range_id: range.id }
  });

  if (!team) {
    team = await prisma.team.create({
      data: {
        name: "Admin Team",
        range_id: range.id,
        agency_id: agency.id
      }
    });
  }

  const admin = await prisma.user.create({
    data: {
      name,
      email,
      password: passwordHash,
      emp_no: "ADMIN001",
      designation: "ADMIN",
      agency_id: agency.id,
      range_id: range.id,
      team_id: team.id
    }
  });

  console.log(`Admin seeded → ${admin.email}`);
}

module.exports = { ensureAdmin };
