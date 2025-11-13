const { prisma } = require("../../lib/prisma");

async function fixUsers() {
  console.log("Fixing users with missing agency and range assignments...");
  
  // Get available agencies and ranges
  const agencies = await prisma.agency.findMany();
  const ranges = await prisma.range.findMany();
  
  console.log(`Found ${agencies.length} agencies and ${ranges.length} ranges`);
  
  // Update users with null agency_id and range_id
  const usersToUpdate = await prisma.user.findMany({
    where: {
      designation: { not: 'ADMIN' },
      OR: [
        { agency_id: null },
        { range_id: null }
      ]
    }
  });
  
  console.log(`Found ${usersToUpdate.length} users to update`);
  
  for (let i = 0; i < usersToUpdate.length; i++) {
    const user = usersToUpdate[i];
    // Assign first agency and its first range
    const agency = agencies[0];
    const range = ranges.find(r => r.agency_id === agency.id);
    
    if (agency && range) {
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          agency_id: agency.id, 
          range_id: range.id 
        }
      });
      console.log(`Updated user ${user.email} with agency_id: ${agency.id}, range_id: ${range.id}`);
    }
  }
  
  console.log("User fixes completed!");
}

module.exports = { fixUsers };