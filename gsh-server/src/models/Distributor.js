const mongoose = require("mongoose");
const { Schema } = mongoose;

const DistributorSchema = new Schema(
  {
    name: { type: String, required: true, index: true }, // e.g., "British Agencies"
    area: { type: String },                               // e.g., "North western Province 1"
    town: { type: String },                               // e.g., "Puttalam"
    dateAdded: { type: Date, default: () => new Date() },
    isActive: { type: Boolean, default: true },

    // assignments (Admin can link PM/TM/SE to this distributor)
    assignedPMs: [{ type: Schema.Types.ObjectId, ref: "User" }],
    assignedTMs: [{ type: Schema.Types.ObjectId, ref: "User" }],
    assignedSEs: [{ type: Schema.Types.ObjectId, ref: "User" }],

    // optional metadata
    contactName: { type: String },
    contactPhone: { type: String },
    notes: { type: String }
  },
  { timestamps: true }
);

// search index
DistributorSchema.index({ name: "text", area: "text", town: "text" });

module.exports = mongoose.model("Distributor", DistributorSchema);
