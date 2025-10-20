const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { Schema } = mongoose;

const roles = ["ADMIN", "PM", "TM", "SE", "JE", "FC", "MR"];

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: roles, default: "MR" },

    range: {
      type: Schema.Types.ObjectId,
      ref: "Sector",
      required: function () {
        return this.role !== "ADMIN";
      }, // Admin can be global
      index: true,
    },
    agency: {
      type: Schema.Types.ObjectId,
      ref: "SubSector",
      required: function () {
        return this.role !== "ADMIN";
      }, // Admin can be global
      index: true,
    },

    // optional domain fields if FE needs them
    empNo: String,
    designation: String,
    distributor: String,
  },
  { timestamps: true }
);


UserSchema.index({ subSector: 1, role: 1 });
UserSchema.index({ sector: 1, role: 1, isActive: 1 });

module.exports = mongoose.model("User", UserSchema);
module.exports.roles = roles;
