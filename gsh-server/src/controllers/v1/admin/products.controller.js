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

/**
 * POST /api/v1/admin/products
 */
exports.create = async (req, res) => {
   try {
     const {
       name, therapeutic_category, generic_name, route_of_administration,
       range, agency, variants
     } = req.body;

     if (!name) {
       return ApiResponse.error(res, "Product name is required", 400);
     }

     if (!variants || !Array.isArray(variants) || variants.length === 0) {
       return ApiResponse.error(res, "At least one variant is required", 400);
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
     if (range && range.trim()) {
       productData.range = range.trim();
     }
     if (agency && agency.trim()) {
       productData.agency = agency.trim();
     }

     // Prepare variants data
     const variantsData = variants.map(variant => ({
       strength: variant.strength?.trim() || null,
       pack_size: variant.pack_size?.trim() || null,
       sampling_price: variant.sampling_price ? parseFloat(variant.sampling_price) : null,
       stocking_price: variant.stocking_price ? parseFloat(variant.stocking_price) : null,
       detailed_price: variant.detailed_price ? parseFloat(variant.detailed_price) : null,
     }));

     productData.variants = {
       create: variantsData
     };

     const product = await prisma.product.create({
       data: productData,
       include: {
         variants: true
       }
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
       where: { id: parseInt(req.params.id) },
       include: {
         variants: true
       }
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
     if (updateData.range && updateData.range.trim()) {
       productData.range = updateData.range.trim();
     }
     if (updateData.agency && updateData.agency.trim()) {
       productData.agency = updateData.agency.trim();
     }

     // Handle variants update
     if (updateData.variants && Array.isArray(updateData.variants)) {
       // Get existing variants
       const existingVariants = await prisma.productVariant.findMany({
         where: { product_id: parseInt(id) }
       });

       const existingVariantIds = existingVariants.map(v => v.id);
       const incomingVariantIds = updateData.variants
         .filter(v => v.id)
         .map(v => parseInt(v.id));

       // Variants to delete
       const variantsToDelete = existingVariantIds.filter(id => !incomingVariantIds.includes(id));

       // Variants to update
       const variantsToUpdate = updateData.variants.filter(v => v.id);

       // Variants to create
       const variantsToCreate = updateData.variants.filter(v => !v.id);

       // Delete variants
       if (variantsToDelete.length > 0) {
         await prisma.productVariant.deleteMany({
           where: {
             id: { in: variantsToDelete },
             product_id: parseInt(id)
           }
         });
       }

       // Update variants
       for (const variant of variantsToUpdate) {
         await prisma.productVariant.update({
           where: { id: parseInt(variant.id) },
           data: {
             strength: variant.strength?.trim() || null,
             pack_size: variant.pack_size?.trim() || null,
             sampling_price: variant.sampling_price ? parseFloat(variant.sampling_price) : null,
             stocking_price: variant.stocking_price ? parseFloat(variant.stocking_price) : null,
             detailed_price: variant.detailed_price ? parseFloat(variant.detailed_price) : null,
           }
         });
       }

       // Create new variants
       if (variantsToCreate.length > 0) {
         const newVariantsData = variantsToCreate.map(variant => ({
           strength: variant.strength?.trim() || null,
           pack_size: variant.pack_size?.trim() || null,
           sampling_price: variant.sampling_price ? parseFloat(variant.sampling_price) : null,
           stocking_price: variant.stocking_price ? parseFloat(variant.stocking_price) : null,
           detailed_price: variant.detailed_price ? parseFloat(variant.detailed_price) : null,
         }));

         await prisma.productVariant.createMany({
           data: newVariantsData.map(data => ({ ...data, product_id: parseInt(id) }))
         });
       }
     }

     const product = await prisma.product.update({
       where: { id: parseInt(id) },
       data: productData,
       include: {
         variants: true
       }
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
