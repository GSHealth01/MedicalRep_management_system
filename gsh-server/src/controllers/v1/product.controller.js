const { prisma } = require('../../../lib/prisma');
const ApiResponse = require("../../utils/ApiResponse");
const AppError = require("../../utils/AppError");

/**
 * GET /api/v1/products
 * Query: q, name, range, agency, page, limit, sortBy, order
 * Public endpoint for MRs to view products (filtered by their sector)
 */
exports.list = async (req, res) => {
  try {
    const {
      q, name, range, agency,
      page = 1, limit = 200, sortBy = "name", order = "asc"
    } = req.query;

    // Get user's sector for filtering
    const userSectorId = req.user?.sector_id;
    let filter = {};

    // If user has a sector, filter products by their sector
    if (userSectorId) {
      filter.range = req.user.sector.range;
      filter.agency = req.user.sector.agency;
    }

    if (q) filter.name = { contains: q, mode: 'insensitive' };
    if (name) filter.name = { contains: name, mode: 'insensitive' };
    if (range) filter.range = range;
    if (agency) filter.agency = agency;

    const skip = (Number(page) - 1) * Number(limit);
    const orderBy = { [sortBy]: order };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where: filter,
        orderBy,
        skip,
        take: Number(limit),
        include: {
          variants: true
        }
      }),
      prisma.product.count({ where: filter })
    ]);

    return ApiResponse.ok(res, "Products fetched", {
      items,
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return ApiResponse.error(res, "Failed to fetch products");
  }
};