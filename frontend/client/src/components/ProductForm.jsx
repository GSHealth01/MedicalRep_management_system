import { useState, useMemo } from "react";

// Build a SKU from form inputs (generic/product, strength, route, pack size)
function generateSku({ productName, genericName, strength, route, injectionType, packSize }) {
  const pick = (s, n) => (s || "").replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, n || 4);
  const gen = pick(genericName, 5) || pick(productName, 5) || "PROD";
  const str = (strength || "").replace(/\s+/g, "").toUpperCase() || "NA";
  const rt  = route === "Injection"
    ? `INJ-${(injectionType || "").replace(/[^A-Z]/gi, "").toUpperCase() || "NA"}`
    : (route || "NA").toUpperCase();
  const pk  = String(packSize || "").replace(/[^0-9]/g, "") || "1";
  return `${gen}-${str}-${rt}-${pk}`;
}

export default function ProductForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    productName: "",
    therapeuticCategory: "",
    genericName: "",
    route: "",
    injectionType: "",
    packSize: "",
    strength: "",
    date: "",
  });

  const canSubmit = useMemo(() => {
    return (
      formData.productName &&
      formData.therapeuticCategory &&
      formData.genericName &&
      formData.route &&
      (formData.route === "Injection" ? !!formData.injectionType : true) &&
      formData.date
    );
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "route" && value !== "Injection") next.injectionType = "";
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    // Normalize to BE payload
    const sku = generateSku(formData);
    const payload = {
      sku,
      name: formData.productName,
      genericName: formData.genericName,
      strength: formData.strength || undefined,
      packSize: formData.packSize ? Number(formData.packSize) : undefined,
      description: [
        formData.therapeuticCategory,
        `Route: ${formData.route}${formData.route === "Injection" && formData.injectionType ? ` (${formData.injectionType})` : ""}`
      ].filter(Boolean).join(" | "),
      dateAdded: formData.date,
      isActive: true,
      // If BE requires these, uncomment and set defaults:
      // unitCode: formData.route === "Oral" ? "TAB" : formData.route === "Injection" ? "AMP" : "OTH",
      // price: 0
    };

    onSubmit && onSubmit(payload, formData);

    setFormData({
      productName: "",
      therapeuticCategory: "",
      genericName: "",
      route: "",
      injectionType: "",
      packSize: "",
      strength: "",
      date: "",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl bg-white shadow-lg rounded-lg p-6 space-y-4">
      {/* Product Name */}
      <div>
        <label className="block text-gray-700 mb-1">Product Name</label>
        <input
          type="text"
          name="productName"
          value={formData.productName}
          onChange={handleChange}
          placeholder="Enter product name"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Therapeutic Category */}
      <div>
        <label className="block text-gray-700 mb-1">Therapeutic Category</label>
        <input
          type="text"
          name="therapeuticCategory"
          value={formData.therapeuticCategory}
          onChange={handleChange}
          placeholder="Enter therapeutic category"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Generic Name */}
      <div>
        <label className="block text-gray-700 mb-1">Generic Name</label>
        <input
          type="text"
          name="genericName"
          value={formData.genericName}
          onChange={handleChange}
          placeholder="Enter generic name"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Route of Administration */}
      <div>
        <label className="block text-gray-700 mb-1">Route of Administration</label>
        <select
          name="route"
          value={formData.route}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select Route</option>
          <option value="Oral">Oral</option>
          <option value="Local">Local</option>
          <option value="Injection">Injection</option>
        </select>
      </div>

      {/* Injection Type */}
      {formData.route === "Injection" && (
        <div>
          <label className="block text-gray-700 mb-1">Injection Type</label>
          <select
            name="injectionType"
            value={formData.injectionType}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select injection type</option>
            <option value="IM">IM</option>
            <option value="IV">IV</option>
            <option value="Sub-cut">Sub-cut</option>
          </select>
        </div>
      )}

      {/* Pack Size */}
      <div>
        <label className="block text-gray-700 mb-1">Pack Size</label>
        <input
          type="text"
          name="packSize"
          value={formData.packSize}
          onChange={handleChange}
          placeholder="Enter pack size"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Strength */}
      <div>
        <label className="block text-gray-700 mb-1">Strength</label>
        <input
          type="text"
          name="strength"
          value={formData.strength}
          onChange={handleChange}
          placeholder="Enter strength"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Date */}
      <div>
        <label className="block text-gray-700 mb-1">Date</label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Submit */}
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition">
        Add Product
      </button>
    </form>
  );
}
