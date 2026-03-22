const bcrypt = require('bcryptjs');
const { prisma } = require('../../../lib/prisma');

async function getFormData(req, res) {
  try {
    const [agencies, ranges, teams, distributors] = await Promise.all([
      prisma.agency.findMany({ select: { id: true, name: true } }),
      prisma.range.findMany({ select: { id: true, name: true } }),
      prisma.team.findMany({ select: { id: true, name: true } }),
      prisma.distributor.findMany({
        select: {
          distributor_code: true,
          name: true,
          coverage_town: true,
          route: true,
          area: { select: { name: true } },
          range: { select: { name: true } },
          agency: { select: { name: true } }
        }
      })
    ]);

    res.json({
      agencies,
      ranges,
      teams,
      distributors
    });
  } catch (error) {
    console.error('Error fetching form data:', error);
    res.status(500).json({ message: 'Failed to fetch form data' });
  }
}

async function createUser(req, res) {
  try {
    const {
      email,
      password,
      name,
      emp_no,
      designation,
      join_date,
      birthday,
      agency_id,
      range_id,
      team_id,
      distributor_id
    } = req.body;

    console.log('Creating user with distributor_id:', distributor_id);

    // If distributor_id is provided, we need to find the actual distributor_code
    let distributor_code = null;
    if (distributor_id) {
      // Check if it's a code (like DIS001) or a name
      const distributor = await prisma.distributor.findFirst({
        where: {
          OR: [
            { distributor_code: distributor_id },
            { name: distributor_id }
          ]
        },
        select: { distributor_code: true, name: true }
      });
      
      if (distributor) {
        distributor_code = distributor.distributor_code;
        console.log('Found distributor code:', distributor_code);
      } else {
        console.log('No distributor found for:', distributor_id);
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with relationships
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        emp_no,
        designation,
        join_date: join_date ? new Date(join_date) : null,
        birthday: birthday ? new Date(birthday) : null,
        agency_id: agency_id ? parseInt(agency_id) : null,
        range_id: range_id ? parseInt(range_id) : null,
        team_id: team_id ? parseInt(team_id) : null,
        distributor_code: distributor_code  // Store the actual distributor CODE
      },
      select: {
        id: true,
        email: true,
        name: true,
        emp_no: true,
        designation: true,
        join_date: true,
        birthday: true,
        distributor_code: true,
        agency: { select: { id: true, name: true } },
        range: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        createdAt: true
      }
    });

    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    console.error('Error creating user:', error);

    // Handle Prisma unique constraint error
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      return res.status(409).json({
        message: `${field} already exists`
      });
    }

    res.status(500).json({ message: 'Failed to create user' });
  }
}

async function getAllUsers(req, res) {
  try {
    const { range } = req.query;
    let where = {};
    if (range) {
      where.sector = { range };
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        emp_no: true,
        designation: true,
        join_date: true,
        birthday: true,
        sector: { select: { id: true, agency: true, range: true } },
        team: { select: { id: true, name: true } },
        distributors: {
          include: {
            distributor: { select: { distributor_code: true, name: true } }
          }
        }
      },
      orderBy: { dateAdded: 'desc' }
    });

    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
}

async function getCurrentUserProfile(req, res) {
  try {
    const userId = req.user.id; // From JWT middleware
    console.log('Fetching profile for user ID:', userId);
    
    // Get user data with new distributors relationship
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        emp_no: true,
        designation: true,
        join_date: true,
        birthday: true,
        sector: { select: { id: true, agency: true, range: true } },
        team: { select: { id: true, name: true } },
        distributors: {
          include: {
            distributor: {
              select: {
                distributor_code: true,
                name: true,
                coverage_town: true,
                route: true,
                area: { select: { name: true } },
                sector: { select: { agency: true, range: true } }
              }
            }
          }
        }
      }
    });

    console.log('User data found:', user);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get first distributor info for backward compatibility (DCR form expects single distributor)
    let distributorInfo = null;
    if (user.distributors && user.distributors.length > 0) {
      console.log('Found distributors for user:', user.distributors.length);
      distributorInfo = user.distributors[0].distributor;
      console.log('Primary distributor info:', distributorInfo);
    } else {
      console.log('No distributors found for user');
    }

    // Return data in the format DCR form expects
    const userWithDistributor = {
      id: user.id,
      email: user.email,
      name: user.name,
      emp_no: user.emp_no,
      designation: user.designation,
      join_date: user.join_date,
      birthday: user.birthday,
      agency: user.sector ? { id: user.sector.id, name: user.sector.agency } : null,
      range: user.sector ? { id: user.sector.id, name: user.sector.range } : null,
      team: user.team,
      // For DCR compatibility - return first distributor as 'distributor'
      distributor: distributorInfo,
      // Also provide all distributors as array
      distributors: user.distributors.map(ud => ud.distributor)
    };

    console.log('Final user data with distributors:', userWithDistributor);

    res.json({ user: userWithDistributor });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
}

