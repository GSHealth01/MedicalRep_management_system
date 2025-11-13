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

    const [items, total] = await Promise.all([
      prisma.team.findMany({
        skip: Number(skip),
        take: Number(limit),
        orderBy,
        include: {
          range: {
            include: {
              agency: true
            }
          }
        }
      }),
      prisma.team.count()
    ]);

    console.log(`Found ${items.length} teams, total: ${total}`); // Debug log

    return ApiResponse.ok(res, "Teams fetched", {
      items,
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
  try {
    const {
      name,
      range_id,
      agency_id,
      // Manager assignments (will be arrays of user names or IDs that we need to resolve)
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
      prisma.range.findUnique({ where: { id: parseInt(range_id) } }),
      prisma.agency.findUnique({ where: { id: parseInt(agency_id) } })
    ]);

    if (!range) {
      throw new AppError(404, "Range not found");
    }
    if (!agency) {
      throw new AppError(404, "Agency not found");
    }

    // Convert arrays to comma-separated strings for storage
    const createData = {
      name: name,
      range_id: parseInt(range_id),
      agency_id: parseInt(agency_id),
      operations_manager: ops.length > 0 ? ops.join(', ') : null,
      senior_manager: sms.length > 0 ? sms.join(', ') : null,
      territory_managers: tms.length > 0 ? tms.join(', ') : null,
      senior_executives: ses.length > 0 ? ses.join(', ') : null,
      junior_executives: jes.length > 0 ? jes.join(', ') : null,
      field_coordinators: fcs.length > 0 ? fcs.join(', ') : null
    };

    // Note: We don't have a field for pms (Product Managers) and mrs (Medical Reps) in schema
    // You might want to add these or handle them differently

    const team = await prisma.team.create({
      data: createData
    });

    return ApiResponse.ok(res, "Team created", {
      id: team.id,
      name: team.name,
      managers: {
        ops, sms, pms, tms, ses, jes, fcs, mrs
      }
    }, 201);
  } catch (error) {
    console.error('Error creating team:', error);
    if (error instanceof AppError) {
      return ApiResponse.error(res, error.message, error.statusCode);
    }
    return ApiResponse.serverError(res, "Failed to create team");
  }
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