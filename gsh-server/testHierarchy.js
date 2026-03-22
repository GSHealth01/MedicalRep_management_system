const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({ where: { id: 255 } });
  
  const designation = user.designation;
  const HIERARCHY = {
    'OM': 1, 'SM': 2, 'MGR': 3, 'PM': 4, 'TM': 5,
    'PPES': 6, 'PPEJ': 7, 'FC': 8, 'MR': 9
  };
  const rank = HIERARCHY[designation];
  
  const subordinateDesignations = Object.entries(HIERARCHY)
      .filter(([, r]) => r > rank)
      .map(([des]) => des);
      
  console.log('User:', user.name, 'Designation:', designation, 'Rank:', rank);
  console.log('Subordinate Designations:', subordinateDesignations);
  
  const subs = await prisma.user.findMany({
    where: {
      team_id: user.team_id,
      designation: { in: subordinateDesignations }
    }
  });
  
  console.log('Subordinates length:', subs.length, subs.map(s => s.name));
}
main().catch(console.error).finally(() => prisma.$disconnect());
