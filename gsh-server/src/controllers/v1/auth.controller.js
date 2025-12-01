const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { prisma } = require('../../../lib/prisma');
const RefreshToken = require("../../models/RefreshToken");
const { signAccessToken, signRefreshToken, verifyRefresh } = require("../../utils/jwt");
const ApiResponse = require("../../utils/ApiResponse");
const AppError = require("../../utils/AppError");

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const pickUser = (u) => ({ id: u.id, email: u.email, designation: u.designation, name: u.name, emp_no: u.emp_no });

exports.signup = async (req, res) => {
  const { name, email, password, empNo, designation } = req.body;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new AppError(409, "Email already registered");

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: passwordHash,
      emp_no: empNo,
      designation
    }
  });

  const payload = { sub: user.id.toString(), email: user.email, designation: user.designation };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const rHash = hashToken(refreshToken);
  const { exp } = JSON.parse(Buffer.from(refreshToken.split(".")[1], "base64").toString());
  await RefreshToken.findOneAndUpdate(
    { userId: user.id.toString() },
    { tokenHash: rHash, expiresAt: new Date(exp * 1000) },
    { upsert: true, new: true }
  );

  return ApiResponse.ok(res, "Signed up successfully", { accessToken, refreshToken, user: pickUser(user) }, 201);
};

exports.signin = async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError(401, "Invalid credentials");

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new AppError(401, "Invalid credentials");

  const payload = { sub: user.id.toString(), email: user.email, designation: user.designation };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const rHash = hashToken(refreshToken);
  const { exp } = JSON.parse(Buffer.from(refreshToken.split(".")[1], "base64").toString());
  await RefreshToken.findOneAndUpdate(
    { userId: user.id.toString() },
    { tokenHash: rHash, expiresAt: new Date(exp * 1000) },
    { upsert: true, new: true }
  );

  return ApiResponse.ok(res, "Signed in successfully", { accessToken, refreshToken, user: pickUser(user) });
};

exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new AppError(400, "Missing refreshToken");

  let payload;
  try {
    payload = verifyRefresh(refreshToken);
  } catch {
    throw new AppError(401, "Invalid refresh token");
  }

  const record = await RefreshToken.findOne({ userId: payload.sub });
  if (!record) throw new AppError(401, "Refresh token not found");

  const same = record.tokenHash === hashToken(refreshToken);
  if (!same || record.expiresAt < new Date()) throw new AppError(401, "Refresh token expired or rotated");

  const newPayload = { sub: payload.sub, email: payload.email, designation: payload.designation };
  const accessToken = signAccessToken(newPayload);
  const newRefreshToken = signRefreshToken(newPayload);

  const newHash = hashToken(newRefreshToken);
  const { exp } = JSON.parse(Buffer.from(newRefreshToken.split(".")[1], "base64").toString());
  record.tokenHash = newHash;
  record.expiresAt = new Date(exp * 1000);
  await record.save();

  return ApiResponse.ok(res, "Tokens refreshed", {
    accessToken,
    refreshToken: newRefreshToken,
    user: { id: payload.sub, email: payload.email, designation: payload.designation }
  });
};

exports.logout = async (req, res) => {
  if (req.user?.id) await RefreshToken.deleteOne({ userId: req.user.id });
  return ApiResponse.ok(res, "Logged out", null, 200);
};
