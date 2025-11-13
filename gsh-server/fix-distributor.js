const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUserDistributor() {
  try {
    console.log('=== FIXING USER DISTRIBUTOR RELATIONSHIP ===');
    
    // Step 1: Create Colombo area if it doesn't exist
    let area = await prisma.area.findFirst({ where: { name: 'Colombo' } });
    if (!area) {
      area = await prisma.area.create({
        data: { name: 'Colombo' }
      });
      console.log('✅ Created Colombo area:', area);
    } else {
      console.log('✅ Colombo area already exists:', area);
    }
    
    // Step 2: Create British Agencies distributor if it doesn't exist
    let distributor = await prisma.distributor.findFirst({
      where: { name: 'British Agencies' }
    });
    
    if (!distributor) {
      distributor = await prisma.distributor.create({
        data: {
          distributor_code: 'DIS001',
          name: 'British Agencies',
          coverage_town: 'Colombo',
          route: 'Route A',
          agency_id: 10, // B4 agency  
          range_id: 5,   // B range
          area_id: area.id
        }
      });
      console.log('✅ Created British Agencies distributor:', distributor);
    } else {
      console.log('✅ British Agencies distributor already exists:', distributor);
    }
    
    // Step 3: Update user 20 to use the correct distributor_code
    const updatedUser = await prisma.user.update({
      where: { id: 20 },
      data: { 
        distributor_code: distributor.distributor_code
      },
      select: {
        id: true,
        name: true,
        distributor_code: true,
        email: true
      }
    });
    
    console.log('✅ Updated user:', updatedUser);
    console.log('🎉 SUCCESS: User now properly linked to distributor!');
    
    // Step 4: Test the profile lookup
    const testProfile = await prisma.user.findUnique({
      where: { id: 20 },
      select: {
        id: true,
        name: true,
        distributor_code: true,
        distributor: {
          select: {
            distributor_code: true,
            name: true,
            coverage_town: true,
            area: { select: { name: true } }
          }
        }
      }
    });
    
    console.log('🎯 Profile test result:', JSON.stringify(testProfile, null, 2));
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixUserDistributor();