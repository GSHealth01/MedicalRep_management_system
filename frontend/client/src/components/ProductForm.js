// src/components/ProductForm.jsx
import { useState } from "react";

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Reset injection type if route is changed away from "Injection"
    if (name === "route" && value !== "Injection") {
      setFormData((prev) => ({ ...prev, injectionType: "" }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(formData);

    // Reset form
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
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl bg-white shadow-lg rounded-lg p-6 space-y-4"
    >
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
        <label className="block text-gray-700 mb-1">Root of Administration</label>
        <select
          name="route"
          value={formData.route}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select Root</option>
          <option value="Oral">Oral</option>
          <option value="Local">Local</option>
          <option value="Injection">Injection</option>
        </select>
      </div>

      {/* Injection Type (only if route === Injection) */}
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
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
      >
        Add Product
      </button>
    </form>
  );
}
