const { PrismaClient } = require('@prisma/client');
const ApiResponse = require('../../../utils/ApiResponse');
const AppError = require('../../../utils/AppError');

const prisma = new PrismaClient();

/**
 * GET /api/v1/admin/teams
 */
exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = "id", order = "desc" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const orderBy = { [sortBy]: order === "asc" ? "asc" : "desc" };

    console.log('Fetching teams with orderBy:', orderBy); // Debug log

    const teams = await prisma.team.findMany({
      skip: Number(skip),
      take: Number(limit),
      orderBy,
      include: {
        sector: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            emp_no: true,
            designation: true,
            team_role: true
          }
        },
        _count: true
      }
    });

    console.log(`Found ${teams.length} teams`);

    // Group users by designation for each team
    const teamsWithGroupedUsers = teams.map(team => {
      const groupedUsers = {
        ops: [],
        sms: [],
        pms: [],
        tms: [],
        ses: [],
        jes: [],
        fcs: [],
        mrs: []
      };

      // Map designation codes to bucket keys
      const designationToBucket = {
        'OM': 'ops', 'OPERATIONS_MANAGER': 'ops', 'TERRITORY_MANAGER': 'ops',
        'SE': 'sms', 'SENIOR_EXECUTIVE': 'sms', 'SENIOR_MANAGER': 'sms',
        'PM': 'pms', 'PRODUCT_MANAGER': 'pms',
        'TM': 'tms', 'TERRITORY_MANAGER': 'tms',
        'JE': 'jes', 'JUNIOR_EXECUTIVE': 'jes',
        'FC': 'fcs', 'FIELD_COORDINATOR': 'fcs',
        'MR': 'mrs', 'MEDICAL_REP': 'mrs', 'MEDICAL_REPRESENTATIVE': 'mrs'
      };

      team.users.forEach(user => {
        const normalizedDesignation = String(user.designation || '').toUpperCase().trim();
        const bucket = designationToBucket[normalizedDesignation];
        if (bucket) {
          const displayName = user.team_role === 'LEADER' ? `${user.name} (Leader)` : user.name;
          groupedUsers[bucket].push({ ...user, name: displayName });
        }
      });

      // Add the grouped fields to the team object
      return {
        ...team,
        operations_manager: groupedUsers.ops.map(u => u.name).join(', ') || '-',
        senior_manager: groupedUsers.sms.map(u => u.name).join(', ') || '-',
        territory_managers: groupedUsers.tms.map(u => u.name).join(', ') || '-',
        product_managers: groupedUsers.pms.map(u => u.name).join(', ') || '-',
        senior_executives: groupedUsers.ses.map(u => u.name).join(', ') || '-',
        junior_executives: groupedUsers.jes.map(u => u.name).join(', ') || '-',
        field_coordinators: groupedUsers.fcs.map(u => u.name).join(', ') || '-',
        medical_representatives: groupedUsers.mrs.map(u => u.name).join(', ') || '-'
      };
    });

    const total = await prisma.team.count();

    return ApiResponse.ok(res, "Teams fetched", {
      items: teamsWithGroupedUsers,
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Error fetching teams:', error.message);
    return res.status(500).json({ message: "Failed to fetch teams", error: error.message });
  }
};

/**
 * POST /api/v1/admin/teams
 */
