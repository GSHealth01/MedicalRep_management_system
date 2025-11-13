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
    const users = await prisma.user.findMany({
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
        distributor: {
          select: {
            distributor_code: true,
            name: true,
            coverage_town: true,
            route: true,
            area: { select: { name: true } },
            range: { select: { name: true } },
            agency: { select: { name: true } }
          }
        },
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
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
    
    // Get user data first
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
        distributor_code: true,
        agency: { select: { id: true, name: true } },
        range: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } }
      }
    });

    console.log('User data found:', user);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get distributor information manually if distributor_code exists
    let distributorInfo = null;
    if (user.distributor_code) {
      console.log('Looking up distributor with code:', user.distributor_code);
      distributorInfo = await prisma.distributor.findUnique({
        where: { distributor_code: user.distributor_code },
        select: {
          distributor_code: true,
          name: true,
          coverage_town: true,
          route: true,
          area: { select: { name: true } },
          range: { select: { name: true } },
          agency: { select: { name: true } }
        }
      });
      console.log('Distributor info found:', distributorInfo);
    } else {
      console.log('No distributor_code found for user');
    }

    // Combine user and distributor data
    const userWithDistributor = {
      ...user,
      distributor: distributorInfo
    };

    console.log('Final user data with distributor:', userWithDistributor);

    res.json({ user: userWithDistributor });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
}

module.exports = {
  getFormData,
  createUser,
  getAllUsers,
  getCurrentUserProfile
};