const SubSector = require("../../../models/SubSector");
const Team = require("../../../models/Team");
const ApiResponse = require("../../../utils/ApiResponse");
const AppError = require("../../../utils/AppError");

exports.listBySector = async (req, res) => {
  const { page = 1, limit = 10, sortBy = "createdAt", order = "desc" } = req.query;
  const filter = { sector: req.params.sectorId };
  const skip = (Number(page) - 1) * Number(limit);
  const sort = { [sortBy]: order === "asc" ? 1 : -1 };

  const [items, total] = await Promise.all([
    SubSector.find(filter).sort(sort).skip(skip).limit(Number(limit)),
    SubSector.countDocuments(filter)
  ]);

  return ApiResponse.ok(res, "Sub-sectors fetched", {
    items, page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit))
  });
};

exports.createUnderSector = async (req, res) => {
  const { name, code, isActive, dateAdded } = req.body;
  const dup = await SubSector.findOne({ sector: req.params.sectorId, name });
  if (dup) throw new AppError(409, "Sub-sector name already exists in this sector");
  const ss = await SubSector.create({ sector: req.params.sectorId, name, code, isActive, dateAdded });
  return ApiResponse.ok(res, "Sub-sector created", { id: ss._id, name: ss.name }, 201);
};

exports.getOne = async (req, res) => {
  const ss = await SubSector.findById(req.params.id).populate("sector", "name code");
  if (!ss) throw new AppError(404, "Sub-sector not found");
  const teamCount = await Team.countDocuments({ subSector: ss._id });
  return ApiResponse.ok(res, "Sub-sector fetched", { ...ss.toObject(), teamCount });
};

exports.update = async (req, res) => {
  const update = req.body;
  if (update.name) {
    const taken = await SubSector.findOne({ sector: req.body.sector ?? undefined, name: update.name, _id: { $ne: req.params.id } });
    if (taken) throw new AppError(409, "Sub-sector name already exists in this sector");
  }
  const ss = await SubSector.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!ss) throw new AppError(404, "Sub-sector not found");
  return ApiResponse.ok(res, "Sub-sector updated", ss);
};

exports.updateStatus = async (req, res) => {
  const { isActive } = req.body;
  const ss = await SubSector.findByIdAndUpdate(req.params.id, { isActive: Boolean(isActive) }, { new: true });
  if (!ss) throw new AppError(404, "Sub-sector not found");
  return ApiResponse.ok(res, "Sub-sector status updated", { id: ss._id, isActive: ss.isActive });
};

exports.remove = async (req, res) => {
  const hasTeams = await Team.exists({ subSector: req.params.id });
  if (hasTeams) throw new AppError(400, "Cannot delete sub-sector with existing teams");
  const del = await SubSector.findByIdAndDelete(req.params.id);
  if (!del) throw new AppError(404, "Sub-sector not found");
  return ApiResponse.ok(res, "Sub-sector removed", null, 200);
};