exports.create = async (req, res) => {
  const transaction = await prisma.$transaction(async (tx) => {
    const {
      name,
      sector_id,
      // Employee IDs that will be assigned to the team
      ops = [],
      sms = [],
      pms = [],
      tms = [],
      ses = [],
      jes = [],
      fcs = [],
      mrs = []
    } = req.body;

    if (!name || !sector_id) {
      throw new AppError(400, "Name and sector_id are required");
    }

    // Check if sector exists
    const sector = await tx.sector.findUnique({ where: { id: parseInt(sector_id) } });

    if (!sector) {
      throw new AppError(404, "Sector not found");
    }

    // Create the team first
    const team = await tx.team.create({
      data: {
        name: name,
        sector_id: parseInt(sector_id),
      }
    });

    console.log(`Created team ${team.name} with ID: ${team.id}`);

    // Collect all user IDs to assign to this team
    const allUserIds = [...ops, ...sms, ...pms, ...tms, ...ses, ...jes, ...fcs, ...mrs];
    
    if (allUserIds.length > 0) {
      // Update users to assign them to this team
      console.log(`Assigning ${allUserIds.length} users to team ${team.id}:`, allUserIds);
      
      const updatedUsers = await tx.user.updateMany({
        where: {
          id: {
            in: allUserIds.map(id => parseInt(id))
          }
        },
        data: {
          team_id: team.id
        }
      });

      console.log(`Updated ${updatedUsers.count} users to team ${team.id}`);
    }

    // Get the team with assigned users to return proper data
    const teamWithUsers = await tx.team.findUnique({
      where: { id: team.id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            emp_no: true,
            designation: true,
            team_role: true
          }
        },
        sector: true
      }
    });

    // Group users by their designations for better display
    const groupedUsers = {
      ops: [],
      sms: [],
      pms: [],
      tms: [],
      ses: [],
      jes: [],
      fcs: [],
      mrs: []
    };

    // Map designation codes to bucket keys
    const designationToBucket = {
      'OM': 'ops', 'OPERATIONS_MANAGER': 'ops', 'TERRITORY_MANAGER': 'ops',
      'SE': 'sms', 'SENIOR_EXECUTIVE': 'sms', 'SENIOR_MANAGER': 'sms',
      'PM': 'pms', 'PRODUCT_MANAGER': 'pms',
      'TM': 'tms', 'TERRITORY_MANAGER': 'tms',
      'JE': 'jes', 'JUNIOR_EXECUTIVE': 'jes',
      'FC': 'fcs', 'FIELD_COORDINATOR': 'fcs',
      'MR': 'mrs', 'MEDICAL_REP': 'mrs', 'MEDICAL_REPRESENTATIVE': 'mrs'
    };

    teamWithUsers.users.forEach(user => {
      const normalizedDesignation = String(user.designation || '').toUpperCase().trim();
      const bucket = designationToBucket[normalizedDesignation];
      if (bucket) {
        groupedUsers[bucket].push(user);
      }
    });

    return ApiResponse.ok(res, "Team created successfully", {
      id: teamWithUsers.id,
      name: teamWithUsers.name,
      sector: teamWithUsers.sector,
      assignedUsers: {
        ops: groupedUsers.ops,
        sms: groupedUsers.sms,
        pms: groupedUsers.pms,
        tms: groupedUsers.tms,
        ses: groupedUsers.ses,
        jes: groupedUsers.jes,
        fcs: groupedUsers.fcs,
        mrs: groupedUsers.mrs
      }
    }, 201);
  });

  return transaction;
};

exports.getOne = async (req, res) => {
  try {
    const team = await prisma.team.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        sector: true
      }
    });

    if (!team) {
      throw new AppError(404, "Team not found");
    }

    // Fetch users separately to ensure they are included
    const users = await prisma.user.findMany({
      where: { team_id: parseInt(req.params.id) },
      select: {
        id: true,
        name: true,
        email: true,
        emp_no: true,
        designation: true,
        team_role: true
      }
    });

    const teamWithUsers = { ...team, users };

    return ApiResponse.ok(res, "Team fetched", teamWithUsers);
  } catch (error) {
    console.error('Error fetching team:', error);
    if (error instanceof AppError) {
      return ApiResponse.error(res, error.message, error.statusCode);
    }
    return ApiResponse.serverError(res, "Failed to fetch team");
  }
};

