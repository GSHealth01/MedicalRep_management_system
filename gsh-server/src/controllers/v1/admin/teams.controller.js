const Team = require("../../../models/Team");
const SubSector = require("../../../models/SubSector");
const User = require("../../../models/User");
const ApiResponse = require("../../../utils/ApiResponse");
const AppError = require("../../../utils/AppError");

// helpers
async function assertUsersHaveRole(userIds, role) {
  const found = await User.find({ _id: { $in: userIds }, role }).select("_id");
  if (found.length !== userIds.length) throw new AppError(400, `One or more users not found or not role ${role}`);
  return found.map(u => u._id.toString());
}

async function fcAlreadyOnAnotherTeam(userIds, teamId) {
  const clash = await Team.findOne({ _id: { $ne: teamId }, fcIds: { $in: userIds } }).select("_id name");
  return clash;
}

/**
 * GET /api/v1/admin/teams
 * Query: subSector, page, limit, sortBy, order
 */
exports.list = async (req, res) => {
  const { subSector, page = 1, limit = 10, sortBy = "createdAt", order = "desc" } = req.query;
  const filter = {};
  if (subSector) filter.subSector = subSector;

  const skip = (Number(page) - 1) * Number(limit);
  const sort = { [sortBy]: order === "asc" ? 1 : -1 };

  const [items, total] = await Promise.all([
    Team.find(filter)
      .sort(sort).skip(skip).limit(Number(limit))
      .populate("subSector", "name sector")
      .populate("leader", "_id name email role"),
    Team.countDocuments(filter)
  ]);

  return ApiResponse.ok(res, "Teams fetched", {
    items, page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit))
  });
};

/**
 * POST /api/v1/admin/subsectors/:subSectorId/teams
 */
exports.createUnderSubSector = async (req, res) => {
  const sub = await SubSector.findById(req.params.subSectorId);
  if (!sub) throw new AppError(404, "Sub-sector not found");

  const { name, leader, notes } = req.body;
  // Optional leader must be TM/PM/SE if provided. :contentReference[oaicite:6]{index=6}
  if (leader) {
    const ok = await User.findOne({ _id: leader, role: { $in: ["TM", "PM", "SE"] } });
    if (!ok) throw new AppError(400, "Leader must be a TM, PM, or SE");
  }

  const t = await Team.create({ name, subSector: sub._id, leader: leader || undefined, notes });
  return ApiResponse.ok(res, "Team created", { id: t._id, name: t.name }, 201);
};

exports.getOne = async (req, res) => {
  const t = await Team.findById(req.params.id)
    .populate("subSector", "name sector")
    .populate("leader", "_id name email role")
    .populate("fcIds", "_id name email role")
    .populate("mrIds", "_id name email role")
    .populate("jeIds", "_id name email role");
  if (!t) throw new AppError(404, "Team not found");
  return ApiResponse.ok(res, "Team fetched", t);
};

exports.update = async (req, res) => {
  const { name, leader, notes, isActive } = req.body;
  if (leader) {
    const ok = await User.findOne({ _id: leader, role: { $in: ["TM", "PM", "SE"] } });
    if (!ok) throw new AppError(400, "Leader must be a TM, PM, or SE");
  }
  const t = await Team.findByIdAndUpdate(req.params.id, { name, leader, notes, isActive }, { new: true });
  if (!t) throw new AppError(404, "Team not found");
  return ApiResponse.ok(res, "Team updated", t);
};

exports.updateStatus = async (req, res) => {
  const { isActive } = req.body;
  const t = await Team.findByIdAndUpdate(req.params.id, { isActive: Boolean(isActive) }, { new: true });
  if (!t) throw new AppError(404, "Team not found");
  return ApiResponse.ok(res, "Team status updated", { id: t._id, isActive: t.isActive });
};

/**
 * PATCH /api/v1/admin/teams/:id/members
 * Body: { role: "FC"|"MR"|"JE", userIds: [ ... ] }
 * - Enforces “each FC only on one team” rule. :contentReference[oaicite:7]{index=7}
 */
exports.addMembers = async (req, res) => {
  const { role, userIds } = req.body;
  if (!["FC", "MR", "JE"].includes(role)) throw new AppError(400, "role must be one of FC, MR, JE");
  if (!Array.isArray(userIds) || !userIds.length) throw new AppError(400, "userIds is required");

  await assertUsersHaveRole(userIds, role);

  // FC must be on only one team
  if (role === "FC") {
    const clash = await fcAlreadyOnAnotherTeam(userIds, req.params.id);
    if (clash) throw new AppError(400, `FC already assigned to team '${clash.name}'`);
  }

  const t = await Team.findById(req.params.id);
  if (!t) throw new AppError(404, "Team not found");

  const field = role === "FC" ? "fcIds" : role === "MR" ? "mrIds" : "jeIds";
  const current = new Set((t[field] || []).map(id => id.toString()));
  userIds.forEach(id => current.add(String(id)));
  t[field] = Array.from(current);
  await t.save();

  return ApiResponse.ok(res, "Members added to team", { id: t._id, role, memberIds: t[field] });
};

/**
 * PATCH /api/v1/admin/teams/:id/members/remove
 * Body: { role: "FC"|"MR"|"JE", userIds: [ ... ] }
 */
exports.removeMembers = async (req, res) => {
  const { role, userIds } = req.body;
  if (!["FC", "MR", "JE"].includes(role)) throw new AppError(400, "role must be one of FC, MR, JE");
  if (!Array.isArray(userIds) || !userIds.length) throw new AppError(400, "userIds is required");

  const t = await Team.findById(req.params.id);
  if (!t) throw new AppError(404, "Team not found");

  const field = role === "FC" ? "fcIds" : role === "MR" ? "mrIds" : "jeIds";
  const toRemove = new Set(userIds.map(String));
  t[field] = (t[field] || []).filter(id => !toRemove.has(id.toString()));
  await t.save();

  return ApiResponse.ok(res, "Members removed from team", { id: t._id, role, memberIds: t[field] });
};

exports.remove = async (req, res) => {
  const del = await Team.findByIdAndDelete(req.params.id);
  if (!del) throw new AppError(404, "Team not found");
  return ApiResponse.ok(res, "Team removed", null, 200);
};