async function getTeamSubordinates(req, res) {
  try {
    const userId = req.user.id;
    const userDesignation = (req.user.designation || '').toUpperCase().trim();

    console.log(`[DEBUG] getTeamSubordinates for user ${userId}, designation: "${userDesignation}"`);

    // Hierarchy rank: lower number = higher power
    const HIERARCHY = {
      // Abbreviations
      'OM': 1, 'SM': 2, 'MGR': 3, 'PM': 4, 'TM': 5,
      'PPES': 6, 'PPEJ': 7, 'FC': 8, 'MR': 9,
      // Full names fallbacks
      'OPERATIONS MANAGER': 1,
      'SENIOR MANAGER': 2,
      'MANAGER': 3,
      'PRODUCTS MANAGER': 4,
      'PRODUCT MANAGER': 4,
      'TERRITORY MANAGER': 5,
      'PRODUCT PROMOTION EXECUTIVE - SENIOR': 6,
      'PRODUCT PROMOTION EXECUTIVE - JUNIOR': 7,
      'FIELD COORDINATOR': 8,
      'MEDICAL REPRESENTATIVE': 9,
      'MEDICAL REP': 9
    };

    const userRank = HIERARCHY[userDesignation];
    console.log(`[DEBUG] User Rank: ${userRank}`);

    // MR (9), ADMIN, or unknown designation get no subordinates
    if (!userRank || userRank >= 9 || userDesignation === 'ADMIN') {
      console.log(`[DEBUG] User has no subordinates (Rank ${userRank}, Designation ${userDesignation})`);
      return res.json({ data: [] });
    }

    // Get the logged-in user's team
    const currentUser = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { team_id: true }
    });

    if (!currentUser || !currentUser.team_id) {
      console.log(`[DEBUG] User ${userId} has no team assigned.`);
      return res.json({ data: [] });
    }

    console.log(`[DEBUG] User team ID: ${currentUser.team_id}`);

    // All short codes that are BELOW this user in Rank
    const subordinateDesignations = ['OM', 'SM', 'MGR', 'PM', 'TM', 'PPES', 'PPEJ', 'FC', 'MR']
      .filter(code => HIERARCHY[code] > userRank);

    console.log(`[DEBUG] Looking for subordinates with designations:`, subordinateDesignations);

    const subordinates = await prisma.user.findMany({
      where: {
        team_id: currentUser.team_id,
        designation: { in: subordinateDesignations },
        id: { not: parseInt(userId) } // never show self
      },
      include: {
        sector: true,
        team: true
      },
      orderBy: { name: 'asc' }
    });

    console.log(`[DEBUG] Found ${subordinates.length} subordinates:`, subordinates.map(s => s.name));

    res.json({ data: subordinates });
  } catch (error) {
    console.error('Error fetching team subordinates:', error);
    res.status(500).json({ message: 'Failed to fetch team subordinates' });
  }
}

async function getEmployees(req, res) {
  try {
    const userId = req.user.id;
    const users = await prisma.user.findMany({
      where: {
        designation: { notIn: ['ADMIN'] },
        id: { not: parseInt(userId) } // Optional: also hide the user themselves
      },
      include: {
        sector: true,
        team: true
      },
      orderBy: { name: 'asc' }
    });
    res.json({ data: users });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Failed to fetch employees' });
  }
}

module.exports = {
  getFormData,
  createUser,
  getAllUsers,
  getCurrentUserProfile,
  getEmployees,
  getTeamSubordinates
};