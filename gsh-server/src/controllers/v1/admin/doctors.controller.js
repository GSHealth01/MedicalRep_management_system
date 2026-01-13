const { prisma } = require('../../../../lib/prisma');
const ApiResponse = require("../../../utils/ApiResponse");
const AppError = require("../../../utils/AppError");

/**
 * GET /api/v1/admin/doctors
 * Query: q, specialty, page, limit, sortBy, order
 */
exports.list = async (req, res) => {
  try {
    const {
      q, specialty,
      page = 1, limit = 100, sortBy = "id", order = "desc"
    } = req.query;

    const filter = {};
    if (q) filter.name = { contains: q, mode: 'insensitive' };
    if (specialty) filter.specialty = { contains: specialty, mode: 'insensitive' };

    const skip = (Number(page) - 1) * Number(limit);
    const orderBy = { [sortBy]: order };

    const [items, total] = await Promise.all([
      prisma.doctor.findMany({
        where: filter,
        include: {
          sector: {
            select: {
              id: true,
              agency: true,
              range: true
            }
          }
        },
        orderBy,
        skip,
        take: Number(limit)
      }),
      prisma.doctor.count({ where: filter })
    ]);

    return ApiResponse.ok(res, "Doctors fetched", {
      items,
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return ApiResponse.error(res, "Failed to fetch doctors");
  }
};

/**
 * POST /api/v1/admin/doctors
 */
exports.create = async (req, res) => {
  try {
    const {
      name, contactNumber, email, specialty, categorization, dateAdded, sector_id
    } = req.body;

    if (!name) {
      return ApiResponse.error(res, "Doctor name is required", 400);
    }

    const doctor = await prisma.doctor.create({
      data: {
        name,
        contactNumber,
        email,
        specialty,
        categorization,
        dateAdded: dateAdded ? new Date(dateAdded + 'T00:00:00.000Z') : undefined,
        sector_id: sector_id ? parseInt(sector_id) : undefined
      },
      include: {
        sector: {
          select: {
            id: true,
            agency: true,
            range: true
          }
        }
      }
    });

    return ApiResponse.ok(res, "Doctor created", doctor, 201);
  } catch (error) {
    console.error('Error creating doctor:', error);
    if (error.code === 'P2002') {
      return ApiResponse.error(res, "Doctor name already exists", 409);
    }
    return ApiResponse.error(res, "Failed to create doctor");
  }
};

/**
 * GET /api/v1/admin/doctors/:id
 */
exports.getOne = async (req, res) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        sector: {
          select: {
            id: true,
            agency: true,
            range: true
          }
        }
      }
    });

    if (!doctor) {
      return ApiResponse.error(res, "Doctor not found", 404);
    }

    return ApiResponse.ok(res, "Doctor fetched", doctor);
  } catch (error) {
    console.error('Error fetching doctor:', error);
    return ApiResponse.error(res, "Failed to fetch doctor");
  }
};

/**
 * PATCH /api/v1/admin/doctors/:id
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Handle date conversion if dateAdded is provided
    if (updateData.dateAdded) {
      updateData.dateAdded = new Date(updateData.dateAdded + 'T00:00:00.000Z');
    }

    // Handle sector_id conversion if provided
    if (updateData.sector_id) {
      updateData.sector_id = parseInt(updateData.sector_id);
    }

    const doctor = await prisma.doctor.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        sector: {
          select: {
            id: true,
            agency: true,
            range: true
          }
        }
      }
    });

    return ApiResponse.ok(res, "Doctor updated", doctor);
  } catch (error) {
    console.error('Error updating doctor:', error);
    if (error.code === 'P2025') {
      return ApiResponse.error(res, "Doctor not found", 404);
    }
    return ApiResponse.error(res, "Failed to update doctor");
  }
};

/**
 * PUT /api/v1/admin/doctors/:id
 */
exports.updatePut = async (req, res) => {
  return exports.update(req, res);
};

/**
 * DELETE /api/v1/admin/doctors/:id
 */
exports.remove = async (req, res) => {
  try {
    const doctorId = parseInt(req.params.id);
    await prisma.doctor.delete({
      where: { id: doctorId }
    });

    return ApiResponse.ok(res, "Doctor removed", null, 200);
  } catch (error) {
    console.error('Error deleting doctor:', error);
    if (error.code === 'P2025') {
      return ApiResponse.error(res, "Doctor not found", 404);
    }
    return ApiResponse.error(res, "Failed to delete doctor");
  }
};
