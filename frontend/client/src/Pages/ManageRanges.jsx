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

  // Hardcoded agencies
  const hardcodedAgencies = [
    { id: 'A1', name: 'A1' },
    { id: 'A2', name: 'A2' },
    { id: 'A3', name: 'A3' },
    { id: 'A4', name: 'A4' },
    { id: 'A5', name: 'A5' },
    { id: 'B1', name: 'B1' },
    { id: 'B2', name: 'B2' },
    { id: 'B3', name: 'B3' },
    { id: 'B4', name: 'B4' },
    { id: 'B5', name: 'B5' },
    { id: 'B6', name: 'B6' },
    { id: 'B7', name: 'B7' },
    { id: 'B8', name: 'B8' },
    { id: 'B9', name: 'B9' },
    { id: 'B10', name: 'B10' }
  ];

  // Get filtered agencies based on selected sector
  const getFilteredAgencies = (sectorName) => {
    if (!sectorName) return [];
    if (sectorName === 'A') {
      return hardcodedAgencies.filter(a => a.name.startsWith('A'));
    } else if (sectorName === 'B') {
      return hardcodedAgencies.filter(a => a.name.startsWith('B'));
    }
    return [];
  };

  // Load sectors on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        // Load ranges (sectors) from new API
        const rangesRes = await api.get("/ranges");
        setSectors(rangesRes.data.ranges || []);
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Add a new sector (POST /ranges)
  const addSector = async () => {
    if (!newSector) return;
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

  // Add an agency (using hardcoded agencies)
  const addAgency = async (sector) => {
    console.log('addAgency called with:', { sector, newAgency, sectors });
    if (!newAgency.trim()) return;
    
    // Find the selected agency from hardcoded list
    const selectedAgency = hardcodedAgencies.find(a => a.name === newAgency);
    if (!selectedAgency) {
      alert("Invalid agency selected");
      return;
    }
    
    // Check if agency is already assigned to this sector
    if (sector.agency?.name === selectedAgency.name) {
      alert(`Agency ${selectedAgency.name} is already assigned to Range ${sector.name}`);
      return;
    }
    
    // Check if agency is already assigned to another sector
    const existingAssignment = sectors.find(s =>
      s.agency?.name === selectedAgency.name && s.id !== sector.id
    );
    
    if (existingAssignment) {
      alert(`Agency ${selectedAgency.name} is already assigned to Range ${existingAssignment.name}. Please unassign it first.`);
      return;
    }
    
    try {
      // Update the sector with the selected agency
      const body = {
        name: sector.name,
        agency_id: selectedAgency.id
      };
      await api.put(`/ranges/${sector.id}`, body);
      
      // Update local state
      setSectors((s) =>
        s.map((sec) =>
          sec.id === sector.id
            ? { ...sec, agency: { name: selectedAgency.name, id: selectedAgency.id } }
            : sec
        )
      );
      
      setNewAgency("");
      setSelectedSector(null);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to assign agency");
    }
  };


  // UI
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Manage Ranges (Sectors)</h1>

      {/* Add Sector */}
      <div className="mb-6 flex gap-2">
        <select
          className="border rounded px-3 py-2 flex-1 shadow-sm"
          value={newSector}
          onChange={(e) => setNewSector(e.target.value)}
        >
          <option value="">Select Range</option>
          <option value="A">A</option>
          <option value="B">B</option>
        </select>
        <button
          onClick={addSector}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          disabled={!newSector}
        >
          Add Range
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
                    {sector.agency?.name || "None"}
                  </td>

                  <td className="py-2 px-4 text-center">
                    {selectedSector === sector.id ? (
                      <div className="flex gap-2 justify-center">
                        <select
                          className="border rounded px-2 py-1"
                          value={newAgency}
                          onChange={(e) => {
                            console.log('Agency changed to:', e.target.value);
                            setNewAgency(e.target.value);
                          }}
                        >
                          <option value="">Select Agency</option>
                          {getFilteredAgencies(sector.name).map((agency) => (
                            <option key={agency.id} value={agency.name}>
                              {agency.name}
                            </option>
                          ))}
                        </select>
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
