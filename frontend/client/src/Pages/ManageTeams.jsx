import { useEffect, useState } from "react";
import TeamForm from "../components/TeamForm";
import { api } from "../services/api";
import { useNotification } from "../components/NotificationPopup";

// =====================
// Edit Team Modal
// =====================
function EditTeamModal({ team, onClose, onSave }) {
  const [formData, setFormData] = useState({
    // FRONTEND FIELDS FOR TEAM:
    // - Team Name
    // - Range
    name: team?.name || "",
    range: team?.range?.name || "",
  });
  const [loading, setLoading] = useState(false);
  const [ranges, setRanges] = useState([]);

  useEffect(() => {
    const fetchRanges = async () => {
      try {
        const res = await api.get("/ranges");
        setRanges(res?.data?.data || []);
      } catch (e) {
        console.error("Failed to fetch ranges", e);
      }
    };
    fetchRanges();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch {
      // error handled in parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Edit Team</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Team Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Range
            </label>
            <select
              name="range"
              value={formData.range}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Range</option>
              {ranges.map((range) => (
                <option key={range.id} value={range.name}>
                  {range.name}
                </option>
              ))}
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
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function UserManagementModal({
  team,
  users,
  availableUsers,
  onClose,
  onAssign,
  onUpdateStatus,
  onUpdateRole,
  onRemove,
}) {

  const [selectedUser, setSelectedUser] = useState("");
  const [assignStatus, setAssignStatus] = useState("ACTIVE"); 
  const [assignRole, setAssignRole] = useState("NORMAL"); 

  const handleAssign = () => {
    if (!selectedUser) return;
    
    onAssign(parseInt(selectedUser, 10), assignStatus, assignRole);
    setSelectedUser("");
    setAssignStatus("ACTIVE");
    setAssignRole("NORMAL");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Manage Users - {team.name}</h2>

        {/* Assign User Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Assign User to Team</h3>
          <div className="flex flex-col md:flex-row gap-2 md:items-center">
            {/* User select */}
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a user</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.emp_no})
                </option>
              ))}
            </select>

            {/* Member Type (type) select */}
            <select
              value={assignRole}
              onChange={(e) => setAssignRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="NORMAL">Member</option>
              <option value="LEADER">Leader</option>
            </select>

            {/* Status select */}
            <select
              value={assignStatus}
              onChange={(e) => setAssignStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            {/* Assign button */}
            <button
              onClick={handleAssign}
              disabled={!selectedUser}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Assign
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Note: Only one <strong>Leader</strong> is allowed per team. When
            assigning a new leader, the previous leader will be changed to
            Member.
          </p>
        </div>

        {/* Users List */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Team Users</h3>
          {users.length === 0 ? (
            <p className="text-gray-500">No users assigned to this team</p>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <span className="font-medium">{user.name}</span> (
                    {user.emp_no})
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Member Type (type) */}
                    <select
                      value={user.role} // or user.type if backend returns 'type'
                      onChange={(e) => onUpdateRole(user.id, e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="NORMAL">Memebr</option>
                      <option value="LEADER">Leader</option>
                    </select>

                    {/* Status */}
                    <select
                      value={user.status}
                      onChange={(e) => onUpdateStatus(user.id, e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>

                    {/* Remove */}
                    <button
                      onClick={() => onRemove(user.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================
// Main ManageTeams Page
// =====================
export default function ManageTeams() {
  const { showNotification, NotificationComponent } = useNotification();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [editingTeam, setEditingTeam] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [managingTeam, setManagingTeam] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);

  // Load teams on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get("/teams");
        const payload = res?.data?.data ?? res?.data ?? {};
        const items = payload?.teams || [];
        if (mounted) setTeams(items);
      } catch (e) {
        console.error("Failed to load teams", e);
        if (mounted) setErr("Failed to load teams");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Create Team (TeamForm should send { name, range_id } or similar)
  const handleAddTeam = async (payload) => {
    try {
      const res = await api.post("/teams", payload);
      const created = res?.data?.data || {};

      const row = {
        id: created.id,
        name: created.name,
        range: created.range,
        _count: { users: 0 },
      };

      setTeams((list) => [row, ...list]);
      showNotification(
        `Team "${payload.name}" created successfully!`,
        "success"
      );
    } catch (e) {
      console.error("Error creating team:", e);
      showNotification(
        e?.response?.data?.message || "Failed to create team",
        "error"
      );
    }
  };

  // Edit
  const handleEditTeam = (team) => {
    setEditingTeam(team);
  };

  const handleSaveEdit = async (formData) => {
    try {
      const updateData = { name: formData.name };
      if (formData.range) {
        const rangesRes = await api.get("/ranges");
        const ranges = rangesRes?.data?.data || [];
        const range = ranges.find((r) => r.name === formData.range);
        if (range) updateData.range_id = range.id;
      }

      await api.put(`/teams/${editingTeam.id}`, updateData);

      setTeams((list) =>
        list.map((team) =>
          team.id === editingTeam.id
            ? {
                ...team,
                name: formData.name,
                range: formData.range ? { name: formData.range } : team.range,
              }
            : team
        )
      );

      showNotification(
        `Team ${formData.name} updated successfully!`,
        "success"
      );
    } catch (e) {
      throw new Error(
        e?.response?.data?.message || "Failed to update team"
      );
    }
  };

  // Delete
  const handleDeleteTeam = async (team) => {
    if (!window.confirm(`Are you sure you want to delete team ${team.name}?`)) {
      return;
    }

    try {
      await api.delete(`/teams/${team.id}`);
      setTeams((list) => list.filter((t) => t.id !== team.id));
      showNotification(`Team ${team.name} deleted successfully!`, "success");
    } catch (e) {
      showNotification(
        e?.response?.data?.message || "Failed to delete team",
        "error"
      );
    }
  };

  // Manage Users (open modal)
  const handleManageUsers = async (team) => {
    setManagingTeam(team);
    try {
      const teamRes = await api.get(`/teams/${team.id}`);
      const teamData = teamRes?.data?.data || {};
      setTeamUsers(teamData.users || []);

      const usersRes = await api.get("/admin/users", { params: { limit: 500 } });
      const users = usersRes?.data?.data?.items || [];
      const available = users.filter((u) => !u.team_id);
      setAvailableUsers(available);
    } catch (e) {
      console.error("Failed to load team users", e);
      showNotification("Failed to load team users", "error");
    }
  };

  // Assign User with status + type
  const handleAssignUser = async (userId, status, role) => {
    try {
      await api.post(`/teams/${managingTeam.id}/assign-user`, {
        userId,
        status,
        role, // backend can treat this as 'type'
      });

      const teamRes = await api.get(`/teams/${managingTeam.id}`);
      const teamData = teamRes?.data?.data || {};
      setTeamUsers(teamData.users || []);

      setAvailableUsers((prev) => prev.filter((u) => u.id !== userId));
      showNotification("User assigned to team", "success");
    } catch (e) {
      console.error("Failed to assign user", e);
      showNotification(
        e?.response?.data?.message || "Failed to assign user",
        "error"
      );
    }
  };

  // Update Status
  const handleUpdateStatus = async (userId, status) => {
    try {
      await api.patch(`/teams/${managingTeam.id}/user/${userId}/status`, {
        status,
      });
      setTeamUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status } : u))
      );
      showNotification("User status updated", "success");
    } catch (e) {
      console.error("Failed to update status", e);
      showNotification(
        e?.response?.data?.message || "Failed to update status",
        "error"
      );
    }
  };

  // Update Member Type (role/type)
  const handleUpdateRole = async (userId, role) => {
    try {
      await api.patch(`/teams/${managingTeam.id}/user/${userId}/role`, {
        role,
      });
      setTeamUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u))
      );
      showNotification("User type updated", "success");
    } catch (e) {
      console.error("Failed to update type", e);
      showNotification(
        e?.response?.data?.message || "Failed to update type",
        "error"
      );
    }
  };

  // Remove User from team
  const handleRemoveUser = async (userId) => {
    if (!window.confirm("Remove user from team?")) return;

    try {
      await api.delete(`/teams/${managingTeam.id}/user/${userId}`);

      const removedUser = teamUsers.find((u) => u.id === userId);
      setTeamUsers((prev) => prev.filter((u) => u.id !== userId));
      if (removedUser) {
        setAvailableUsers((prev) => [
          ...prev,
          { ...removedUser, team_id: null },
        ]);
      }

      showNotification("User removed from team", "success");
    } catch (e) {
      console.error("Failed to remove user", e);
      showNotification(
        e?.response?.data?.message || "Failed to remove user",
        "error"
      );
    }
  };

  return (
    <div>
      {/* Header + Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Teams</h1>
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-md hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-lg"
        >
          {showForm ? "Hide Form" : "Add Team"}
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

      {/* User Management Modal */}
      {managingTeam && (
        <UserManagementModal
          team={managingTeam}
          users={teamUsers}
          availableUsers={availableUsers}
          onClose={() => setManagingTeam(null)}
          onAssign={handleAssignUser}
          onUpdateStatus={handleUpdateStatus}
          onUpdateRole={handleUpdateRole}
          onRemove={handleRemoveUser}
        />
      )}

      {/* Add Team Form */}
      {showForm && <TeamForm onSubmit={handleAddTeam} />}

      {/* Team List (only when form hidden) */}
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
                  <th className="py-2 px-4 text-center">Range</th>
                  <th className="py-2 px-4 text-center">Users</th>
                  <th className="py-2 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teams.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="text-center py-4 text-gray-500"
                    >
                      No teams created yet
                    </td>
                  </tr>
                ) : (
                  teams.map((team) => (
                    <tr
                      key={team.id}
                      className="border-b hover:bg-gray-50 text-center"
                    >
                      <td className="py-2 px-4">{team.name}</td>
                      <td className="py-2 px-4">
                        {team.range?.name || "-"}
                      </td>
                      <td className="py-2 px-4">
                        {team._count?.users || 0}
                      </td>
                      <td className="py-2 px-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleManageUsers(team)}
                            className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 text-sm transition-colors"
                            title="Manage Users"
                          >
                            Manage Users
                          </button>
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

      {/* Notifications */}
      <NotificationComponent />
    </div>
  );
}
