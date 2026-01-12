import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api"; // uses your existing axios instance with auth

export default function TeamForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    range: "",         // "A" or "B"
    teamName: "",
    agency: "",        // agency name like "A1", "A2", etc.
    medicalReps: [],   // array of selected employee IDs
    fieldCoordinators: [],
    juniorExecutives: [],
    seniorExecutives: [],
    territoryManagers: [],
    productManagers: []
  });

  const [ranges, setRanges] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadingRanges, setLoadingRanges] = useState(false);
  const [loadingAgencies, setLoadingAgencies] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [errRanges, setErrRanges] = useState("");
  const [errAgencies, setErrAgencies] = useState("");
  const [errEmployees, setErrEmployees] = useState("");

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

  // Load ranges and agencies
  useEffect(() => {
    let mounted = true;

    // Load ranges
    (async () => {
      setLoadingRanges(true);
      setErrRanges("");
      try {
        const res = await api.get("/ranges");
        const items = normalizeItems(res);
        if (mounted) setRanges(items);
      } catch (e) {
        if (mounted) setErrRanges(e?.response?.data?.message || "Failed to load ranges");
      } finally {
        if (mounted) setLoadingRanges(false);
      }
    })();

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

  // Load employees when range changes
  useEffect(() => {
    if (!formData.range) {
      setEmployees([]);
      return;
    }

    let mounted = true;
    (async () => {
      setLoadingEmployees(true);
      setErrEmployees("");
      try {
        const res = await api.get("/admin/users", { params: { range: formData.range, limit: 500 } });
        // For users API, the response is { success, message, data: usersArray }
        const items = res?.data?.data || [];
        if (mounted) setEmployees(items);
      } catch (e) {
        if (mounted) setErrEmployees(e?.response?.data?.message || "Failed to load employees");
      } finally {
        if (mounted) setLoadingEmployees(false);
      }
    })();
    return () => { mounted = false; };
  }, [formData.range]);

  // Filter agencies based on selected range
  const filteredAgencies = useMemo(() => {
    if (!formData.range) return [];
    return agencies.filter(agency => agency.name.startsWith(formData.range));
  }, [agencies, formData.range]);

  // Group employees by designation
  const employeesByDesignation = useMemo(() => {
    const groups = {
      'Medical Rep': [],
      'Field Coordinator': [],
      'Junior Executive': [],
      'Senior Executive': [],
      'Territory Manager': [],
      'Product Manager': []
    };

    // Map database designations to display names
    const designationMap = {
      'MR': 'Medical Rep',
      'MEDICAL REP': 'Medical Rep',
      'MEDICAL_REP': 'Medical Rep',
      'MEDICAL_REPRESENTATIVE': 'Medical Rep',
      'FC': 'Field Coordinator',
      'FIELD COORDINATOR': 'Field Coordinator',
      'FIELD_COORDINATOR': 'Field Coordinator',
      'JE': 'Junior Executive',
      'JUNIOR EXECUTIVE': 'Junior Executive',
      'JUNIOR_EXECUTIVE': 'Junior Executive',
      'SE': 'Senior Executive',
      'SENIOR EXECUTIVE': 'Senior Executive',
      'SENIOR_EXECUTIVE': 'Senior Executive',
      'TM': 'Territory Manager',
      'TERRITORY MANAGER': 'Territory Manager',
      'TERRITORY_MANAGER': 'Territory Manager',
      'PM': 'Product Manager',
      'PRODUCT MANAGER': 'Product Manager',
      'PRODUCT_MANAGER': 'Product Manager'
    };

    employees.forEach(emp => {
      const designation = emp.designation || '';
      const displayName = designationMap[designation.toUpperCase()];
      if (displayName && groups[displayName]) {
        groups[displayName].push(emp);
      }
    });

    return groups;
  }, [employees]);

  const canSubmit = useMemo(() => !!formData.range && !!formData.teamName && !!formData.agency, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => {
      const newData = { ...s, [name]: value };
      // Clear agency when range changes
      if (name === 'range') {
        newData.agency = '';
        newData.medicalReps = [];
        newData.fieldCoordinators = [];
        newData.juniorExecutives = [];
        newData.seniorExecutives = [];
        newData.territoryManagers = [];
        newData.productManagers = [];
      }
      return newData;
    });
  };

  const handleEmployeeSelection = (designation, employeeId, checked) => {
    const fieldName = {
      'Medical Rep': 'medicalReps',
      'Field Coordinator': 'fieldCoordinators',
      'Junior Executive': 'juniorExecutives',
      'Senior Executive': 'seniorExecutives',
      'Territory Manager': 'territoryManagers',
      'Product Manager': 'productManagers'
    }[designation];

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

    // Find the agency ID
    const selectedAgency = agencies.find(a => a.name === formData.agency);

    if (!selectedAgency) {
      alert("Invalid agency selection");
      return;
    }

    // For range, we need to find the range by name (A or B)
    // Since agencies are named like A1, A2, B1, B2, etc., the range is the first character
    const rangeName = formData.range;
    const selectedRange = ranges.find(r => r.name === rangeName);

    if (!selectedRange) {
      alert("Invalid range selection");
      return;
    }

    const payload = {
      name: formData.teamName,
      agency_id: selectedAgency.id,
      range_id: selectedRange.id,
      mrs: formData.medicalReps,
      fcs: formData.fieldCoordinators,
      jes: formData.juniorExecutives,
      ses: formData.seniorExecutives,
      tms: formData.territoryManagers,
      pms: formData.productManagers
    };

    onSubmit && onSubmit(payload, formData);

    // reset
    setFormData({
      range: "",
      teamName: "",
      agency: "",
      medicalReps: [],
      fieldCoordinators: [],
      juniorExecutives: [],
      seniorExecutives: [],
      territoryManagers: [],
      productManagers: []
    });
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
                      onChange={(e) => handleEmployeeSelection(designation, emp.id, e.target.checked)}
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
      {/* Range */}
      <div>
        <label className="block text-gray-700 mb-1">Range</label>
        <select
          name="range"
          value={formData.range}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
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
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
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
        />
      </div>


      {/* Employee Selection Dropdowns */}
      {formData.range && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderEmployeeDropdown("Medical Reps", "Medical Rep", "medicalReps")}
          {renderEmployeeDropdown("Field Coordinators", "Field Coordinator", "fieldCoordinators")}
          {renderEmployeeDropdown("Junior Executives", "Junior Executive", "juniorExecutives")}
          {renderEmployeeDropdown("Senior Executives", "Senior Executive", "seniorExecutives")}
          {renderEmployeeDropdown("Territory Managers", "Territory Manager", "territoryManagers")}
          {renderEmployeeDropdown("Product Managers", "Product Manager", "productManagers")}
        </div>
      )}

      <button type="submit" disabled={!canSubmit} className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-2 rounded-md hover:from-red-700 hover:to-red-800 transition disabled:opacity-50 shadow-lg">
        Add Team
      </button>
    </form>
  );
}
