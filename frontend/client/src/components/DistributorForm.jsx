import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api"; // baseURL should be http://localhost:4000/api/v1 (or your configured URL)

export default function DistributorForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    range: "",
    distributorName: "",
    distributorCode: "",
    area: "",
    town: "",
    route: "",
    sector: "", // Range (Sector)
    date: "",
  });

  const [agencies, setAgencies] = useState([]);
  const [ranges, setRanges] = useState([]);
  const [loadingAgencies, setLoadingAgencies] = useState(true);
  const [loadingRanges, setLoadingRanges] = useState(true);
  const [agencyError, setAgencyError] = useState("");
  const [rangeError, setRangeError] = useState("");
  const [areaError, setAreaError] = useState("");

  useEffect(() => {
    let mounted = true;

    // Helper function to normalize API responses
    const normalizeItems = (res) => {
      const data = res?.data;
      
      // If response has agencies key
      if (data?.agencies && Array.isArray(data.agencies)) {
        return data.agencies;
      }
      
      // If response has ranges key
      if (data?.ranges && Array.isArray(data.ranges)) {
        return data.ranges;
      }
      
      // If response has data.items structure
      if (data?.data?.items && Array.isArray(data.data.items)) {
        return data.data.items;
      }
      
      // If response has items directly
      if (data?.items && Array.isArray(data.items)) {
        return data.items;
      }
      
      // If response is an array directly
      if (Array.isArray(data)) {
        return data;
      }
      
      return [];
    };

    // Load agencies
    (async () => {
      setLoadingAgencies(true);
      setAgencyError("");
      try {
        const res = await api.get("/agencies", {
          params: { limit: 200 },
        });
        const items = normalizeItems(res);
        if (mounted) setAgencies(items);
      } catch (err) {
        if (mounted)
          setAgencyError(
            err?.response?.data?.message || "Failed to load agencies"
          );
      } finally {
        if (mounted) setLoadingAgencies(false);
      }
    })();

    // Load ranges
    (async () => {
      setLoadingRanges(true);
      setRangeError("");
      try {
        const res = await api.get("/ranges");
        const items = normalizeItems(res);
        if (mounted) setRanges(items);
      } catch (err) {
        if (mounted)
          setRangeError(
            err?.response?.data?.message || "Failed to load ranges"
          );
      } finally {
        if (mounted) setLoadingRanges(false);
      }
    })();

    // Load areas (removed - using text input instead)

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
      !!formData.range &&
      !!formData.distributorName &&
      !!formData.distributorCode &&
      !!formData.area &&
      !!formData.town &&
      !!formData.route &&
      !!formData.sector
    );
  }, [formData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    // Normalize payload for BE
    const payload = {
      distributor_code: formData.distributorCode.trim(), // BE expects "distributor_code"
      name: formData.distributorName.trim(), // BE expects "name"
      coverage_town: formData.town.trim(), // BE expects "coverage_town"
      route: formData.route,
      range_id: parseInt(formData.sector), // Range (Sector) field maps to range_id
      agency_id: parseInt(formData.range), // range field maps to agency_id
      area: formData.area.trim(), // area is a text field
    };

    console.log('Submitting distributor payload:', payload);
    console.log('Raw form data:', formData);

    if (onSubmit) onSubmit(payload, formData); // pass both normalized & raw

    // reset form
  setFormData({
    range: "",
    distributorName: "",
    distributorCode: "",
    area: "",
    town: "",
    route: "",
    sector: "",
    date: "",
  });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl bg-white shadow-lg rounded-lg p-6 space-y-4"
    >
      {/* Agency */}
      <div>
        <label className="block text-gray-700 mb-1">Agency</label>
        <select
          name="range"
          value={formData.range}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
          required
          disabled={loadingAgencies || !!agencyError}
        >
          <option value="">
            {loadingAgencies ? "Loading agencies..." : "Select agency"}
          </option>
          {agencies.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        {agencyError && (
          <p className="text-sm text-red-600 mt-1">{agencyError}</p>
        )}
      </div>

      {/* Range (Sector) */}
      <div>
        <label className="block text-gray-700 mb-1">Range (Sector)</label>
        <select
          name="sector"
          value={formData.sector}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
          required
          disabled={loadingRanges || !!rangeError}
        >
          <option value="">
            {loadingRanges ? "Loading ranges..." : "Select range"}
          </option>
          {ranges.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        {rangeError && (
          <p className="text-sm text-red-600 mt-1">{rangeError}</p>
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
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
          required
        />
      </div>

      {/* Distributor Code */}
      <div>
        <label className="block text-gray-700 mb-1">Distributor Code *</label>
        <input
          type="text"
          name="distributorCode"
          value={formData.distributorCode}
          onChange={handleChange}
          placeholder="Enter distributor code (e.g., DIS036)"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
          required
          pattern="[A-Z]{3}[0-9]{3}"
          title="Code should be in format DIS036"
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
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
          required
          placeholder="Enter area name"
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
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
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
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
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
        className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-2 rounded-md hover:from-red-700 hover:to-red-800 transition disabled:opacity-50 shadow-lg"
      >
        Add Distributor
      </button>
    </form>
  );
}
