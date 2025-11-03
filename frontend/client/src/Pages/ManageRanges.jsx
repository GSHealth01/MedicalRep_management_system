import { useEffect, useState } from "react";
import { api } from "../services/api"; // baseURL should be http://localhost:4000/api/v1 with auth headers

export default function ManageSectors() {
  const [sectors, setSectors] = useState([]);
  const [newSector, setNewSector] = useState("");
  const [newAgency, setNewAgency] = useState("");
  const [selectedSector, setSelectedSector] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [agencies, setAgencies] = useState([]);

  // Load sectors and agencies on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        // Load ranges (sectors) from new API
        const rangesRes = await api.get("/ranges");
        setSectors(rangesRes.data.ranges || []);

        // Load agencies for dropdown
        const agenciesRes = await api.get("/agencies");
        setAgencies(agenciesRes.data.agencies || []);
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Add a new sector (POST /ranges)
  const addSector = async () => {
    if (!newSector.trim()) return;
    try {
      const body = { name: newSector.trim() };
      const res = await api.post("/ranges", body);
      const created = res?.data?.range || {};
      const row = {
        id: created.id,
        name: created.name,
        agency: created.agency,
        _count: created._count || { users: 0, teams: 0 }
      };
      setSectors((s) => [...s, row]);
      setNewSector("");
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to add sector");
    }
  };

  // Add an agency (POST /agencies)
  const addAgency = async (sector) => {
    if (!newAgency.trim()) return;
    try {
      const body = { name: newAgency.trim() };
      const res = await api.post("/agencies", body);
      const created = res?.data?.agency || {};
      const row = {
        id: created.id,
        name: created.name
      };
      setAgencies((a) => [...a, row]);
      setNewAgency("");
      setSelectedSector(null);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to add agency");
    }
  };

  const agenciesText = (sectorId) =>
    agencies.map((a) => a.name).join(", ") || "None";

  // UI
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Manage Ranges (Sectors)</h1>

      {/* Add Sector */}
      <div className="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="Enter sector name"
          className="border rounded px-3 py-2 flex-1 shadow-sm"
          value={newSector}
          onChange={(e) => setNewSector(e.target.value)}
        />
        <button
          onClick={addSector}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
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
                <th className="py-2 px-4 text-left">Range</th>
                <th className="py-2 px-4 text-left">Agencies</th>
                <th className="py-2 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sectors.map((sector) => (
                <tr key={sector.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4">
                    <div className="font-medium">{sector.name}</div>
                    <div className="text-xs text-gray-500">
                      Agency: {sector.agency?.name || 'N/A'} | Users: {sector._count?.users || 0} | Teams: {sector._count?.teams || 0}
                    </div>
                  </td>

                  <td className="py-2 px-4">
                    {agenciesText(sector.id)}
                  </td>

                  <td className="py-2 px-4 text-center">
                    {selectedSector === sector.id ? (
                      <div className="flex gap-2 justify-center">
                        <input
                          type="text"
                          placeholder="Enter agency"
                          className="border rounded px-2 py-1"
                          value={newAgency}
                          onChange={(e) => setNewAgency(e.target.value)}
                        />
                        <button
                          onClick={() => addAgency(sector)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setSelectedSector(null)}
                          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedSector(sector.id);
                        }}
                        className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                      >
                        + Add Agency
                      </button>
                    )}
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
