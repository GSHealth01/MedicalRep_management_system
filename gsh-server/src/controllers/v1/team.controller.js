const { prisma } = require('../../../lib/prisma');
const ApiResponse = require("../../utils/ApiResponse");
const AppError = require("../../utils/AppError");

// Helper functions for designation parsing
function parseDesignation(designation) {
  if (!designation) return { role: 'NORMAL', status: 'ACTIVE' };
  const parts = designation.split('_');
  if (parts.length === 2) {
    return { role: parts[0], status: parts[1] };
  }
  return { role: 'NORMAL', status: 'ACTIVE' };
}

function buildDesignation(role, status) {
  return `${role}_${status}`;
}

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
      return ApiResponse.error(res, "Team not found", 404);
    }

    // Parse designations and find leader
    let leader = null;
    const usersWithRoles = team.users.map(user => {
      const { role, status } = parseDesignation(user.designation);
      if (role === 'LEADER') {
        leader = { id: user.id, name: user.name };
      }
      return {
        id: user.id,
        name: user.name,
        emp_no: user.emp_no,
        role,
        status
      };
    });

    const response = {
      ...team,
      users: usersWithRoles,
      leader
    };

    return ApiResponse.ok(res, "Team fetched", response);
  } catch (error) {
    console.error('Error fetching team:', error);
    return ApiResponse.error(res, "Failed to fetch team");
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

    return ApiResponse.ok(res, "Form data fetched", { ranges, agencies });
  } catch (error) {
    console.error('Error fetching form data:', error);
    return ApiResponse.error(res, "Failed to fetch form data");
  }
}

// Assign user to team
async function assignUser(req, res) {
  try {
    const { teamId } = req.params;
    const { userId, status = 'ACTIVE', role = 'NORMAL' } = req.body;

    if (!userId) {
      return ApiResponse.error(res, "userId is required", 400);
    }

    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return ApiResponse.error(res, "Status must be ACTIVE or INACTIVE", 400);
    }

    if (!['NORMAL', 'LEADER'].includes(role)) {
      return ApiResponse.error(res, "Role must be NORMAL or LEADER", 400);
    }

    const teamIdInt = parseInt(teamId);
    const userIdInt = parseInt(userId);

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: teamIdInt }
    });
    if (!team) {
      return ApiResponse.error(res, "Team not found", 404);
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userIdInt }
    });
    if (!user) {
      return ApiResponse.error(res, "User not found", 404);
    }

    // Check if user is already in a team
    if (user.team_id) {
      return ApiResponse.error(res, "User is already assigned to a team", 400);
    }

    // If assigning as LEADER, demote current leader
    if (role === 'LEADER') {
      const currentLeader = await prisma.user.findFirst({
        where: {
          team_id: teamIdInt,
          designation: { startsWith: 'LEADER_' }
        }
      });
      if (currentLeader) {
        const { status: currentStatus } = parseDesignation(currentLeader.designation);
        await prisma.user.update({
          where: { id: currentLeader.id },
          data: { designation: buildDesignation('NORMAL', currentStatus) }
        });
      }
    }

    // Assign user to team with specified designation
    const updatedUser = await prisma.user.update({
      where: { id: userIdInt },
      data: {
        team_id: teamIdInt,
        designation: buildDesignation(role, status)
      },
      include: {
        team: { select: { id: true, name: true } }
      }
    });

    return ApiResponse.ok(res, "User assigned to team", {
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        emp_no: updatedUser.emp_no,
        designation: updatedUser.designation,
        team: updatedUser.team
      }
    });
  } catch (error) {
    console.error('Error assigning user to team:', error);
    return ApiResponse.error(res, "Failed to assign user to team");
  }
}

// Update user status in team
async function updateUserStatus(req, res) {
  try {
    const { teamId, userId } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return ApiResponse.error(res, "Status must be ACTIVE or INACTIVE", 400);
    }

    const teamIdInt = parseInt(teamId);
    const userIdInt = parseInt(userId);

    // Check if user is in the team
    const user = await prisma.user.findUnique({
      where: { id: userIdInt }
    });
    if (!user || user.team_id !== teamIdInt) {
      return ApiResponse.error(res, "User not found in this team", 404);
    }

    // Parse current designation and update status
    const { role } = parseDesignation(user.designation);
    const newDesignation = buildDesignation(role, status);

    const updatedUser = await prisma.user.update({
      where: { id: userIdInt },
      data: { designation: newDesignation }
    });

    return ApiResponse.ok(res, "User status updated", {
      user: {
        id: updatedUser.id,
        designation: updatedUser.designation,
        role,
        status
      }
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    return ApiResponse.error(res, "Failed to update user status");
  }
}

// Update user role in team
async function updateUserRole(req, res) {
  try {
    const { teamId, userId } = req.params;
    const { role } = req.body;

    if (!['NORMAL', 'LEADER'].includes(role)) {
      return ApiResponse.error(res, "Role must be NORMAL or LEADER", 400);
    }

    const teamIdInt = parseInt(teamId);
    const userIdInt = parseInt(userId);

    // Check if user is in the team
    const user = await prisma.user.findUnique({
      where: { id: userIdInt }
    });
    if (!user || user.team_id !== teamIdInt) {
      return ApiResponse.error(res, "User not found in this team", 404);
    }

    // If setting to LEADER, demote current leader
    if (role === 'LEADER') {
      const currentLeader = await prisma.user.findFirst({
        where: {
          team_id: teamIdInt,
          designation: { startsWith: 'LEADER_' }
        }
      });
      if (currentLeader) {
        const { status } = parseDesignation(currentLeader.designation);
        await prisma.user.update({
          where: { id: currentLeader.id },
          data: { designation: buildDesignation('NORMAL', status) }
        });
      }
    }

    // Update user's role
    const { status } = parseDesignation(user.designation);
    const newDesignation = buildDesignation(role, status);

    const updatedUser = await prisma.user.update({
      where: { id: userIdInt },
      data: { designation: newDesignation }
    });

    return ApiResponse.ok(res, "User role updated", {
      user: {
        id: updatedUser.id,
        designation: updatedUser.designation,
        role,
        status
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return ApiResponse.error(res, "Failed to update user role");
  }
}

// Remove user from team
async function removeUserFromTeam(req, res) {
  try {
    const { teamId, userId } = req.params;

    const teamIdInt = parseInt(teamId);
    const userIdInt = parseInt(userId);

    // Check if user is in the team
    const user = await prisma.user.findUnique({
      where: { id: userIdInt }
    });
    if (!user || user.team_id !== teamIdInt) {
      return ApiResponse.error(res, "User not found in this team", 404);
    }

    // Remove user from team
    const updatedUser = await prisma.user.update({
      where: { id: userIdInt },
      data: { team_id: null }
    });

    return ApiResponse.ok(res, "User removed from team", {
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        emp_no: updatedUser.emp_no
      }
    });
  } catch (error) {
    console.error('Error removing user from team:', error);
    return ApiResponse.error(res, "Failed to remove user from team");
  }
}

module.exports = {
  createTeam,
  getAllTeams,
  getOneTeam,
  updateTeam,
  deleteTeam,
  getFormData,
  assignUser,
  updateUserStatus,
  updateUserRole,
  removeUserFromTeam
};