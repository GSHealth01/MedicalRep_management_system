const { prisma } = require('../../../../lib/prisma');
const ApiResponse = require("../../../utils/ApiResponse");
const AppError = require("../../../utils/AppError");

/**
 * GET /api/v1/admin/allocated-prices
 * Get all allocated prices
 */
exports.list = async (req, res) => {
  try {
    const allocatedPrices = await prisma.allocatedPrice.findMany({
      orderBy: { designation: 'asc' }
    });

    return ApiResponse.ok(res, "Allocated prices fetched", allocatedPrices);
  } catch (error) {
    console.error('Error fetching allocated prices:', error);
    return ApiResponse.error(res, "Failed to fetch allocated prices");
  }
};

/**
 * GET /api/v1/admin/allocated-prices/designations
 * Get all unique designations from employees
 */
exports.getDesignations = async (req, res) => {
  try {
    // Get unique designations from employees
    const employees = await prisma.user.findMany({
      where: {
        designation: {
          not: null
        }
      },
      select: {
        designation: true
      },
      distinct: ['designation']
    });

    const designations = employees
      .map(e => e.designation)
      .filter(d => d && d.trim() !== '')
      .sort();

    return ApiResponse.ok(res, "Designations fetched", designations);
  } catch (error) {
    console.error('Error fetching designations:', error);
    return ApiResponse.error(res, "Failed to fetch designations");
  }
};

/**
 * GET /api/v1/admin/allocated-prices/by-designation-code/:designationCode
 * Get allocated price by designation code (for DCR use) - handles mapping from code to full name
 */
exports.getByDesignationCode = async (req, res) => {
  try {
    const { designationCode } = req.params;
    
    // Map designation codes to full names
    const designationMap = {
      'MR': 'Medical Rep',
      'FC': 'Field Coordinator',
      'JE': 'Junior Executive',
      'SE': 'Senior Executive',
      'TM': 'Territory Manager',
      'PM': 'Product Manager',
      'OM': 'Operations Manager',
      'ADMIN': 'Admin'
    };
    
    // Try to find by code first (case insensitive)
    let allocatedPrice = await prisma.allocatedPrice.findFirst({
      where: { 
        designation: { 
          equals: designationCode, 
          mode: 'insensitive' 
        }
      }
    });
    
    // If not found by code, try to find by full name
    if (!allocatedPrice) {
      const fullName = designationMap[designationCode.toUpperCase()];
      if (fullName) {
        allocatedPrice = await prisma.allocatedPrice.findFirst({
          where: { 
            designation: { 
              equals: fullName, 
              mode: 'insensitive' 
            }
          }
        });
      }
    }
    
    // If still not found, try to find by searching for the code in designation (contains)
    if (!allocatedPrice) {
      allocatedPrice = await prisma.allocatedPrice.findFirst({
        where: { 
          designation: {
            contains: designationCode,
            mode: 'insensitive'
          }
        }
      });
    }

    if (!allocatedPrice) {
      return ApiResponse.error(res, "Allocated price not found for this designation", 404);
    }

    return ApiResponse.ok(res, "Allocated price fetched", allocatedPrice);
  } catch (error) {
    console.error('Error fetching allocated price by designation code:', error);
    return ApiResponse.error(res, "Failed to fetch allocated price");
  }
};

/**
 * POST /api/v1/admin/allocated-prices
 * Create a new allocated price entry
 */
exports.create = async (req, res) => {
  try {
    const { designation, dailyBata, nightOut, nightOutReturn, monthlyFuel } = req.body;

    if (!designation) {
      return ApiResponse.error(res, "Designation is required", 400);
    }

    // Check if designation already exists (case-insensitive)
    const existing = await prisma.allocatedPrice.findFirst({
      where: { 
        designation: { 
          equals: designation, 
          mode: 'insensitive' 
        }
      }
    });

    if (existing) {
      return ApiResponse.error(res, "Allocated price for this designation already exists", 409);
    }

    const allocatedPrice = await prisma.allocatedPrice.create({
      data: {
        designation: designation, // Keep original case (full name)
        dailyBata: dailyBata ? parseFloat(dailyBata) : null,
        nightOut: nightOut ? parseFloat(nightOut) : null,
        nightOutReturn: nightOutReturn ? parseFloat(nightOutReturn) : null,
        monthlyFuel: monthlyFuel ? parseFloat(monthlyFuel) : null
      }
    });

    return ApiResponse.ok(res, "Allocated price created", allocatedPrice, 201);
  } catch (error) {
    console.error('Error creating allocated price:', error);
    return ApiResponse.error(res, "Failed to create allocated price");
  }
};

/**
 * GET /api/v1/admin/allocated-prices/:id
 * Get a single allocated price by ID
 */
exports.getOne = async (req, res) => {
  try {
    const allocatedPrice = await prisma.allocatedPrice.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!allocatedPrice) {
      return ApiResponse.error(res, "Allocated price not found", 404);
    }

    return ApiResponse.ok(res, "Allocated price fetched", allocatedPrice);
  } catch (error) {
    console.error('Error fetching allocated price:', error);
    return ApiResponse.error(res, "Failed to fetch allocated price");
  }
};

/**
 * PATCH /api/v1/admin/allocated-prices/:id
 * Update an allocated price
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { designation, dailyBata, nightOut, nightOutReturn, monthlyFuel } = req.body;

    // Check if exists
    const existing = await prisma.allocatedPrice.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return ApiResponse.error(res, "Allocated price not found", 404);
    }

    // If designation is being changed, check if new designation already exists
    if (designation && designation.toUpperCase() !== existing.designation) {
      const duplicate = await prisma.allocatedPrice.findUnique({
        where: { designation: designation.toUpperCase() }
      });
      if (duplicate) {
        return ApiResponse.error(res, "Allocated price for this designation already exists", 409);
      }
    }

    const updateData = {};
    if (designation) updateData.designation = designation; // Keep original case (full name)
    if (dailyBata !== undefined) updateData.dailyBata = dailyBata ? parseFloat(dailyBata) : null;
    if (nightOut !== undefined) updateData.nightOut = nightOut ? parseFloat(nightOut) : null;
    if (nightOutReturn !== undefined) updateData.nightOutReturn = nightOutReturn ? parseFloat(nightOutReturn) : null;
    if (monthlyFuel !== undefined) updateData.monthlyFuel = monthlyFuel ? parseFloat(monthlyFuel) : null;

    const allocatedPrice = await prisma.allocatedPrice.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    return ApiResponse.ok(res, "Allocated price updated", allocatedPrice);
  } catch (error) {
    console.error('Error updating allocated price:', error);
    if (error.code === 'P2025') {
      return ApiResponse.error(res, "Allocated price not found", 404);
    }
    return ApiResponse.error(res, "Failed to update allocated price");
  }
};

/**
 * DELETE /api/v1/admin/allocated-prices/:id
 * Delete an allocated price
 */
exports.remove = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Check if exists
    const existing = await prisma.allocatedPrice.findUnique({
      where: { id }
    });

    if (!existing) {
      return ApiResponse.error(res, "Allocated price not found", 404);
    }

    await prisma.allocatedPrice.delete({
      where: { id }
    });

    return ApiResponse.ok(res, "Allocated price removed", null, 200);
  } catch (error) {
    console.error('Error deleting allocated price:', error);
    if (error.code === 'P2025') {
      return ApiResponse.error(res, "Allocated price not found", 404);
    }
    return ApiResponse.error(res, "Failed to delete allocated price");
  }
};
