const Sector = require("../../../models/Sector");
const SubSector = require("../../../models/SubSector");
const ApiResponse = require("../../../utils/ApiResponse");
const AppError = require("../../../utils/AppError");

exports.list = async (req, res) => {
  const { q, isActive, page = 1, limit = 10, sortBy = "createdAt", order = "desc" } = req.query;
  const filter = {};
  if (q) filter.name = new RegExp(String(q), "i");
  if (typeof isActive !== "undefined") filter.isActive = isActive === "true";

  const skip = (Number(page) - 1) * Number(limit);
  const sort = { [sortBy]: order === "asc" ? 1 : -1 };

  const [items, total] = await Promise.all([
    Sector.find(filter).sort(sort).skip(skip).limit(Number(limit)),
    Sector.countDocuments(filter)
  ]);

  return ApiResponse.ok(res, "Sectors fetched", {
    items, page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit))
  });
};

exports.create = async (req, res) => {
  const { name, code, description, isActive } = req.body;
  const exists = await Sector.findOne({ name });
  if (exists) throw new AppError(409, "Sector name already exists");
  const s = await Sector.create({ name, code, description, isActive });
  return ApiResponse.ok(res, "Sector created", { id: s._id, name: s.name }, 201);
};

exports.getOne = async (req, res) => {
  const s = await Sector.findById(req.params.id);
  if (!s) throw new AppError(404, "Sector not found");
  const subCount = await SubSector.countDocuments({ sector: s._id });
  return ApiResponse.ok(res, "Sector fetched", { ...s.toObject(), subSectorCount: subCount });
};

exports.update = async (req, res) => {
  const update = req.body;
  if (update.name) {
    const taken = await Sector.findOne({ name: update.name, _id: { $ne: req.params.id } });
    if (taken) throw new AppError(409, "Sector name already exists");
  }
  const s = await Sector.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!s) throw new AppError(404, "Sector not found");
  return ApiResponse.ok(res, "Sector updated", s);
};

exports.updateStatus = async (req, res) => {
  const { isActive } = req.body;
  const s = await Sector.findByIdAndUpdate(req.params.id, { isActive: Boolean(isActive) }, { new: true });
  if (!s) throw new AppError(404, "Sector not found");
  return ApiResponse.ok(res, "Sector status updated", { id: s._id, isActive: s.isActive });
};

exports.remove = async (req, res) => {
  const subExists = await SubSector.exists({ sector: req.params.id });
  if (subExists) throw new AppError(400, "Cannot delete sector with existing sub-sectors");
  const del = await Sector.findByIdAndDelete(req.params.id);
  if (!del) throw new AppError(404, "Sector not found");
  return ApiResponse.ok(res, "Sector removed", null, 200);
};
