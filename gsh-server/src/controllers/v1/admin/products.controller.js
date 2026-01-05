const { prisma } = require('../../../../lib/prisma');
const ApiResponse = require("../../../utils/ApiResponse");
const AppError = require("../../../utils/AppError");

/**
 * GET /api/v1/admin/products
 * Query: q, name, isActive, page, limit, sortBy, order
 */
exports.list = async (req, res) => {
  try {
    const {
      q, name, isActive,
      page = 1, limit = 200, sortBy = "id", order = "desc"
    } = req.query;

    const filter = {};
    if (q) filter.name = { contains: q, mode: 'insensitive' };
    if (name) filter.name = { contains: name, mode: 'insensitive' };

    const skip = (Number(page) - 1) * Number(limit);
    const orderBy = { [sortBy]: order };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where: filter,
        orderBy,
        skip,
        take: Number(limit)
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

/**
 * POST /api/v1/admin/products
 */
exports.create = async (req, res) => {
  try {
    const {
      name, therapeutic_category, generic_name, route_of_administration,
      pack_size, strength
    } = req.body;

    if (!name) {
      return ApiResponse.error(res, "Product name is required", 400);
    }

    // Only save fields that are not null/undefined/empty
    const productData = {
      name
    };

    if (therapeutic_category && therapeutic_category.trim()) {
      productData.therapeutic_category = therapeutic_category.trim();
    }
    if (generic_name && generic_name.trim()) {
      productData.generic_name = generic_name.trim();
    }
    if (route_of_administration && route_of_administration.trim()) {
      productData.route_of_administration = route_of_administration.trim();
    }
    if (pack_size && pack_size.trim()) {
      productData.pack_size = pack_size.trim();
    }
    if (strength && strength.trim()) {
      productData.strength = strength.trim();
    }

    const product = await prisma.product.create({
      data: productData
    });

    return ApiResponse.ok(res, "Product created", product, 201);
  } catch (error) {
    console.error('Error creating product:', error);
    if (error.code === 'P2002') {
      return ApiResponse.error(res, "Product name already exists", 409);
    }
    return ApiResponse.error(res, "Failed to create product");
  }
};

/**
 * GET /api/v1/admin/products/:id
 */
exports.getOne = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!product) {
      return ApiResponse.error(res, "Product not found", 404);
    }

    return ApiResponse.ok(res, "Product fetched", product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return ApiResponse.error(res, "Failed to fetch product");
  }
};

/**
 * PATCH /api/v1/admin/products/:id
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Only save fields that are not null/undefined/empty
    const productData = {};
    
    if (updateData.name && updateData.name.trim()) {
      productData.name = updateData.name.trim();
    }
    if (updateData.therapeutic_category && updateData.therapeutic_category.trim()) {
      productData.therapeutic_category = updateData.therapeutic_category.trim();
    }
    if (updateData.generic_name && updateData.generic_name.trim()) {
      productData.generic_name = updateData.generic_name.trim();
    }
    if (updateData.route_of_administration && updateData.route_of_administration.trim()) {
      productData.route_of_administration = updateData.route_of_administration.trim();
    }
    if (updateData.pack_size && updateData.pack_size.trim()) {
      productData.pack_size = updateData.pack_size.trim();
    }
    if (updateData.strength && updateData.strength.trim()) {
      productData.strength = updateData.strength.trim();
    }

    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: productData
    });

    return ApiResponse.ok(res, "Product updated", product);
  } catch (error) {
    console.error('Error updating product:', error);
    if (error.code === 'P2025') {
      return ApiResponse.error(res, "Product not found", 404);
    }
    return ApiResponse.error(res, "Failed to update product");
  }
};

/**
 * PUT /api/v1/admin/products/:id
 */
exports.updatePut = async (req, res) => {
  return exports.update(req, res);
};

/**
 * DELETE /api/v1/admin/products/:id
 */
exports.remove = async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    await prisma.product.delete({
      where: { id: productId }
    });

    return ApiResponse.ok(res, "Product removed", null, 200);
  } catch (error) {
    console.error('Error deleting product:', error);
    if (error.code === 'P2025') {
      return ApiResponse.error(res, "Product not found", 404);
    }
    return ApiResponse.error(res, "Failed to delete product");
  }
};
