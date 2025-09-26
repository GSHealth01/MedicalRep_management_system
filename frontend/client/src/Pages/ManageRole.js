// src/Pages/ManageRoles.jsx
import { useState, useEffect } from "react";
import RoleForm from "../components/RoleForm";

export default function ManageRoles() {
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

  const [roles, setRoles] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("roles");
    if (stored) setRoles(JSON.parse(stored));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("roles", JSON.stringify(roles));
  }, [roles]);

  const handleAddRole = (roleData) => {
    if (editingIndex !== null) {
      const updated = [...roles];
      updated[editingIndex] = roleData;
      setRoles(updated);
      setEditingIndex(null);
      alert("Permissions updated ✅");
    } else {
      setRoles([...roles, roleData]);
      alert("Permissions added ✅");
    }
  };

  const handleEdit = (index) => setEditingIndex(index);
  const handleDelete = (index) =>
    setRoles(roles.filter((_, i) => i !== index));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Roles & Permissions
      </h1>

      {/* Permission Form */}
      <RoleForm
        onSubmit={handleAddRole}
        initialData={editingIndex !== null ? roles[editingIndex] : null}
      />

      {/* Saved Permissions as Table */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-2">Saved Permissions</h2>
        {roles.length === 0 ? (
          <p className="text-gray-500">No permissions saved yet</p>
        ) : (
          roles.map((role, idx) => (
            <div key={idx} className="mb-8">
              <h3 className="font-semibold text-blue-600 mb-2">
                Permission Set {idx + 1}
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse bg-white shadow rounded text-sm">
                  <thead className="bg-blue-600 text-white">
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
                          <td
                            key={des}
                            className="py-2 px-4 text-center text-gray-700"
                          >
                            {role.permissions[mod]?.[des] || "None"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Actions */}
              <div className="mt-3 space-x-2">
                <button
                  onClick={() => handleEdit(idx)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(idx)}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
