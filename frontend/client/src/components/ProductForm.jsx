import { useState, useMemo, useEffect } from "react";
import { api } from "../services/api";

export default function ProductForm({ onSubmit, initialData, isEditing, onCancel }) {
   const [formData, setFormData] = useState({
     name: "",
     therapeutic_category: "",
     generic_name: "",
     route_of_administration: "",
     range: "",
     agency: ""
   });

   const [variants, setVariants] = useState([
     {
       id: null,
       strength: "",
       pack_size: "",
       sampling_price: "",
       stocking_price: "",
       detailed_price: ""
     }
   ]);

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
        range: initialData.range || "",
        agency: initialData.agency || ""
      });

      // Load variants
      if (initialData.variants && initialData.variants.length > 0) {
        setVariants(initialData.variants.map(variant => ({
          id: variant.id,
          strength: variant.strength || "",
          pack_size: variant.pack_size || "",
          sampling_price: variant.sampling_price || "",
          stocking_price: variant.stocking_price || "",
          detailed_price: variant.detailed_price || ""
        })));
      } else {
        setVariants([{
          id: null,
          strength: "",
          pack_size: "",
          sampling_price: "",
          stocking_price: "",
          detailed_price: ""
        }]);
      }
    } else if (!isEditing) {
      // Reset form when not editing
      setFormData({
        name: "",
        therapeutic_category: "",
        generic_name: "",
        route_of_administration: "",
        range: "",
        agency: ""
      });
      setVariants([{
        id: null,
        strength: "",
        pack_size: "",
        sampling_price: "",
        stocking_price: "",
        detailed_price: ""
      }]);
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
    return formData.name && formData.therapeutic_category && formData.generic_name &&
           variants.length > 0 && variants.some(v => v.strength || v.pack_size);
  }, [formData, variants]);

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
    if (formData.range.trim()) payload.range = formData.range.trim();
    if (formData.agency.trim()) payload.agency = formData.agency.trim();

    // Add variants
    payload.variants = variants.filter(v => v.strength || v.pack_size).map(variant => ({
      id: variant.id,
      strength: variant.strength.trim(),
      pack_size: variant.pack_size.trim(),
      sampling_price: variant.sampling_price ? parseFloat(variant.sampling_price) : null,
      stocking_price: variant.stocking_price ? parseFloat(variant.stocking_price) : null,
      detailed_price: variant.detailed_price ? parseFloat(variant.detailed_price) : null,
    }));

    onSubmit && onSubmit(payload, formData);

    // Only reset if not editing
    if (!isEditing) {
      setFormData({
        name: "",
        therapeutic_category: "",
        generic_name: "",
        route_of_administration: "",
        range: "",
        agency: ""
      });
      setVariants([{
        id: null,
        strength: "",
        pack_size: "",
        sampling_price: "",
        stocking_price: "",
        detailed_price: ""
      }]);
    }
  };

  const addVariant = () => {
    setVariants([...variants, {
      id: null,
      strength: "",
      pack_size: "",
      sampling_price: "",
      stocking_price: "",
      detailed_price: ""
    }]);
  };

  const removeVariant = (index) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const updateVariant = (index, field, value) => {
    const updatedVariants = [...variants];
    updatedVariants[index][field] = value;
    setVariants(updatedVariants);
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

      {/* Product Variants */}
      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Product Variants</h3>
          <button
            type="button"
            onClick={addVariant}
            className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm"
          >
            Add Variant
          </button>
        </div>

        {variants.map((variant, index) => (
          <div key={index} className="border rounded-lg p-4 mb-4 bg-gray-50">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Variant {index + 1}</h4>
              {variants.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="bg-red-600 text-white px-2 py-1 rounded-md hover:bg-red-700 text-sm"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strength */}
              <div>
                <label className="block text-gray-700 mb-1">Strength</label>
                <input
                  type="text"
                  value={variant.strength}
                  onChange={(e) => updateVariant(index, 'strength', e.target.value)}
                  placeholder="e.g., 10mg, 20mg"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Pack Size */}
              <div>
                <label className="block text-gray-700 mb-1">Pack Size</label>
                <input
                  type="text"
                  value={variant.pack_size}
                  onChange={(e) => updateVariant(index, 'pack_size', e.target.value)}
                  placeholder="e.g., 10 tablets"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Sampling Price */}
              <div>
                <label className="block text-gray-700 mb-1">Sampling Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={variant.sampling_price}
                  onChange={(e) => updateVariant(index, 'sampling_price', e.target.value)}
                  placeholder="0.00"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Stocking Price */}
              <div>
                <label className="block text-gray-700 mb-1">Stocking Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={variant.stocking_price}
                  onChange={(e) => updateVariant(index, 'stocking_price', e.target.value)}
                  placeholder="0.00"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Detailed Price */}
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-1">Detailed Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={variant.detailed_price}
                  onChange={(e) => updateVariant(index, 'detailed_price', e.target.value)}
                  placeholder="0.00"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        ))}
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
