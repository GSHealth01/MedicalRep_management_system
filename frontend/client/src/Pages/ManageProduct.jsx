import { useEffect, useState, useMemo } from "react";
import ProductForm from "../components/ProductForm";
import { api } from "../services/api";
import { useNotification } from "../components/NotificationPopup";
import { useConfirm } from "../components/ConfirmDialog";

// Edit Product Modal Component
function EditProductModal({ product, onClose, onSave }) {
   const [formData, setFormData] = useState({
     name: product?.name || '',
     therapeutic_category: product?.therapeutic_category || '',
     generic_name: product?.generic_name || '',
     route_of_administration: product?.route_of_administration || '',
     range: product?.range || '',
     agency: product?.agency || ''
   });

   const [variants, setVariants] = useState(
     product?.variants && product.variants.length > 0
       ? product.variants.map(variant => ({
           id: variant.id,
           strength: variant.strength || '',
           pack_size: variant.pack_size || '',
           sampling_price: variant.sampling_price || '',
           stocking_price: variant.stocking_price || '',
           detailed_price: variant.detailed_price || ''
         }))
       : [{
           id: null,
           strength: '',
           pack_size: '',
           sampling_price: '',
           stocking_price: '',
           detailed_price: ''
         }]
   );
  
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

  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updateData = {};
      if (formData.name.trim()) updateData.name = formData.name.trim();
      if (formData.therapeutic_category.trim()) updateData.therapeutic_category = formData.therapeutic_category.trim();
      if (formData.generic_name.trim()) updateData.generic_name = formData.generic_name.trim();
      if (formData.route_of_administration.trim()) updateData.route_of_administration = formData.route_of_administration.trim();
      if (formData.range.trim()) updateData.range = formData.range.trim();
      if (formData.agency.trim()) updateData.agency = formData.agency.trim();

      // Add variants
      updateData.variants = variants.filter(v => v.strength || v.pack_size).map(variant => ({
        id: variant.id,
        strength: variant.strength.trim(),
        pack_size: variant.pack_size.trim(),
        sampling_price: variant.sampling_price ? parseFloat(variant.sampling_price) : null,
        stocking_price: variant.stocking_price ? parseFloat(variant.stocking_price) : null,
        detailed_price: variant.detailed_price ? parseFloat(variant.detailed_price) : null,
      }));

      await onSave(updateData, formData);
      onClose();
    } catch (error) {
      // Error handled in parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Edit Product</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter product name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Therapeutic Category *</label>
            <input
              type="text"
              name="therapeutic_category"
              value={formData.therapeutic_category}
              onChange={handleChange}
              placeholder="e.g., Cardiovascular, Antibiotics"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Generic Name *</label>
            <input
              type="text"
              name="generic_name"
              value={formData.generic_name}
              onChange={handleChange}
              placeholder="e.g., Paracetamol, Amoxicillin"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Route of Administration</label>
            <input
              type="text"
              name="route_of_administration"
              value={formData.route_of_administration}
              onChange={handleChange}
              placeholder="e.g., Oral, Intravenous, Topical"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Range (Sector) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Range (Sector)</label>
            <select
              name="range"
              value={formData.range}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Agency (Sub-sector)</label>
            <select
              name="agency"
              value={formData.agency}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
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

          {/* Product Variants */}
          <div className="border-t pt-4 col-span-2">
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

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const showAgency = (a) => {
  // If agency is an object with name property, show the name
  if (typeof a === "object" && a?.name) {
    return a.name;
  }
  // If agency is an object with _id property, show the _id
  if (typeof a === "object" && a?._id) {
    return a._id;
  }
  // If agency is a string/number, show it as is
  if (typeof a === "string" || typeof a === "number") {
    return a;
  }
  // Default fallback
  return "";
};

export default function ManageProducts() {
  const { showNotification, NotificationComponent } = useNotification();
  const { showConfirm, ConfirmDialogComponent } = useConfirm();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Load existing products from BE
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get("/admin/products", { params: { limit: 200 } });
        const payload = res?.data?.data ?? res?.data ?? {};
        const items = Array.isArray(payload?.items) ? payload.items : (Array.isArray(payload) ? payload : []);

        // Normalize the data to ensure agency displays correctly
        const normalizedItems = items.map(item => ({
          ...item,
          agency: typeof item.agency === 'string' && !isNaN(item.agency)
            ? item.agency // Keep as string if it's already a name
            : item.agency // Otherwise keep as is
        }));

        if (mounted) setProducts(normalizedItems);
      } catch (e) {
        if (mounted) setErr(e?.response?.data?.message || "Failed to load products");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleAddProduct = async (payload, rawForm) => {
    try {
      const res = await api.post("/admin/products", payload);
      const created = res?.data?.data || {};
      const newRow = {
        id: created.id,
        name: created.name,
        therapeutic_category: created.therapeutic_category,
        generic_name: created.generic_name,
        route_of_administration: created.route_of_administration,
        range: created.range || rawForm.range,
        agency: created.agency || rawForm.agency,
        variants: created.variants || []
      };
      setProducts((list) => [newRow, ...list]);
      showNotification(`Product ${payload.name} added successfully!`, 'success');
    } catch (e) {
      showNotification(e?.response?.data?.message || "Failed to add product", 'error');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
  };

  const handleSaveEdit = async (updateData, formData) => {
    try {
      const response = await api.put(`/admin/products/${editingProduct.id}`, updateData);
      const updatedProduct = response?.data?.data;

      setProducts((list) =>
        list.map((prod) =>
          prod.id === editingProduct.id
            ? {
                ...prod,
                name: formData.name,
                therapeutic_category: formData.therapeutic_category,
                generic_name: formData.generic_name,
                route_of_administration: formData.route_of_administration,
                range: formData.range,
                agency: formData.agency,
                variants: updatedProduct?.variants || []
              }
            : prod
        )
      );

      showNotification(`Product ${formData.name} updated successfully!`, 'success');
    } catch (e) {
      throw new Error(e?.response?.data?.message || "Failed to update product");
    }
  };

  const handleDeleteProduct = async (product) => {
    const confirmed = await showConfirm({
      title: "Delete Product",
      message: `Are you sure you want to delete product "${product.name}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger"
    });

    if (!confirmed) return;

    try {
      await api.delete(`/admin/products/${product.id}`);
      setProducts((list) => list.filter((prod) => prod.id !== product.id));
      showNotification(`Product ${product.name} deleted successfully!`, 'success');
    } catch (e) {
      showNotification(e?.response?.data?.message || "Failed to delete product", 'error');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Products</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          {showForm ? 'Hide Form' : 'Add Product'}
        </button>
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Add Product Form - Display after list */}
      {showForm && <ProductForm onSubmit={handleAddProduct} />}

      {/* Product List - Display only when form is hidden */}
      {!showForm && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Product List</h2>

          {err && <div className="text-red-600 mb-3">{err}</div>}
          {loading ? (
            <div className="text-gray-600">Loading…</div>
          ) : (
            <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
              <thead className="bg-red-600 text-white">
                <tr>
                  <th className="py-2 px-4 text-center">Product Name</th>
                  <th className="py-2 px-4 text-center">Therapeutic Category</th>
                  <th className="py-2 px-4 text-center">Generic Name</th>
                  <th className="py-2 px-4 text-center">Route of Administration</th>
                  <th className="py-2 px-4 text-center">Strength</th>
                  <th className="py-2 px-4 text-center">Pack Size</th>
                  <th className="py-2 px-4 text-center">Sampling Price</th>
                  <th className="py-2 px-4 text-center">Stocking Price</th>
                  <th className="py-2 px-4 text-center">Detailed Price</th>
                  <th className="py-2 px-4 text-center">Range</th>
                  <th className="py-2 px-4 text-center">Agency</th>
                  <th className="py-2 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="text-center py-4 text-gray-500">No products added yet</td>
                  </tr>
                ) : (
                  products.flatMap((prod) => {
                    if (!prod.variants || prod.variants.length === 0) {
                      return [
                        <tr key={prod.id} className="border-b hover:bg-gray-50 text-center">
                          <td className="py-2 px-4">{prod.name}</td>
                          <td className="py-2 px-4">{prod.therapeutic_category || "-"}</td>
                          <td className="py-2 px-4">{prod.generic_name || "-"}</td>
                          <td className="py-2 px-4">{prod.route_of_administration || "-"}</td>
                          <td className="py-2 px-4 text-gray-500">No variants</td>
                          <td className="py-2 px-4 text-gray-500">-</td>
                          <td className="py-2 px-4 text-gray-500">-</td>
                          <td className="py-2 px-4 text-gray-500">-</td>
                          <td className="py-2 px-4 text-gray-500">-</td>
                          <td className="py-2 px-4">{prod.range || "-"}</td>
                          <td className="py-2 px-4">{showAgency(prod.agency) || "-"}</td>
                          <td className="py-2 px-4">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => handleEditProduct(prod)}
                                className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 text-sm transition-colors"
                                title="Edit Product"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(prod)}
                                className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 text-sm transition-colors"
                                title="Delete Product"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ];
                    }

                    return prod.variants.map((variant, index) => (
                      <tr key={`${prod.id}-${variant.id}`} className="border-b hover:bg-gray-50 text-center">
                        {index === 0 && (
                          <>
                            <td className="py-2 px-4" rowSpan={prod.variants.length}>{prod.name}</td>
                            <td className="py-2 px-4" rowSpan={prod.variants.length}>{prod.therapeutic_category || "-"}</td>
                            <td className="py-2 px-4" rowSpan={prod.variants.length}>{prod.generic_name || "-"}</td>
                            <td className="py-2 px-4" rowSpan={prod.variants.length}>{prod.route_of_administration || "-"}</td>
                          </>
                        )}
                        <td className="py-2 px-4">{variant.strength || "-"}</td>
                        <td className="py-2 px-4">{variant.pack_size || "-"}</td>
                        <td className="py-2 px-4">{variant.sampling_price ? `Rs ${variant.sampling_price}` : "-"}</td>
                        <td className="py-2 px-4">{variant.stocking_price ? `Rs ${variant.stocking_price}` : "-"}</td>
                        <td className="py-2 px-4">{variant.detailed_price ? `Rs ${variant.detailed_price}` : "-"}</td>
                        {index === 0 && (
                          <>
                            <td className="py-2 px-4" rowSpan={prod.variants.length}>{prod.range || "-"}</td>
                            <td className="py-2 px-4" rowSpan={prod.variants.length}>{showAgency(prod.agency) || "-"}</td>
                            <td className="py-2 px-4" rowSpan={prod.variants.length}>
                              <div className="flex justify-center space-x-2">
                                <button
                                  onClick={() => handleEditProduct(prod)}
                                  className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 text-sm transition-colors"
                                  title="Edit Product"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(prod)}
                                  className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 text-sm transition-colors"
                                  title="Delete Product"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ));
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
      
      {/* Notification Component */}
      <NotificationComponent />
      
      {/* Confirmation Dialog Component */}
      <ConfirmDialogComponent />
    </div>
  );
}
