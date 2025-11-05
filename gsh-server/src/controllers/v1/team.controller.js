const { prisma } = require('../../../lib/prisma');

async function createTeam(req, res) {
  try {
    const { name, range_id, agency_id } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const teamData = { name };
    if (range_id) {
      teamData.range_id = parseInt(range_id);
    }
    if (agency_id) {
      teamData.agency_id = parseInt(agency_id);
    }

    const newTeam = await prisma.team.create({
      data: teamData,
      include: {
        range: {
          select: {
            id: true,
            name: true
          }
        },
        agency: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: { users: true }
        }
      }
    });

    res.status(201).json({
      message: 'Team created successfully',
      team: newTeam
    });
  } catch (error) {
    console.error('Error creating team:', error);

    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Invalid range_id or agency_id provided' });
    }

    res.status(500).json({ message: 'Failed to create team' });
  }
}

async function getAllTeams(req, res) {
  try {
    const teams = await prisma.team.findMany({
      include: {
        range: {
          select: {
            id: true,
            name: true
          }
        },
        agency: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: { users: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ teams });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ message: 'Failed to fetch teams' });
  }
}

async function getOneTeam(req, res) {
  try {
    const { id } = req.params;
    const team = await prisma.team.findUnique({
      where: { id: parseInt(id) },
      include: {
        range: {
          select: {
            id: true,
            name: true
          }
        },
        agency: {
          select: {
            id: true,
            name: true
          }
        },
        users: {
          select: {
            id: true,
            name: true,
            emp_no: true,
            designation: true
          }
        }
      }
    });

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json({ team });
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ message: 'Failed to fetch team' });
  }
}

async function updateTeam(req, res) {
  try {
    const { id } = req.params;
    const { name, range_id, agency_id } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updateData = { name };
    if (range_id !== undefined) {
      updateData.range_id = range_id ? parseInt(range_id) : null;
    }
    if (agency_id !== undefined) {
      updateData.agency_id = agency_id ? parseInt(agency_id) : null;
    }

    const updatedTeam = await prisma.team.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        range: {
          select: {
            id: true,
            name: true
          }
        },
        agency: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: { users: true }
        }
      }
    });

    res.json({
      message: 'Team updated successfully',
      team: updatedTeam
    });
  } catch (error) {
    console.error('Error updating team:', error);

    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Invalid range_id or agency_id provided' });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.status(500).json({ message: 'Failed to update team' });
  }
}

async function deleteTeam(req, res) {
  try {
    const { id } = req.params;

    await prisma.team.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Cannot delete team with existing relationships' });
    }

    res.status(500).json({ message: 'Failed to delete team' });
  }
}

async function getFormData(req, res) {
  try {
    const ranges = await prisma.range.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: { name: 'asc' }
    });

    const agencies = await prisma.agency.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({ ranges, agencies });
  } catch (error) {
    console.error('Error fetching form data:', error);
    res.status(500).json({ message: 'Failed to fetch form data' });
  }
}

module.exports = {
  createTeam,
  getAllTeams,
  getOneTeam,
  updateTeam,
  deleteTeam,
  getFormData
};