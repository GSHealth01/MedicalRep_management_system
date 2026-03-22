const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const teams = await prisma.team.findMany({ include: { users: true } });
  
  const designationToBucket = {
    'OM':   'ops',
    'SM':   'sms',
    'MGR':  'mgrs',
    'PM':   'pms',
    'TM':   'tms',
    'PPES': 'ppes',
    'PPEJ': 'ppej',
    'FC':   'fcs',
    'MR':   'mrs'
  };

  const t = teams.find(t => t.id === 18);
  if (!t) return console.log("Team 18 not found");
  const groupedUsers = {
    ops: [], sms: [], mgrs: [], pms: [], tms: [], ppes: [], ppej: [], fcs: [], mrs: []
  };

  t.users.forEach(user => {
    const normalizedDesignation = String(user.designation || '').toUpperCase().trim();
    const bucket = designationToBucket[normalizedDesignation];
    if (bucket) {
      groupedUsers[bucket].push(user);
    }
  });

  console.log("Bucket pms count:", groupedUsers.pms.length);
  console.log("Joined string:", groupedUsers.pms.length > 0 ? groupedUsers.pms.map(u => u.name).join(', ') : '-');
}
main().catch(console.error).finally(() => prisma.$disconnect());
