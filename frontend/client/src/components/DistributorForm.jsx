import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api"; // baseURL should be http://localhost:4000/api/v1 (or your configured URL)

export default function DistributorForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    sector: "", 
    distributorName: "",
    area: "",
    town: "",
    route: "",
    date: "",
  });

  const [sectors, setSectors] = useState([]);
  const [loadingSectors, setLoadingSectors] = useState(true);
  const [sectorError, setSectorError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingSectors(true);
      setSectorError("");
      try {
        // Use ranges endpoint instead of sectors
        const res = await api.get("/ranges", {
          params: { limit: 200 },
        });
        const payload = res?.data?.ranges ?? res?.data ?? [];
        const items = Array.isArray(payload) ? payload : [];
        if (mounted) setSectors(items);
      } catch (err) {
        if (mounted)
          setSectorError(
            err?.response?.data?.message || "Failed to load ranges"
          );
      } finally {
        if (mounted) setLoadingSectors(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const canSubmit = useMemo(() => {
    return (
      !!formData.sector &&
      !!formData.distributorName &&
      !!formData.area &&
      !!formData.town &&
      !!formData.route
    );
  }, [formData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    // Normalize payload for BE
    const payload = {
      name: formData.distributorName, // BE expects "name"
      coverage_town: formData.town, // BE expects "coverage_town"
      route: formData.route,
      agency_id: parseInt(formData.sector), // sector field maps to agency_id
      area_id: parseInt(formData.area), // area field should be area_id
    };

    if (onSubmit) onSubmit(payload, formData); // pass both normalized & raw

    // reset form
    setFormData({
      sector: "",
      distributorName: "",
      area: "",
      town: "",
      route: "",
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl bg-white shadow-lg rounded-lg p-6 space-y-4"
    >
      {/* Range (Sector) */}
      <div>
        <label className="block text-gray-700 mb-1">Range (Sector)</label>
        <select
          name="sector"
          value={formData.sector}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={loadingSectors || !!sectorError}
        >
          <option value="">
            {loadingSectors ? "Loading ranges..." : "Select range"}
          </option>
          {sectors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.agency ? `(Agency: ${s.agency.name})` : ""}
            </option>
          ))}
        </select>
        {sectorError && (
          <p className="text-sm text-red-600 mt-1">{sectorError}</p>
        )}
      </div>

      {/* Distributor Name */}
      <div>
        <label className="block text-gray-700 mb-1">Distributor Name</label>
        <input
          type="text"
          name="distributorName"
          value={formData.distributorName}
          onChange={handleChange}
          placeholder="Enter distributor name"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Area */}
      <div>
        <label className="block text-gray-700 mb-1">Area</label>
        <select
          name="area"
          value={formData.area}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select Area</option>
          <option value="1">Colombo</option>
          <option value="2">Gampaha</option>
          <option value="3">Kalutara</option>
          <option value="4">Ratmalana</option>
        </select>
      </div>

      {/* Coverage (Town) */}
      <div>
        <label className="block text-gray-700 mb-1">Coverage (Town)</label>
        <input
          type="text"
          name="town"
          value={formData.town}
          onChange={handleChange}
          placeholder="Enter town coverage"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Route (local-only for now) */}
      <div>
        <label className="block text-gray-700 mb-1">Route</label>
        <select
          name="route"
          value={formData.route}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select route</option>
          <option value="Route A">Route A</option>
          <option value="Route B">Route B</option>
          <option value="Route C">Route C</option>
        </select>
      </div>


      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
      >
        Add Distributor
      </button>
    </form>
  );
}
