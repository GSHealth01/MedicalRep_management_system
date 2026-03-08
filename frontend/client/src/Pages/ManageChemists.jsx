import { useEffect, useState } from "react";
import ChemistForm from "../components/ChemistForm";
import { api } from "../services/api";
import { useNotification } from "../components/NotificationPopup";
import { useConfirm } from "../components/ConfirmDialog";

// Edit Chemist Modal Component
function EditChemistModal({ chemist, onClose, onSave }) {
  const [formData, setFormData] = useState({
    chemist_code: chemist?.chemist_code || "",
    name: chemist?.name || "",
    distributor_code: chemist?.distributor_code || "",
    town: chemist?.town || "",
    address_owner_name: chemist?.address_owner_name || "",
    address_owner_birthday: chemist?.address_owner_birthday
      ? new Date(chemist.address_owner_birthday).toISOString().slice(0, 10)
      : "",
    purchasing_officer_name: chemist?.purchasing_officer_name || "",
    purchasing_officer_birthday: chemist?.purchasing_officer_birthday
      ? new Date(chemist.purchasing_officer_birthday).toISOString().slice(0, 10)
      : "",
    contact_number: chemist?.contact_number || "",
  });

  const [distributors, setDistributors] = useState([]);
  const [loadingDistributors, setLoadingDistributors] = useState(true);
  const [errorDistributors, setErrorDistributors] = useState("");

  // Load distributors
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingDistributors(true);
      setErrorDistributors("");
      try {
        const res = await api.get("/admin/distributors", { params: { limit: 200 } });
        const payload = res?.data?.data ?? res?.data ?? {};
        const items = Array.isArray(payload?.items) ? payload.items : (Array.isArray(payload) ? payload : []);
        if (mounted) {
          setDistributors(items);
        }
      } catch (err) {
        if (mounted) setErrorDistributors("Failed to load distributors");
      } finally {
        if (mounted) setLoadingDistributors(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Edit Chemist</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Chemist Code (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chemist Code</label>
            <input
              type="text"
              value={formData.chemist_code}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>

          {/* Distributor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Distributor</label>
            <select
              name="distributor_code"
              value={formData.distributor_code}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              disabled={loadingDistributors}
            >
              <option value="">
                {loadingDistributors ? "Loading..." : "Select Distributor"}
              </option>
              {distributors.map((dist) => (
                <option key={dist.distributor_code} value={dist.distributor_code}>
                  {dist.name || dist.distributor_code}
                </option>
              ))}
            </select>
            {errorDistributors && (
              <p className="text-sm text-red-600 mt-1">{errorDistributors}</p>
            )}
          </div>

          {/* Town */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Town</label>
            <input
              type="text"
              name="town"
              value={formData.town}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Contact Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
            <input
              type="tel"
              name="contact_number"
              value={formData.contact_number}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Address Owner Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address Owner Name</label>
            <input
              type="text"
              name="address_owner_name"
              value={formData.address_owner_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Address Owner Birthday */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address Owner Birthday</label>
            <input
              type="date"
              name="address_owner_birthday"
              value={formData.address_owner_birthday}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Purchasing Officer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchasing Officer Name</label>
            <input
              type="text"
              name="purchasing_officer_name"
              value={formData.purchasing_officer_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Purchasing Officer Birthday */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchasing Officer Birthday</label>
            <input
              type="date"
              name="purchasing_officer_birthday"
              value={formData.purchasing_officer_birthday}
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
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ManageChemists() {
  const { showNotification, NotificationComponent } = useNotification();
  const { showConfirm, ConfirmDialogComponent } = useConfirm();
  const [chemists, setChemists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [editingChemist, setEditingChemist] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Load chemists
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get("/admin/chemists", { params: { limit: 200 } });
        const payload = res?.data?.data ?? res?.data ?? {};
        const items = Array.isArray(payload?.items) ? payload.items : (Array.isArray(payload) ? payload : []);
        if (mounted) setChemists(items);
      } catch (e) {
        if (mounted) setErr(e?.response?.data?.message || "Failed to load chemists");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleAddChemist = async (payload) => {
    try {
      console.log('[DEBUG] Adding chemist with payload:', payload);
      const res = await api.post("/admin/chemists", payload);
      console.log('[DEBUG] Add chemist response:', res.data);
      const created = res?.data?.data || {};
      const newRow = {
        id: created.id,
        ...payload,
        distributor: created.distributor,
        date_added: new Date()
      };
      setChemists((list) => [newRow, ...list]);
      console.log('[DEBUG] Showing success notification for add');
      showNotification(`Chemist ${payload.name} added successfully!`, 'success');
    } catch (e) {
      console.error('[DEBUG] Add chemist error:', e);
      console.error('[DEBUG] Error response:', e.response?.data);
      showNotification(e?.response?.data?.message || "Failed to add chemist", 'error');
    }
  };

  const handleEditChemist = (chemist) => {
    setEditingChemist(chemist);
  };

  const handleSaveEdit = async (formData) => {
    try {
      console.log('[DEBUG] Editing chemist:', editingChemist?.id, formData);
      const updateData = { ...formData };
      delete updateData.chemist_code; // Can't change code

      const response = await api.put(`/admin/chemists/${editingChemist.id}`, updateData);
      console.log('[DEBUG] Edit chemist response:', response.data);

      setChemists((list) =>
        list.map((chem) =>
          chem.id === editingChemist.id
            ? { ...chem, ...formData }
            : chem
        )
      );

      console.log('[DEBUG] Showing success notification for edit');
      showNotification(`Chemist ${formData.name} updated successfully!`, 'success');
    } catch (e) {
      console.error('[DEBUG] Edit chemist error:', e);
      console.error('[DEBUG] Error response:', e.response?.data);
      throw new Error(e?.response?.data?.message || "Failed to update chemist");
    }
  };

  const handleDeleteChemist = async (chemist) => {
    const confirmed = await showConfirm({
      title: "Delete Chemist",
      message: `Are you sure you want to delete chemist "${chemist.name}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger"
    });

    if (!confirmed) return;

    try {
      await api.delete(`/admin/chemists/${chemist.id}`);
      setChemists((list) => list.filter((chem) => chem.id !== chemist.id));
      showNotification(`Chemist ${chemist.name} deleted successfully!`, 'success');
    } catch (e) {
      showNotification(e?.response?.data?.message || "Failed to delete chemist", 'error');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toISOString().slice(0, 10);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Chemists</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          {showForm ? 'Hide Form' : 'Add Chemist'}
        </button>
      </div>

      {/* Edit Modal */}
      {editingChemist && (
        <EditChemistModal
          chemist={editingChemist}
          onClose={() => setEditingChemist(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Add Form */}
      {showForm && <ChemistForm onSubmit={handleAddChemist} />}

      {/* Chemist List */}
      {!showForm && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Chemist List</h2>

          {err && <div className="text-red-600 mb-3">{err}</div>}
          {loading ? (
            <div className="text-gray-600">Loading…</div>
          ) : (
            <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="py-2 px-4 text-center">Code</th>
                  <th className="py-2 px-4 text-center">Name</th>
                  <th className="py-2 px-4 text-center">Town</th>
                  <th className="py-2 px-4 text-center">Distributor</th>
                  <th className="py-2 px-4 text-center">Contact</th>
                  <th className="py-2 px-4 text-center">Address Owner</th>
                  <th className="py-2 px-4 text-center">Owner Birthday</th>
                  <th className="py-2 px-4 text-center">Purchasing Officer</th>
                  <th className="py-2 px-4 text-center">PO Birthday</th>
                  <th className="py-2 px-4 text-center">Date Added</th>
                  <th className="py-2 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {chemists.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-4 text-gray-500">
                      No chemists added yet
                    </td>
                  </tr>
                ) : (
                  chemists.map((chem) => (
                    <tr key={chem.id} className="border-b hover:bg-gray-50 text-center">
                      <td className="py-2 px-4 font-medium">{chem.chemist_code}</td>
                      <td className="py-2 px-4">{chem.name}</td>
                      <td className="py-2 px-4">{chem.town || "-"}</td>
                      <td className="py-2 px-4">
                        {chem.distributor?.name || chem.distributor_code || "-"}
                      </td>
                      <td className="py-2 px-4">{chem.contact_number || "-"}</td>
                      <td className="py-2 px-4">{chem.address_owner_name || "-"}</td>
                      <td className="py-2 px-4">{formatDate(chem.address_owner_birthday)}</td>
                      <td className="py-2 px-4">{chem.purchasing_officer_name || "-"}</td>
                      <td className="py-2 px-4">{formatDate(chem.purchasing_officer_birthday)}</td>
                      <td className="py-2 px-4">{formatDate(chem.date_added)}</td>
                      <td className="py-2 px-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleEditChemist(chem)}
                            className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 text-sm"
                            title="Edit Chemist"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteChemist(chem)}
                            className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 text-sm"
                            title="Delete Chemist"
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
      {NotificationComponent}
      {ConfirmDialogComponent}
    </div>
  );
}
