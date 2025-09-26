// src/pages/ManageSectors.jsx
import { useState } from "react";

export default function ManageSectors() {
  const [sectors, setSectors] = useState([
    { id: 1, name: "Arrowil-A", agencies: ["A1", "A2", "A3"] },
    { id: 2, name: "Arrowil-B", agencies: ["B1", "B2", "B3", "B4", "B5", "B6"] },
  ]);

  const [newSector, setNewSector] = useState("");
  const [newAgency, setNewAgency] = useState("");
  const [selectedSector, setSelectedSector] = useState(null);

  const addSector = () => {
    if (!newSector) return;
    setSectors([...sectors, { id: Date.now(), name: newSector, agencies: [] }]);
    setNewSector("");
  };

  const addAgency = (sectorId) => {
    if (!newAgency) return;
    setSectors(
      sectors.map((s) =>
        s.id === sectorId
          ? { ...s, agencies: [...s.agencies, newAgency] }
          : s
      )
    );
    setNewAgency("");
    setSelectedSector(null);
  };

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

      {/* Table of Sectors */}
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
              <tr key={sector.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4">{sector.name}</td>
                <td className="py-2 px-4">
                  {sector.agencies.join(", ") || "None"}
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
                        onClick={() => addAgency(sector.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedSector(sector.id)}
                      className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                    >
                      + Add Agency
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
