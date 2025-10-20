import { useEffect, useState } from "react";
import { api } from "../services/api"; // baseURL should be http://localhost:4000/api/v1 with auth headers

export default function ManageSectors() {
  const [sectors, setSectors] = useState([]);
  const [subsBySector, setSubsBySector] = useState({}); // { [sectorId]: SubSector[] }
  const [newSector, setNewSector] = useState("");
  const [newAgency, setNewAgency] = useState("");
  const [selectedSector, setSelectedSector] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Helpers
  const normalizeItems = (res) => {
    const payload = res?.data?.data ?? res?.data ?? {};
    return Array.isArray(payload?.items) ? payload.items : (Array.isArray(payload) ? payload : []);
  };

  const makeCodeFromName = (name) =>
    (name || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 16) || `SEC-${Date.now().toString(36).toUpperCase()}`;

  // Load sectors on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get("/admin/sectors", { params: { isActive: true, limit: 200 } });
        setSectors(normalizeItems(res));
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load sectors");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Add a new sector (POST /admin/sectors)
  const addSector = async () => {
    if (!newSector.trim()) return;
    try {
      const body = { name: newSector.trim(), code: makeCodeFromName(newSector) };
      const res = await api.post("/admin/sectors", body);
      const created = res?.data?.data || {};
      const row = {
        _id: created.id || created._id,
        name: created.name || body.name,
        code: created.code || body.code,
        isActive: created.isActive ?? true,
      };
      setSectors((s) => [...s, row]);
      setNewSector("");
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to add sector");
    }
  };

  // Lazy-load agencies (sub-sectors) for a sector
  const loadAgencies = async (sectorId) => {
    if (subsBySector[sectorId]) return; // already loaded
    try {
      const res = await api.get(`/admin/subsectors/sector/${sectorId}`);
      const items = normalizeItems(res);
      setSubsBySector((m) => ({ ...m, [sectorId]: items }));
    } catch {
      setSubsBySector((m) => ({ ...m, [sectorId]: [] }));
    }
  };

  // Add an agency (POST /admin/subsectors/sector/:sectorId)
  const addAgency = async (sector) => {
    if (!newAgency.trim() || !sector?._id) return;
    try {
      const sectorCode = sector.code || makeCodeFromName(sector.name);
      const code = `${sectorCode}-${makeCodeFromName(newAgency)}`.slice(0, 24);
      const body = { name: newAgency.trim(), code };
      const res = await api.post(`/admin/subsectors/sector/${sector._id}`, body);
      const created = res?.data?.data || {};
      const row = {
        _id: created.id || created._id,
        name: created.name || body.name,
        code: created.code || body.code,
        sector: sector._id,
        isActive: created.isActive ?? true,
      };
      setSubsBySector((m) => {
        const list = m[sector._id] || [];
        return { ...m, [sector._id]: [...list, row] };
      });
      setNewAgency("");
      setSelectedSector(null);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to add agency");
    }
  };

  const agenciesText = (sectorId) =>
    (subsBySector[sectorId] || []).map((s) => s.name || s.code).join(", ") || "None";

  // UI
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Manage Sectors</h1>

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
                <th className="py-2 px-4 text-left">Sector</th>
                <th className="py-2 px-4 text-left">Agencies</th>
                <th className="py-2 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sectors.map((sector) => (
                <tr key={sector._id || sector.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4">
                    <div className="font-medium">{sector.name}</div>
                    <div className="text-xs text-gray-500">Code: {sector.code}</div>
                  </td>

                  <td className="py-2 px-4">
                    {/* if we haven't loaded agencies yet, trigger load when row becomes selected */}
                    {selectedSector === (sector._id || sector.id) && !subsBySector[sector._id || sector.id]
                      ? "Loading agencies…"
                      : agenciesText(sector._id || sector.id)}
                  </td>

                  <td className="py-2 px-4 text-center">
                    {selectedSector === (sector._id || sector.id) ? (
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
                        onClick={async () => {
                          const id = sector._id || sector.id;
                          setSelectedSector(id);
                          await loadAgencies(id);
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
