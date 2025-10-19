const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true, index: true },     // e.g., unit code / SKU
    name: { type: String, required: true },                                // Product name
    genericName: { type: String },                                         // Generic / molecule
    strength: { type: String },                                            // e.g., "50 mg"
    packSize: { type: Number },                                            // e.g., 100
    unitCode: { type: String },                                            // optional “unit code”
    description: { type: String },                                         // long description
    price: { type: Number, default: 0 },                                   // pricing
    isActive: { type: Boolean, default: true },                            // admin can deactivate instead of delete
    images: [{ type: String }]                                             // optional image URLs
  },
  { timestamps: true }
);

// helpful text index
ProductSchema.index({ name: "text", genericName: "text", sku: "text" });

module.exports = mongoose.model("Product", ProductSchema);
