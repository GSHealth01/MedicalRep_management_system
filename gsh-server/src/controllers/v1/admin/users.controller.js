const { prisma } = require('../../../../lib/prisma');
const bcrypt = require("bcryptjs");
const ApiResponse = require("../../../utils/ApiResponse");
const AppError = require("../../../utils/AppError");

function normEmail(v) {
  return (v || "").trim().toLowerCase();
}

exports.list = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        range: { select: { id: true, name: true } },
        agency: { select: { id: true, name: true } }
      },
      orderBy: { id: 'desc' }
    });

    return ApiResponse.ok(res, "Users fetched", users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return ApiResponse.error(res, "Failed to fetch users");
  }
};

exports.create = async (req, res) => {
  try {
    console.log('Request body:', req.body); // Debug log

    const {
      name,
      email,
      password,
      empNo,
      designation,
      join_date,
      birthday,
      agency_id,
      range_id,
      team_id,
      distributor_id
    } = req.body;

    // Map empNo to emp_no for consistency
    const emp_no = empNo;

    console.log('Extracted fields:', { name, email, password, emp_no, designation }); // Debug log

    // Check required fields - make designation optional for now since it might be empty
    if (!email || !password || !name || !emp_no) {
      throw new AppError(400, "email, password, name, and emp_no are required");
    }

    const normalizedEmail = normEmail(email);
    const exists = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });
    if (exists) throw new AppError(409, "Email already registered");

    // Check for duplicate emp_no
    const empNoExists = await prisma.user.findUnique({
      where: { emp_no: emp_no }
    });
    if (empNoExists) throw new AppError(409, "Employee number already exists");

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: passwordHash,
        designation: designation ? designation.toUpperCase() : 'USER',
        emp_no: emp_no,
        join_date: join_date ? new Date(join_date + 'T00:00:00.000Z') : undefined,
        birthday: birthday ? new Date(birthday + 'T00:00:00.000Z') : undefined,
        agency_id: agency_id ? parseInt(agency_id) : undefined,
        range_id: range_id ? parseInt(range_id) : undefined,
        team_id: team_id ? parseInt(team_id) : undefined,
        distributor_id: distributor_id ? parseInt(distributor_id) : undefined
      },
      include: {
        range: { select: { id: true, name: true } },
        agency: { select: { id: true, name: true } },
        team: { select: { id: true, team_name: true } },
        distributor: { select: { id: true, name: true } }
      }
    });

    return ApiResponse.ok(
      res,
      "User created",
      {
        id: user.id,
        email: user.email,
        name: user.name,
        emp_no: user.emp_no,
        designation: user.designation,
        join_date: user.join_date,
        birthday: user.birthday,
        range: user.range,
        agency: user.agency,
        team: user.team,
        distributor: user.distributor
      },
      201
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return ApiResponse.error(res, error.message || "Failed to create user");
  }
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
  try {
    const { id } = req.params;
    const { name, empNo, designation, agency, range, distributor } = req.body;

    const userId = parseInt(id);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return ApiResponse.error(res, "User not found", 404);
    }

    // Prepare update data
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (empNo !== undefined) updateData.emp_no = empNo;
    if (designation !== undefined) updateData.designation = designation.toUpperCase();

    // Handle agency and range updates
    if (agency !== undefined || range !== undefined) {
      if (agency && range) {
        // Validate that agency and range exist
        const agencyExists = await prisma.agency.findFirst({ where: { name: agency } });
        const rangeExists = await prisma.range.findFirst({ where: { name: range } });

        if (!agencyExists) return ApiResponse.error(res, "Agency not found", 404);
        if (!rangeExists) return ApiResponse.error(res, "Range not found", 404);

        updateData.agency = { connect: { id: agencyExists.id } };
        updateData.range = { connect: { id: rangeExists.id } };
      } else if (agency || range) {
        return ApiResponse.error(res, "Both agency and range must be provided together", 400);
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        range: { select: { id: true, name: true } },
        agency: { select: { id: true, name: true } }
      }
    });

    return ApiResponse.ok(res, "User updated", updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return ApiResponse.error(res, error.message || "Failed to update user");
  }
};

exports.remove = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const deleted = await prisma.user.delete({
      where: { id: userId }
    });

    return ApiResponse.ok(res, "User removed", null, 200);
  } catch (error) {
    console.error('Error deleting user:', error);
    if (error.code === 'P2025') {
      return ApiResponse.error(res, "User not found", 404);
    }
    return ApiResponse.error(res, "Failed to delete user");
  }
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
