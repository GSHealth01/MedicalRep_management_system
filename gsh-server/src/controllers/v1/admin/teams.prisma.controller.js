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
        range: {
          include: {
            agency: true
          }
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            emp_no: true,
            designation: true
          }
        }
      }
    });

    console.log(`Found ${teams.length} teams`); // Debug log

    // Group users by designation for display
    const formattedTeams = teams.map(team => {
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

      team.users.forEach(user => {
        const normalizedDesignation = String(user.designation || '').toUpperCase().trim();
        const bucket = designationToBucket[normalizedDesignation];
        if (bucket) {
          groupedUsers[bucket].push(`${user.name} (${user.emp_no})`);
        }
      });

      return {
        ...team,
        ops: groupedUsers.ops,
        sms: groupedUsers.sms,
        pms: groupedUsers.pms,
        tms: groupedUsers.tms,
        ses: groupedUsers.ses,
        jes: groupedUsers.jes,
        fcs: groupedUsers.fcs,
        mrs: groupedUsers.mrs
      };
    });

    const total = await prisma.team.count();

    return ApiResponse.ok(res, "Teams fetched", {
      items: formattedTeams,
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
      range_id,
      agency_id,
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
    
    if (!name || !range_id || !agency_id) {
      throw new AppError(400, "Name, range_id, and agency_id are required");
    }

    // Check if range and agency exist
    const [range, agency] = await Promise.all([
      tx.range.findUnique({ where: { id: parseInt(range_id) } }),
      tx.agency.findUnique({ where: { id: parseInt(agency_id) } })
    ]);

    if (!range) {
      throw new AppError(404, "Range not found");
    }
    if (!agency) {
      throw new AppError(404, "Agency not found");
    }

    // Create the team first
    const team = await tx.team.create({
      data: {
        name: name,
        range_id: parseInt(range_id),
        agency_id: parseInt(agency_id),
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
            designation: true
          }
        },
        range: true,
        agency: true
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
      range: teamWithUsers.range,
      agency: teamWithUsers.agency,
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
        range: {
          include: {
            agency: true
          }
        }
      }
    });

    if (!team) {
      throw new AppError(404, "Team not found");
    }

    return ApiResponse.ok(res, "Team fetched", team);
  } catch (error) {
    console.error('Error fetching team:', error);
    if (error instanceof AppError) {
      return ApiResponse.error(res, error.message, error.statusCode);
    }
    return ApiResponse.serverError(res, "Failed to fetch team");
  }
};

exports.update = async (req, res) => {
  try {
    const { name, range_id, agency_id } = req.body;
    const { id } = req.params;

    const updateData = {};
    if (name) updateData.name = name;
    if (range_id) updateData.range_id = parseInt(range_id);
    if (agency_id) updateData.agency_id = parseInt(agency_id);

    // Check if range and agency exist if provided
    if (range_id || agency_id) {
      const checks = [];
      if (range_id) {
        checks.push(prisma.range.findUnique({ where: { id: parseInt(range_id) } }));
      }
      if (agency_id) {
        checks.push(prisma.agency.findUnique({ where: { id: parseInt(agency_id) } }));
      }
      
      const [rangeResult, agencyResult] = await Promise.all(checks);
      
      if (range_id && !rangeResult) {
        throw new AppError(404, "Range not found");
      }
      if (agency_id && !agencyResult) {
        throw new AppError(404, "Agency not found");
      }
    }

    const team = await prisma.team.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    if (!team) {
      throw new AppError(404, "Team not found");
    }

    return ApiResponse.ok(res, "Team updated", team);
  } catch (error) {
    console.error('Error updating team:', error);
    if (error instanceof AppError) {
      return ApiResponse.error(res, error.message, error.statusCode);
    }
    return ApiResponse.serverError(res, "Failed to update team");
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