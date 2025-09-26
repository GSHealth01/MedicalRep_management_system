// src/Pages/ManageRoles.jsx
import { useState } from "react";
import RoleForm from "../components/RoleForm";

export default function ManageRoles() {
  const [roles, setRoles] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  const handleAddRole = (role) => {
    if (editingIndex !== null) {
      // Update existing role
      const updatedRoles = [...roles];
      updatedRoles[editingIndex] = role;
      setRoles(updatedRoles);
      setEditingIndex(null);
      alert(`Role "${role.roleName}" updated ✅`);
    } else {
      // Add new role
      setRoles([...roles, role]);
      alert(`Role "${role.roleName}" added ✅`);
    }
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
  };

  const handleDelete = (index) => {
    if (window.confirm("Are you sure you want to delete this role?")) {
      const updatedRoles = roles.filter((_, i) => i !== index);
      setRoles(updatedRoles);
    }
  };

  // Helper: get module → actions string
  const getActivePermissions = (permissions) => {
    return Object.keys(permissions)
      .map((module) => {
        const actions = Object.entries(permissions[module])
          .filter(([_, val]) => val === true)
          .map(([action]) => action.charAt(0).toUpperCase() + action.slice(1));
        if (actions.length > 0) {
          return `${module}: ${actions.join(", ")}`;
        }
        return null;
      })
      .filter(Boolean); // remove nulls
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Manage Roles & Permissions
      </h1>

      {/* Role Form */}
      <RoleForm
        onSubmit={handleAddRole}
        initialData={editingIndex !== null ? roles[editingIndex] : null}
      />

      {/* Roles Table */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Roles List</h2>
        <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="py-2 px-4 text-center">Role Name</th>
              <th className="py-2 px-4 text-center">Description</th>
              <th className="py-2 px-4 text-center">Modules & Permissions</th>
              <th className="py-2 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-500">
                  No roles added yet
                </td>
              </tr>
            ) : (
              roles.map((role, index) => {
                const activePermissions = getActivePermissions(role.permissions);
                return (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4 text-center">{role.roleName}</td>
                    <td className="py-2 px-4 text-center">{role.description}</td>
                    <td className="py-2 px-4">
                      {activePermissions.length > 0 ? (
                        <ul className="list-disc list-inside text-left">
                          {activePermissions.map((perm, i) => (
                            <li key={i}>{perm}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-500">No permissions</span>
                      )}
                    </td>
                    <td className="py-2 px-4 text-center space-x-2">
                      <button
                        onClick={() => handleEdit(index)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(index)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
