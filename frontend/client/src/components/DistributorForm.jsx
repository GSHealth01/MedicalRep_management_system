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
    sector: "",
    date: "",
  });

  const [agencies, setAgencies] = useState([]);
  const [loadingAgencies, setLoadingAgencies] = useState(true);
  const [agencyError, setAgencyError] = useState("");

  // Load sectors from API and map to agencies
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingAgencies(true);
      setAgencyError("");
      try {
        const res = await api.get("/admin/sectors");
        const payload = res?.data?.data?.items || [];
        // Map sectors to agency format
        const agencyList = payload.map(sector => ({
          id: sector.id,
          name: sector.agency
        }));
        if (mounted) setAgencies(agencyList);
      } catch (err) {
        if (mounted) setAgencyError(err?.response?.data?.message || "Failed to load sectors");
      } finally {
        if (mounted) setLoadingAgencies(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Hardcoded ranges (same as other forms)
  const ranges = useMemo(() => [
    { id: 'A', name: 'A' },
    { id: 'B', name: 'B' }
  ], []);

  const [filteredAgencies, setFilteredAgencies] = useState([]);

  // when range changes, filter agencies based on the selected range
  useEffect(() => {
    if (!formData.sector) {
      setFilteredAgencies([]);
      return;
    }
    // Filter agencies based on the selected range
    const filtered = agencies.filter(agency => {
      // Check if agency name starts with the selected range (A or B)
      return agency.name && agency.name.startsWith(formData.sector);
    });
    setFilteredAgencies(filtered);
  }, [formData.sector, agencies]);

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
      distributor_code: formData.distributorCode.trim(),
      name: formData.distributorName.trim(),
      coverage_town: formData.town.trim(),
      route: formData.route,
      sector_id: parseInt(formData.range),
      area: formData.area.trim(),
    };

    console.log('Submitting distributor payload:', payload);
    console.log('Raw form data:', formData);

    if (onSubmit) onSubmit(payload, formData); 
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
      {/* Range (Sector) */}
      <div>
        <label className="block text-gray-700 mb-1">Range (Sector)</label>
        <select
          name="sector"
          value={formData.sector}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
          required
        >
          <option value="">Select range</option>
          {ranges.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {/* Agency */}
      <div>
        <label className="block text-gray-700 mb-1">Agency</label>
        <select
          name="range"
          value={formData.range}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
          required
          disabled={!formData.sector || loadingAgencies}
        >
          <option value="">
            {!formData.sector
              ? "Select range first"
              : loadingAgencies
              ? "Loading agencies..."
              : agencyError
              ? "Error loading agencies"
              : "Select agency"}
          </option>
          {filteredAgencies.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        {agencyError && (
          <p className="text-sm text-red-600 mt-1">{agencyError}</p>
        )}
        {filteredAgencies.length === 0 && !loadingAgencies && !agencyError && formData.sector && (
          <p className="text-sm text-gray-500 mt-1">No agencies found for this range</p>
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
