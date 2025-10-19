const mongoose = require("mongoose");

const DoctorSchema = new mongoose.Schema(
  {
    sector: { type: mongoose.Schema.Types.ObjectId, ref: "Sector", required: true, index: true },
    name: { type: String, required: true },
    contactNumber: { type: String },
    email: { type: String, index: true, sparse: true },
    specialty: { type: String },
    categorization: { type: String },
    dateAdded: { type: Date, default: () => new Date() },
    hospital: { type: String },
    address: { type: String },
    city: { type: String },
    notes: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Unique within a sector:
DoctorSchema.index({ sector: 1, email: 1 }, { unique: true, sparse: true });
DoctorSchema.index(
  { sector: 1, name: 1, hospital: 1 },
  { unique: true, partialFilterExpression: { name: { $exists: true }, hospital: { $exists: true } } }
);

module.exports = mongoose.model("Doctor", DoctorSchema);
