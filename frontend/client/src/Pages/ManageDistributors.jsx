import { useEffect, useState, useMemo } from "react";
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
    range: '',
    agency: ''
  });
  
  // Add agencies state
  const [agencies, setAgencies] = useState([]);
  const [loadingAgencies, setLoadingAgencies] = useState(true);
  const [agencyError, setAgencyError] = useState("");

  // Load sectors from API and map to agencies
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

  // Update form data when distributor changes
  useEffect(() => {
    if (distributor) {
      setFormData({
        name: distributor?.name || '',
        distributorCode: distributor?.distributor_code || '',
        area: typeof distributor?.area === 'object' ? distributor?.area?.name || '' : distributor?.area || '',
        town: distributor?.coverage_town || distributor?.town || '',
        route: distributor?.route || '',
        range: distributor?.sector?.range || '',
        agency: typeof distributor?.agency === 'object' ? distributor?.agency?.name || '' : distributor?.agency || ''
      });
    }
  }, [distributor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // clear dependent agency when range changes
    if (name === "range") {
      setFormData((s) => ({ ...s, range: value, agency: "" }));
      return;
    }
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
            <select
              name="route"
              value={formData.route}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
            >
              <option value="">Select route</option>
              <option value="Route A">Route A</option>
              <option value="Route B">Route B</option>
              <option value="Route C">Route C</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Range</label>
            <select
              name="range"
              value={formData.range}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
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

  // Load existing distributors
  const loadDistributors = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/admin/distributors", { params: { limit: 100 } });
      const payload = res?.data?.data ?? res?.data ?? {};
      const items = Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload)
        ? payload
        : [];

      const safeItems = items.map(item => ({
        ...item,
        range: item.sector?.range || 'Unknown',
        agency: item.sector?.agency || 'Unknown',
        area: typeof item.area === 'object' ? item.area?.name || 'Unknown' : item.area || 'Unknown',
        coverage_town: item.coverage_town || item.town || 'Unknown',
      }));
      setDistributors(safeItems);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load distributors");
    } finally {
      setLoading(false);
    }
  };

  // Load on mount
  useEffect(() => { loadDistributors(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddDistributor = async (payload) => {
    try {
      await api.post("/admin/distributors", payload);
      await loadDistributors(); // reload full list from server
      showNotification('Distributor added successfully!', 'success');
    } catch (e) {
      console.error('Error adding distributor:', e);
      showNotification(e?.response?.data?.message || "Failed to add distributor", 'error');
    }
  };

  const handleEditDistributor = (distributor) => {
    setEditingDistributor(distributor);
  };

  const handleSaveEdit = async (formData) => {
    try {
      const updateData = {};
      if (formData.name) updateData.name = formData.name.trim();
      if (formData.town) updateData.coverage_town = formData.town.trim();
      if (formData.route) updateData.route = formData.route.trim();
      if (formData.range) updateData.range = formData.range;
      if (formData.agency) updateData.agency = formData.agency;
      if (formData.area) updateData.area = formData.area;

      const distributorCode = editingDistributor.distributor_code || editingDistributor.distributorCode;
      await api.put(`/admin/distributors/${distributorCode}`, updateData);

      // Reload full list from server so all values are accurate
      await loadDistributors();
      showNotification('Distributor updated successfully!', 'success');
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
      setDistributors(list => list.filter(d => (d.distributor_code || d.distributorCode) !== distributorCode));
      showNotification(`Distributor "${distributor.name}" deleted successfully!`, 'success');
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
                <th className="py-2 px-4 text-center">Range</th>
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
                  <td colSpan="9" className="text-center py-4 text-gray-500">
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
                        {String(dist.range || 'Unknown')}
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
                      <td className="py-2 px-4">
                        {dist.dateAdded ? new Date(dist.dateAdded).toISOString().slice(0, 10) : '-'}
                      </td>
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
      {NotificationComponent}
      
      {/* Confirmation Dialog Component */}
      {ConfirmDialogComponent}
    </div>
  );
}
