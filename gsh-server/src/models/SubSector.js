const mongoose = require("mongoose");
const { Schema } = mongoose;

const SubSectorSchema = new Schema(
  {
    sector: { type: Schema.Types.ObjectId, ref: "Sector", required: true, index: true },
    name: { type: String, required: true },
    code: { type: String },
    isActive: { type: Boolean, default: true },
    dateAdded: { type: Date, default: () => new Date() }
  },
  { timestamps: true }
);

SubSectorSchema.index({ sector: 1, name: 1 }, { unique: true }); // name unique per sector

module.exports = mongoose.model("SubSector", SubSectorSchema);
