const mongoose = require("mongoose");

const roles = ["ADMIN", "PM", "TM", "SE", "JE", "FC", "MR"];

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: roles, default: "MR" },

    // optional domain fields if FE needs them
    empNo: String,
    designation: String,
    agency: String,
    range: String,
    distributor: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
module.exports.roles = roles;
