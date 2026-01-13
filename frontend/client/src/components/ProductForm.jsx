import React, { useState } from 'react';

const ProductForm = ({ product, onSave, onCancel }) => {
  const [productName, setProductName] = useState(product?.name || '');
  const [variants, setVariants] = useState(product?.variants || [{ strength: '', pack_size: '', sampling_price: '', stocking_price: '', detailed_price: '' }]);

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
    onSave({ name: productName, variants });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
        <input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Variants</label>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 border border-gray-300 text-left text-xs font-medium text-gray-500 uppercase">Strength</th>
                <th className="px-4 py-2 border border-gray-300 text-left text-xs font-medium text-gray-500 uppercase">Pack Size</th>
                <th className="px-4 py-2 border border-gray-300 text-left text-xs font-medium text-gray-500 uppercase">Sampling Price</th>
                <th className="px-4 py-2 border border-gray-300 text-left text-xs font-medium text-gray-500 uppercase">Stocking Price</th>
                <th className="px-4 py-2 border border-gray-300 text-left text-xs font-medium text-gray-500 uppercase">Detailed Price</th>
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
