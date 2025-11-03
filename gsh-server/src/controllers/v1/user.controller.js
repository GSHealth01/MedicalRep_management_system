const bcrypt = require('bcryptjs');
const { prisma } = require('../../../lib/prisma');

async function getFormData(req, res) {
  try {
    const [agencies, ranges, teams, distributors] = await Promise.all([
      prisma.agency.findMany({ select: { id: true, name: true } }),
      prisma.range.findMany({ select: { id: true, name: true } }),
      prisma.team.findMany({ select: { id: true, team_name: true } }),
      prisma.distributor.findMany({ select: { id: true, name: true } })
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
        distributor_id: distributor_id ? parseInt(distributor_id) : null
      },
      select: {
        id: true,
        email: true,
        name: true,
        emp_no: true,
        designation: true,
        join_date: true,
        birthday: true,
        agency: { select: { id: true, name: true } },
        range: { select: { id: true, name: true } },
        team: { select: { id: true, team_name: true } },
        distributor: { select: { id: true, name: true } },
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
        agency: { select: { id: true, name: true } },
        range: { select: { id: true, name: true } },
        team: { select: { id: true, team_name: true } },
        distributor: { select: { id: true, name: true } },
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

module.exports = {
  getFormData,
  createUser,
  getAllUsers
};