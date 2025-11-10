import { useEffect, useState } from "react";
import DistributorForm from "../components/DistributorForm";
import { api } from "../services/api";

// Edit Distributor Modal Component
function EditDistributorModal({ distributor, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: distributor?.name || '',
    area: distributor?.area || '',
    town: distributor?.coverage_town || distributor?.town || '',
    route: distributor?.route || '',
    agency: distributor?.agency || ''
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
        <h2 className="text-xl font-bold mb-4">Edit Distributor</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Distributor Name *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Area *</label>
            <select
              name="area"
              value={formData.area}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Area</option>
              <option value="Colombo">Colombo</option>
              <option value="Gampaha">Gampaha</option>
              <option value="Kalutara">Kalutara</option>
              <option value="Kandy">Kandy</option>
              <option value="Matale">Matale</option>
              <option value="Nuwara Eliya">Nuwara Eliya</option>
              <option value="Galle">Galle</option>
              <option value="Matara">Matara</option>
              <option value="Hambantota">Hambantota</option>
              <option value="Jaffna">Jaffna</option>
              <option value="Kilinochchi">Kilinochchi</option>
              <option value="Mannar">Mannar</option>
              <option value="Vavuniya">Vavuniya</option>
              <option value="Mullaitivu">Mullaitivu</option>
              <option value="Batticaloa">Batticaloa</option>
              <option value="Ampara">Ampara</option>
              <option value="Trincomalee">Trincomalee</option>
              <option value="Kurunegala">Kurunegala</option>
              <option value="Puttalam">Puttalam</option>
              <option value="Anuradhapura">Anuradhapura</option>
              <option value="Polonnaruwa">Polonnaruwa</option>
              <option value="Badulla">Badulla</option>
              <option value="Moneragala">Moneragala</option>
              <option value="Ratnapura">Ratnapura</option>
              <option value="Kegalle">Kegalle</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Town</label>
            <input
              type="text"
              name="town"
              value={formData.town}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter route"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agency</label>
            <select
              name="agency"
              value={formData.agency}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

export default function ManageDistributors() {
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
        name: created.name,
        area: created.area?.name || payload.area, // Use area name from response
        town: created.coverage_town,
        route: created.route,
        agency: created.agency?.name || 'Unknown', // Use agency name from response
        sector: created.agency?.name || 'Unknown', // For backward compatibility
      };
      setDistributors((list) => [newRow, ...list]);
      alert(`Distributor ${payload.name} added ✅`);
    } catch (e) {
      console.error('Error adding distributor:', e); // Debug log
      alert(e?.response?.data?.message || "Failed to add distributor");
    }
  };

  const handleEditDistributor = (distributor) => {
    setEditingDistributor(distributor);
  };

  const handleSaveEdit = async (formData) => {
    try {
      const updateData = {};
      if (formData.name.trim()) updateData.name = formData.name.trim();
      if (formData.area) updateData.area = formData.area;
      if (formData.town.trim()) updateData.coverage_town = formData.town.trim();
      if (formData.route.trim()) updateData.route = formData.route.trim();
      if (formData.agency) updateData.agency = formData.agency;

      await api.put(`/admin/distributors/${editingDistributor.id || editingDistributor._id}`, updateData);

      setDistributors((list) =>
        list.map((dist) =>
          dist.id === editingDistributor.id || dist._id === editingDistributor._id
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

      alert(`Distributor ${formData.name} updated successfully!`);
    } catch (e) {
      throw new Error(e?.response?.data?.message || "Failed to update distributor");
    }
  };

  const handleDeleteDistributor = async (distributor) => {
    if (!window.confirm(`Are you sure you want to delete distributor ${distributor.name}?`)) {
      return;
    }

    try {
      await api.delete(`/admin/distributors/${distributor.id || distributor._id}`);
      setDistributors((list) => list.filter((dist) => {
        const distId = dist.id || dist._id;
        const deleteId = distributor.id || distributor._id;
        return distId !== deleteId;
      }));
      alert(`Distributor ${distributor.name} deleted successfully!`);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to delete distributor");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Distributors</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Distributor List - Display first */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Distributor List</h2>

        {err && <div className="text-red-600 mb-3">{err}</div>}
        {loading ? (
          <div className="text-gray-600">Loading…</div>
        ) : (
          <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-blue-600 text-white">
              <tr>
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
                  <td colSpan="7" className="text-center py-4 text-gray-500">
                    No distributors added yet
                  </td>
                </tr>
              ) : (
                distributors.map((dist) => {
                  console.log('Rendering distributor:', dist); // Debug log
                  return (
                    <tr
                      key={dist.id || dist._id}
                      className="border-b hover:bg-gray-50 text-center"
                    >
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
                            className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 text-sm transition-colors"
                            title="Edit Distributor"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteDistributor(dist)}
                            className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 text-sm transition-colors"
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
    </div>
  );
}
