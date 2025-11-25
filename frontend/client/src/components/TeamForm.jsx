import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api"; // uses your existing axios instance with auth

export default function TeamForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    range: "",         // range _id
    teamName: "",
    agency: "",        // agency _id (new field)
  });

  const [ranges, setRanges] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [loadingRanges, setLoadingRanges] = useState(false);
  const [loadingAgencies, setLoadingAgencies] = useState(true);
  const [errRanges, setErrRanges] = useState("");
  const [errAgencies, setErrAgencies] = useState("");

  // Helpers
  const normalizeItems = (res) => {
    // Handle different response structures
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

  // Load ranges and agencies
  useEffect(() => {
    let mounted = true;

    // Load ranges
    (async () => {
      setLoadingRanges(true);
      setErrRanges("");
      try {
        const res = await api.get("/ranges");
        const items = normalizeItems(res);
        if (mounted) setRanges(items);
      } catch (e) {
        if (mounted) setErrRanges(e?.response?.data?.message || "Failed to load ranges");
      } finally {
        if (mounted) setLoadingRanges(false);
      }
    })();

    // Load agencies
    (async () => {
      setLoadingAgencies(true);
      setErrAgencies("");
      try {
        const res = await api.get("/agencies", { params: { limit: 200 } });
        const items = normalizeItems(res);
        if (mounted) setAgencies(items);
      } catch (e) {
        if (mounted) setErrAgencies(e?.response?.data?.message || "Failed to load agencies");
      } finally {
        if (mounted) setLoadingAgencies(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const canSubmit = useMemo(() => !!formData.range && !!formData.teamName && !!formData.agency, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const submit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    const payload = {
      name: formData.teamName,
      agency_id: parseInt(formData.agency),
      range_id: parseInt(formData.range)
    };

    onSubmit && onSubmit(payload, formData);

    // reset
    setFormData({
      range: "",
      teamName: "",
      agency: "",
    });
  };


  return (
    <form onSubmit={submit} className="max-w-3xl bg-white shadow-lg rounded-lg p-6 space-y-4">
      {/* Agency */}
      <div>
        <label className="block text-gray-700 mb-1">Agency</label>
        <select
          name="agency"
          value={formData.agency}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
          required
          disabled={loadingAgencies || !!errAgencies}
        >
          <option value="">{loadingAgencies ? "Loading agencies..." : "Select agency"}</option>
          {agencies.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        {errAgencies && <p className="text-sm text-red-600 mt-1">{errAgencies}</p>}
      </div>

      {/* Range */}
      <div>
        <label className="block text-gray-700 mb-1">Range</label>
        <select
          name="range"
          value={formData.range}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
          required
          disabled={loadingRanges || !!errRanges}
        >
          <option value="">{loadingRanges ? "Loading ranges..." : "Select range"}</option>
          {ranges.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} {r.agency ? `(${r.agency.name})` : ""}
            </option>
          ))}
        </select>
        {errRanges && <p className="text-sm text-red-600 mt-1">{errRanges}</p>}
      </div>

      {/* Team Name */}
      <div>
        <label className="block text-gray-700 mb-1">Team Name</label>
        <input
          type="text"
          name="teamName"
          value={formData.teamName}
          onChange={handleChange}
          placeholder="Enter team name"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
          required
        />
      </div>

      <button type="submit" disabled={!canSubmit} className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-2 rounded-md hover:from-red-700 hover:to-red-800 transition disabled:opacity-50 shadow-lg">
        Add Team
      </button>
    </form>
  );
}
