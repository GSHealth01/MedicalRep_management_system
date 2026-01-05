import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api"; // Add import for API

export default function EmployeeForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    username: "",       // used as email
    password: "",       // NEW
    name: "",           // NEW: Employee's full name
    empNo: "",
    designation: "",    // maps to role (MR/FC/JE/SE/TM/PM/ADMIN)
    birthday: "",
    joinDate: "",
    agency: "",         // subSector _id
    range: "",          // sector _id
    distributors: []    // Array of selected distributor IDs
  });

  // Add distributors state
  const [distributors, setDistributors] = useState([]);
  const [loadingDistributors, setLoadingDistributors] = useState(true);
  const [distributorError, setDistributorError] = useState("");

  // Add agencies state
  const [agencies, setAgencies] = useState([]);
  const [loadingAgencies, setLoadingAgencies] = useState(true);
  const [agencyError, setAgencyError] = useState("");

  // Load distributors from API
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingDistributors(true);
      setDistributorError("");
      try {
        const res = await api.get("/admin/distributors", { params: { limit: 200 } });
        const payload = res?.data?.data ?? res?.data ?? {};
        const items = Array.isArray(payload?.items) ? payload.items : (Array.isArray(payload) ? payload : []);
        if (mounted) setDistributors(items);
      } catch (err) {
        if (mounted) setDistributorError(err?.response?.data?.message || "Failed to load distributors");
      } finally {
        if (mounted) setLoadingDistributors(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Load agencies from API
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingAgencies(true);
      setAgencyError("");
      try {
        const res = await api.get("/agencies");
        const payload = res?.data?.agencies || [];
        if (mounted) setAgencies(payload);
      } catch (err) {
        if (mounted) setAgencyError(err?.response?.data?.message || "Failed to load agencies");
      } finally {
        if (mounted) setLoadingAgencies(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Hardcoded ranges
  const ranges = useMemo(() => [
    { id: 'A', name: 'A' },
    { id: 'B', name: 'B' }
  ], []);

  const [filteredAgencies, setFilteredAgencies] = useState([]);

  // normalize payload shape in a way BE expects
  const canSubmit = useMemo(() => {
    const hasEmail = /\S+@\S+\.\S+/.test(formData.username);
    return (
      !!formData.name &&
      hasEmail &&
      !!formData.password &&
      !!formData.empNo &&
      !!formData.designation &&
      !!formData.range &&
      !!formData.agency
    );
  }, [formData]);

  // when range changes, filter agencies based on the selected range
  useEffect(() => {
    if (!formData.range) {
      setFilteredAgencies([]);
      return;
    }
    // Filter agencies based on the selected range
    // Agencies from API might have different structure, so we check if name starts with range
    const filtered = agencies.filter(agency => {
      // Check if agency name starts with the selected range (A or B)
      return agency.name && agency.name.startsWith(formData.range);
    });
    setFilteredAgencies(filtered);
  }, [formData.range, agencies]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // clear dependent agency when range changes
    if (name === "range") {
      setFormData((s) => ({ ...s, range: value, agency: "" }));
      return;
    }
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const handleDistributorChange = (distributorId) => {
    setFormData((s) => {
      const currentDistributors = s.distributors || [];
      if (currentDistributors.includes(distributorId)) {
        // Remove distributor if already selected
        return {
          ...s,
          distributors: currentDistributors.filter(id => id !== distributorId)
        };
      } else {
        // Add distributor if not selected
        return {
          ...s,
          distributors: [...currentDistributors, distributorId]
        };
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    const email = formData.username.trim().toLowerCase();
    const nameGuess = email.includes("@") ? email.split("@")[0] : formData.username.trim();

    // For Prisma backend, we need to send the data to the correct endpoint
    // The admin/users endpoint expects specific field names that match the database schema
    const prismaPayload = {
      name: formData.name || nameGuess || formData.empNo,
      email: email,
      password: formData.password,
      empNo: formData.empNo,
      designation: formData.designation,
      agency_id: formData.agency,           // Convert to agency_id (string is fine for now)
      range_id: formData.range,             // Convert to range_id (string is fine for now)

      // Dates with correct field names
      birthday: formData.birthday || undefined,
      join_date: formData.joinDate || undefined,  // joinDate -> join_date
      team_id: undefined, // Optional, can be added later
      distributor_ids: formData.distributors || [] // Multiple distributors
    };

    onSubmit && onSubmit(prismaPayload, formData);

    // reset
    setFormData({
      username: "",
      password: "",
      empNo: "",
      designation: "",
      birthday: "",
      joinDate: "",
      agency: "",
      range: "",
      distributors: []
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl bg-white shadow-lg rounded-lg p-6 space-y-4">
      {/* Employee Name */}
      <div>
        <label className="block text-gray-700 mb-1">Employee Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter employee full name"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
          required
        />
      </div>

      {/* Username (Email) */}
      <div>
        <label className="block text-gray-700 mb-1">Username (Email)</label>
        <input
          type="email"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="user@example.com"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
          required
        />
      </div>

      {/* Password */}
      <div>
        <label className="block text-gray-700 mb-1">Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter a temporary password"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
          required
          minLength={7}
        />
        <p className="text-xs text-gray-500 mt-1">Min 7 chars. You can enforce complexity server-side.</p>
      </div>


      {/* Employee No */}
      <div>
        <label className="block text-gray-700 mb-1">Employee No</label>
        <input
          type="text"
          name="empNo"
          value={formData.empNo}
          onChange={handleChange}
          placeholder="Enter employee number"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
          required
        />
      </div>

      {/* Join Date */}
      <div>
        <label className="block text-gray-700 mb-1">Join Date</label>
        <input
          type="date"
          name="joinDate"
          value={formData.joinDate}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
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
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
        />
      </div>

      {/* Designation (role) */}
      <div>
        <label className="block text-gray-700 mb-1">Designation</label>
        <select
          name="designation"
          value={formData.designation}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
          required
        >
          <option value="">Select designation</option>
          <option value="MR">Medical Rep</option>
          <option value="FC">Field Coordinator</option>
          <option value="JE">Junior Executive</option>
          <option value="SE">Senior Executive</option>
          <option value="TM">Territory Manager</option>
          <option value="PM">Product Manager</option>
          <option value="OM">Operations Manager</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {/* Range (Sector) */}
      <div>
        <label className="block text-gray-700 mb-1">Range (Sector)</label>
        <select
          name="range"
          value={formData.range}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
          required={formData.designation !== "ADMIN"}
        >
          <option value="">Select range</option>
          {ranges.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {/* Agency (Sub-sector) */}
      <div>
        <label className="block text-gray-700 mb-1">Agency (Sub-sector)</label>
        <select
          name="agency"
          value={formData.agency}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
          required={formData.designation !== "ADMIN"}
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
          {filteredAgencies.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        {agencyError && (
          <p className="text-sm text-red-600 mt-1">{agencyError}</p>
        )}
        {filteredAgencies.length === 0 && !loadingAgencies && !agencyError && formData.range && (
          <p className="text-sm text-gray-500 mt-1">No agencies found for this range</p>
        )}
      </div>

      {/* Distributors (Multiple Selection with Checkboxes) */}
      <div>
        <label className="block text-gray-700 mb-2">Distributors (Select multiple)</label>
        {loadingDistributors ? (
          <p className="text-sm text-gray-600">Loading distributors...</p>
        ) : distributorError ? (
          <p className="text-sm text-red-600">{distributorError}</p>
        ) : (
          <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-2">
            {distributors.length === 0 ? (
              <p className="text-sm text-gray-500">No distributors available</p>
            ) : (
              distributors.map((distributor) => {
                const distributorId = distributor.distributor_code || distributor.id || distributor.name;
                const distributorName = distributor.name || distributor.distributor_name || distributorId;
                const isSelected = formData.distributors.includes(distributorId);
                
                return (
                  <div key={distributorId} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`distributor-${distributorId}`}
                      checked={isSelected}
                      onChange={() => handleDistributorChange(distributorId)}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={`distributor-${distributorId}`}
                      className="text-sm text-gray-700 cursor-pointer flex-1"
                    >
                      {distributorName} ({distributorId})
                    </label>
                  </div>
                );
              })
            )}
          </div>
        )}
        {formData.distributors.length > 0 && (
          <p className="text-xs text-gray-600 mt-1">
            {formData.distributors.length} distributor(s) selected
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-2 rounded-md hover:from-red-700 hover:to-red-800 transition disabled:opacity-50 shadow-lg"
      >
        Add Employee
      </button>
    </form>
  );
}
