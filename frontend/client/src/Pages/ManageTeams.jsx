import { useEffect, useState } from "react";
import TeamForm from "../components/TeamForm";
import { api } from "../services/api";

export default function ManageTeams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Optional: load existing teams (if your BE exposes /admin/teams)
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get("/admin/teams", { params: { limit: 200 } }); // adjust if you list by subSector
        const payload = res?.data?.data ?? res?.data ?? {};
        const items = Array.isArray(payload?.items) ? payload.items : (Array.isArray(payload) ? payload : []);
        if (mounted) setTeams(items);
      } catch (e) {
        // non-fatal if you don't have this endpoint
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleAddTeam = async (payload, rawForm) => {
    try {
      // Create under the sub-sector (agency)
      const subSectorId = rawForm.subSector;
      const res = await api.post(`/admin/subsectors/${subSectorId}/teams`, payload);
      const created = res?.data?.data || {};

      // Merge BE-created info with FE selections for display
      const row = {
        _id: created.id || created._id || Math.random().toString(36).slice(2),
        name: created.name || payload.name,
        // Keep member arrays for table display (until you wire real users)
        ses: rawForm.ses,
        tms: rawForm.tms,
        pms: rawForm.pms,
        jes: rawForm.jes,
        fcs: rawForm.fcs,
        mrs: rawForm.mrs,
      };
      setTeams((list) => [row, ...list]);
      alert(`Team "${payload.name}" added ✅`);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to add team");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Manage Teams</h1>

      <TeamForm onSubmit={handleAddTeam} />

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Team List</h2>
        {err && <div className="text-red-600 mb-3">{err}</div>}
        {loading ? (
          <div className="text-gray-600">Loading…</div>
        ) : (
          <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="py-2 px-4 text-center">Team Name</th>
                <th className="py-2 px-4 text-center">Senior Executives (SE)</th>
                <th className="py-2 px-4 text-center">Territory Managers (TM)</th>
                <th className="py-2 px-4 text-center">Product Managers (PM)</th>
                <th className="py-2 px-4 text-center">Junior Executives (JE)</th>
                <th className="py-2 px-4 text-center">Field Coordinators (FC)</th>
                <th className="py-2 px-4 text-center">Medical Reps (MR)</th>
              </tr>
            </thead>
            <tbody>
              {teams.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-gray-500">No teams created yet</td>
                </tr>
              ) : (
                teams.map((team) => (
                  <tr key={team._id || team.id} className="border-b hover:bg-gray-50 text-center">
                    <td className="py-2 px-4">{team.name || team.teamName}</td>
                    <td className="py-2 px-4">{team.ses?.join(", ") || "-"}</td>
                    <td className="py-2 px-4">{team.tms?.join(", ") || "-"}</td>
                    <td className="py-2 px-4">{team.pms?.join(", ") || "-"}</td>
                    <td className="py-2 px-4">{team.jes?.join(", ") || "-"}</td>
                    <td className="py-2 px-4">{team.fcs?.join(", ") || "-"}</td>
                    <td className="py-2 px-4">{team.mrs?.join(", ") || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
