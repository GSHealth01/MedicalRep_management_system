import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function ChemistForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    chemist_code: "",
    name: "",
    distributor_code: "",
    address_owner_name: "",
    address_owner_birthday: "",
    purchasing_officer_name: "",
    purchasing_officer_birthday: "",
    contact_number: "",
  });

  const [distributors, setDistributors] = useState([]);
  const [loadingDistributors, setLoadingDistributors] = useState(true);
  const [errorDistributors, setErrorDistributors] = useState("");

  // Load distributors
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingDistributors(true);
      setErrorDistributors("");
      try {
        const res = await api.get("/admin/distributors", { params: { limit: 200 } });
        const payload = res?.data?.data ?? res?.data ?? {};
        const items = Array.isArray(payload?.items) ? payload.items : (Array.isArray(payload) ? payload : []);
        if (mounted) {
          setDistributors(items);
        }
      } catch (err) {
        if (mounted) setErrorDistributors("Failed to load distributors");
      } finally {
        if (mounted) setLoadingDistributors(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(formData);
    
    // Reset form
    setFormData({
      chemist_code: "",
      name: "",
      distributor_code: "",
      address_owner_name: "",
      address_owner_birthday: "",
      purchasing_officer_name: "",
      purchasing_officer_birthday: "",
      contact_number: "",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl bg-white shadow-lg rounded-lg p-6 space-y-4">
      {/* Chemist Code */}
      <div>
        <label className="block text-gray-700 mb-1">Chemist Code *</label>
        <input
          type="text"
          name="chemist_code"
          value={formData.chemist_code}
          onChange={handleChange}
          placeholder="Enter chemist code"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Name */}
      <div>
        <label className="block text-gray-700 mb-1">Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter chemist name"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Distributor */}
      <div>
        <label className="block text-gray-700 mb-1">Distributor</label>
        <select
          name="distributor_code"
          value={formData.distributor_code}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loadingDistributors}
        >
          <option value="">
            {loadingDistributors ? "Loading..." : "Select Distributor"}
          </option>
          {distributors.map((dist) => (
            <option key={dist.distributor_code} value={dist.distributor_code}>
              {dist.name || dist.distributor_code}
            </option>
          ))}
        </select>
        {errorDistributors && (
          <p className="text-sm text-red-600 mt-1">{errorDistributors}</p>
        )}
      </div>

      {/* Contact Number */}
      <div>
        <label className="block text-gray-700 mb-1">Contact Number</label>
        <input
          type="tel"
          name="contact_number"
          value={formData.contact_number}
          onChange={handleChange}
          placeholder="Enter contact number"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Address Owner Name */}
      <div>
        <label className="block text-gray-700 mb-1">Address Owner Name</label>
        <input
          type="text"
          name="address_owner_name"
          value={formData.address_owner_name}
          onChange={handleChange}
          placeholder="Enter address owner name"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Address Owner Birthday */}
      <div>
        <label className="block text-gray-700 mb-1">Address Owner Birthday</label>
        <input
          type="date"
          name="address_owner_birthday"
          value={formData.address_owner_birthday}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Purchasing Officer Name */}
      <div>
        <label className="block text-gray-700 mb-1">Purchasing Officer Name</label>
        <input
          type="text"
          name="purchasing_officer_name"
          value={formData.purchasing_officer_name}
          onChange={handleChange}
          placeholder="Enter purchasing officer name"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Purchasing Officer Birthday */}
      <div>
        <label className="block text-gray-700 mb-1">Purchasing Officer Birthday</label>
        <input
          type="date"
          name="purchasing_officer_birthday"
          value={formData.purchasing_officer_birthday}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
      >
        Add Chemist
      </button>
    </form>
  );
}
