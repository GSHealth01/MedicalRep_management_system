import EmployeeForm from "../components/EmployeeForm";
import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useNotification } from "../components/NotificationPopup";
import { useConfirm } from "../components/ConfirmDialog";

// Edit Employee Modal Component
function EditEmployeeModal({ employee, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: employee?.name || '',
    email: employee?.email || '',
    empNo: employee?.emp_no || employee?.empNo || '',
    designation: employee?.designation || '',
    range: employee?.range?.name || employee?.range || '',
    agency: employee?.agency?.name || employee?.agency || '',
    distributor: employee?.distributor || '',
    birthday: employee?.birthday ? new Date(employee.birthday).toISOString().slice(0, 10) : '',
    joinDate: employee?.join_date || employee?.joinDate ? new Date(employee.join_date || employee.joinDate).toISOString().slice(0, 10) : ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      // Error handled in parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Edit Employee</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee Number</label>
            <input
              type="text"
              name="empNo"
              value={formData.empNo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
            <select
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
              required
            >
              <option value="">Select Designation</option>
              <option value="Medical Rep">Medical Rep</option>
              <option value="Field Coordinator">Field Coordinator</option>
              <option value="Junior Executive">Junior Executive</option>
              <option value="Senior Executive">Senior Executive</option>
              <option value="Territory Manager">Territory Manager</option>
              <option value="Product Manager">Product Manager</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Range</label>
            <select
              name="range"
              value={formData.range}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
            >
              <option value="">Select Range</option>
              <option value="A">A</option>
              <option value="B">B</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agency</label>
            <select
              name="agency"
              value={formData.agency}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
            >
              <option value="">Select Agency</option>
              {formData.range === 'A' && (
                <>
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                  <option value="A3">A3</option>
                  <option value="A4">A4</option>
                </>
              )}
              {formData.range === 'B' && (
                <>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                  <option value="B3">B3</option>
                  <option value="B4">B4</option>
                  <option value="B5">B5</option>
                  <option value="B6">B6</option>
                  <option value="B7">B7</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Birthday</label>
            <input
              type="date"
              name="birthday"
              value={formData.birthday}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Join Date</label>
            <input
              type="date"
              name="joinDate"
              value={formData.joinDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Distributor</label>
            <input
              type="text"
              name="distributor"
              value={formData.distributor}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
              placeholder="Enter distributor"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-md hover:from-red-700 hover:to-red-800 disabled:opacity-50 transition-all duration-200 shadow-md"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ManageEmployees() {
  const { showNotification, NotificationComponent } = useNotification();
  const { showConfirm, ConfirmDialogComponent } = useConfirm();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Load from BE
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get("/admin/users", { params: { limit: 200 } });
        
        // The Prisma API returns data directly in res.data, not res.data.data
        const items = Array.isArray(res.data) ? res.data : (Array.isArray(res?.data?.data) ? res?.data?.data : []);
        
        console.log('Raw API response:', res.data); // Debug log
        console.log('Extracted items:', items); // Debug log
        
        // Normalize the data to ensure all fields are present and consistently named
        const normalizedItems = items.map(item => ({
          _id: item._id || item.id,
          id: item.id || item._id,
          name: item.name || "",
          email: item.email || "",
          emp_no: item.emp_no || item.empNo || "",
          designation: item.designation || "",
          range: item.range || { name: item.range_name || "" },
          agency: item.agency || { name: item.agency_name || "" },
          distributor: item.distributor_code || "", // Fix: map distributor_code to distributor
          birthday: item.birthday || "",
          join_date: item.join_date || "",
          createdAt: item.createdAt || item.created_at || item.date || item.dateAdded || new Date()
        }));
        
        console.log('Normalized items:', normalizedItems); // Debug log
        
        if (mounted) setEmployees(normalizedItems);
      } catch (e) {
        if (mounted) setErr(e?.response?.data?.message || "Failed to load employees");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleAddEmployee = async (payload /* normalized for BE */, rawForm) => {
    try {
      const res = await api.post("/admin/users", payload);
      const created = res?.data?.data || {};

      // Compose a row for immediate display
      const row = {
        _id: created.id || created._id || Math.random().toString(36).slice(2),
        name: payload.name,
        email: payload.email,
        emp_no: payload.empNo,
        designation: payload.designation,
        distributor: payload.distributor,
        // show populated names if BE returns them, otherwise show raw ids
        range: created.range || payload.range,
        agency: created.agency || payload.agency,
        birthday: rawForm.birthday,
        join_date: rawForm.joinDate,
        createdAt: new Date()
      };

      setEmployees((list) => [row, ...list]);
      showNotification(`Employee ${payload.email} added successfully!`, 'success');
    } catch (e) {
      showNotification(e?.response?.data?.message || "Failed to add employee", 'error');
    }
  };

  const fmtDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "-");
  const showRange = (r) => (typeof r === "object" ? (r?.name || r?.code || r?._id || "") : (r || ""));
  const showAgency = (a) => (typeof a === "object" ? (a?.name || a?.code || a?._id || "") : (a || ""));

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
  };

  const handleSaveEmployee = async (formData) => {
    try {
      const updateData = {
        name: formData.name,
        empNo: formData.empNo,
        designation: formData.designation,
        agency: formData.agency,
        range: formData.range,
        birthday: formData.birthday || undefined,
        joinDate: formData.joinDate || undefined,
        distributor: formData.distributor || undefined
      };

      await api.put(`/admin/users/${editingEmployee.id || editingEmployee._id}`, updateData);

      // Update local state
      setEmployees((list) =>
        list.map((emp) =>
          emp.id === editingEmployee.id || emp._id === editingEmployee._id
            ? {
                ...emp,
                name: formData.name,
                emp_no: formData.empNo,
                designation: formData.designation,
                agency: formData.agency ? { name: formData.agency } : emp.agency,
                range: formData.range ? { name: formData.range } : emp.range,
                birthday: formData.birthday,
                join_date: formData.joinDate,
                distributor: formData.distributor
              }
            : emp
        )
      );

      showNotification(`Employee ${formData.email || formData.empNo} updated successfully!`, 'success');
    } catch (e) {
      throw new Error(e?.response?.data?.message || "Failed to update employee");
    }
  };

  const handleDeleteEmployee = async (employee) => {
    const confirmed = await showConfirm({
      title: "Delete Employee",
      message: `Are you sure you want to delete employee ${employee.email}? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger"
    });

    if (!confirmed) return;

    try {
      await api.delete(`/admin/users/${employee.id || employee._id}`);
      setEmployees((list) => list.filter((emp) => {
        // Use a more robust comparison to avoid deleting multiple employees
        const empId = emp.id || emp._id;
        const deleteId = employee.id || employee._id;
        return empId !== deleteId;
      }));
      showNotification(`Employee ${employee.email} deleted successfully!`, 'success');
    } catch (e) {
      showNotification(e?.response?.data?.message || "Failed to delete employee", 'error');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Employees</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          {showForm ? 'Hide Form' : 'Add Employee'}
        </button>
      </div>

      {/* Employee List - Display only when form is hidden */}
      {!showForm && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Employee List</h2>

          {err && <div className="text-red-600 mb-3">{err}</div>}
          {loading ? (
            <div className="text-gray-600">Loading…</div>
          ) : (
            <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
              <thead className="bg-gradient-to-r from-red-600 to-red-700 text-white">
                <tr>
                  <th className="py-2 px-4 text-center">Username (Email)</th>
                  <th className="py-2 px-4 text-center">Emp No</th>
                  <th className="py-2 px-4 text-center">Name</th>
                  <th className="py-2 px-4 text-center">Designation</th>
                  <th className="py-2 px-4 text-center">Birthday</th>
                  <th className="py-2 px-4 text-center">Join Date</th>
                  <th className="py-2 px-4 text-center">Range</th>
                  <th className="py-2 px-4 text-center">Agency</th>
                  <th className="py-2 px-4 text-center">Distributor</th>
                  <th className="py-2 px-4 text-center">Date Added</th>
                  <th className="py-2 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="text-center py-4 text-gray-500">
                      No employees added yet
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp._id || emp.id} className="border-b hover:bg-gray-50 text-center">
                      <td className="py-2 px-4">{emp.email || emp.username}</td>
                      <td className="py-2 px-4">{emp.emp_no || "-"}</td>
                      <td className="py-2 px-4">{emp.name || "-"}</td>
                      <td className="py-2 px-4">{emp.designation || "-"}</td>
                      <td className="py-2 px-4">{fmtDate(emp.birthday)}</td>
                      <td className="py-2 px-4">{fmtDate(emp.joinDate || emp.join_date)}</td>
                      <td className="py-2 px-4">{showRange(emp.range)}</td>
                      <td className="py-2 px-4">{showAgency(emp.agency)}</td>
                      <td className="py-2 px-4">{emp.distributor || "-"}</td>
                      <td className="py-2 px-4">{fmtDate(emp.createdAt || emp.dateAdded || new Date())}</td>
                      <td className="py-2 px-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleEditEmployee(emp)}
                            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-md hover:bg-gradient-to-r from-red-600 to-red-700 text-sm transition-colors shadow-md"
                            title="Edit Employee"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(emp)}
                            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-md hover:bg-gradient-to-r from-red-600 to-red-700 text-sm transition-colors"
                            title="Delete Employee"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <EditEmployeeModal
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onSave={handleSaveEmployee}
        />
      )}

      {/* Add Employee Form - Display after list */}
      {showForm && <EmployeeForm onSubmit={handleAddEmployee} />}
      
      {/* Notification Component */}
      <NotificationComponent />
      
      {/* Confirmation Dialog Component */}
      <ConfirmDialogComponent />
    </div>
  );
}
