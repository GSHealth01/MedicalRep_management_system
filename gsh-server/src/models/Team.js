const mongoose = require("mongoose");
const { Schema } = mongoose;

const TeamSchema = new Schema(
  {
    name: { type: String, required: true },
    subSector: { type: Schema.Types.ObjectId, ref: "SubSector", required: true, index: true },
    // Optional leader (must be TM/PM/SE if provided)
    leader: { type: Schema.Types.ObjectId, ref: "User" },
    // Members grouped by role as per doc: FC/MR mandatory, JE optional. :contentReference[oaicite:3]{index=3}
    fcIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    mrIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    jeIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    notes: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// For faster checks when enforcing “FC is only on one team”
TeamSchema.index({ fcIds: 1 });

module.exports = mongoose.model("Team", TeamSchema);
