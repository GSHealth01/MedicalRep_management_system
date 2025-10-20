const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../../../models/User");
const Sector = require("../../../models/Sector");       // "range"
const SubSector = require("../../../models/SubSector"); // "agency"
const ApiResponse = require("../../../utils/ApiResponse");
const AppError = require("../../../utils/AppError");

function normEmail(v) {
  return (v || "").trim().toLowerCase();
}

async function assertSubSectorBelongsToSector(agencyId, rangeId) {
  if (!mongoose.isValidObjectId(agencyId) || !mongoose.isValidObjectId(rangeId)) {
    throw new AppError(400, "Invalid sector/agency id");
  }
  const sub = await SubSector.findOne({ _id: agencyId, sector: rangeId }).select("_id sector");
  if (!sub) throw new AppError(400, "Agency does not belong to the given range");
}

exports.list = async (req, res) => {
  const { agency, range, role, q } = req.query;

  const filter = {};
  if (agency) filter.agency = agency;
  if (range) filter.range = range;
  if (role) filter.role = String(role).toUpperCase();
  if (q) {
    filter.$or = [
      { email: new RegExp(q, "i") },
      { name: new RegExp(q, "i") },
      { empNo: new RegExp(q, "i") },
      { designation: new RegExp(q, "i") },
    ];
  }

  const users = await User.find(filter)
    .select("_id name email role empNo designation agency range distributor createdAt isActive")
    .populate("range", "name code")
    .populate("agency", "name code")
    .sort({ createdAt: -1 });

  return ApiResponse.ok(res, "Users fetched", users);
};

exports.create = async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    empNo,
    designation,
    agency,      // sub-sector (required for non-ADMIN)
    range,       // sector     (required for non-ADMIN)
    distributor
  } = req.body;

  if (!email || !password || !role) {
    throw new AppError(400, "name, email, password, and role are required");
  }

  const normalizedEmail = normEmail(email);
  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) throw new AppError(409, "Email already registered");

  const isAdmin = String(role).toUpperCase() === "ADMIN";

  // Validate sector & sub-sector for non-admin users
  if (!isAdmin) {
    if (!range || !agency) {
      throw new AppError(400, "range (sector) and agency (sub-sector) are required for non-admin users");
    }
    const sec = await Sector.findById(range).select("_id");
    if (!sec) throw new AppError(404, "Range (sector) not found");
    await assertSubSectorBelongsToSector(agency, range);
  }

  const passwordHash = await bcrypt.hash(password || "ChangeMe123!", 12);

  const user = await User.create({
    name,
    email: normalizedEmail, 
    passwordHash,
    role: String(role).toUpperCase(),
    empNo,
    designation,
    agency: isAdmin ? undefined : agency,
    range: isAdmin ? undefined : range,
    distributor,
    isActive: true
  });

  return ApiResponse.ok(
    res,
    "User created",
    { id: user._id, email: user.email, role: user.role, range: user.range, agency: user.agency },
    201
  );
};

exports.getOne = async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("_id name email role empNo designation agency range distributor createdAt isActive")
    .populate("range", "name code")
    .populate("agency", "name code");

  if (!user) throw new AppError(404, "User not found");
  return ApiResponse.ok(res, "User fetched", user);
};

exports.updateRole = async (req, res) => {
  const role = String(req.body.role || "").toUpperCase();
  if (!role) throw new AppError(400, "role is required");

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true }
  ).select("_id email role");

  if (!user) throw new AppError(404, "User not found");
  return ApiResponse.ok(res, "Role updated", user);
};

exports.updateProfile = async (req, res) => {
  const { name, empNo, designation, agency, range, distributor, isActive } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) throw new AppError(404, "User not found");

  if (agency || range) {
    const nextRange = range || user.range;
    const nextAgency = agency || user.agency;

    if (!nextRange || !nextAgency) {
      throw new AppError(400, "Both range and agency must be provided together");
    }

    const sec = await Sector.findById(nextRange).select("_id");
    if (!sec) throw new AppError(404, "Range (sector) not found");
    await assertSubSectorBelongsToSector(nextAgency, nextRange);

    user.range = nextRange;
    user.agency = nextAgency;
  }

  if (typeof name === "string") user.name = name;
  if (typeof empNo === "string") user.empNo = empNo;
  if (typeof designation === "string") user.designation = designation;
  if (typeof distributor !== "undefined") user.distributor = distributor;
  if (typeof isActive === "boolean") user.isActive = isActive;

  await user.save();

  const refreshed = await User.findById(user._id)
    .select("_id name email role empNo designation agency range distributor createdAt isActive")
    .populate("range", "name code")
    .populate("agency", "name code");

  return ApiResponse.ok(res, "User updated", refreshed);
};

exports.remove = async (req, res) => {
  const deleted = await User.findByIdAndDelete(req.params.id);
  if (!deleted) throw new AppError(404, "User not found");
  return ApiResponse.ok(res, "User removed", null, 200);
};

exports.listByAgency = async (req, res) => {
  const { agencyId } = req.params;
  const users = await User.find({ agency: agencyId })
    .select("_id name email role empNo designation agency range distributor createdAt isActive")
    .populate("range", "name code")
    .populate("agency", "name code")
    .sort({ createdAt: -1 });

  return ApiResponse.ok(res, "Users fetched", users);
};
