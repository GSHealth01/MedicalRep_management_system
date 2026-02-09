import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api"; // baseURL should point to your BE (e.g., http://localhost:4000/api/v1)

export default function DoctorForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    range: "",             // "A" or "B"
    agency: "",            // agency name like "A1", "A2", etc.
    doctorName: "",
    contactNumber: "",
    email: "",
    speciality: "",        // UI spelling; mapped to "specialty" in payload
    categorization: "",
    birthday: "",
    town: "",
    date: "",
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

    // Load ranges (hardcoded)
    setRanges([
      { id: 'A', name: 'A' },
      { id: 'B', name: 'B' }
    ]);
    setLoadingRanges(false);

    // Load sectors as agencies
    (async () => {
      setLoadingAgencies(true);
      setErrAgencies("");
      try {
        const res = await api.get("/admin/sectors");
        const payload = res?.data?.data?.items || [];
        // Map sectors to agency format
        const agencyList = payload.map(sector => ({
          id: sector.id,
          name: sector.agency
        }));
        if (mounted) setAgencies(agencyList);
      } catch (e) {
        if (mounted) setErrAgencies(e?.response?.data?.message || "Failed to load sectors");
      } finally {
        if (mounted) setLoadingAgencies(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Filter agencies based on selected range
  const filteredAgencies = useMemo(() => {
    if (!formData.range) return [];
    return agencies.filter(agency => agency.name.startsWith(formData.range));
  }, [agencies, formData.range]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => {
      const newData = { ...s, [name]: value };
      // Clear agency when range changes
      if (name === 'range') {
        newData.agency = '';
      }
      return newData;
    });
  };

  const canSubmit = useMemo(() => {
    return (
      !!formData.range &&
      !!formData.agency &&
      !!formData.doctorName.trim() &&
      !!formData.contactNumber.trim() &&
      // email optional in your BE, but keep if you want:
      (!!formData.email ? /\S+@\S+\.\S+/.test(formData.email) : true) &&
      !!formData.date
    );
  }, [formData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    // Find the range ID
    const selectedRange = ranges.find(r => r.name === formData.range);

    if (!selectedRange) {
      alert("Invalid range selection");
      return;
    }

    // Find the selected agency
    const selectedAgency = agencies.find(a => a.name === formData.agency);

    if (!selectedAgency) {
      alert("Invalid agency selection");
      return;
    }

    // Normalize for BE
    const payload = {
      sector_id: selectedAgency.id,           // required by BE
      name: formData.doctorName,              // BE expects "name"
      contactNumber: formData.contactNumber,
      email: formData.email || undefined,
      specialty: formData.speciality || undefined,       // map UI "speciality" -> "specialty"
      categorization: formData.categorization || undefined,
      birthday: formData.birthday || undefined,
      town: formData.town || undefined,
      dateAdded: formData.date || undefined,
      // Optional fields you may add later: hospital, address, city, notes
    };

    if (onSubmit) onSubmit(payload, formData);

    // reset
    setFormData({
      range: "",
      agency: "",
      doctorName: "",
      contactNumber: "",
      email: "",
      speciality: "",
      categorization: "",
      birthday: "",
      town: "",
      date: "",
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl bg-white shadow-lg rounded-lg p-6 space-y-4"
    >
      {/* Range */}
      <div>
        <label className="block text-gray-700 mb-1">Range</label>
        <select
          name="range"
          value={formData.range}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select Range</option>
          <option value="A">A</option>
          <option value="B">B</option>
        </select>
      </div>

      {/* Agency */}
      <div>
        <label className="block text-gray-700 mb-1">Agency</label>
        <select
          name="agency"
          value={formData.agency}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={!formData.range || loadingAgencies || !!errAgencies}
        >
          <option value="">
            {loadingAgencies ? "Loading agencies..." : formData.range ? "Select agency" : "Select range first"}
          </option>
          {filteredAgencies.map((a) => (
            <option key={a.id} value={a.name}>
              {a.name}
            </option>
          ))}
        </select>
        {errAgencies && <p className="text-sm text-red-600 mt-1">{errAgencies}</p>}
      </div>

      {/* Doctor Name */}
      <div>
        <label className="block text-gray-700 mb-1">Doctor Name</label>
        <input
          type="text"
          name="doctorName"
          value={formData.doctorName}
          onChange={handleChange}
          placeholder="Enter doctor's name"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Contact Number */}
      <div>
        <label className="block text-gray-700 mb-1">Contact Number</label>
        <input
          type="tel"
          name="contactNumber"
          value={formData.contactNumber}
          onChange={handleChange}
          placeholder="Enter contact number"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-gray-700 mb-1">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter email address"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Speciality (UI) */}
      <div>
        <label className="block text-gray-700 mb-1">Speciality</label>
        <input
          type="text"
          name="speciality"
          value={formData.speciality}
          onChange={handleChange}
          placeholder="Enter speciality"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Categorization */}
      <div>
        <label className="block text-gray-700 mb-1">Categorization</label>
        <input
          type="text"
          name="categorization"
          value={formData.categorization}
          onChange={handleChange}
          placeholder="Enter categorization"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Birthday */}
      <div>
        <label className="block text-gray-700 mb-1">Birthday</label>
        <input
          type="date"
          name="birthday"
          value={formData.birthday}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Town */}
      <div>
        <label className="block text-gray-700 mb-1">Town</label>
        <input
          type="text"
          name="town"
          value={formData.town}
          onChange={handleChange}
          placeholder="Enter town"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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
        Add Doctor
      </button>
    </form>
  );
}
