// src/components/RoleForm.jsx
import { useState, useEffect } from "react";

export default function RoleForm({ onSubmit, initialData }) {
  const designations = [
    "Operations Manager",
    "Senior Manager",
    "Product Manager",
    "Territory Manager",
    "Senior Executive",
    "Junior Executive",
    "Field Coordinator",
    "Medical Rep",
  ];

  const modules = [
    "Manage Employees",
    "Manage Products",
    "Manage Distributors",
    "Manage Doctors",
    "Manage Teams",
    "Reports / Summaries",
    "Itinerary",
  ];

  const accessOptions = ["None", "View", "Add", "Edit", "Delete"];

  // State: permissions[module][designation] = "Access Type"
  const [permissions, setPermissions] = useState({});

  // Load for edit OR initialize
  useEffect(() => {
    if (initialData) {
      setPermissions(initialData.permissions);
    } else {
      const initialPermissions = {};
      modules.forEach((mod) => {
        initialPermissions[mod] = {};
        designations.forEach((des) => {
          initialPermissions[mod][des] = "None";
        });
      });
      setPermissions(initialPermissions);
    }
  }, [initialData]);

  const handlePermissionChange = (module, designation, value) => {
    setPermissions((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [designation]: value,
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit({ permissions });

    // reset
    const resetPermissions = {};
    modules.forEach((mod) => {
      resetPermissions[mod] = {};
      designations.forEach((des) => {
        resetPermissions[mod][des] = "None";
      });
    });
    setPermissions(resetPermissions);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-6xl bg-white shadow-lg rounded-lg p-6 space-y-6"
    >
      {/* Permissions Table */}
      <div>
        <label className="block text-gray-700 mb-2 font-semibold">
          Define Permissions
        </label>
        <table className="min-w-full border-collapse bg-white shadow rounded text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="py-2 px-4 text-left">Module</th>
              {designations.map((des) => (
                <th key={des} className="py-2 px-4 text-center">
                  {des}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((mod) => (
              <tr key={mod} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4 font-medium">{mod}</td>
                {designations.map((des) => (
                  <td key={des} className="py-2 px-4 text-center">
                    <select
                      value={permissions[mod]?.[des] || "None"}
                      onChange={(e) =>
                        handlePermissionChange(mod, des, e.target.value)
                      }
                      className="border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      {accessOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
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
        Save Permissions
      </button>
    </form>
  );
}
