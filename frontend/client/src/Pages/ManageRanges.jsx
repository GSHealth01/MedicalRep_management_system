import { useEffect, useState } from "react";
import { api } from "../services/api"; // baseURL should be http://localhost:4000/api/v1 with auth headers

export default function ManageSectors() {
  const [sectors, setSectors] = useState([]);
  const [newAgency, setNewAgency] = useState("");
  const [newRange, setNewRange] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Hardcoded agencies
  const hardcodedAgencies = [
    'A1', 'A2', 'A3', 'A4', 'A5',
    'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10'
  ];

  // Load sectors on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get("/admin/sectors");
        setSectors(res.data.items || []);
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Add a new sector
  const addSector = async () => {
    if (!newAgency || !newRange) return;
    try {
      const body = { agency: newAgency.trim(), range: newRange };
      const res = await api.post("/admin/sectors", body);
      const created = res?.data?.data || {};
      setSectors((s) => [...s, created]);
      setNewAgency("");
      setNewRange("");
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to add sector");
    }
  };


  // UI
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Manage Sectors</h1>

      {/* Add Sector */}
      <div className="mb-6 flex gap-2">
        <select
          className="border rounded px-3 py-2 shadow-sm"
          value={newRange}
          onChange={(e) => setNewRange(e.target.value)}
        >
          <option value="">Select Range</option>
          <option value="A">A</option>
          <option value="B">B</option>
        </select>
        <select
          className="border rounded px-3 py-2 shadow-sm"
          value={newAgency}
          onChange={(e) => setNewAgency(e.target.value)}
        >
          <option value="">Select Agency</option>
          {hardcodedAgencies.map((agency) => (
            <option key={agency} value={agency}>
              {agency}
            </option>
          ))}
        </select>
        <button
          onClick={addSector}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          disabled={!newRange || !newAgency}
        >
          Add Sector
        </button>
      </div>

      {err && <div className="text-red-600 mb-3">{err}</div>}
      {loading ? (
        <div className="text-gray-600">Loading…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="py-2 px-4 text-left">Agency</th>
                <th className="py-2 px-4 text-left">Range</th>
                <th className="py-2 px-4 text-center">Counts</th>
              </tr>
            </thead>
            <tbody>
              {sectors.map((sector) => (
                <tr key={sector.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4">{sector.agency}</td>
                  <td className="py-2 px-4">{sector.range}</td>
                  <td className="py-2 px-4 text-center">
                    Users: {sector._count?.users || 0} | Teams: {sector._count?.teams || 0} | Doctors: {sector._count?.doctors || 0} | Distributors: {sector._count?.distributors || 0}
                  </td>
                </tr>
              ))}
              {sectors.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center py-4 text-gray-500">No sectors yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
