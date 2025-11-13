import { useEffect, useState } from "react";
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
    pack_size: product?.pack_size || '',
    strength: product?.strength || ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pack Size</label>
            <input
              type="text"
              name="pack_size"
              value={formData.pack_size}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Strength</label>
            <input
              type="text"
              name="strength"
              value={formData.strength}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
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
        if (mounted) setProducts(items);
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
        pack_size: created.pack_size,
        strength: created.strength
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

  const handleSaveEdit = async (formData) => {
    try {
      const updateData = {};
      if (formData.name.trim()) updateData.name = formData.name.trim();
      if (formData.therapeutic_category.trim()) updateData.therapeutic_category = formData.therapeutic_category.trim();
      if (formData.generic_name.trim()) updateData.generic_name = formData.generic_name.trim();
      if (formData.route_of_administration.trim()) updateData.route_of_administration = formData.route_of_administration.trim();
      if (formData.pack_size.trim()) updateData.pack_size = formData.pack_size.trim();
      if (formData.strength.trim()) updateData.strength = formData.strength.trim();

      await api.put(`/admin/products/${editingProduct.id}`, updateData);

      setProducts((list) =>
        list.map((prod) =>
          prod.id === editingProduct.id
            ? {
                ...prod,
                name: formData.name,
                therapeutic_category: formData.therapeutic_category,
                generic_name: formData.generic_name,
                route_of_administration: formData.route_of_administration,
                pack_size: formData.pack_size,
                strength: formData.strength
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
                  <th className="py-2 px-4 text-center">Pack Size</th>
                  <th className="py-2 px-4 text-center">Strength</th>
                  <th className="py-2 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-gray-500">No products added yet</td>
                  </tr>
                ) : (
                  products.map((prod) => (
                    <tr key={prod.id} className="border-b hover:bg-gray-50 text-center">
                      <td className="py-2 px-4">{prod.name}</td>
                      <td className="py-2 px-4">{prod.therapeutic_category || "-"}</td>
                      <td className="py-2 px-4">{prod.generic_name || "-"}</td>
                      <td className="py-2 px-4">{prod.route_of_administration || "-"}</td>
                      <td className="py-2 px-4">{prod.pack_size || "-"}</td>
                      <td className="py-2 px-4">{prod.strength || "-"}</td>
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
                  ))
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
