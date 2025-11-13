const bcrypt = require("bcryptjs");
const { prisma } = require("../../lib/prisma");

async function resetUserPasswords() {
  console.log("Resetting all user passwords to default password...");
  
  const defaultPassword = "user123@";
  const passwordHash = await bcrypt.hash(defaultPassword, 12);
  
  // Reset passwords for all non-admin users
  const users = await prisma.user.findMany({
    where: {
      designation: { not: 'ADMIN' }
    }
  });
  
  console.log(`Found ${users.length} non-admin users to update`);
  
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { password: passwordHash }
    });
    console.log(`Reset password for ${user.email} (${user.name})`);
  }
  
  console.log(`All user passwords reset to: ${defaultPassword}`);
  console.log("Users can now login with their email and password: user123@");
}

module.exports = { resetUserPasswords };