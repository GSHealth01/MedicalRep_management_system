import { useState } from "react";
import { api } from "../services/api";

export default function ManageTeamModal({ team, onClose, onSave, showNotification }) {
  const [selectedLeader, setSelectedLeader] = useState(
    team?.users?.find(u => u.team_role === 'LEADER')?.id || null
  );
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!selectedLeader) {
      showNotification("Please select a leader", "error");
      return;
    }

    setLoading(true);
    try {
      await api.put(`/admin/teams/${team.id}/leader`, { userId: selectedLeader });
      showNotification("Team leader updated successfully", "success");
      onSave(); // Refresh the teams list
      onClose();
    } catch (e) {
      console.error("Failed to set leader", e);
      showNotification(e?.response?.data?.message || "Failed to update leader", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!team) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Manage Team: {team.name}</h2>

        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Team Members</h3>
          <div className="space-y-2">
            {team.users && team.users.length > 0 ? (
              team.users.map((user) => (
                <div key={user.id} className="flex items-center space-x-3 p-2 border rounded">
                  <input
                    type="radio"
                    name="leader"
                    value={user.id}
                    checked={selectedLeader === user.id}
                    onChange={() => setSelectedLeader(user.id)}
                    className="form-radio"
                  />
                  <div>
                    <span className="font-medium">{user.name}</span>
                    <span className="text-gray-500 ml-2">
                      ({
                        {
                          'OM':   'Operations Manager',
                          'SM':   'Senior Manager',
                          'MGR':  'Manager',
                          'PM':   'Products Manager',
                          'TM':   'Territory Manager',
                          'PPES': 'Product Promotion Executive - Senior',
                          'PPEJ': 'Product Promotion Executive - Junior',
                          'FC':   'Field Coordinator',
                          'MR':   'Medical Representative',
                          'ADMIN':'Admin'
                        }[user.designation] || user.designation
                      })
                    </span>
                    {user.team_role === 'LEADER' && (
                      <span className="text-green-600 ml-2 font-semibold">(Current Leader)</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No members in this team</p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Leader"}
          </button>
        </div>
      </div>
    </div>
  );
}