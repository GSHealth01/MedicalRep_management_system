import { useEffect, useState } from "react";
import DistributorForm from "../components/DistributorForm";
import { api } from "../services/api";
import { useNotification } from "../components/NotificationPopup";
import { useConfirm } from "../components/ConfirmDialog";

// Edit Distributor Modal Component
function EditDistributorModal({ distributor, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    distributorCode: '',
    area: '',
    town: '',
    route: '',
    agency: ''
  });
  const [loading, setLoading] = useState(false);

  // Update form data when distributor changes
  useEffect(() => {
    if (distributor) {
      setFormData({
        name: distributor?.name || '',
        distributorCode: distributor?.distributor_code || '',
        area: typeof distributor?.area === 'object' ? distributor?.area?.name || '' : distributor?.area || '',
        town: distributor?.coverage_town || distributor?.town || '',
        route: distributor?.route || '',
        agency: typeof distributor?.agency === 'object' ? distributor?.agency?.name || '' : distributor?.agency || ''
      });
    }
  }, [distributor]);

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
        <h2 className="text-xl font-bold mb-4">Edit Distributor</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Distributor Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Distributor Code *</label>
            <input
              type="text"
              name="distributorCode"
              value={formData.distributorCode}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
              required
              disabled
              title="Distributor code cannot be edited"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Area *</label>
            <input
              type="text"
              name="area"
              value={formData.area}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
              required
              placeholder="Enter area name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Town</label>
            <input
              type="text"
              name="town"
              value={formData.town}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
              placeholder="Enter town name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
            <input
              type="text"
              name="route"
              value={formData.route}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
              placeholder="Enter route"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agency</label>
            <select
              name="agency"
              value={formData.agency}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
            >
              <option value="">Select Agency</option>
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="A3">A3</option>
              <option value="A4">A4</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="B3">B3</option>
              <option value="B4">B4</option>
              <option value="B5">B5</option>
              <option value="B6">B6</option>
              <option value="B7">B7</option>
            </select>
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
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-md hover:from-red-700 hover:to-red-800 disabled:opacity-50 transition-all duration-200 shadow-md"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ManageDistributors() {
  const { showNotification, NotificationComponent } = useNotification();
  const { showConfirm, ConfirmDialogComponent } = useConfirm();
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [editingDistributor, setEditingDistributor] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Load existing distributors (optionally you can filter by sector via ?sector=)
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get("/admin/distributors", {
          params: { limit: 100 },
        });
        const payload = res?.data?.data ?? res?.data ?? {};
        const items = Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload)
          ? payload
          : [];
        console.log('Distributors response:', res.data); // Debug log
        console.log('Items:', items); // Debug log

        // Ensure all nested objects are properly handled
        const safeItems = items.map(item => ({
          ...item,
          agency: typeof item.agency === 'object' ? item.agency?.name || 'Unknown' : item.agency || 'Unknown',
          area: typeof item.area === 'object' ? item.area?.name || 'Unknown' : item.area || 'Unknown',
          coverage_town: item.coverage_town || item.town || 'Unknown',
        }));

        if (mounted) setDistributors(safeItems);
      } catch (e) {
        if (mounted)
          setErr(e?.response?.data?.message || "Failed to load distributors");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleAddDistributor = async (payload, rawForm) => {
    try {
      console.log('Sending payload:', payload); // Debug log
      const res = await api.post("/admin/distributors", payload);
      console.log('Response:', res.data); // Debug log

      // The controller returns the distributor object with agency and area included
      const created = res?.data?.data || res?.data || {};
      const newRow = {
        id: created.id,
        distributor_code: created.distributor_code,
        name: created.name,
        area: created.area?.name || payload.area, // Use area name from response
        town: created.coverage_town,
        route: created.route,
        agency: created.agency?.name || 'Unknown', // Use agency name from response
        sector: created.agency?.name || 'Unknown', // For backward compatibility
      };
      setDistributors((list) => [newRow, ...list]);
      showNotification(`Distributor ${payload.name} added successfully!`, 'success');
    } catch (e) {
      console.error('Error adding distributor:', e); // Debug log
      showNotification(e?.response?.data?.message || "Failed to add distributor", 'error');
    }
  };

  const handleEditDistributor = (distributor) => {
    setEditingDistributor(distributor);
  };

  const handleSaveEdit = async (formData) => {
    try {
      const updateData = {};
      if (formData.name.trim()) updateData.name = formData.name.trim();
      if (formData.town.trim()) updateData.coverage_town = formData.town.trim();
      if (formData.route.trim()) updateData.route = formData.route.trim();
      
      // For agency and area, we need to find the IDs or handle them properly
      // Since these are complex relationships, let's update them as strings for now
      if (formData.agency) updateData.agency = formData.agency;
      if (formData.area) updateData.area = formData.area;

      const distributorCode = editingDistributor.distributor_code || editingDistributor.distributorCode;
      console.log('Updating distributor with code:', distributorCode);
      console.log('Update data:', updateData);

      await api.put(`/admin/distributors/${distributorCode}`, updateData);

      setDistributors((list) =>
        list.map((dist) =>
          (dist.distributor_code === distributorCode || dist.distributorCode === distributorCode)
            ? {
                ...dist,
                name: formData.name,
                area: formData.area,
                coverage_town: formData.town,
                town: formData.town,
                route: formData.route,
                agency: formData.agency
              }
            : dist
        )
      );

      showNotification(`Distributor ${formData.name} updated successfully!`, 'success');
    } catch (e) {
      console.error('Error updating distributor:', e);
      throw new Error(e?.response?.data?.message || "Failed to update distributor");
    }
  };

  const handleDeleteDistributor = async (distributor) => {
    const confirmed = await showConfirm({
      title: "Delete Distributor",
      message: `Are you sure you want to delete distributor "${distributor.name}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger"
    });

    if (!confirmed) return;

    try {
      const distributorCode = distributor.distributor_code || distributor.distributorCode;
      await api.delete(`/admin/distributors/${distributorCode}`);
      setDistributors((list) => list.filter((dist) => {
        const distCode = dist.distributor_code || dist.distributorCode;
        const deleteCode = distributor.distributor_code || distributor.distributorCode;
        return distCode !== deleteCode;
      }));
      showNotification(`Distributor ${distributor.name} deleted successfully!`, 'success');
    } catch (e) {
      showNotification(e?.response?.data?.message || "Failed to delete distributor", 'error');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Distributors</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-md hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-lg"
        >
          {showForm ? 'Hide Form' : 'Add Distributor'}
        </button>
      </div>

      {/* Edit Distributor Modal */}
      {editingDistributor && (
        <EditDistributorModal
          distributor={editingDistributor}
          onClose={() => setEditingDistributor(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Add Distributor Form - Display after list */}
      {showForm && <DistributorForm onSubmit={handleAddDistributor} />}

      {/* Distributor List - Display only when form is hidden */}
      {!showForm && (
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Distributor List</h2>

        {err && <div className="text-red-600 mb-3">{err}</div>}
        {loading ? (
          <div className="text-gray-600">Loading…</div>
        ) : (
          <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-gradient-to-r from-red-600 to-red-700 text-white">
              <tr>
                <th className="py-2 px-4 text-center">Distributor Code</th>
                <th className="py-2 px-4 text-center">Distributor Name</th>
                <th className="py-2 px-4 text-center">Agency</th>
                <th className="py-2 px-4 text-center">Area</th>
                <th className="py-2 px-4 text-center">Town</th>
                <th className="py-2 px-4 text-center">Route</th>
                <th className="py-2 px-4 text-center">Date Added</th>
                <th className="py-2 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {distributors.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-gray-500">
                    No distributors added yet
                  </td>
                </tr>
              ) : (
                distributors.map((dist) => {
                  console.log('Rendering distributor:', dist); // Debug log
                  return (
                    <tr
                      key={dist.distributor_code || dist.distributorCode || Math.random()}
                      className="border-b hover:bg-gray-50 text-center"
                    >
                      <td className="py-2 px-4 font-medium">
                        {String(dist.distributor_code || dist.distributorCode || 'Unknown')}
                      </td>
                      <td className="py-2 px-4">
                        {String(dist.name || dist.distributorName || 'Unknown')}
                      </td>
                      <td className="py-2 px-4">
                        {String(dist.agency || 'Unknown')}
                      </td>
                      <td className="py-2 px-4">
                        {String(dist.area || 'Unknown')}
                      </td>
                      <td className="py-2 px-4">
                        {String(dist.coverage_town || 'Unknown')}
                      </td>
                      <td className="py-2 px-4">
                        {String(dist.route || '-')}
                      </td>
                      <td className="py-2 px-4">-</td>
                      <td className="py-2 px-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleEditDistributor(dist)}
                            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-md hover:bg-gradient-to-r from-red-600 to-red-700 text-sm transition-colors shadow-md"
                            title="Edit Distributor"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteDistributor(dist)}
                            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-md hover:bg-gradient-to-r from-red-600 to-red-700 text-sm transition-colors"
                            title="Delete Distributor"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
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
