import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api"; // uses your existing axios instance with auth

// Map UI buckets -> BE roles
// Tweak as you prefer (e.g., ops could be ["TM","PM"] if you want both).
const BUCKET_ROLE_MAP = {
  ops: ["TM"],   // Operations Manager picker shows Territory Managers by default
  sms: ["SE"],   // "Senior Manager" picker shows Senior Executives
  pms: ["PM"],
  tms: ["TM"],
  ses: ["SE"],
  jes: ["JE"],
  fcs: ["FC"],
  mrs: ["MR"],
};

export default function TeamForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    sector: "",        // sector _id
    subSector: "",     // sub-sector (agency) _id
    teamName: "",
    // store selected USER IDs for each bucket
    ops: [],
    sms: [],
    pms: [],
    tms: [],
    ses: [],
    jes: [],
    fcs: [],
    mrs: [],
  });

  const [sectors, setSectors] = useState([]);
  const [subSectors, setSubSectors] = useState([]);
  const [loadingSectors, setLoadingSectors] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [errSectors, setErrSectors] = useState("");
  const [errSubs, setErrSubs] = useState("");

  // Users in selected agency
  const [agencyUsers, setAgencyUsers] = useState([]);   // raw list from BE
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errUsers, setErrUsers] = useState("");
  const [idToLabel, setIdToLabel] = useState({});       // { userId: "Label to show" }
  const [byRole, setByRole] = useState({});             // { ROLE: User[] }

  // Helpers
  const normalizeItems = (res) => {
    const payload = res?.data?.data ?? res?.data ?? {};
    return Array.isArray(payload?.items) ? payload.items : (Array.isArray(payload) ? payload : []);
  };
  const userLabel = (u) =>
    `${u.name || u.email}${u.empNo ? ` · ${u.empNo}` : ""}${u.role ? ` · ${u.role}` : ""}`;

  // Load sectors
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
        if (mounted) setErrSectors(e?.response?.data?.message || "Failed to load sectors");
      } finally {
        if (mounted) setLoadingSectors(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Load sub-sectors when sector changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      setSubSectors([]);
      setErrSubs("");
      if (!formData.sector) return;
      setLoadingSubs(true);
      try {
        const res = await api.get(`/admin/subsectors/sector/${formData.sector}`);
        const items = normalizeItems(res);
        if (mounted) setSubSectors(items);
      } catch (e) {
        if (mounted) setErrSubs(e?.response?.data?.message || "Failed to load agencies");
      } finally {
        if (mounted) setLoadingSubs(false);
      }
    })();
    return () => { mounted = false; };
  }, [formData.sector]);

  // Load users in the selected agency
  useEffect(() => {
    let mounted = true;
    (async () => {
      setAgencyUsers([]);
      setErrUsers("");
      setIdToLabel({});
      setByRole({});
      if (!formData.subSector) return;
      setLoadingUsers(true);
      try {
        // fetch all users in this sub-sector; BE returns populated sector/agency
        const res = await api.get("/admin/users", {
          params: { agency: formData.subSector, limit: 500 },
        });
        const items = normalizeItems(res);
        if (!mounted) return;

        setAgencyUsers(items);
        // id -> label map
        const map = {};
        items.forEach((u) => { map[u._id || u.id] = userLabel(u); });
        setIdToLabel(map);
        // group by role
        const grouped = items.reduce((acc, u) => {
          const r = String(u.role || "").toUpperCase();
          acc[r] = acc[r] || [];
          acc[r].push(u);
          return acc;
        }, {});
        setByRole(grouped);

        // clear current selections when agency changes
        setFormData((s) => ({
          ...s,
          ops: [], sms: [], pms: [], tms: [], ses: [], jes: [], fcs: [], mrs: [],
        }));
      } catch (e) {
        if (mounted) setErrUsers(e?.response?.data?.message || "Failed to load users in agency");
      } finally {
        if (mounted) setLoadingUsers(false);
      }
    })();
    return () => { mounted = false; };
  }, [formData.subSector]);

  const canSubmit = useMemo(() => !!formData.sector && !!formData.subSector && !!formData.teamName, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // If sector changes, clear subSector and users
    if (name === "sector") {
      setFormData((s) => ({ ...s, sector: value, subSector: "" }));
      setAgencyUsers([]);
      setByRole({});
      setIdToLabel({});
      return;
    }
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const handleMultiSelect = (e, field) => {
    const values = Array.from(e.target.selectedOptions, (opt) => opt.value); // store IDs
    setFormData((s) => ({ ...s, [field]: values }));
  };

  // Build options for a bucket by its mapped BE roles
  const optionsForBucket = (bucketKey) => {
    const roles = BUCKET_ROLE_MAP[bucketKey] || [];
    const users = roles.flatMap((r) => byRole[r] || []);
    // de-dup if roles overlap
    const seen = new Set();
    return users
      .filter((u) => {
        const id = u._id || u.id;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .map((u) => ({ id: u._id || u.id, label: userLabel(u) }));
  };

  const submit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    const payload = { name: formData.teamName }; // create team first

    // Prepare human-readable labels for the table (no extra fetch needed)
    const labels = {
      ops: formData.ops.map((id) => idToLabel[id]).filter(Boolean),
      sms: formData.sms.map((id) => idToLabel[id]).filter(Boolean),
      pms: formData.pms.map((id) => idToLabel[id]).filter(Boolean),
      tms: formData.tms.map((id) => idToLabel[id]).filter(Boolean),
      ses: formData.ses.map((id) => idToLabel[id]).filter(Boolean),
      jes: formData.jes.map((id) => idToLabel[id]).filter(Boolean),
      fcs: formData.fcs.map((id) => idToLabel[id]).filter(Boolean),
      mrs: formData.mrs.map((id) => idToLabel[id]).filter(Boolean),
    };

    onSubmit &&
      onSubmit(payload, {
        ...formData,        // contains selected IDs
        labels,             // contains selected labels for table display
      });

    // reset (keep sector to add multiple teams in same agency if you want)
    setFormData({
      sector: "",
      subSector: "",
      teamName: "",
      ops: [], sms: [], pms: [], tms: [], ses: [], jes: [], fcs: [], mrs: [],
    });
    setAgencyUsers([]);
    setByRole({});
    setIdToLabel({});
  };

  // Reusable multi-select
  const Bucket = ({ field, title }) => {
    const opts = optionsForBucket(field);
    return (
      <div>
        <label className="block text-gray-700 mb-1">{title}</label>
        <select
          multiple
          value={formData[field]}
          onChange={(e) => handleMultiSelect(e, field)}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!formData.subSector || loadingUsers || opts.length === 0}
        >
          {opts.length === 0 ? (
            <option value="" disabled>
              {loadingUsers ? "Loading…" : "No users available"}
            </option>
          ) : (
            opts.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))
          )}
        </select>
      </div>
    );
  };

  return (
    <form onSubmit={submit} className="max-w-3xl bg-white shadow-lg rounded-lg p-6 space-y-4">
      {/* Sector */}
      <div>
        <label className="block text-gray-700 mb-1">Sector</label>
        <select
          name="sector"
          value={formData.sector}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={loadingSectors || !!errSectors}
        >
          <option value="">{loadingSectors ? "Loading sectors..." : "Select sector"}</option>
          {sectors.map((s) => (
            <option key={s._id || s.id} value={s._id || s.id}>
              {s.name} {s.code ? `(${s.code})` : ""}
            </option>
          ))}
        </select>
        {errSectors && <p className="text-sm text-red-600 mt-1">{errSectors}</p>}
      </div>

      {/* Sub-sector / Agency */}
      <div>
        <label className="block text-gray-700 mb-1">Agency</label>
        <select
          name="subSector"
          value={formData.subSector}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={!formData.sector || loadingSubs || !!errSubs}
        >
          <option value="">
            {!formData.sector ? "Select sector first" : loadingSubs ? "Loading agencies..." : "Select agency"}
          </option>
          {subSectors.map((ss) => (
            <option key={ss._id || ss.id} value={ss._id || ss.id}>
              {ss.name} {ss.code ? `(${ss.code})` : ""}
            </option>
          ))}
        </select>
        {errSubs && <p className="text-sm text-red-600 mt-1">{errSubs}</p>}
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
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Member pickers */}
      <Bucket field="ops" title="Operations Manager" />
      <Bucket field="sms" title="Senior Manager" />
      <Bucket field="pms" title="Product Managers" />
      <Bucket field="tms" title="Territory Managers" />
      <Bucket field="ses" title="Senior Executives" />
      <Bucket field="jes" title="Junior Executives" />
      <Bucket field="fcs" title="Field Coordinators (FC)" />
      <Bucket field="mrs" title="Medical Reps (MR)" />

      {/* Users load error */}
      {errUsers && <p className="text-sm text-red-600">{errUsers}</p>}

      <button type="submit" disabled={!canSubmit} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50">
        Add Team
      </button>
    </form>
  );
}
