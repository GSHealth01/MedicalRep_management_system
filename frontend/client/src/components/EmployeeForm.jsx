import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api"; // baseURL -> http://localhost:4000/api/v1

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

  const [sectors, setSectors] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [loadingSectors, setLoadingSectors] = useState(true);
  const [loadingAgencies, setLoadingAgencies] = useState(false);
  const [errSectors, setErrSectors] = useState("");
  const [errAgencies, setErrAgencies] = useState("");

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

  // helpers
  const normalizeItems = (res) => {
    const payload = res?.data?.data ?? res?.data ?? {};
    return Array.isArray(payload?.items) ? payload.items : (Array.isArray(payload) ? payload : []);
  };

  // load sectors on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingSectors(true);
      setErrSectors("");
      try {
        const res = await api.get("/admin/sectors", { params: { isActive: true, limit: 200 } });
        const items = normalizeItems(res);
        if (mounted) setSectors(items);
      } catch (e) {
        if (mounted) setErrSectors(e?.response?.data?.message || "Failed to load ranges (sectors)");
      } finally {
        if (mounted) setLoadingSectors(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // when range (sector) changes, load its agencies (sub-sectors)
  useEffect(() => {
    let mounted = true;
    (async () => {
      setAgencies([]);
      setErrAgencies("");
      if (!formData.range) return;
      setLoadingAgencies(true);
      try {
        const res = await api.get(`/admin/subsectors/sector/${formData.range}`);
        const items = normalizeItems(res);
        if (mounted) setAgencies(items);
      } catch (e) {
        if (mounted) setErrAgencies(e?.response?.data?.message || "Failed to load agencies");
      } finally {
        if (mounted) setLoadingAgencies(false);
      }
    })();
    return () => { mounted = false; };
  }, [formData.range]);

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

    onSubmit && onSubmit(payload, formData);

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
          disabled={loadingSectors || !!errSectors}
        >
          <option value="">
            {loadingSectors ? "Loading ranges..." : "Select range"}
          </option>
          {sectors.map((s) => (
            <option key={s._id || s.id} value={s._id || s.id}>
              {s.name} {s.code ? `(${s.code})` : ""}
            </option>
          ))}
        </select>
        {errSectors && <p className="text-xs text-red-600 mt-1">{errSectors}</p>}
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
          disabled={!formData.range || loadingAgencies || !!errAgencies}
        >
          <option value="">
            {!formData.range
              ? "Select range first"
              : loadingAgencies
              ? "Loading agencies..."
              : "Select agency"}
          </option>
          {agencies.map((a) => (
            <option key={a._id || a.id} value={a._id || a.id}>
              {a.name} {a.code ? `(${a.code})` : ""}
            </option>
          ))}
        </select>
        {errAgencies && <p className="text-xs text-red-600 mt-1">{errAgencies}</p>}
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
