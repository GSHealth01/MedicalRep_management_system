import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api"; // baseURL should point to your BE (e.g., http://localhost:4000/api/v1)

export default function TeamForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    sector: "",           // NEW: sector _id
    subSector: "",        // NEW: sub-sector (agency) _id
    teamName: "",
    ops: [],
    sms: [],
    pms: [],
    tms: [],
    ses: [],
    jes: [],
    fcs: [],
    mrs: [],
  });

  // Dummy dropdown values for members (you can later fetch by role from BE)
  const ops = ["Ops A", "Ops B"];
  const sms = ["SM A", "SM B"];
  const pms = ["PM A", "PM B"];
  const tms = ["TM A", "TM B"];
  const ses = ["SE A", "SE B"];
  const jes = ["JE A", "JE B"];
  const fcs = ["FC A", "FC B"];
  const mrs = ["MR A", "MR B", "MR C"];

  const [sectors, setSectors] = useState([]);
  const [subSectors, setSubSectors] = useState([]);
  const [loadingSectors, setLoadingSectors] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [errSectors, setErrSectors] = useState("");
  const [errSubs, setErrSubs] = useState("");

  // Helpers
  const normalizeItems = (res) => {
    const payload = res?.data?.data ?? res?.data ?? {};
    return Array.isArray(payload?.items) ? payload.items : (Array.isArray(payload) ? payload : []);
  };

  // Load sectors on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingSectors(true);
      setErrSectors("");
      try {
        const res = await api.get("/admin/sectors", { params: { isActive: true, limit: 200 } });
        if (mounted) setSectors(normalizeItems(res));
      } catch (e) {
        if (mounted) setErrSectors(e?.response?.data?.message || "Failed to load sectors");
      } finally {
        if (mounted) setLoadingSectors(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // When sector changes, load its sub-sectors (agencies)
  useEffect(() => {
    let mounted = true;
    (async () => {
      setSubSectors([]);
      setErrSubs("");
      if (!formData.sector) return;
      setLoadingSubs(true);
      try {
        const res = await api.get(`/admin/subsectors/sector/${formData.sector}`);
        if (mounted) setSubSectors(normalizeItems(res));
      } catch (e) {
        if (mounted) setErrSubs(e?.response?.data?.message || "Failed to load agencies");
      } finally {
        if (mounted) setLoadingSubs(false);
      }
    })();
    return () => { mounted = false; };
  }, [formData.sector]);

  const canSubmit = useMemo(() => {
    return !!formData.sector && !!formData.subSector && !!formData.teamName;
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // clear subSector if sector is changed
    if (name === "sector") {
      setFormData((s) => ({ ...s, sector: value, subSector: "" }));
      return;
    }
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const handleMultiSelect = (e, field) => {
    const values = Array.from(e.target.selectedOptions, (opt) => opt.value);
    setFormData((s) => ({ ...s, [field]: values }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    // Minimal BE payload (members can be added later via member endpoints)
    const payload = {
      name: formData.teamName,
      // you can also send a code if your BE expects it:
      // code: `TEAM-${formData.teamName.trim().toUpperCase().replace(/[^A-Z0-9]+/g,"-").slice(0,16)}`,
    };

    // Pass both normalized payload AND raw form (contains sector/subSector and members)
    onSubmit && onSubmit(payload, formData);

    // Reset form
    setFormData({
      sector: "",
      subSector: "",
      teamName: "",
      ops: [],
      sms: [],
      pms: [],
      tms: [],
      ses: [],
      jes: [],
      fcs: [],
      mrs: [],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl bg-white shadow-lg rounded-lg p-6 space-y-4">
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

      {/* Sub-sector / Agency (dependent on Sector) */}
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
            {!formData.sector
              ? "Select sector first"
              : loadingSubs
              ? "Loading agencies..."
              : "Select agency"}
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

      {/* Operations Manager */}
      <div>
        <label className="block text-gray-700 mb-1">Operations Manager</label>
        <select multiple value={formData.ops} onChange={(e) => handleMultiSelect(e, "ops")} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          {ops.map((op) => <option key={op} value={op}>{op}</option>)}
        </select>
      </div>

      {/* Senior Manager */}
      <div>
        <label className="block text-gray-700 mb-1">Senior Manager</label>
        <select multiple value={formData.sms} onChange={(e) => handleMultiSelect(e, "sms")} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          {sms.map((sm) => <option key={sm} value={sm}>{sm}</option>)}
        </select>
      </div>

      {/* Project Manager */}
      <div>
        <label className="block text-gray-700 mb-1">Project Manager</label>
        <select multiple value={formData.pms} onChange={(e) => handleMultiSelect(e, "pms")} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          {pms.map((pm) => <option key={pm} value={pm}>{pm}</option>)}
        </select>
      </div>

      {/* Territory Manager */}
      <div>
        <label className="block text-gray-700 mb-1">Territory Manager</label>
        <select multiple value={formData.tms} onChange={(e) => handleMultiSelect(e, "tms")} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          {tms.map((tm) => <option key={tm} value={tm}>{tm}</option>)}
        </select>
      </div>

      {/* Senior Executive */}
      <div>
        <label className="block text-gray-700 mb-1">Senior Executive</label>
        <select multiple value={formData.ses} onChange={(e) => handleMultiSelect(e, "ses")} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          {ses.map((se) => <option key={se} value={se}>{se}</option>)}
        </select>
      </div>

      {/* Junior Executive */}
      <div>
        <label className="block text-gray-700 mb-1">Junior Executive</label>
        <select multiple value={formData.jes} onChange={(e) => handleMultiSelect(e, "jes")} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          {jes.map((je) => <option key={je} value={je}>{je}</option>)}
        </select>
      </div>

      {/* Field Coordinators */}
      <div>
        <label className="block text-gray-700 mb-1">Field Coordinators (FC)</label>
        <select multiple value={formData.fcs} onChange={(e) => handleMultiSelect(e, "fcs")} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          {fcs.map((fc) => <option key={fc} value={fc}>{fc}</option>)}
        </select>
      </div>

      {/* Medical Reps */}
      <div>
        <label className="block text-gray-700 mb-1">Medical Reps (MR)</label>
        <select multiple value={formData.mrs} onChange={(e) => handleMultiSelect(e, "mrs")} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          {mrs.map((mr) => <option key={mr} value={mr}>{mr}</option>)}
        </select>
      </div>

      <button type="submit" disabled={!canSubmit} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50">
        Add Team
      </button>
    </form>
  );
}
