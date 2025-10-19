const Doctor = require("../../../models/Doctor");
const ApiResponse = require("../../../utils/ApiResponse");
const AppError = require("../../../utils/AppError");

/**
 * GET /api/v1/admin/doctors
 * Query: sector, q, specialty, categorization, isActive, city, dateFrom, dateTo, page, limit, sortBy, order
 */
exports.list = async (req, res) => {
  const {
    sector, q, specialty, categorization, isActive, city,
    dateFrom, dateTo,
    page = 1, limit = 10, sortBy = "createdAt", order = "desc"
  } = req.query;

  const filter = {};
  if (sector) filter.sector = sector;
  if (q) filter.$text = { $search: q };
  if (specialty) filter.specialty = specialty;
  if (categorization) filter.categorization = categorization;
  if (typeof isActive !== "undefined") filter.isActive = isActive === "true";
  if (city) filter.city = city;
  if (dateFrom || dateTo) {
    filter.dateAdded = {};
    if (dateFrom) filter.dateAdded.$gte = new Date(dateFrom);
    if (dateTo)   filter.dateAdded.$lte = new Date(dateTo);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sort = { [sortBy]: order === "asc" ? 1 : -1 };

  const [items, total] = await Promise.all([
    Doctor.find(filter).sort(sort).skip(skip).limit(Number(limit)).populate("sector", "_id name code"),
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
 * Body must include: sector, name
 * Uniqueness enforced **within the same sector**:
 *  - (sector, email) unique (sparse)
 *  - (sector, name, hospital) unique (partial)
 */
exports.create = async (req, res) => {
  const {
    sector, name, contactNumber, email, specialty, categorization, dateAdded,
    hospital, address, city, notes, isActive
  } = req.body;

  if (!sector) throw new AppError(400, "sector is required");
  if (!name) throw new AppError(400, "name is required");

  if (email) {
    const emailTaken = await Doctor.findOne({ sector, email });
    if (emailTaken) throw new AppError(409, "Email already exists in this sector");
  }
  if (name && hospital) {
    const nameHospTaken = await Doctor.findOne({ sector, name, hospital });
    if (nameHospTaken) throw new AppError(409, "Doctor with same name & hospital exists in this sector");
  }

  const doctor = await Doctor.create({
    sector, name, contactNumber, email, specialty, categorization,
    dateAdded: dateAdded ? new Date(dateAdded) : undefined,
    hospital, address, city, notes, isActive
  });

  return ApiResponse.ok(res, "Doctor created", { id: doctor._id, name: doctor.name }, 201);
};

/**
 * GET /api/v1/admin/doctors/:id
 */
exports.getOne = async (req, res) => {
  const doctor = await Doctor.findById(req.params.id).populate("sector", "_id name code");
  if (!doctor) throw new AppError(404, "Doctor not found");
  return ApiResponse.ok(res, "Doctor fetched", doctor);
};

/**
 * PATCH /api/v1/admin/doctors/:id
 * Allows sector change; re-checks uniqueness in the target sector.
 */
exports.update = async (req, res) => {
  const update = { ...req.body };
  if (update.dateAdded) update.dateAdded = new Date(update.dateAdded);

  const existing = await Doctor.findById(req.params.id);
  if (!existing) throw new AppError(404, "Doctor not found");

  // Determine target uniqueness scope
  const targetSector = update.sector || existing.sector;
  const nextEmail = update.email ?? existing.email;
  const nextName = update.name ?? existing.name;
  const nextHospital = update.hospital ?? existing.hospital;

  if (nextEmail) {
    const emailTaken = await Doctor.findOne({
      sector: targetSector,
      email: nextEmail,
      _id: { $ne: existing._id }
    });
    if (emailTaken) throw new AppError(409, "Email already exists in this sector");
  }

  if (nextName && nextHospital) {
    const nameHospTaken = await Doctor.findOne({
      sector: targetSector,
      name: nextName,
      hospital: nextHospital,
      _id: { $ne: existing._id }
    });
    if (nameHospTaken) throw new AppError(409, "Doctor with same name & hospital exists in this sector");
  }

  const doctor = await Doctor.findByIdAndUpdate(existing._id, update, { new: true }).populate("sector", "_id name code");
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
