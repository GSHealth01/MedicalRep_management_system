import { useEffect, useState } from "react";
import { getAllocatedPrices, createAllocatedPrice, updateAllocatedPrice, getDesignations, api } from "../services/api";
import { useNotification } from "../components/NotificationPopup";

// Designation mapping from abbreviations to full names
const designationMap = {
  'MR': 'Medical Rep',
  'FC': 'Field Coordinator',
  'JE': 'Junior Executive',
  'SE': 'Senior Executive',
  'TM': 'Territory Manager',
  'PM': 'Product Manager',
  'OM': 'Operations Manager',
  'ADMIN': 'Admin',
  // Full names as well
  'Medical Rep': 'Medical Rep',
  'Field Coordinator': 'Field Coordinator',
  'Junior Executive': 'Junior Executive',
  'Senior Executive': 'Senior Executive',
  'Territory Manager': 'Territory Manager',
  'Product Manager': 'Product Manager',
  'Operations Manager': 'Operations Manager',
  'Admin': 'Admin'
};

// Get full name from designation code
const getFullDesignationName = (code) => {
  return designationMap[code] || code || "";
};

// All possible designations (full names) - matching EmployeeForm.jsx
const ALL_DESIGNATIONS = [
  'Medical Rep',
  'Field Coordinator',
  'Junior Executive',
  'Senior Executive',
  'Territory Manager',
  'Product Manager',
  'Operations Manager',
  'Admin'
];

// Add/Edit Modal Component
function AllocatedPriceModal({ allocatedPrice, availableDesignations, onClose, onSave, isEdit }) {
  const [formData, setFormData] = useState({
    designation: allocatedPrice?.designation || "",
    dailyBata: allocatedPrice?.dailyBata || "",
    nightOut: allocatedPrice?.nightOut || ""
  });
  
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        designation: formData.designation,
        dailyBata: formData.dailyBata ? parseFloat(formData.dailyBata) : null,
        nightOut: formData.nightOut ? parseFloat(formData.nightOut) : null
      });
      onClose();
    } catch (error) {
      console.error("Error saving allocated price:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {isEdit ? "Edit Allocated Price" : "Add Allocated Price"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Designation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Designation *
            </label>
            {isEdit ? (
              <input
                type="text"
                value={getFullDesignationName(formData.designation)}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            ) : (
              <select
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Designation</option>
                {availableDesignations.map((desig) => (
                  <option key={desig} value={desig}>
                    {desig}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Daily Bata */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Daily Bata (LKR)
            </label>
            <input
              type="number"
              name="dailyBata"
              value={formData.dailyBata}
              onChange={handleChange}
              step="0.01"
              min="0"
              placeholder="Enter daily bata amount"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Night Out */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Night Out (LKR)
            </label>
            <input
              type="number"
              name="nightOut"
              value={formData.nightOut}
              onChange={handleChange}
              step="0.01"
              min="0"
              placeholder="Enter night out amount"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ManageAllocatedPrices() {
  const [allocatedPrices, setAllocatedPrices] = useState([]);
  const [employeeDesignations, setEmployeeDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingAllocatedPrice, setEditingAllocatedPrice] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, price: null });
  
  const { showNotification, NotificationComponent } = useNotification();

  // Fetch allocated prices and designations
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Fetch allocated prices
      const pricesResponse = await getAllocatedPrices();
      const pricesData = pricesResponse?.data || pricesResponse || [];
      setAllocatedPrices(Array.isArray(pricesData) ? pricesData : []);
      
      // Fetch designations from employees
      const designationsResponse = await getDesignations();
      const designationsData = designationsResponse?.data || designationsResponse || [];
      setEmployeeDesignations(Array.isArray(designationsData) ? designationsData : []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle create
  const handleCreate = async (data) => {
    try {
      // Convert full name back to code for storage if needed
      // We'll store the full name as-is since that's what's in employees
      await createAllocatedPrice(data);
      showNotification("Allocated price created successfully", "success");
      fetchData();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to create allocated price";
      showNotification(msg, "error");
      throw err;
    }
  };

  // Handle update
  const handleUpdate = async (data) => {
    try {
      await updateAllocatedPrice(editingAllocatedPrice.id, data);
      showNotification("Allocated price updated successfully", "success");
      fetchData();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to update allocated price";
      showNotification(msg, "error");
      throw err;
    }
  };

  // Handle delete - show custom modal
  const handleDelete = (allocatedPrice) => {
    setDeleteConfirm({ show: true, price: allocatedPrice });
  };

  // Confirm delete action
  const confirmDelete = async () => {
    const allocatedPrice = deleteConfirm.price;
    setDeleteConfirm({ show: false, price: null });
    
    if (!allocatedPrice) return;

    try {
      await api.delete(`/admin/allocated-prices/${allocatedPrice.id}`);
      setAllocatedPrices((list) => list.filter((item) => item.id !== allocatedPrice.id));
      showNotification("Allocated price deleted successfully!", "success");
    } catch (err) {
      showNotification(err?.response?.data?.message || "Failed to delete allocated price", "error");
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setDeleteConfirm({ show: false, price: null });
  };

  // Open modal for adding
  const handleAdd = () => {
    setEditingAllocatedPrice(null);
    setShowModal(true);
  };

  // Open modal for editing
  const handleEdit = (allocatedPrice) => {
    setEditingAllocatedPrice(allocatedPrice);
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAllocatedPrice(null);
  };

  // Handle save from modal
  const handleSave = async (data) => {
    if (editingAllocatedPrice) {
      await handleUpdate(data);
    } else {
      await handleCreate(data);
    }
  };

  // Get designations that don't have allocated prices yet
  // Use all possible designations + any from employees that aren't in our list
  const usedDesignations = allocatedPrices.map(p => p.designation);
  
  // Convert all designations to full names and combine with employee designations
  const allDisplayDesignations = [
    ...new Set([
      ...ALL_DESIGNATIONS,
      ...employeeDesignations.map(d => getFullDesignationName(d))
    ])
  ].sort();
  
  const usedDisplayDesignations = usedDesignations.map(d => getFullDesignationName(d));
  const availableDesignations = allDisplayDesignations.filter(d => !usedDisplayDesignations.includes(d));

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Allocated Prices</h1>
        <button
          onClick={handleAdd}
          disabled={availableDesignations.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Allocated Price
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : allocatedPrices.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No allocated prices found. 
          {employeeDesignations.length > 0 
            ? ` Click "Add Allocated Price" to create one for an employee designation.`
            : " Add employees first to configure their allocated prices."}
        </div>
      ) : (
        /* Table */
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Designation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Daily Bata (LKR)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Night Out (LKR)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allocatedPrices.map((price) => (
                <tr key={price.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {getFullDesignationName(price.designation)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {price.dailyBata ? `LKR ${parseFloat(price.dailyBata).toFixed(2)}` : "Nothing added"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {price.nightOut ? `LKR ${parseFloat(price.nightOut).toFixed(2)}` : "Nothing added"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(price)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(price)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <AllocatedPriceModal
          allocatedPrice={editingAllocatedPrice}
          availableDesignations={availableDesignations}
          onClose={handleCloseModal}
          onSave={handleSave}
          isEdit={!!editingAllocatedPrice}
        />
      )}

      {/* Notification and Confirm Dialogs */}
      {NotificationComponent}
      
      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-red-100 border-2 border-red-400">
                <span className="text-xl">⚠️</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-red-800">
                  Delete Allocated Price
                </h3>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 text-sm leading-relaxed">
                Are you sure you want to delete the allocated price for <strong>"{getFullDesignationName(deleteConfirm.price?.designation)}"</strong>? This action cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
