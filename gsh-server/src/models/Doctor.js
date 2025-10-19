const mongoose = require("mongoose");

const DoctorSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true },        // e.g., "M.S Perera"
    contactNumber: { type: String },                      // e.g., "0770870361"
    email:       { type: String, index: true, sparse: true, unique: true },
    specialty:   { type: String },                        // e.g., "VP" (your doc)
    categorization: { type: String },                     // e.g., "A"
    dateAdded:   { type: Date, default: () => new Date() },
    hospital:    { type: String },                        // optional
    address:     { type: String },                        // optional
    city:        { type: String },                        // optional
    notes:       { type: String },                        // optional
    isActive:    { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Full-text index for quick search
DoctorSchema.index({ name: "text", specialty: "text", email: "text" });

// Optional: contact number uniqueness (sparse) — enable if your data ensures uniqueness.
// DoctorSchema.index({ contactNumber: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Doctor", DoctorSchema);
