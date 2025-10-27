import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api"; // baseURL should point to your BE (e.g., http://localhost:4000/api/v1)

export default function DoctorForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    sector: "",            // <-- NEW: sector _id
    doctorName: "",
    contactNumber: "",
    email: "",
    speciality: "",        // UI spelling; mapped to "specialty" in payload
    categorization: "",
    date: "",
  });

  const [sectors, setSectors] = useState([]);
  const [loadingSectors, setLoadingSectors] = useState(true);
  const [sectorError, setSectorError] = useState("");

  // Load sectors from DB
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingSectors(true);
      setSectorError("");
      try {
        const res = await api.get("/admin/sectors", { params: { isActive: true, limit: 200 } });
        const payload = res?.data?.data ?? res?.data ?? {};
        const items = Array.isArray(payload?.items) ? payload.items : (Array.isArray(payload) ? payload : []);
        if (mounted) setSectors(items);
      } catch (err) {
        if (mounted) setSectorError(err?.response?.data?.message || "Failed to load sectors");
      } finally {
        if (mounted) setLoadingSectors(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const canSubmit = useMemo(() => {
    return (
      !!formData.sector &&
      !!formData.doctorName &&
      !!formData.contactNumber &&
      // email optional in your BE, but keep if you want:
      (!!formData.email ? /\S+@\S+\.\S+/.test(formData.email) : true) &&
      !!formData.date
    );
  }, [formData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    // Normalize for BE
    const payload = {
      sector: formData.sector,                 // required by BE
      name: formData.doctorName,              // BE expects "name"
      contactNumber: formData.contactNumber,
      email: formData.email || undefined,
      specialty: formData.speciality || undefined,       // map UI "speciality" -> "specialty"
      categorization: formData.categorization || undefined,
      dateAdded: formData.date || undefined,
      // Optional fields you may add later: hospital, address, city, notes
    };

    if (onSubmit) onSubmit(payload, formData);

    // reset
    setFormData({
      sector: "",
      doctorName: "",
      contactNumber: "",
      email: "",
      speciality: "",
      categorization: "",
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
          <option value="">{loadingSectors ? "Loading sectors..." : "Select sector"}</option>
          {sectors.map((s) => (
            <option key={s._id || s.id} value={s._id || s.id}>
              {s.name} {s.code ? `(${s.code})` : ""}
            </option>
          ))}
        </select>
        {sectorError && <p className="text-sm text-red-600 mt-1">{sectorError}</p>}
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