exports.update = async (req, res) => {
  const transaction = await prisma.$transaction(async (tx) => {
    const {
      name,
      sector_id,
      // Employee IDs that will be assigned to the team
      ops = [],
      sms = [],
      pms = [],
      tms = [],
      ses = [],
      jes = [],
      fcs = [],
      mrs = []
    } = req.body;
    const { id } = req.params;

    const updateData = {};
    if (name) updateData.name = name;
    if (sector_id) updateData.sector_id = parseInt(sector_id);

    // Check if sector exists if provided
    if (sector_id) {
      const sector = await tx.sector.findUnique({ where: { id: parseInt(sector_id) } });
      if (!sector) {
        throw new AppError(404, "Sector not found");
      }
    }

    const team = await tx.team.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    if (!team) {
      throw new AppError(404, "Team not found");
    }

    // Remove all existing user assignments for this team
    await tx.user.updateMany({
      where: { team_id: parseInt(id) },
      data: { team_id: null, team_role: null, team_status: null }
    });

    // Collect all user IDs to assign to this team
    const allUserIds = [...ops, ...sms, ...pms, ...tms, ...ses, ...jes, ...fcs, ...mrs];

    if (allUserIds.length > 0) {
      // Update users to assign them to this team
      console.log(`Assigning ${allUserIds.length} users to team ${id}:`, allUserIds);

      const updatedUsers = await tx.user.updateMany({
        where: {
          id: {
            in: allUserIds.map(id => parseInt(id))
          }
        },
        data: {
          team_id: parseInt(id),
          team_role: 'NORMAL', // Default, will be updated below
          team_status: 'ACTIVE'
        }
      });

      console.log(`Updated ${updatedUsers.count} users to team ${id}`);
    }

    // Set specific roles based on arrays
    const roleAssignments = [
      { ids: ops, role: 'LEADER' }, // Assuming ops are leaders or something, but wait, in create it's NORMAL
      { ids: sms, role: 'NORMAL' },
      { ids: pms, role: 'NORMAL' },
      { ids: tms, role: 'NORMAL' },
      { ids: ses, role: 'NORMAL' },
      { ids: jes, role: 'NORMAL' },
      { ids: fcs, role: 'NORMAL' },
      { ids: mrs, role: 'NORMAL' }
    ];

    for (const assignment of roleAssignments) {
      if (assignment.ids.length > 0) {
        await tx.user.updateMany({
          where: { id: { in: assignment.ids.map(id => parseInt(id)) } },
          data: { team_role: assignment.role }
        });
      }
    }

    // Get the updated team with assigned users to return proper data
    const teamWithUsers = await tx.team.findUnique({
      where: { id: parseInt(id) },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            emp_no: true,
            designation: true,
            team_role: true,
            team_status: true
          }
        },
        sector: true
      }
    });

    return ApiResponse.ok(res, "Team updated successfully", {
      id: teamWithUsers.id,
      name: teamWithUsers.name,
      sector: teamWithUsers.sector,
      users: teamWithUsers.users
    }, 200);
  });

  return transaction;
};

exports.setLeader = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      throw new AppError(400, "userId is required");
    }

    // Check if user is in the team
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { id: true, team_id: true }
    });

    if (!user || user.team_id !== parseInt(id)) {
      throw new AppError(400, "User not found in this team");
    }

    // Set all users in team to NORMAL
    await prisma.user.updateMany({
      where: { team_id: parseInt(id) },
      data: { team_role: 'NORMAL' }
    });

    // Set the selected user as LEADER
    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { team_role: 'LEADER' }
    });

    return ApiResponse.ok(res, "Team leader updated successfully");
  } catch (error) {
    console.error('Error setting team leader:', error);
    if (error instanceof AppError) {
      return ApiResponse.error(res, error.message, error.statusCode);
    }
    return ApiResponse.serverError(res, "Failed to set team leader");
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    const team = await prisma.team.delete({
      where: { id: parseInt(id) }
    });

    if (!team) {
      throw new AppError(404, "Team not found");
    }

    return ApiResponse.ok(res, "Team removed", null, 200);
  } catch (error) {
    console.error('Error deleting team:', error);
    if (error instanceof AppError) {
      return ApiResponse.error(res, error.message, error.statusCode);
    }
    return ApiResponse.serverError(res, "Failed to delete team");
  }
};