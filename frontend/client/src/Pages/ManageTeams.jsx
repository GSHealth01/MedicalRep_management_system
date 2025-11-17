import { useEffect, useState } from "react";
import TeamForm from "../components/TeamForm";
import { api } from "../services/api";
import { useNotification } from "../components/NotificationPopup";

// Edit Team Modal Component
function EditTeamModal({ team, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: team?.name || '',
    range: team?.range_id || '',
    ops: team?.ops || [],
    sms: team?.sms || [],
    pms: team?.pms || [],
    tms: team?.tms || [],
    ses: team?.ses || [],
    jes: team?.jes || [],
    fcs: team?.fcs || [],
    mrs: team?.mrs || []
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (field, value) => {
    const array = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({ ...prev, [field]: array }));
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
        <h2 className="text-xl font-bold mb-4">Edit Team</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team Name *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Range</label>
            <select
              name="range"
              value={formData.range}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Range</option>
              <option value="1">Range 1</option>
              <option value="2">Range 2</option>
              <option value="3">Range 3</option>
              <option value="4">Range 4</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Operations (comma-separated)</label>
            <input
              type="text"
              name="ops"
              value={formData.ops.join(', ')}
              onChange={(e) => handleArrayChange('ops', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="OP1, OP2, OP3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senior Managers (comma-separated)</label>
            <input
              type="text"
              name="sms"
              value={formData.sms.join(', ')}
              onChange={(e) => handleArrayChange('sms', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="SM1, SM2, SM3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Managers (comma-separated)</label>
            <input
              type="text"
              name="pms"
              value={formData.pms.join(', ')}
              onChange={(e) => handleArrayChange('pms', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="PM1, PM2, PM3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Territory Managers (comma-separated)</label>
            <input
              type="text"
              name="tms"
              value={formData.tms.join(', ')}
              onChange={(e) => handleArrayChange('tms', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="TM1, TM2, TM3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senior Executives (comma-separated)</label>
            <input
              type="text"
              name="ses"
              value={formData.ses.join(', ')}
              onChange={(e) => handleArrayChange('ses', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="SE1, SE2, SE3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Junior Executives (comma-separated)</label>
            <input
              type="text"
              name="jes"
              value={formData.jes.join(', ')}
              onChange={(e) => handleArrayChange('jes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="JE1, JE2, JE3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Field Coordinators (comma-separated)</label>
            <input
              type="text"
              name="fcs"
              value={formData.fcs.join(', ')}
              onChange={(e) => handleArrayChange('fcs', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="FC1, FC2, FC3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medical Representatives (comma-separated)</label>
            <input
              type="text"
              name="mrs"
              value={formData.mrs.join(', ')}
              onChange={(e) => handleArrayChange('mrs', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="MR1, MR2, MR3"
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

export default function ManageTeams() {
  const { showNotification, NotificationComponent } = useNotification();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [editingTeam, setEditingTeam] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get("/admin/teams", { params: { limit: 200 } });
        const payload = res?.data?.data ?? res?.data ?? {};
        const items = Array.isArray(payload?.items) ? payload.items : (Array.isArray(payload) ? payload : []);
        if (mounted) setTeams(items);
      } catch (e) {
        // optional
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleAddTeam = async (payload, rawForm) => {
    try {
      const rangeId = rawForm.range;
      const teamPayload = {
        ...payload,
        range_id: parseInt(rangeId),
        // Include selected employee IDs for each category
        ops: rawForm.ops || [],
        sms: rawForm.sms || [],
        pms: rawForm.pms || [],
        tms: rawForm.tms || [],
        ses: rawForm.ses || [],
        jes: rawForm.jes || [],
        fcs: rawForm.fcs || [],
        mrs: rawForm.mrs || []
      };
      
      console.log('Creating team with payload:', teamPayload); // Debug log
      
      const res = await api.post("/admin/teams", teamPayload);
      const created = res?.data?.data || {};

      console.log('Created team response:', created); // Debug log

      // Use the assignedUsers data from the backend response
      if (created.assignedUsers) {
        const row = {
          _id: created.id || Math.random().toString(36).slice(2),
          name: created.name,
          range_id: rangeId,
          ops: created.assignedUsers.ops.map(u => `${u.name} (${u.emp_no})`),
          sms: created.assignedUsers.sms.map(u => `${u.name} (${u.emp_no})`),
          pms: created.assignedUsers.pms.map(u => `${u.name} (${u.emp_no})`),
          tms: created.assignedUsers.tms.map(u => `${u.name} (${u.emp_no})`),
          ses: created.assignedUsers.ses.map(u => `${u.name} (${u.emp_no})`),
          jes: created.assignedUsers.jes.map(u => `${u.name} (${u.emp_no})`),
          fcs: created.assignedUsers.fcs.map(u => `${u.name} (${u.emp_no})`),
          mrs: created.assignedUsers.mrs.map(u => `${u.name} (${u.emp_no})`)
        };
        
        setTeams((list) => [row, ...list]);
        showNotification(`Team "${payload.name}" created successfully with ${rawForm.ops.length + rawForm.sms.length + rawForm.pms.length + rawForm.tms.length + rawForm.ses.length + rawForm.jes.length + rawForm.fcs.length + rawForm.mrs.length} employees assigned!`, 'success');
      } else {
        // Fallback for backward compatibility
        const row = {
          _id: created.id || Math.random().toString(36).slice(2),
          name: created.name || payload.name,
          range_id: rangeId,
          ops: [],
          sms: [],
          pms: [],
          tms: [],
          ses: [],
          jes: [],
          fcs: [],
          mrs: []
        };
        
        setTeams((list) => [row, ...list]);
        showNotification(`Team "${payload.name}" created successfully!`, 'success');
      }
    } catch (e) {
      console.error('Error creating team:', e); // Debug log
      showNotification(e?.response?.data?.message || "Failed to create team", 'error');
    }
  };

  const handleEditTeam = (team) => {
    setEditingTeam(team);
  };

  const handleSaveEdit = async (formData) => {
    try {
      const updateData = {};
      if (formData.name.trim()) updateData.name = formData.name.trim();
      if (formData.subSector) updateData.subSector = formData.subSector;
      if (formData.ops && formData.ops.length > 0) updateData.ops = formData.ops;
      if (formData.sms && formData.sms.length > 0) updateData.sms = formData.sms;
      if (formData.pms && formData.pms.length > 0) updateData.pms = formData.pms;
      if (formData.tms && formData.tms.length > 0) updateData.tms = formData.tms;
      if (formData.ses && formData.ses.length > 0) updateData.ses = formData.ses;
      if (formData.jes && formData.jes.length > 0) updateData.jes = formData.jes;
      if (formData.fcs && formData.fcs.length > 0) updateData.fcs = formData.fcs;
      if (formData.mrs && formData.mrs.length > 0) updateData.mrs = formData.mrs;

      await api.put(`/admin/teams/${editingTeam.id || editingTeam._id}`, updateData);

      setTeams((list) =>
        list.map((team) =>
          team.id === editingTeam.id || team._id === editingTeam._id
            ? {
                ...team,
                name: formData.name,
                ops: formData.ops,
                sms: formData.sms,
                pms: formData.pms,
                tms: formData.tms,
                ses: formData.ses,
                jes: formData.jes,
                fcs: formData.fcs,
                mrs: formData.mrs
              }
            : team
        )
      );

      showNotification(`Team ${formData.name} updated successfully!`, 'success');
    } catch (e) {
      throw new Error(e?.response?.data?.message || "Failed to update team");
    }
  };

  const handleDeleteTeam = async (team) => {
    if (!window.confirm(`Are you sure you want to delete team ${team.name}?`)) {
      return;
    }

    try {
      await api.delete(`/admin/teams/${team.id || team._id}`);
      setTeams((list) => list.filter((t) => {
        const teamId = t.id || t._id;
        const deleteId = team.id || team._id;
        return teamId !== deleteId;
      }));
      showNotification(`Team ${team.name} deleted successfully!`, 'success');
    } catch (e) {
      showNotification(e?.response?.data?.message || "Failed to delete team", 'error');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Teams</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-md hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-lg"
        >
          {showForm ? 'Hide Form' : 'Add Team'}
        </button>
      </div>

      {/* Edit Team Modal */}
      {editingTeam && (
        <EditTeamModal
          team={editingTeam}
          onClose={() => setEditingTeam(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Add Team Form - Display after list */}
      {showForm && <TeamForm onSubmit={handleAddTeam} />}

      {/* Team List - Display only when form is hidden */}
      {!showForm && (
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Team List</h2>
        {err && <div className="text-red-600 mb-3">{err}</div>}
        {loading ? (
          <div className="text-gray-600">Loading…</div>
        ) : (
          <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-gradient-to-r from-red-600 to-red-700 text-white">
              <tr>
                <th className="py-2 px-4 text-center">Team Name</th>
                <th className="py-2 px-4 text-center">Ops</th>
                <th className="py-2 px-4 text-center">SM</th>
                <th className="py-2 px-4 text-center">PM</th>
                <th className="py-2 px-4 text-center">TM</th>
                <th className="py-2 px-4 text-center">SE</th>
                <th className="py-2 px-4 text-center">JE</th>
                <th className="py-2 px-4 text-center">FC</th>
                <th className="py-2 px-4 text-center">MR</th>
                <th className="py-2 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-4 text-gray-500">No teams created yet</td>
                </tr>
              ) : (
                teams.map((team) => (
                  <tr key={team._id || team.id} className="border-b hover:bg-gray-50 text-center">
                    <td className="py-2 px-4">{team.name || team.teamName}</td>
                    <td className="py-2 px-4">{team.ops?.join(", ") || "-"}</td>
                    <td className="py-2 px-4">{team.sms?.join(", ") || "-"}</td>
                    <td className="py-2 px-4">{team.pms?.join(", ") || "-"}</td>
                    <td className="py-2 px-4">{team.tms?.join(", ") || "-"}</td>
                    <td className="py-2 px-4">{team.ses?.join(", ") || "-"}</td>
                    <td className="py-2 px-4">{team.jes?.join(", ") || "-"}</td>
                    <td className="py-2 px-4">{team.fcs?.join(", ") || "-"}</td>
                    <td className="py-2 px-4">{team.mrs?.join(", ") || "-"}</td>
                    <td className="py-2 px-4 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleEditTeam(team)}
                          className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 text-sm transition-colors"
                          title="Edit Team"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTeam(team)}
                          className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 text-sm transition-colors"
                          title="Delete Team"
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
    </div>
  );
}
