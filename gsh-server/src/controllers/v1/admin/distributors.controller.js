const Distributor = require("../../../models/Distributor");
const User = require("../../../models/User");
const ApiResponse = require("../../../utils/ApiResponse");
const AppError = require("../../../utils/AppError");

/**
 * GET /api/v1/admin/distributors
 * Query: sector, q, area, town, isActive, dateFrom, dateTo, page, limit, sortBy, order
 */
exports.list = async (req, res) => {
  const {
    sector, q, area, town, isActive, dateFrom, dateTo,
    page = 1, limit = 10, sortBy = "createdAt", order = "desc"
  } = req.query;

  const filter = {};
  if (sector) filter.sector = sector;
  if (q) filter.$text = { $search: q };
  if (area) filter.area = area;
  if (town) filter.town = town;
  if (typeof isActive !== "undefined") filter.isActive = isActive === "true";
  if (dateFrom || dateTo) {
    filter.dateAdded = {};
    if (dateFrom) filter.dateAdded.$gte = new Date(dateFrom);
    if (dateTo)   filter.dateAdded.$lte = new Date(dateTo);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sort = { [sortBy]: order === "asc" ? 1 : -1 };

  const [items, total] = await Promise.all([
    Distributor.find(filter).sort(sort).skip(skip).limit(Number(limit))
      .populate("sector", "_id name code"),
    Distributor.countDocuments(filter)
  ]);

  return ApiResponse.ok(res, "Distributors fetched", {
    items,
    page: Number(page),
    limit: Number(limit),
    total,
    pages: Math.ceil(total / Number(limit))
  });
};

/**
 * POST /api/v1/admin/distributors
 * Body must include: sector, name
 * Uniqueness enforced **within the same sector**: (sector, name, town)
 */
exports.create = async (req, res) => {
  const {
    sector, name, area, town, dateAdded, isActive,
    contactName, contactPhone, notes
  } = req.body;

  if (!sector) throw new AppError(400, "sector is required");
  if (!name) throw new AppError(400, "name is required");

  const dup = await Distributor.findOne({ sector, name, town });
  if (dup) throw new AppError(409, "Distributor with same name & town already exists in this sector");

  const d = await Distributor.create({
    sector, name, area, town,
    dateAdded: dateAdded ? new Date(dateAdded) : undefined,
    isActive, contactName, contactPhone, notes
  });

  return ApiResponse.ok(res, "Distributor created", { id: d._id, name: d.name }, 201);
};

/**
 * GET /api/v1/admin/distributors/:id
 */
exports.getOne = async (req, res) => {
  const d = await Distributor.findById(req.params.id)
    .populate("sector", "_id name code")
    .populate("assignedPMs", "_id name email role")
    .populate("assignedTMs", "_id name email role")
    .populate("assignedSEs", "_id name email role");
  if (!d) throw new AppError(404, "Distributor not found");
  return ApiResponse.ok(res, "Distributor fetched", d);
};

/**
 * PATCH /api/v1/admin/distributors/:id
 * Allows sector/name/town changes; re-checks sector-scoped uniqueness.
 */
exports.update = async (req, res) => {
  const update = { ...req.body };
  if (update.dateAdded) update.dateAdded = new Date(update.dateAdded);

  const existing = await Distributor.findById(req.params.id);
  if (!existing) throw new AppError(404, "Distributor not found");

  const targetSector = update.sector || existing.sector;
  const nextName = update.name ?? existing.name;
  const nextTown = update.town ?? existing.town;

  const clash = await Distributor.findOne({
    sector: targetSector,
    name: nextName,
    town: nextTown,
    _id: { $ne: existing._id }
  });
  if (clash) throw new AppError(409, "Distributor with same name & town already exists in this sector");

  const d = await Distributor.findByIdAndUpdate(existing._id, update, { new: true })
    .populate("sector", "_id name code");
  return ApiResponse.ok(res, "Distributor updated", d);
};

/**
 * PATCH /api/v1/admin/distributors/:id/status
 * Body: { isActive: boolean }
 */
exports.updateStatus = async (req, res) => {
  const { isActive } = req.body;
  const d = await Distributor.findByIdAndUpdate(
    req.params.id, { isActive: Boolean(isActive) }, { new: true }
  );
  if (!d) throw new AppError(404, "Distributor not found");
  return ApiResponse.ok(res, "Distributor status updated", { id: d._id, isActive: d.isActive });
};

/**
 * PATCH /api/v1/admin/distributors/:id/assign
 * Body: { role: "PM" | "TM" | "SE", userIds: [ "...", ... ] }
 * Only accepts users that actually have the requested role.
 */
exports.assign = async (req, res) => {
  const { role, userIds } = req.body;
  if (!["PM", "TM", "SE"].includes(role)) throw new AppError(400, "role must be one of PM, TM, SE");
  if (!Array.isArray(userIds) || userIds.length === 0) throw new AppError(400, "userIds is required");

  const users = await User.find({ _id: { $in: userIds }, role });
  if (users.length !== userIds.length) throw new AppError(400, "One or more users not found or role mismatch");

  const d = await Distributor.findById(req.params.id);
  if (!d) throw new AppError(404, "Distributor not found");

  const field = role === "PM" ? "assignedPMs" : role === "TM" ? "assignedTMs" : "assignedSEs";
  const current = new Set((d[field] || []).map(id => id.toString()));
  for (const u of users) current.add(u._id.toString());
  d[field] = Array.from(current);
  await d.save();

  return ApiResponse.ok(res, "Users assigned to distributor", { id: d._id, role, userIds: d[field] });
};

/**
 * PATCH /api/v1/admin/distributors/:id/unassign
 * Body: { role: "PM" | "TM" | "SE", userIds: [ "...", ... ] }
 */
exports.unassign = async (req, res) => {
  const { role, userIds } = req.body;
  if (!["PM", "TM", "SE"].includes(role)) throw new AppError(400, "role must be one of PM, TM, SE");
  if (!Array.isArray(userIds) || userIds.length === 0) throw new AppError(400, "userIds is required");

  const d = await Distributor.findById(req.params.id);
  if (!d) throw new AppError(404, "Distributor not found");

  const field = role === "PM" ? "assignedPMs" : role === "TM" ? "assignedTMs" : "assignedSEs";
  const toRemove = new Set(userIds.map(String));
  d[field] = (d[field] || []).filter(id => !toRemove.has(id.toString()));
  await d.save();

  return ApiResponse.ok(res, "Users unassigned from distributor", { id: d._id, role, userIds: d[field] });
};

/**
 * DELETE /api/v1/admin/distributors/:id
 */
exports.remove = async (req, res) => {
  const del = await Distributor.findByIdAndDelete(req.params.id);
  if (!del) throw new AppError(404, "Distributor not found");
  return ApiResponse.ok(res, "Distributor removed", null, 200);
};
