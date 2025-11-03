const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateAdminRole() {
  try {
    const updatedUser = await prisma.user.update({
      where: { email: 'admin@gsh.com' },
      data: { role: 'ADMIN' }
    });
    console.log('Admin role updated successfully:', updatedUser);
  } catch (error) {
    console.error('Error updating admin role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminRole();