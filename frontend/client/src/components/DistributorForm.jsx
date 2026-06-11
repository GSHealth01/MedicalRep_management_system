import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

export default function DistributorForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    range: "",          // A or B
    agency: "",         // sector id (from agency dropdown)
    distributorName: "",
    distributorCode: "",
    area: "",
    town: "",
    route: "",
  });

  const [allSectors, setAllSectors] = useState([]);  // raw sector objects from API
  const [loadingAgencies, setLoadingAgencies] = useState(true);
  const [agencyError, setAgencyError] = useState("");

  // Load all sectors from API
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingAgencies(true);
      setAgencyError("");
      try {
        const res = await api.get("/admin/sectors");
        const payload = res?.data?.data?.items || [];
        if (mounted) setAllSectors(payload);
      } catch (err) {
        if (mounted) setAgencyError(err?.response?.data?.message || "Failed to load sectors");
      } finally {
        if (mounted) setLoadingAgencies(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Filter sectors by selected range
  const filteredAgencies = useMemo(() => {
    if (!formData.range) return [];
    return allSectors.filter(s => s.range === formData.range);
  }, [formData.range, allSectors]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "range") {
      // Reset agency when range changes
      setFormData(s => ({ ...s, range: value, agency: "" }));
      return;
    }
    setFormData(s => ({ ...s, [name]: value }));
  };

  const canSubmit = useMemo(() => {
    return (
      !!formData.range &&
      !!formData.agency &&
      !!formData.distributorName &&
      !!formData.distributorCode &&
      !!formData.area &&
      !!formData.town &&
      !!formData.route
    );
  }, [formData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    // formData.agency holds the sector_id from the dropdown
    const payload = {
      distributor_code: formData.distributorCode.trim(),
      name: formData.distributorName.trim(),
      coverage_town: formData.town.trim(),
      route: formData.route,
      sector_id: parseInt(formData.agency),   // agency dropdown value is the sector.id
      area: formData.area.trim(),
    };

    if (onSubmit) onSubmit(payload, formData);

    setFormData({
      range: "",
      agency: "",
      distributorName: "",
      distributorCode: "",
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
      {/* Distributor Name */}
      <div>
        <label className="block text-gray-700 mb-1">Distributor Name *</label>
        <input
          type="text"
          name="distributorName"
          value={formData.distributorName}
          onChange={handleChange}
          placeholder="Enter distributor name"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
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
          placeholder="e.g., DIS036"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
          required
        />
      </div>

      {/* Range (A or B) */}
      <div>
        <label className="block text-gray-700 mb-1">Range *</label>
        <select
          name="range"
          value={formData.range}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
          required
        >
          <option value="">Select range</option>
          <option value="A">A</option>
          <option value="B">B</option>
        </select>
      </div>

      {/* Agency (sector dropdown filtered by range) */}
      <div>
        <label className="block text-gray-700 mb-1">Agency *</label>
        <select
          name="agency"
          value={formData.agency}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
          required
          disabled={!formData.range || loadingAgencies}
        >
          <option value="">
            {!formData.range
              ? "Select range first"
              : loadingAgencies
              ? "Loading agencies..."
              : agencyError
              ? "Error loading agencies"
              : "Select agency"}
          </option>
          {filteredAgencies.map(s => (
            <option key={s.id} value={s.id}>{s.agency}</option>
          ))}
        </select>
        {agencyError && <p className="text-sm text-red-600 mt-1">{agencyError}</p>}
        {filteredAgencies.length === 0 && !loadingAgencies && !agencyError && formData.range && (
          <p className="text-sm text-gray-500 mt-1">No agencies found for range {formData.range}</p>
        )}
      </div>

      {/* Area */}
      <div>
        <label className="block text-gray-700 mb-1">Area *</label>
        <input
          type="text"
          name="area"
          value={formData.area}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
          required
          placeholder="Enter area name"
        />
      </div>

      {/* Town */}
      <div>
        <label className="block text-gray-700 mb-1">Coverage (Town) *</label>
        <input
          type="text"
          name="town"
          value={formData.town}
          onChange={handleChange}
          placeholder="Enter town coverage"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
          required
        />
      </div>

      {/* Route */}
      <div>
        <label className="block text-gray-700 mb-1">Route *</label>
        <select
          name="route"
          value={formData.route}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
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
