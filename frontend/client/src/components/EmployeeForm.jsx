import { useEffect, useMemo, useState } from "react";

export default function EmployeeForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    username: "",       // used as email
    password: "",       // NEW
    empNo: "",
    designation: "",    // maps to role (MR/FC/JE/SE/TM/PM/ADMIN)
    birthday: "",
    joinDate: "",
    promotionDate: "",
    agency: "",         // subSector _id
    range: "",          // sector _id
    distributor: "",
    date: "",
  });

  // Hardcoded ranges and agencies
  const ranges = useMemo(() => [
    { id: 'A', name: 'A' },
    { id: 'B', name: 'B' }
  ], []);

  const agencies = useMemo(() => [
    { id: 'A1', name: 'A1', range: 'A' },
    { id: 'A2', name: 'A2', range: 'A' },
    { id: 'A3', name: 'A3', range: 'A' },
    { id: 'A4', name: 'A4', range: 'A' },
    { id: 'B1', name: 'B1', range: 'B' },
    { id: 'B2', name: 'B2', range: 'B' },
    { id: 'B3', name: 'B3', range: 'B' },
    { id: 'B4', name: 'B4', range: 'B' },
    { id: 'B5', name: 'B5', range: 'B' },
    { id: 'B6', name: 'B6', range: 'B' },
    { id: 'B7', name: 'B7', range: 'B' }
  ], []);

  const [filteredAgencies, setFilteredAgencies] = useState([]);

  // normalize payload shape in a way BE expects
  const canSubmit = useMemo(() => {
    const hasEmail = /\S+@\S+\.\S+/.test(formData.username);
    const needsPromo = formData.designation && formData.designation !== "MR" ? !!formData.promotionDate : true;
    return (
      hasEmail &&
      !!formData.password &&
      !!formData.empNo &&
      !!formData.designation &&
      !!formData.range &&
      !!formData.agency &&
      needsPromo
    );
  }, [formData]);

  // helpers - kept for potential future use
  // const normalizeItems = (res) => {
  //   const payload = res?.data?.data ?? res?.data ?? {};
  //   return Array.isArray(payload?.items) ? payload.items : (Array.isArray(payload) ? payload : []);
  // };

  // Memoize agencies to avoid re-creating on every render
  const memoizedAgencies = agencies;

  // when range changes, filter agencies based on the selected range
  useEffect(() => {
    if (!formData.range) {
      setFilteredAgencies([]);
      return;
    }
    const filtered = memoizedAgencies.filter(agency => agency.range === formData.range);
    setFilteredAgencies(filtered);
  }, [formData.range, memoizedAgencies]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // clear dependent agency when range changes
    if (name === "range") {
      setFormData((s) => ({ ...s, range: value, agency: "" }));
      return;
    }
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    const email = formData.username.trim().toLowerCase();
    const nameGuess = email.includes("@") ? email.split("@")[0] : formData.username.trim();

    const payload = {
      // BE-required
      name: nameGuess || formData.empNo,
      email,
      password: formData.password,           // NEW
      role: String(formData.designation || "").toUpperCase(),
      range: formData.range,                // "range" in FE -> sector in BE
      agency: formData.agency,            // "agency" in FE -> subSector in BE

      // optional metadata your schema already supports
      empNo: formData.empNo,
      designation: formData.designation,
      distributor: formData.distributor,

      // dates (ignored if schema doesn't have them; fine under mongoose strict)
      birthday: formData.birthday || undefined,
      joinDate: formData.joinDate || undefined,
      promotionDate:
        formData.designation && formData.designation !== "MR"
          ? (formData.promotionDate || undefined)
          : undefined,
      dateAdded: formData.date || undefined,
    };

    // For Prisma backend, we need to send the data to the correct endpoint
    // The admin/users endpoint expects different field names
    const prismaPayload = {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      role: payload.role,
      empNo: payload.empNo,
      designation: payload.designation,
      agency: payload.agency,
      range: payload.range,
      distributor: payload.distributor
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
      promotionDate: "",
      agency: "",
      range: "",
      distributor: "",
      date: "",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl bg-white shadow-lg rounded-lg p-6 space-y-4">
      {/* Username (Email) */}
      <div>
        <label className="block text-gray-700 mb-1">Username (Email)</label>
        <input
          type="email"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="user@example.com"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Designation (role) */}
      <div>
        <label className="block text-gray-700 mb-1">Designation</label>
        <select
          name="designation"
          value={formData.designation}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select designation</option>
          <option value="MR">Medical Rep</option>
          <option value="FC">Field Coordinator</option>
          <option value="JE">Junior Executive</option>
          <option value="SE">Senior Executive</option>
          <option value="TM">Territory Manager</option>
          <option value="PM">Product Manager</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {/* Promotion Date (exclude for MR) */}
      {formData.designation && formData.designation !== "MR" && (
        <div>
          <label className="block text-gray-700 mb-1">
            Date of Promotion as {formData.designation}
          </label>
          <input
            type="date"
            name="promotionDate"
            value={formData.promotionDate}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Range (Sector) */}
      <div>
        <label className="block text-gray-700 mb-1">Range (Sector)</label>
        <select
          name="range"
          value={formData.range}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required={formData.designation !== "ADMIN"}
          disabled={!formData.range}
        >
          <option value="">
            {!formData.range
              ? "Select range first"
              : "Select agency"}
          </option>
          {filteredAgencies.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {/* Distributor */}
      <div>
        <label className="block text-gray-700 mb-1">Distributor</label>
        <input
          type="text"
          name="distributor"
          value={formData.distributor}
          onChange={handleChange}
          placeholder="Enter distributor"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Date (record date) */}
      <div>
        <label className="block text-gray-700 mb-1">Date</label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
      >
        Add Employee
      </button>
    </form>
  );
}
