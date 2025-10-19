const mongoose = require("mongoose");
const { Schema } = mongoose;

const SectorSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, index: true }, // e.g., "Arrowill-A"
    code: { type: String, unique: true, sparse: true },
    description: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Sector", SectorSchema);
