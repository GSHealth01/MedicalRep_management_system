// src/components/RoleForm.jsx
import { useState, useEffect } from "react";

export default function RoleForm({ onSubmit, initialData }) {
  const [formData, setFormData] = useState({
    roleName: "",
    description: "",
    permissions: {
      employees: { view: false, add: false, edit: false, delete: false },
      products: { view: false, add: false, edit: false, delete: false },
      distributors: { view: false, add: false, edit: false, delete: false },
      doctors: { view: false, add: false, edit: false, delete: false },
      teams: { view: false, add: false, edit: false, delete: false },
      reports: { view: false, add: false, edit: false, delete: false },
      itinerary: { view: false, add: false, edit: false, delete: false },
    },
  });

  // Load initial data for editing
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePermissionChange = (module, action) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [module]: {
          ...formData.permissions[module],
          [action]: !formData.permissions[module][action],
        },
      },
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(formData);

    // Reset form
    setFormData({
      roleName: "",
      description: "",
      permissions: {
        employees: { view: false, add: false, edit: false, delete: false },
        products: { view: false, add: false, edit: false, delete: false },
        distributors: { view: false, add: false, edit: false, delete: false },
        doctors: { view: false, add: false, edit: false, delete: false },
        teams: { view: false, add: false, edit: false, delete: false },
        reports: { view: false, add: false, edit: false, delete: false },
        itinerary: { view: false, add: false, edit: false, delete: false },
      },
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-4xl bg-white shadow-lg rounded-lg p-6 space-y-6"
    >
      {/* Role Name */}
      <div>
        <label className="block text-gray-700 mb-1">Role Name</label>
        <input
          type="text"
          name="roleName"
          value={formData.roleName}
          onChange={handleChange}
          placeholder="Enter role name"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-gray-700 mb-1">Description</label>
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter role description"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Permissions Table */}
      <div>
        <label className="block text-gray-700 mb-2 font-semibold">
          Permissions
        </label>
        <table className="w-full border-collapse bg-white shadow-sm rounded">
          <thead className="bg-gray-200">
            <tr>
              <th className="py-2 px-4 text-center">Module</th>
              <th className="py-2 px-4 text-center">View</th>
              <th className="py-2 px-4 text-center">Add</th>
              <th className="py-2 px-4 text-center">Edit</th>
              <th className="py-2 px-4 text-center">Delete</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(formData.permissions).map((module) => (
              <tr key={module} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4 text-center capitalize">{module}</td>
                {["view", "add", "edit", "delete"].map((action) => (
                  <td key={action} className="py-2 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={formData.permissions[module][action]}
                      onChange={() => handlePermissionChange(module, action)}
                      className="h-4 w-4 text-blue-600"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
      >
        {initialData ? "Update Role" : "Add Role"}
      </button>
    </form>
  );
}

