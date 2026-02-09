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

  const [variants, setVariants] = useState(product?.variants || [{ strength: '', pack_size: '', stocking_price: '' }]);

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
    setVariants([...variants, { strength: '', pack_size: '', stocking_price: '' }]);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        variants: variants.filter(v => v.strength || v.pack_size).map(variant => ({
          strength: variant.strength.trim(),
          pack_size: variant.pack_size.trim(),
          stocking_price: variant.stocking_price ? parseFloat(variant.stocking_price) : null,
        }))
      };

      await onSubmit(payload, formData);
    } catch (error) {
      // Error handling is done in the parent
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4">Add New Product</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Therapeutic Category</label>
            <input
              type="text"
              name="therapeutic_category"
              value={formData.therapeutic_category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Generic Name</label>
            <input
              type="text"
              name="generic_name"
              value={formData.generic_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Route of Administration</label>
            <input
              type="text"
              name="route_of_administration"
              value={formData.route_of_administration}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Range</label>
            <select
              name="range"
              value={formData.range}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Range</option>
              {ranges.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agency</label>
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
        </div>

        {/* Variants Section */}
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Product Variants</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 border border-gray-300 text-left text-xs font-medium text-gray-500 uppercase">Strength</th>
                  <th className="px-4 py-2 border border-gray-300 text-left text-xs font-medium text-gray-500 uppercase">Pack Size</th>
                  <th className="px-4 py-2 border border-gray-300 text-left text-xs font-medium text-gray-500 uppercase">Wholesale Price (Rs.)</th>
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
                        value={variant.stocking_price}
                        onChange={(e) => updateVariant(index, 'stocking_price', e.target.value)}
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
            className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            + Add Another Variant
          </button>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Product
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
