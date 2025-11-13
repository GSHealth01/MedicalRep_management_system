import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api"; // uses your existing axios instance with auth

// Map UI buckets -> BE roles
// Based on the actual user designation codes we see in the database
const BUCKET_ROLE_MAP = {
  ops: ["OM", "TM", "OPERATIONS_MANAGER", "TERRITORY_MANAGER"],   // Operations Manager picker
  sms: ["SE", "SENIOR_EXECUTIVE", "SENIOR_MANAGER"],   // "Senior Manager" picker shows Senior Executives
  pms: ["PM", "PRODUCT_MANAGER"],  // Product Managers
  tms: ["TM", "TERRITORY_MANAGER"],  // Territory Managers
  ses: ["SE", "SENIOR_EXECUTIVE"],  // Senior Executives
  jes: ["JE", "JUNIOR_EXECUTIVE"],  // Junior Executives
  fcs: ["FC", "FIELD_COORDINATOR"],  // Field Coordinators
  mrs: ["MR", "MEDICAL_REP", "MEDICAL_REPRESENTATIVE"],  // Medical Reps
};

export default function TeamForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    range: "",         // range _id
    teamName: "",
    agency: "",        // agency _id (new field)
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

  const [ranges, setRanges] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [loadingRanges, setLoadingRanges] = useState(false); // No longer loading from API
  const [loadingAgencies, setLoadingAgencies] = useState(true);
  const [errRanges, setErrRanges] = useState("");
  const [errAgencies, setErrAgencies] = useState("");

  // Users in selected range
  const [rangeUsers, setRangeUsers] = useState([]);     // raw list from BE
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errUsers, setErrUsers] = useState("");
  const [idToLabel, setIdToLabel] = useState({});       // { userId: "Label to show" }
  const [byRole, setByRole] = useState({});             // { ROLE: User[] }

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
  
  const userLabel = (u) =>
    `${u.name || u.email}${u.emp_no ? ` · ${u.emp_no}` : ""}${u.designation ? ` · ${u.designation}` : ""}`;

  // Initialize hardcoded ranges (just A and B) and load agencies
  useEffect(() => {
    let mounted = true;
    
    // Set hardcoded ranges
    if (mounted) {
      setRanges([
        { id: 'A', name: 'A' },
        { id: 'B', name: 'B' }
      ]);
      setLoadingRanges(false);
    }

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

  // Load users in the selected range and agency
  useEffect(() => {
    let mounted = true;
    (async () => {
      setRangeUsers([]);
      setErrUsers("");
      setIdToLabel({});
      setByRole({});
      if (!formData.range || !formData.agency) return;
      setLoadingUsers(true);
      try {
        // fetch all users in this range AND agency
        const res = await api.get("/admin/users", {
          params: {
            range: formData.range,
            agency: formData.agency,
            limit: 500
          },
        });
        const items = normalizeItems(res);
        if (!mounted) return;

        console.log('Loaded users for agency/range:', formData.agency, formData.range, items.length);
        console.log('Users data:', items); // Debug log
        
        setRangeUsers(items);
        
        // id -> label map (ensure we use the correct id field)
        const map = {};
        items.forEach((u) => {
          const userId = u.id || u._id; // Use correct id field
          if (userId) {
            map[userId] = userLabel(u);
          }
        });
        setIdToLabel(map);
        
        // group by role (use designation field from user data)
        const grouped = items.reduce((acc, u) => {
          const designation = String(u.designation || u.role || "").toUpperCase().trim();
          console.log(`User ${u.name} has designation: "${designation}"`);
          if (designation) {
            acc[designation] = acc[designation] || [];
            acc[designation].push(u);
          }
          return acc;
        }, {});
        setByRole(grouped);

        console.log('Users grouped by designation:', Object.keys(grouped));
        console.log('Grouped users:', grouped);

        // clear current selections when range or agency changes
        setFormData((s) => ({
          ...s,
          ops: [], sms: [], pms: [], tms: [], ses: [], jes: [], fcs: [], mrs: [],
        }));
      } catch (e) {
        if (mounted) setErrUsers(e?.response?.data?.message || "Failed to load users in range");
        console.error('Error loading users:', e); // Debug error
      } finally {
        if (mounted) setLoadingUsers(false);
      }
    })();
    return () => { mounted = false; };
  }, [formData.range, formData.agency]);

  const canSubmit = useMemo(() => !!formData.range && !!formData.teamName && !!formData.agency, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const handleMultiSelect = (e, field) => {
    const values = Array.from(e.target.selectedOptions, (opt) => opt.value); // store IDs
    setFormData((s) => ({ ...s, [field]: values }));
  };

  // Build options for a bucket by its mapped BE roles
  const optionsForBucket = (bucketKey) => {
    const roles = BUCKET_ROLE_MAP[bucketKey] || [];
    console.log(`Building options for ${bucketKey}, searching for roles:`, roles);
    console.log('Available roles in byRole:', Object.keys(byRole));
    
    const users = roles.flatMap((r) => {
      const roleUsers = byRole[r] || [];
      console.log(`Role "${r}" found ${roleUsers.length} users:`, roleUsers);
      return roleUsers;
    });
    
    console.log(`Total users for ${bucketKey}:`, users.length);
    
    // de-dup if roles overlap
    const seen = new Set();
    const options = users
      .filter((u) => {
        const id = u.id || u._id; // Use correct id field
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .map((u) => ({
        id: u.id || u._id,
        label: userLabel(u)
      }));
      
    console.log(`Final options for ${bucketKey}:`, options);
    return options;
  };

  const submit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    const payload = {
      name: formData.teamName, // create team first
      agency_id: parseInt(formData.agency), // new agency field
      range_id: parseInt(formData.range) // range_id field
    };

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

    // reset (keep range to add multiple teams in same range if you want)
    setFormData({
      range: "",
      teamName: "",
      agency: "",
      ops: [], sms: [], pms: [], tms: [], ses: [], jes: [], fcs: [], mrs: [],
    });
    setRangeUsers([]);
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
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
          disabled={!formData.range || loadingUsers || opts.length === 0}
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

      <button type="submit" disabled={!canSubmit} className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-2 rounded-md hover:from-red-700 hover:to-red-800 transition disabled:opacity-50 shadow-lg">
        Add Team
      </button>
    </form>
  );
}
