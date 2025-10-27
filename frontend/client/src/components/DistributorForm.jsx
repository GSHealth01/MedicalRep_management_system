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
        // Try both shapes: {data:{items:[...]}} or {data:[...]}
        const res = await api.get("/admin/sectors", {
          params: { isActive: true, limit: 200 },
        });
        const payload = res?.data?.data ?? res?.data ?? {};
        const items = Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload)
          ? payload
          : [];
        if (mounted) setSectors(items);
      } catch (err) {
        if (mounted)
          setSectorError(
            err?.response?.data?.message || "Failed to load sectors"
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
      !!formData.route &&
      !!formData.date
    );
  }, [formData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    // Normalize payload for BE
    const payload = {
      sector: formData.sector, // required by BE
      name: formData.distributorName, // BE expects "name"
      area: formData.area,
      town: formData.town,
      // route is not in BE model; keep it if you later add it server-side
      dateAdded: formData.date, // BE supports dateAdded
    };

    if (onSubmit) onSubmit(payload, formData); // pass both normalized & raw

    // reset form
    setFormData({
      sector: "",
      distributorName: "",
      area: "",
      town: "",
      route: "",
      date: "",
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl bg-white shadow-lg rounded-lg p-6 space-y-4"
    >
      {/* Sector */}
      <div>
        <label className="block text-gray-700 mb-1">Sector</label>
        <select
          name="sector"
          value={formData.sector}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={loadingSectors || !!sectorError}
        >
          <option value="">
            {loadingSectors ? "Loading sectors..." : "Select sector"}
          </option>
          {sectors.map((s) => (
            <option key={s._id || s.id} value={s._id || s.id}>
              {s.name} {s.code ? `(${s.code})` : ""}
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
        <input
          type="text"
          name="area"
          value={formData.area}
          onChange={handleChange}
          placeholder="Enter area"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
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

      {/* Date */}
      <div>
        <label className="block text-gray-700 mb-1">Date</label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
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
