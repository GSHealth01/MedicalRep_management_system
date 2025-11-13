const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // --- 1. Create Parent Data First ---
  // We use `upsert` to avoid creating duplicates if you run the seed multiple times.

  const agency = await prisma.agency.upsert({
    where: { name: 'Main Agency' },
    update: {},
    create: { name: 'Main Agency' },
  });
  console.log('Created agency:', agency.name);

  const area = await prisma.area.upsert({
    where: { name: 'Main Area' },
    update: {},
    create: { name: 'Main Area' },
  });
  console.log('Created area:', area.name);

  // Create the specific areas for distributor form
  const areas = [
    { name: 'Colombo' },
    { name: 'Gampaha' },
    { name: 'Kandy' },
    { name: 'Kurunegala' }
  ];

  const createdAreas = [];
  for (const areaData of areas) {
    const newArea = await prisma.area.upsert({
      where: { name: areaData.name },
      update: {},
      create: areaData,
    });
    createdAreas.push(newArea);
    console.log('Created area:', newArea.name);
  }

  const range = await prisma.range.upsert({
    where: { id: 1 }, // Use a predictable ID for the first one
    update: {},
    create: {
      name: 'Main Range',
      agency_id: agency.id,
    },
  });
  console.log('Created range:', range.name);

  const team = await prisma.team.upsert({
    where: { id: 1 }, // Use a predictable ID
    update: {},
    create: {
      name: 'Admin Team', // Updated from team_name to name
      range_id: range.id,
      agency_id: agency.id, // Added required agency_id field
    },
  });
  console.log('Created team:', team.team_name);

  const distributor = await prisma.distributor.upsert({
    where: { area_id: area.id }, // `area_id` is unique, so we use it
    update: {},
    create: {
      name: 'Main Distributor',
      agency_id: agency.id,
      area_id: area.id,
      range_id: range.id, // Added required range_id field
    },
  });
  console.log('Created distributor:', distributor.name);

  // --- 2. Now Create the Admin User ---
  const adminEmail = 'admin@yourcompany.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('Admin user already exists. Skipping...');
  } else {
    const salt = await bcrypt.genSalt(10);
    // !! SET YOUR ADMIN PASSWORD HERE !!
    const hashedPassword = await bcrypt.hash('adminpassword123', salt);

    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Admin',
        emp_no: 'A-001', // This must be unique
        designation: 'ADMIN',
        agency_id: agency.id,
        range_id: range.id,
        team_id: team.id,
        distributor_id: distributor.id,
      },
    });
    console.log('Admin user created successfully:', adminUser);
  }

  console.log('Seeding complete! 🚀');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });