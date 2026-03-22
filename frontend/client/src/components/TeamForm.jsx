import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api"; // uses your existing axios instance with auth

export default function TeamForm({ onSubmit, team }) {
  const [formData, setFormData] = useState({
    sector: "",        // sector ID
    teamName: "",
    ops: [],
    sms: [],
    mgrs: [],
    pms: [],
    tms: [],
    ppes: [],
    ppej: [],
    fcs: [],
    mrs: []
  });

  const [sectors, setSectors] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadingSectors, setLoadingSectors] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [errSectors, setErrSectors] = useState("");
  const [errEmployees, setErrEmployees] = useState("");

  // Initialize form data with team data if editing
  useEffect(() => {
    if (team) {
      const groupedUsers = {
        ops: [],
        sms: [],
        mgrs: [],
        pms: [],
        tms: [],
        ppes: [],
        ppej: [],
        fcs: [],
        mrs: []
      };

      const designationToBucket = {
        'OM': 'ops',
        'SM': 'sms',
        'MGR': 'mgrs',
        'PM': 'pms',
        'TM': 'tms',
        'PPES': 'ppes',
        'PPEJ': 'ppej',
        'FC': 'fcs',
        'MR': 'mrs'
      };

      team.users.forEach(user => {
        const normalizedDesignation = String(user.designation || '').toUpperCase().trim();
        const bucket = designationToBucket[normalizedDesignation];
        if (bucket) {
          groupedUsers[bucket].push(user.id);
        }
      });

      setFormData({
        sector: team.sector?.id || "",
        teamName: team.name || "",
        ops: groupedUsers.ops,
        sms: groupedUsers.sms,
        mgrs: groupedUsers.mgrs,
        pms: groupedUsers.pms,
        tms: groupedUsers.tms,
        ppes: groupedUsers.ppes,
        ppej: groupedUsers.ppej,
        fcs: groupedUsers.fcs,
        mrs: groupedUsers.mrs
      });
    }
  }, [team]);

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

    // If response has data.items structure (teams API)
    if (data?.data?.items && Array.isArray(data.data.items)) {
      return data.data.items;
    }

    // If response has data directly (users API: { success, message, data: usersArray })
    if (data?.data && Array.isArray(data.data)) {
      return data.data;
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

  // Load sectors
  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoadingSectors(true);
      setErrSectors("");
      try {
        const res = await api.get("/admin/sectors");
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

  // Load employees when sector changes
  useEffect(() => {
    if (!formData.sector) {
      setEmployees([]);
      return;
    }

    let mounted = true;
    (async () => {
      setLoadingEmployees(true);
      setErrEmployees("");
      try {
        const res = await api.get("/admin/users", { params: { sector_id: formData.sector, limit: 500 } });
        // For users API, the response is { success, message, data: usersArray }
        let items = res?.data?.data || [];

        // When editing, ensure team users are included in the employees list
        if (team && team.users) {
          const existingIds = new Set(items.map(e => e.id));
          const missingUsers = team.users.filter(u => !existingIds.has(u.id));
          if (missingUsers.length > 0) {
            items = [...items, ...missingUsers];
          }
        }

        if (mounted) setEmployees(items);
      } catch (e) {
        if (mounted) setErrEmployees(e?.response?.data?.message || "Failed to load employees");
      } finally {
        if (mounted) setLoadingEmployees(false);
      }
    })();
    return () => { mounted = false; };
  }, [formData.sector, team]);

  // Group employees by designation
  const employeesByDesignation = useMemo(() => {
    const groups = {
      'OM': [],
      'SM': [],
      'MGR': [],
      'PM': [],
      'TM': [],
      'PPES': [],
      'PPEJ': [],
      'FC': [],
      'MR': []
    };

    employees.forEach(emp => {
      const designation = String(emp.designation || '').toUpperCase().trim();
      if (groups[designation] !== undefined) {
        groups[designation].push(emp);
      }
    });

    return groups;
  }, [employees]);

  const canSubmit = useMemo(() => !!formData.sector && !!formData.teamName, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => {
      const newData = { ...s, [name]: value };
      if (name === 'sector') {
        newData.ops = [];
        newData.sms = [];
        newData.mgrs = [];
        newData.pms = [];
        newData.tms = [];
        newData.ppes = [];
        newData.ppej = [];
        newData.fcs = [];
        newData.mrs = [];
      }
      return newData;
    });
  };

  const handleEmployeeSelection = (designationBucket, employeeId, checked) => {
    const fieldName = designationBucket;

    setFormData(prev => {
      const current = prev[fieldName] || [];
      if (checked) {
        return { ...prev, [fieldName]: [...current, employeeId] };
      } else {
        return { ...prev, [fieldName]: current.filter(id => id !== employeeId) };
      }
    });
  };

  const submit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    const payload = {
      name: formData.teamName,
      sector_id: parseInt(formData.sector),
      ops: formData.ops,
      sms: formData.sms,
      mgrs: formData.mgrs,
      pms: formData.pms,
      tms: formData.tms,
      ppes: formData.ppes,
      ppej: formData.ppej,
      fcs: formData.fcs,
      mrs: formData.mrs
    };

    onSubmit && onSubmit(payload, formData, team);

    // reset only if not editing
    if (!team) {
      setFormData({
        sector: "",
        teamName: "",
        ops: [],
        sms: [],
        mgrs: [],
        pms: [],
        tms: [],
        ppes: [],
        ppej: [],
        fcs: [],
        mrs: []
      });
    }
  };

  const renderEmployeeDropdown = (title, designation, fieldName) => {
    const availableEmployees = employeesByDesignation[designation] || [];
    const selectedIds = formData[fieldName] || [];

    return (
      <div>
        <label className="block text-gray-700 mb-2">{title}</label>
        {loadingEmployees ? (
          <p className="text-sm text-gray-600">Loading employees...</p>
        ) : errEmployees ? (
          <p className="text-sm text-red-600">{errEmployees}</p>
        ) : (
          <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-2">
            {availableEmployees.length === 0 ? (
              <p className="text-sm text-gray-500">No {title.toLowerCase()} available</p>
            ) : (
              availableEmployees.map((emp) => {
                const isSelected = selectedIds.includes(emp.id);
                return (
                  <div key={emp.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`${fieldName}-${emp.id}`}
                      checked={isSelected}
                      onChange={(e) => handleEmployeeSelection(fieldName, emp.id, e.target.checked)}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={`${fieldName}-${emp.id}`}
                      className="text-sm text-gray-700 cursor-pointer flex-1"
                    >
                      {emp.name} ({emp.emp_no})
                    </label>
                  </div>
                );
              })
            )}
          </div>
        )}
        {selectedIds.length > 0 && (
          <p className="text-xs text-gray-600 mt-1">
            {selectedIds.length} selected
          </p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={submit} className="max-w-4xl bg-white shadow-lg rounded-lg p-6 space-y-6">
      {/* Sector */}
      <div>
        <label className="block text-gray-700 mb-1">Sector</label>
        <select
          name="sector"
          value={formData.sector}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
          required
          disabled={loadingSectors || !!errSectors || !!team}
        >
          <option value="">
            {loadingSectors ? "Loading sectors..." : "Select sector"}
          </option>
          {sectors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.agency} - {s.range}
            </option>
          ))}
        </select>
        {errSectors && <p className="text-sm text-red-600 mt-1">{errSectors}</p>}
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
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
          required
          disabled={!!team}
        />
      </div>


      {formData.sector && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderEmployeeDropdown("Operations Managers", "OM", "ops")}
          {renderEmployeeDropdown("Senior Managers", "SM", "sms")}
          {renderEmployeeDropdown("Managers", "MGR", "mgrs")}
          {renderEmployeeDropdown("Products Managers", "PM", "pms")}
          {renderEmployeeDropdown("Territory Managers", "TM", "tms")}
          {renderEmployeeDropdown("Promo Execs - Senior", "PPES", "ppes")}
          {renderEmployeeDropdown("Promo Execs - Junior", "PPEJ", "ppej")}
          {renderEmployeeDropdown("Field Coordinators", "FC", "fcs")}
          {renderEmployeeDropdown("Medical Representatives", "MR", "mrs")}
        </div>
      )}

      <button type="submit" disabled={!canSubmit} className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-2 rounded-md hover:from-red-700 hover:to-red-800 transition disabled:opacity-50 shadow-lg">
        {team ? "Update Team" : "Add Team"}
      </button>
    </form>
  );
}
