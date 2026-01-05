import { useState, useMemo, useEffect } from "react";
import { api } from "../services/api";

export default function ProductForm({ onSubmit, initialData, isEditing, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    therapeutic_category: "",
    generic_name: "",
    route_of_administration: "",
    pack_size: "",
    strength: "",
    range: "",
    agency: ""
  });

  // Add agencies state
  const [agencies, setAgencies] = useState([]);
  const [loadingAgencies, setLoadingAgencies] = useState(true);
  const [agencyError, setAgencyError] = useState("");

  // Load agencies from API
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingAgencies(true);
      setAgencyError("");
      try {
        const res = await api.get("/agencies");
        const payload = res?.data?.agencies || [];
        if (mounted) setAgencies(payload);
      } catch (err) {
        if (mounted) setAgencyError(err?.response?.data?.message || "Failed to load agencies");
      } finally {
        if (mounted) setLoadingAgencies(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Hardcoded ranges (same as EmployeeForm)
  const ranges = useMemo(() => [
    { id: 'A', name: 'A' },
    { id: 'B', name: 'B' }
  ], []);

  const [filteredAgencies, setFilteredAgencies] = useState([]);

  // Load initial data when editing
  useEffect(() => {
    if (initialData && isEditing) {
      setFormData({
        name: initialData.name || "",
        therapeutic_category: initialData.therapeutic_category || "",
        generic_name: initialData.generic_name || "",
        route_of_administration: initialData.route_of_administration || "",
        pack_size: initialData.pack_size || "",
        strength: initialData.strength || "",
        range: initialData.range || "",
        agency: initialData.agency || ""
      });
    } else if (!isEditing) {
      // Reset form when not editing
      setFormData({
        name: "",
        therapeutic_category: "",
        generic_name: "",
        route_of_administration: "",
        pack_size: "",
        strength: "",
        range: "",
        agency: ""
      });
    }
  }, [initialData, isEditing]);

  // when range changes, filter agencies based on the selected range
  useEffect(() => {
    if (!formData.range) {
      setFilteredAgencies([]);
      return;
    }
    // Filter agencies based on the selected range
    const filtered = agencies.filter(agency => {
      // Check if agency name starts with the selected range (A or B)
      return agency.name && agency.name.startsWith(formData.range);
    });
    setFilteredAgencies(filtered);
  }, [formData.range, agencies]);

  const canSubmit = useMemo(() => {
    return formData.name && formData.therapeutic_category && formData.generic_name;
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // clear dependent agency when range changes
    if (name === "range") {
      setFormData((s) => ({ ...s, range: value, agency: "" }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    // Normalize to BE payload - only send fields that have values
    const payload = {};
    if (formData.name.trim()) payload.name = formData.name.trim();
    if (formData.therapeutic_category.trim()) payload.therapeutic_category = formData.therapeutic_category.trim();
    if (formData.generic_name.trim()) payload.generic_name = formData.generic_name.trim();
    if (formData.route_of_administration.trim()) payload.route_of_administration = formData.route_of_administration.trim();
    if (formData.pack_size.trim()) payload.pack_size = formData.pack_size.trim();
    if (formData.strength.trim()) payload.strength = formData.strength.trim();
    if (formData.range.trim()) payload.range = formData.range.trim();
    if (formData.agency.trim()) payload.agency = formData.agency.trim();

    onSubmit && onSubmit(payload, formData);

    // Only reset if not editing
    if (!isEditing) {
      setFormData({
        name: "",
        therapeutic_category: "",
        generic_name: "",
        route_of_administration: "",
        pack_size: "",
        strength: "",
        range: "",
        agency: ""
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl bg-white shadow-lg rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold mb-4">
        {isEditing ? "Edit Product" : "Add New Product"}
      </h3>

      {/* Product Name */}
      <div>
        <label className="block text-gray-700 mb-1">Product Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter product name"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Therapeutic Category */}
      <div>
        <label className="block text-gray-700 mb-1">Therapeutic Category *</label>
        <input
          type="text"
          name="therapeutic_category"
          value={formData.therapeutic_category}
          onChange={handleChange}
          placeholder="Enter therapeutic category"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Generic Name */}
      <div>
        <label className="block text-gray-700 mb-1">Generic Name *</label>
        <input
          type="text"
          name="generic_name"
          value={formData.generic_name}
          onChange={handleChange}
          placeholder="Enter generic name"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Route of Administration */}
      <div>
        <label className="block text-gray-700 mb-1">Route of Administration</label>
        <input
          type="text"
          name="route_of_administration"
          value={formData.route_of_administration}
          onChange={handleChange}
          placeholder="e.g., Oral, Injection, Topical"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Pack Size */}
      <div>
        <label className="block text-gray-700 mb-1">Pack Size</label>
        <input
          type="text"
          name="pack_size"
          value={formData.pack_size}
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

      {/* Range (Sector) */}
      <div>
        <label className="block text-gray-700 mb-1">Range (Sector)</label>
        <select
          name="range"
          value={formData.range}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select range</option>
          {ranges.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {/* Agency (Sub-sector) */}
      <div>
        <label className="block text-gray-700 mb-1">Agency (Sub-sector)</label>
        <select
          name="agency"
          value={formData.agency}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!formData.range || loadingAgencies}
        >
          <option value="">
            {!formData.range
              ? "Select range first"
              : loadingAgencies
              ? "Loading agencies..."
              : agencyError
              ? "Error loading agencies"
              : "Select agency"}
          </option>
          {filteredAgencies.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        {agencyError && (
          <p className="text-sm text-red-600 mt-1">{agencyError}</p>
        )}
        {filteredAgencies.length === 0 && !loadingAgencies && !agencyError && formData.range && (
          <p className="text-sm text-gray-500 mt-1">No agencies found for this range</p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isEditing ? "Update Product" : "Add Product"}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
