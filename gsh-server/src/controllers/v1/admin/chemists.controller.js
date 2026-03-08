const { prisma } = require('../../../../lib/prisma');
const ApiResponse = require("../../../utils/ApiResponse");
const AppError = require("../../../utils/AppError");

/**
 * GET /api/v1/admin/chemists
 * Query: q, distributor_code, page, limit, sortBy, order
 */
exports.list = async (req, res) => {
  try {
    const {
      q, distributor_code,
      page = 1, limit = 100, sortBy = "id", order = "desc"
    } = req.query;

    const filter = {};
    if (q) filter.name = { contains: q, mode: 'insensitive' };
    if (distributor_code) filter.distributor_code = distributor_code;

    const skip = (Number(page) - 1) * Number(limit);
    const orderBy = { [sortBy]: order };

    const [items, total] = await Promise.all([
      prisma.chemist.findMany({
        where: filter,
        include: {
          distributor: { select: { distributor_code: true, name: true } }
        },
        orderBy,
        skip,
        take: Number(limit)
      }),
      prisma.chemist.count({ where: filter })
    ]);

    return ApiResponse.ok(res, "Chemists fetched", {
      items,
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Error fetching chemists:', error);
    return ApiResponse.error(res, "Failed to fetch chemists");
  }
};

/**
 * POST /api/v1/admin/chemists
 */
exports.create = async (req, res) => {
  try {
    const {
      chemist_code, name, distributor_code, town,
      address_owner_name, address_owner_birthday,
      purchasing_officer_name, purchasing_officer_birthday,
      contact_number
    } = req.body;

    if (!chemist_code || !name) {
      return ApiResponse.error(res, "Chemist code and name are required", 400);
    }

    // Check for duplicate chemist_code
    const existingChemist = await prisma.chemist.findUnique({
      where: { chemist_code }
    });

    if (existingChemist) {
      return ApiResponse.error(res, "Chemist code already exists", 409);
    }

    const chemist = await prisma.chemist.create({
      data: {
        chemist_code,
        name,
        distributor_code,
        town,
        address_owner_name,
        address_owner_birthday: address_owner_birthday ? new Date(address_owner_birthday + 'T00:00:00.000Z') : undefined,
        purchasing_officer_name,
        purchasing_officer_birthday: purchasing_officer_birthday ? new Date(purchasing_officer_birthday + 'T00:00:00.000Z') : undefined,
        contact_number
      },
      include: {
        distributor: { select: { distributor_code: true, name: true } }
      }
    });

    return ApiResponse.ok(res, "Chemist created", chemist, 201);
  } catch (error) {
    console.error('Error creating chemist:', error);
    if (error.code === 'P2002') {
      return ApiResponse.error(res, "Chemist code already exists", 409);
    }
    if (error.code === 'P2003') {
      return ApiResponse.error(res, "Invalid distributor reference", 400);
    }
    return ApiResponse.error(res, "Failed to create chemist");
  }
};

/**
 * GET /api/v1/admin/chemists/:id
 */
exports.getOne = async (req, res) => {
  try {
    const chemist = await prisma.chemist.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        distributor: { select: { distributor_code: true, name: true } }
      }
    });

    if (!chemist) {
      return ApiResponse.error(res, "Chemist not found", 404);
    }

    return ApiResponse.ok(res, "Chemist fetched", chemist);
  } catch (error) {
    console.error('Error fetching chemist:', error);
    return ApiResponse.error(res, "Failed to fetch chemist");
  }
};

/**
 * PATCH /api/v1/admin/chemists/:id
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Handle date conversions
    if (updateData.address_owner_birthday) {
      updateData.address_owner_birthday = new Date(updateData.address_owner_birthday + 'T00:00:00.000Z');
    }
    if (updateData.purchasing_officer_birthday) {
      updateData.purchasing_officer_birthday = new Date(updateData.purchasing_officer_birthday + 'T00:00:00.000Z');
    }

    const chemist = await prisma.chemist.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        distributor: { select: { distributor_code: true, name: true } }
      }
    });

    return ApiResponse.ok(res, "Chemist updated", chemist);
  } catch (error) {
    console.error('Error updating chemist:', error);
    if (error.code === 'P2025') {
      return ApiResponse.error(res, "Chemist not found", 404);
    }
    if (error.code === 'P2003') {
      return ApiResponse.error(res, "Invalid distributor reference", 400);
    }
    return ApiResponse.error(res, "Failed to update chemist");
  }
};

/**
 * PUT /api/v1/admin/chemists/:id
 */
exports.updatePut = async (req, res) => {
  return exports.update(req, res);
};

/**
 * DELETE /api/v1/admin/chemists/:id
 */
exports.remove = async (req, res) => {
  try {
    const chemistId = parseInt(req.params.id);
    
    await prisma.chemist.delete({
      where: { id: chemistId }
    });

    return ApiResponse.ok(res, "Chemist removed", null, 200);
  } catch (error) {
    console.error('Error deleting chemist:', error);
    if (error.code === 'P2025') {
      return ApiResponse.error(res, "Chemist not found", 404);
    }
    return ApiResponse.error(res, "Failed to delete chemist");
  }
};
