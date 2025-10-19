const bcrypt = require("bcryptjs");
const User = require("../../../models/User");
const ApiResponse = require("../../../utils/ApiResponse");
const AppError = require("../../../utils/AppError");

exports.list = async (_req, res) => {
  const users = await User.find().select("_id name email role empNo designation agency range distributor createdAt");
  return ApiResponse.ok(res, "Users fetched", users);
};

exports.create = async (req, res) => {
  const { name, email, password, role, empNo, designation, agency, range, distributor } = req.body;

  const exists = await User.findOne({ email });
  if (exists) throw new AppError(409, "Email already registered");

  const passwordHash = await bcrypt.hash(password || "ChangeMe123!", 12);
  const user = await User.create({ name, email, passwordHash, role, empNo, designation, agency, range, distributor });

  return ApiResponse.ok(res, "User created", { id: user._id, email: user.email, role: user.role }, 201);
};

exports.getOne = async (req, res) => {
  const user = await User.findById(req.params.id).select("_id name email role empNo designation agency range distributor createdAt");
  if (!user) throw new AppError(404, "User not found");
  return ApiResponse.ok(res, "User fetched", user);
};

exports.updateRole = async (req, res) => {
  const { role } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("_id email role");
  if (!user) throw new AppError(404, "User not found");
  return ApiResponse.ok(res, "Role updated", user);
};

exports.updateProfile = async (req, res) => {
  const { name, empNo, designation, agency, range, distributor } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name, empNo, designation, agency, range, distributor },
    { new: true }
  ).select("_id name email role empNo designation agency range distributor");
  if (!user) throw new AppError(404, "User not found");
  return ApiResponse.ok(res, "User updated", user);
};

exports.remove = async (req, res) => {
  const deleted = await User.findByIdAndDelete(req.params.id);
  if (!deleted) throw new AppError(404, "User not found");
  return ApiResponse.ok(res, "User removed", null, 200);
};
