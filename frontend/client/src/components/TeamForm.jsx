import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api"; // uses your existing axios instance with auth

export default function TeamForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    sector: "",        // sector ID
    teamName: "",
    medicalReps: [],   // array of selected employee IDs
    fieldCoordinators: [],
    juniorExecutives: [],
    seniorExecutives: [],
    territoryManagers: [],
    productManagers: []
  });

  const [sectors, setSectors] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadingSectors, setLoadingSectors] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [errSectors, setErrSectors] = useState("");
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
        const items = res?.data?.data || [];
        if (mounted) setEmployees(items);
      } catch (e) {
        if (mounted) setErrEmployees(e?.response?.data?.message || "Failed to load employees");
      } finally {
        if (mounted) setLoadingEmployees(false);
      }
    })();
    return () => { mounted = false; };
  }, [formData.sector]);

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

  const canSubmit = useMemo(() => !!formData.sector && !!formData.teamName, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => {
      const newData = { ...s, [name]: value };
      // Clear employees when sector changes
      if (name === 'sector') {
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

    const payload = {
      name: formData.teamName,
      sector_id: parseInt(formData.sector),
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
      sector: "",
      teamName: "",
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
      {/* Sector */}
      <div>
        <label className="block text-gray-700 mb-1">Sector</label>
        <select
          name="sector"
          value={formData.sector}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
          required
          disabled={loadingSectors || !!errSectors}
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
        />
      </div>


      {/* Employee Selection Dropdowns */}
      {formData.sector && (
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
