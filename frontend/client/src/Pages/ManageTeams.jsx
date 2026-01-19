import { useEffect, useState } from "react";
import TeamForm from "../components/TeamForm";
import { api } from "../services/api";
import { useNotification } from "../components/NotificationPopup";

function UserManagementModal({
  team,
  users,
  onClose,
  onUpdateStatus,
  onUpdateRole,
  onRemove,
}) {

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Manage Users - {team.name}</h2>

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
  const [teamUsers, setTeamUsers] = useState([]);

  // Load teams on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get("/admin/teams");
        const payload = res?.data?.data ?? res?.data ?? {};
        const items = payload?.items || [];
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
      const res = await api.post("/admin/teams", payload);
      const created = res?.data?.data || {};

      const row = {
        id: created.id,
        name: created.name,
        range: created.range,
        agency: created.agency,
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
  const handleEditTeam = async (team) => {
    try {
      const teamRes = await api.get(`/teams/${team.id}`);
      const teamData = teamRes?.data?.data || {};
      setEditingTeam(teamData);
    } catch (e) {
      console.error("Failed to load team for editing", e);
      showNotification("Failed to load team data", "error");
    }
  };

  const handleSaveEdit = async (payload, formData, team) => {
    try {
      await api.put(`/admin/teams/${team.id}`, payload);

      // Refresh the teams list
      const res = await api.get("/admin/teams");
      const items = res?.data?.data?.items || [];
      setTeams(items);

      showNotification(
        `Team ${payload.name} updated successfully!`,
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
      await api.delete(`/admin/teams/${team.id}`);
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
    } catch (e) {
      console.error("Failed to load team users", e);
      showNotification("Failed to load team users", "error");
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

      setTeamUsers((prev) => prev.filter((u) => u.id !== userId));

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Team</h2>
            <TeamForm
              team={editingTeam}
              onSubmit={(payload, formData, team) => {
                handleSaveEdit(payload, formData, team);
                setEditingTeam(null);
              }}
            />
            <button
              onClick={() => setEditingTeam(null)}
              className="mt-4 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* User Management Modal */}
      {managingTeam && (
        <UserManagementModal
          team={managingTeam}
          users={teamUsers}
          onClose={() => setManagingTeam(null)}
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
                  <th className="py-2 px-4 text-center">Agency</th>
                  <th className="py-2 px-4 text-center">Range</th>
                  <th className="py-2 px-4 text-center">Operations Manager</th>
                  <th className="py-2 px-4 text-center">Senior Manager</th>
                  <th className="py-2 px-4 text-center">Territory Managers</th>
                  <th className="py-2 px-4 text-center">Product Managers</th>
                  <th className="py-2 px-4 text-center">Senior Executives</th>
                  <th className="py-2 px-4 text-center">Junior Executives</th>
                  <th className="py-2 px-4 text-center">Field Coordinators</th>
                  <th className="py-2 px-4 text-center">Medical Representatives</th>
                  <th className="py-2 px-4 text-center">Users</th>
                  <th className="py-2 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teams.length === 0 ? (
                  <tr>
                    <td
                      colSpan="13"
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
                        {team.sector?.agency || "-"}
                      </td>
                      <td className="py-2 px-4">
                        {team.sector?.range || "-"}
                      </td>
                      <td className="py-2 px-4">
                        {team.operations_manager || "-"}
                      </td>
                      <td className="py-2 px-4">
                        {team.senior_manager || "-"}
                      </td>
                      <td className="py-2 px-4">
                        {team.territory_managers || "-"}
                      </td>
                      <td className="py-2 px-4">
                        {team.product_managers || "-"}
                      </td>
                      <td className="py-2 px-4">
                        {team.senior_executives || "-"}
                      </td>
                      <td className="py-2 px-4">
                        {team.junior_executives || "-"}
                      </td>
                      <td className="py-2 px-4">
                        {team.field_coordinators || "-"}
                      </td>
                      <td className="py-2 px-4">
                        {team.medical_representatives || "-"}
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
