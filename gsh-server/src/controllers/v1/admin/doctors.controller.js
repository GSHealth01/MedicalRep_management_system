const Doctor = require("../../../models/Doctor");
const ApiResponse = require("../../../utils/ApiResponse");
const AppError = require("../../../utils/AppError");

/**
 * GET /api/v1/admin/doctors
 * Query: q, specialty, categorization, isActive, city, dateFrom, dateTo, page, limit, sortBy, order
 */
exports.list = async (req, res) => {
  const {
    q, specialty, categorization, isActive, city,
    dateFrom, dateTo,
    page = 1, limit = 10, sortBy = "createdAt", order = "desc"
  } = req.query;

  const filter = {};

  if (q) filter.$text = { $search: q };
  if (specialty) filter.specialty = specialty;
  if (categorization) filter.categorization = categorization;
  if (typeof isActive !== "undefined") filter.isActive = isActive === "true";
  if (city) filter.city = city;

  // Date filter (by dateAdded if provided, else by createdAt)
  if (dateFrom || dateTo) {
    const field = "dateAdded";
    filter[field] = {};
    if (dateFrom) filter[field].$gte = new Date(dateFrom);
    if (dateTo)   filter[field].$lte = new Date(dateTo);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sort = { [sortBy]: order === "asc" ? 1 : -1 };

  const [items, total] = await Promise.all([
    Doctor.find(filter).sort(sort).skip(skip).limit(Number(limit)),
    Doctor.countDocuments(filter)
  ]);

  return ApiResponse.ok(res, "Doctors fetched", {
    items,
    page: Number(page),
    limit: Number(limit),
    total,
    pages: Math.ceil(total / Number(limit))
  });
};

/**
 * POST /api/v1/admin/doctors
 */
exports.create = async (req, res) => {
  const {
    name, contactNumber, email, specialty, categorization, dateAdded,
    hospital, address, city, notes, isActive
  } = req.body;

  // Basic uniqueness checks if email/contact provided
  if (email) {
    const emailTaken = await Doctor.findOne({ email });
    if (emailTaken) throw new AppError(409, "Email already exists for another doctor");
  }

  const doctor = await Doctor.create({
    name, contactNumber, email, specialty, categorization,
    dateAdded: dateAdded ? new Date(dateAdded) : undefined,
    hospital, address, city, notes, isActive
  });

  return ApiResponse.ok(res, "Doctor created", { id: doctor._id, name: doctor.name }, 201);
};

/**
 * GET /api/v1/admin/doctors/:id
 */
exports.getOne = async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) throw new AppError(404, "Doctor not found");
  return ApiResponse.ok(res, "Doctor fetched", doctor);
};

/**
 * PATCH /api/v1/admin/doctors/:id
 */
exports.update = async (req, res) => {
  const update = req.body;

  // if email changed, ensure unique
  if (update.email) {
    const emailTaken = await Doctor.findOne({ email: update.email, _id: { $ne: req.params.id } });
    if (emailTaken) throw new AppError(409, "Email already exists for another doctor");
  }

  if (update.dateAdded) update.dateAdded = new Date(update.dateAdded);

  const doctor = await Doctor.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!doctor) throw new AppError(404, "Doctor not found");

  return ApiResponse.ok(res, "Doctor updated", doctor);
};

/**
 * PATCH /api/v1/admin/doctors/:id/status
 * Body: { isActive: boolean }
 */
exports.updateStatus = async (req, res) => {
  const { isActive } = req.body;
  const doctor = await Doctor.findByIdAndUpdate(
    req.params.id, { isActive: Boolean(isActive) }, { new: true }
  );
  if (!doctor) throw new AppError(404, "Doctor not found");

  return ApiResponse.ok(res, "Doctor status updated", { id: doctor._id, isActive: doctor.isActive });
};

/**
 * DELETE /api/v1/admin/doctors/:id
 */
exports.remove = async (req, res) => {
  const deleted = await Doctor.findByIdAndDelete(req.params.id);
  if (!deleted) throw new AppError(404, "Doctor not found");
  return ApiResponse.ok(res, "Doctor removed", null, 200);
};
