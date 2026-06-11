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
      page = 1, limit = 100, sortBy = "distributor_code", order = "desc"
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
          sector: { select: { id: true, agency: true, range: true } },
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
      name, coverage_town, route, sector_id, area_id, area, distributor_code
    } = req.body;

    console.log('Extracted fields:', { name, coverage_town, route, sector_id, area_id, area, distributor_code }); // Debug log

    if (!name || !distributor_code || !sector_id) {
      return ApiResponse.error(res, "Name, distributor_code, and sector_id are required", 400);
    }

    let areaIdToUse = area_id;
    
    // Handle area field - if area_id is not provided, try to find or create area by name
    if (!areaIdToUse && area) {
      // Try to find existing area by name
      let existingArea = await prisma.area.findFirst({
        where: { name: { equals: area, mode: 'insensitive' } }
      });

      if (existingArea) {
        // Check if this area is already assigned to a distributor
        const existingDistributor = await prisma.distributor.findUnique({
          where: { area_id: existingArea.id }
        });
        if (existingDistributor) {
          return ApiResponse.error(res, `Area "${area}" is already assigned to distributor "${existingDistributor.name}" (${existingDistributor.distributor_code}). Each area can only have one distributor.`, 409);
        }
        areaIdToUse = existingArea.id;
      } else {
        // Create new area if it doesn't exist
        const newArea = await prisma.area.create({
          data: { name: area.trim() }
        });
        areaIdToUse = newArea.id;
      }
    }

    if (!areaIdToUse) {
      return ApiResponse.error(res, "Area is required (either area_id or area name)", 400);
    }

    const distributor = await prisma.distributor.create({
      data: {
        distributor_code,
        name,
        coverage_town,
        route,
        sector_id: parseInt(sector_id),
        area_id: parseInt(areaIdToUse)
      },
      include: {
        sector: { select: { id: true, agency: true, range: true } },
        area: { select: { id: true, name: true } }
      }
    });

    return ApiResponse.ok(res, "Distributor created", distributor, 201);
  } catch (error) {
    console.error('Error creating distributor:', error);
    if (error.code === 'P2002') {
      console.log('P2002 error meta:', error.meta); // Log which field caused the conflict
      return ApiResponse.error(res, `Duplicate entry: ${error.meta?.target?.join(', ') || 'unknown field'} already exists`, 409);
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
      where: { distributor_code: req.params.id },
      include: {
        sector: { select: { id: true, agency: true, range: true } },
        area:   { select: { id: true, name: true } }
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

    // Build final update object with proper field handling
    const finalUpdate = {};

    // Handle simple string fields
    if (updateData.name) finalUpdate.name = updateData.name.trim();
    if (updateData.coverage_town) finalUpdate.coverage_town = updateData.coverage_town.trim();
    if (updateData.route) finalUpdate.route = updateData.route.trim();

    // Handle sector_id - either directly provided or look up by range+agency
    if (updateData.sector_id) {
      finalUpdate.sector_id = parseInt(updateData.sector_id);
    } else if (updateData.range && updateData.agency) {
      // Look up sector by range and agency
      const sector = await prisma.sector.findFirst({
        where: {
          range: updateData.range,
          agency: updateData.agency
        }
      });
      if (!sector) {
        return ApiResponse.error(res, `Sector not found for range '${updateData.range}' and agency '${updateData.agency}'`, 400);
      }
      finalUpdate.sector_id = sector.id;
    }

    // Handle area_id - either directly provided or look up/create by name
    if (updateData.area_id) {
      finalUpdate.area_id = parseInt(updateData.area_id);
    } else if (updateData.area) {
      // Look up area by name, create if it doesn't exist
      let area = await prisma.area.findFirst({
        where: { name: { equals: updateData.area.trim(), mode: 'insensitive' } }
      });
      if (!area) {
        // Create the new area
        area = await prisma.area.create({ data: { name: updateData.area.trim() } });
      }
      finalUpdate.area_id = area.id;
    }

    const distributor = await prisma.distributor.update({
      where: { distributor_code: id },
      data: finalUpdate,
      include: {
        sector: { select: { id: true, agency: true, range: true } },
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
    const code = req.params.id;

    // First delete child records that reference this distributor
    // (no onDelete: Cascade in schema, so we do it manually)
    await prisma.$transaction([
      prisma.userDistributors.deleteMany({ where: { distributor_code: code } }),
      prisma.distributorProducts.deleteMany({ where: { distributor_code: code } }),
      prisma.chemist.deleteMany({ where: { distributor_code: code } }),
    ]);

    await prisma.distributor.delete({ where: { distributor_code: code } });

    return ApiResponse.ok(res, "Distributor removed", null, 200);
  } catch (error) {
    console.error('Error deleting distributor:', error);
    if (error.code === 'P2025') {
      return ApiResponse.error(res, "Distributor not found", 404);
    }
    return ApiResponse.error(res, "Failed to delete distributor");
  }
};
