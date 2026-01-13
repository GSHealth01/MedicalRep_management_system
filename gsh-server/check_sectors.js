const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSectors() {
  try {
    const sectors = await prisma.sector.findMany();
    console.log('Sectors in database:', sectors.length);
    sectors.forEach(s => console.log(s));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSectors();