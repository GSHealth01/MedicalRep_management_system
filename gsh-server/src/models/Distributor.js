const mongoose = require("mongoose");
const { Schema } = mongoose;

const DistributorSchema = new Schema(
  {
    sector: { type: Schema.Types.ObjectId, ref: "Sector", required: true, index: true },
    name: { type: String, required: true, index: true },
    area: { type: String },
    town: { type: String },
    dateAdded: { type: Date, default: () => new Date() },
    isActive: { type: Boolean, default: true },
    assignedPMs: [{ type: Schema.Types.ObjectId, ref: "User" }],
    assignedTMs: [{ type: Schema.Types.ObjectId, ref: "User" }],
    assignedSEs: [{ type: Schema.Types.ObjectId, ref: "User" }],
    contactName: { type: String },
    contactPhone: { type: String },
    notes: { type: String }
  },
  { timestamps: true }
);

// Unique by (sector, name, town)
DistributorSchema.index({ sector: 1, name: 1, town: 1 }, { unique: true });

module.exports = mongoose.model("Distributor", DistributorSchema);
