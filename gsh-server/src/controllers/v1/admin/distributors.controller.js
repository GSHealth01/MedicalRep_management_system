const { prisma } = require('../../../../lib/prisma');
const ApiResponse = require("../../../utils/ApiResponse");
const AppError = require("../../../utils/AppError");

/**
 * GET /api/v1/admin/distributors
 * Query: q, page, limit, sortBy, order
 */
exports.list = async (req, res) => {
  try {
    const {
      q,
      page = 1, limit = 100, sortBy = "id", order = "desc"
    } = req.query;

    const filter = {};
    if (q) filter.name = { contains: q, mode: 'insensitive' };

    const skip = (Number(page) - 1) * Number(limit);
    const orderBy = { [sortBy]: order };

    const [items, total] = await Promise.all([
      prisma.distributor.findMany({
        where: filter,
        orderBy,
        skip,
        take: Number(limit),
        include: {
          agency: { select: { id: true, name: true } },
          area: { select: { id: true, name: true } }
        }
      }),
      prisma.distributor.count({ where: filter })
    ]);

    return ApiResponse.ok(res, "Distributors fetched", {
      items,
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Error fetching distributors:', error);
    return ApiResponse.error(res, "Failed to fetch distributors");
  }
};

/**
 * POST /api/v1/admin/distributors
 */
exports.create = async (req, res) => {
  try {
    console.log('Distributor create request body:', req.body); // Debug log

    const {
      name, coverage_town, route, agency_id, area_id
    } = req.body;

    console.log('Extracted fields:', { name, coverage_town, route, agency_id, area_id }); // Debug log

    if (!name || !agency_id || !area_id) {
      return ApiResponse.error(res, "Name, agency_id, and area_id are required", 400);
    }

    const distributor = await prisma.distributor.create({
      data: {
        name,
        coverage_town,
        route,
        agency_id: parseInt(agency_id),
        area_id: parseInt(area_id)
      },
      include: {
        agency: { select: { id: true, name: true } },
        area: { select: { id: true, name: true } }
      }
    });

    return ApiResponse.ok(res, "Distributor created", distributor, 201);
  } catch (error) {
    console.error('Error creating distributor:', error);
    if (error.code === 'P2002') {
      return ApiResponse.error(res, "Distributor name already exists", 409);
    }
    if (error.code === 'P2003') {
      return ApiResponse.error(res, "Invalid agency or area reference", 400);
    }
    return ApiResponse.error(res, "Failed to create distributor");
  }
};

/**
 * GET /api/v1/admin/distributors/:id
 */
exports.getOne = async (req, res) => {
  try {
    const distributor = await prisma.distributor.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        agency: { select: { id: true, name: true } },
        area: { select: { id: true, name: true } }
      }
    });

    if (!distributor) {
      return ApiResponse.error(res, "Distributor not found", 404);
    }

    return ApiResponse.ok(res, "Distributor fetched", distributor);
  } catch (error) {
    console.error('Error fetching distributor:', error);
    return ApiResponse.error(res, "Failed to fetch distributor");
  }
};

/**
 * PATCH /api/v1/admin/distributors/:id
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Convert string IDs to integers if present
    if (updateData.agency_id) updateData.agency_id = parseInt(updateData.agency_id);
    if (updateData.area_id) updateData.area_id = parseInt(updateData.area_id);

    const distributor = await prisma.distributor.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        agency: { select: { id: true, name: true } },
        area: { select: { id: true, name: true } }
      }
    });

    return ApiResponse.ok(res, "Distributor updated", distributor);
  } catch (error) {
    console.error('Error updating distributor:', error);
    if (error.code === 'P2025') {
      return ApiResponse.error(res, "Distributor not found", 404);
    }
    if (error.code === 'P2003') {
      return ApiResponse.error(res, "Invalid agency or area reference", 400);
    }
    return ApiResponse.error(res, "Failed to update distributor");
  }
};

/**
 * PUT /api/v1/admin/distributors/:id
 */
exports.updatePut = async (req, res) => {
  return exports.update(req, res);
};

/**
 * DELETE /api/v1/admin/distributors/:id
 */
exports.remove = async (req, res) => {
  try {
    const distributorId = parseInt(req.params.id);
    await prisma.distributor.delete({
      where: { id: distributorId }
    });

    return ApiResponse.ok(res, "Distributor removed", null, 200);
  } catch (error) {
    console.error('Error deleting distributor:', error);
    if (error.code === 'P2025') {
      return ApiResponse.error(res, "Distributor not found", 404);
    }
    return ApiResponse.error(res, "Failed to delete distributor");
  }
};
