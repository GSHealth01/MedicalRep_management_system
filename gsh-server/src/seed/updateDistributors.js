const { prisma } = require('../../lib/prisma');

async function updateDistributors() {
  try {
    console.log('Creating new distributors with distributor codes...');

    // First, let's clear existing distributors to avoid conflicts
    console.log('Clearing existing distributor products relationships...');
    await prisma.distributorProducts.deleteMany({});

    console.log('Clearing existing user-distributor relationships...');
    await prisma.user.updateMany({
      data: { distributor_code: null }
    });

    console.log('Clearing existing distributors...');
    await prisma.distributor.deleteMany({});

    // Get agencies and ranges for the new distributors
    const agencies = await prisma.agency.findMany();
    const ranges = await prisma.range.findMany();
    const areas = await prisma.area.findMany();

    console.log('Available agencies:', agencies);
    console.log('Available ranges:', ranges);
    console.log('Available areas:', areas);

    if (agencies.length === 0 || ranges.length === 0 || areas.length === 0) {
      console.log('Creating basic agencies, ranges, and areas...');
      
      // Create basic agency
      const agency = await prisma.agency.create({
        data: { name: 'GS Health' }
      });

      // Create basic range
      const range = await prisma.range.create({
        data: { name: 'A', agency_id: agency.id }
      });

      // Create basic area
      const area = await prisma.area.create({
        data: { name: 'Central Area' }
      });

      // Create distributors with new format
      const distributors = [
        {
          distributor_code: 'DIS036',
          name: 'Central Distributor',
          coverage_town: 'Colombo',
          route: 'Central Route',
          agency_id: agency.id,
          range_id: range.id,
          area_id: area.id
        },
        {
          distributor_code: 'DIS039',
          name: 'Western Distributor', 
          coverage_town: 'Kandy',
          route: 'Western Route',
          agency_id: agency.id,
          range_id: range.id,
          area_id: area.id
        },
        {
          distributor_code: 'DIS040',
          name: 'Eastern Distributor',
          coverage_town: 'Galle',
          route: 'Eastern Route', 
          agency_id: agency.id,
          range_id: range.id,
          area_id: area.id
        }
      ];

      for (const distributorData of distributors) {
        await prisma.distributor.create({ data: distributorData });
        console.log(`Created distributor: ${distributorData.distributor_code} - ${distributorData.name}`);
      }

    } else {
      // Use existing data
      const agency = agencies[0];
      const range = ranges[0];
      const area = areas[0];

      const distributors = [
        {
          distributor_code: 'DIS036',
          name: 'Central Distributor',
          coverage_town: 'Colombo',
          route: 'Central Route',
          agency_id: agency.id,
          range_id: range.id,
          area_id: area.id
        },
        {
          distributor_code: 'DIS039',
          name: 'Western Distributor',
          coverage_town: 'Kandy', 
          route: 'Western Route',
          agency_id: agency.id,
          range_id: range.id,
          area_id: area.id
        }
      ];

      for (const distributorData of distributors) {
        await prisma.distributor.create({ data: distributorData });
        console.log(`Created distributor: ${distributorData.distributor_code} - ${distributorData.name}`);
      }
    }

    console.log('Distributor update completed successfully!');
    
  } catch (error) {
    console.error('Error updating distributors:', error);
  }
}

// Run the update
updateDistributors()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });