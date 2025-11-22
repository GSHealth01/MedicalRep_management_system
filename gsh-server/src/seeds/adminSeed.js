const bcrypt = require("bcryptjs");
const { prisma } = require("../../lib/prisma");

/**
 * Seeds the admin user with email admin@gsh.lk and password admin123@
 * This function is idempotent - it only creates the admin if it doesn't exist.
 */
async function seedAdminUser() {
  const adminEmail = "admin@gsh.lk";
  const adminPassword = "admin123@";

  try {
    // Always ensure the admin has the correct credentials using upsert
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    // First ensure required relations exist
    let agency = await prisma.agency.findFirst({
      where: { name: "Default Agency" }
    });

    if (!agency) {
      agency = await prisma.agency.create({
        data: { name: "Default Agency" }
      });
    }

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

    // Find a unique emp_no
    let empNo = "ADMIN001";
    let counter = 1;
    while (await prisma.user.findUnique({ where: { emp_no: empNo } })) {
      empNo = `ADMIN${String(counter).padStart(3, '0')}`;
      counter++;
    }

    // Upsert the admin user
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        password: passwordHash,
        name: "System Admin",
        designation: "ADMIN",
        agency_id: agency.id,
        range_id: range.id,
        team_id: team.id
      },
      create: {
        name: "System Admin",
        email: adminEmail,
        password: passwordHash,
        emp_no: empNo,
        designation: "ADMIN",
        agency_id: agency.id,
        range_id: range.id,
        team_id: team.id
      }
    });

    console.log("Admin user seeded successfully.");
  } catch (error) {
    console.error("Error seeding admin user:", error);
    throw error;
  }
}

module.exports = { seedAdminUser };