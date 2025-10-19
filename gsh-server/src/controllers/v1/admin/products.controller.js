const Product = require("../../../models/Product");
const ApiResponse = require("../../../utils/ApiResponse");
const AppError = require("../../../utils/AppError");

/**
 * GET /api/v1/admin/products
 * Query: q, sku, isActive, minPrice, maxPrice, page, limit, sortBy, order
 */
exports.list = async (req, res) => {
  const {
    q, sku, isActive, minPrice, maxPrice,
    page = 1, limit = 10, sortBy = "createdAt", order = "desc"
  } = req.query;

  const filter = {};
  if (q) filter.$text = { $search: q };
  if (sku) filter.sku = sku;
  if (typeof isActive !== "undefined") filter.isActive = isActive === "true";
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sort = { [sortBy]: order === "asc" ? 1 : -1 };

  const [items, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(Number(limit)),
    Product.countDocuments(filter)
  ]);

  return ApiResponse.ok(res, "Products fetched", {
    items,
    page: Number(page),
    limit: Number(limit),
    total,
    pages: Math.ceil(total / Number(limit))
  });
};

/**
 * POST /api/v1/admin/products
 */
exports.create = async (req, res) => {
  const {
    sku, name, genericName, strength, packSize,
    unitCode, description, price, images
  } = req.body;

  const exists = await Product.findOne({ sku });
  if (exists) throw new AppError(409, "SKU already exists");

  const product = await Product.create({
    sku, name, genericName, strength, packSize,
    unitCode, description, price, images
  });

  return ApiResponse.ok(res, "Product created", { id: product._id, sku: product.sku }, 201);
};

/**
 * GET /api/v1/admin/products/:id
 */
exports.getOne = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError(404, "Product not found");
  return ApiResponse.ok(res, "Product fetched", product);
};

/**
 * PATCH /api/v1/admin/products/:id
 */
exports.update = async (req, res) => {
  const update = req.body;

  // if SKU is being updated, enforce uniqueness
  if (update.sku) {
    const taken = await Product.findOne({ sku: update.sku, _id: { $ne: req.params.id } });
    if (taken) throw new AppError(409, "SKU already exists");
  }

  const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!product) throw new AppError(404, "Product not found");

  return ApiResponse.ok(res, "Product updated", product);
};

/**
 * PATCH /api/v1/admin/products/:id/status
 * Body: { isActive: boolean }
 */
exports.updateStatus = async (req, res) => {
  const { isActive } = req.body;
  const product = await Product.findByIdAndUpdate(
    req.params.id, { isActive: Boolean(isActive) }, { new: true }
  );
  if (!product) throw new AppError(404, "Product not found");
  return ApiResponse.ok(res, "Product status updated", { id: product._id, isActive: product.isActive });
};

/**
 * DELETE /api/v1/admin/products/:id
 * Hard delete (use with care). Prefer status toggle for safer ops.
 */
exports.remove = async (req, res) => {
  const deleted = await Product.findByIdAndDelete(req.params.id);
  if (!deleted) throw new AppError(404, "Product not found");
  return ApiResponse.ok(res, "Product removed", null, 200);
};
