import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';

const ProductForm = ({ product, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    therapeutic_category: product?.therapeutic_category || '',
    generic_name: product?.generic_name || '',
    route_of_administration: product?.route_of_administration || '',
    range: product?.range || '',
    agency: product?.agency || ''
  });

  const [variants, setVariants] = useState(product?.variants || [{ strength: '', pack_size: '', sampling_price: '', stocking_price: '', detailed_price: '' }]);

  // Add agencies state
  const [agencies, setAgencies] = useState([]);
  const [loadingAgencies, setLoadingAgencies] = useState(true);
  const [agencyError, setAgencyError] = useState("");

  // Load sectors as agencies from API
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingAgencies(true);
      setAgencyError("");
      try {
        const res = await api.get("/admin/sectors");
        const payload = res?.data?.data?.items || [];
        // Map sectors to agency format
        const agencyList = payload.map(sector => ({
          id: sector.id,
          name: sector.agency
        }));
        if (mounted) setAgencies(agencyList);
      } catch (err) {
        if (mounted) setAgencyError(err?.response?.data?.message || "Failed to load sectors");
      } finally {
        if (mounted) setLoadingAgencies(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Hardcoded ranges
  const ranges = useMemo(() => [
    { id: 'A', name: 'A' },
    { id: 'B', name: 'B' }
  ], []);

  const [filteredAgencies, setFilteredAgencies] = useState([]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    // clear dependent agency when range changes
    if (name === "range") {
      setFormData((s) => ({ ...s, range: value, agency: "" }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addVariant = () => {
    setVariants([...variants, { strength: '', pack_size: '', sampling_price: '', stocking_price: '', detailed_price: '' }]);
  };

  const removeVariant = (index) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const updateVariant = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updateData = {};
    if (formData.name.trim()) updateData.name = formData.name.trim();
    if (formData.therapeutic_category.trim()) updateData.therapeutic_category = formData.therapeutic_category.trim();
    if (formData.generic_name.trim()) updateData.generic_name = formData.generic_name.trim();
    if (formData.route_of_administration.trim()) updateData.route_of_administration = formData.route_of_administration.trim();
    if (formData.range.trim()) updateData.range = formData.range.trim();
    if (formData.agency.trim()) updateData.agency = formData.agency.trim();

    // Add variants
    updateData.variants = variants.filter(v => v.strength || v.pack_size).map(variant => ({
      strength: variant.strength.trim(),
      pack_size: variant.pack_size.trim(),
      sampling_price: variant.sampling_price ? parseFloat(variant.sampling_price) : null,
      stocking_price: variant.stocking_price ? parseFloat(variant.stocking_price) : null,
      detailed_price: variant.detailed_price ? parseFloat(variant.detailed_price) : null,
    }));

    onSubmit(updateData, formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter product name"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Therapeutic Category *</label>
        <input
          type="text"
          name="therapeutic_category"
          value={formData.therapeutic_category}
          onChange={handleChange}
          placeholder="e.g., Cardiovascular, Antibiotics"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Generic Name *</label>
        <input
          type="text"
          name="generic_name"
          value={formData.generic_name}
          onChange={handleChange}
          placeholder="e.g., Paracetamol, Amoxicillin"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Route of Administration</label>
        <input
          type="text"
          name="route_of_administration"
          value={formData.route_of_administration}
          onChange={handleChange}
          placeholder="e.g., Oral, Intravenous, Topical"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Range (Sector) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Range (Sector)</label>
        <select
          name="range"
          value={formData.range}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <label className="block text-sm font-medium text-gray-700 mb-2">Agency (Sub-sector)</label>
        <select
          name="agency"
          value={formData.agency}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <option key={a.id} value={a.name}>
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Variants</label>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 border border-gray-300 text-left text-xs font-medium text-gray-500 uppercase">Strength</th>
                <th className="px-4 py-2 border border-gray-300 text-left text-xs font-medium text-gray-500 uppercase">Pack Size</th>
                <th className="px-4 py-2 border border-gray-300 text-left text-xs font-medium text-gray-500 uppercase">Sampling Price (Rs.)</th>
                <th className="px-4 py-2 border border-gray-300 text-left text-xs font-medium text-gray-500 uppercase">Stocking Price (Rs.)</th>
                <th className="px-4 py-2 border border-gray-300 text-left text-xs font-medium text-gray-500 uppercase">Detailed Price (Rs.)</th>
                <th className="px-4 py-2 border border-gray-300 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant, index) => (
                <tr key={index} className="bg-white">
                  <td className="px-4 py-2 border border-gray-300">
                    <input
                      type="text"
                      value={variant.strength}
                      onChange={(e) => updateVariant(index, 'strength', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      placeholder="e.g. 10mg"
                    />
                  </td>
                  <td className="px-4 py-2 border border-gray-300">
                    <input
                      type="text"
                      value={variant.pack_size}
                      onChange={(e) => updateVariant(index, 'pack_size', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      placeholder="e.g. Tab 10"
                    />
                  </td>
                  <td className="px-4 py-2 border border-gray-300">
                    <input
                      type="number"
                      step="0.01"
                      value={variant.sampling_price}
                      onChange={(e) => updateVariant(index, 'sampling_price', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="px-4 py-2 border border-gray-300">
                    <input
                      type="number"
                      step="0.01"
                      value={variant.stocking_price}
                      onChange={(e) => updateVariant(index, 'stocking_price', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="px-4 py-2 border border-gray-300">
                    <input
                      type="number"
                      step="0.01"
                      value={variant.detailed_price}
                      onChange={(e) => updateVariant(index, 'detailed_price', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="px-4 py-2 border border-gray-300 text-center">
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      disabled={variants.length === 1}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={addVariant}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Variant
        </button>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
