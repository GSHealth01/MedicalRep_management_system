// src/pages/ManageEmployees.jsx
import EmployeeForm from "../components/EmployeeForm";
import { useState } from "react";

export default function ManageEmployees() {
  const [employees, setEmployees] = useState([]);

  const handleAddEmployee = (employee) => {
    setEmployees([...employees, employee]);
    alert(`Employee ${employee.username} added ✅`);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Manage Employees</h1>

      {/* Employee Form */}
      <EmployeeForm onSubmit={handleAddEmployee} />

      {/* Table of Employees */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Employee List</h2>
        <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="py-2 px-4 text-center">Username</th>
              <th className="py-2 px-4 text-center">Emp No</th>
              <th className="py-2 px-4 text-center">Designation</th>
              <th className="py-2 px-4 text-center">Birthday</th>
              <th className="py-2 px-4 text-center">Join Date</th>
              <th className="py-2 px-4 text-center">Promotion Date</th>
              <th className="py-2 px-4 text-center">Agency</th>
              <th className="py-2 px-4 text-center">Range</th>
              <th className="py-2 px-4 text-center">Distributor</th>
              <th className="py-2 px-4 text-center">Date</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center py-4 text-gray-500">
                  No employees added yet
                </td>
              </tr>
            ) : (
              employees.map((emp, index) => (
                <tr key={index} className="border-b hover:bg-gray-50 text-center">
                  <td className="py-2 px-4">{emp.username}</td>
                  <td className="py-2 px-4">{emp.empNo}</td>
                  <td className="py-2 px-4">{emp.designation}</td>
                  <td className="py-2 px-4">{emp.birthday || "-"}</td>
                  <td className="py-2 px-4">{emp.joinDate || "-"}</td>
                  <td className="py-2 px-4">
                    {emp.designation !== "MR" ? emp.promotionDate || "-" : "-"}
                  </td>
                  <td className="py-2 px-4">{emp.agency}</td>
                  <td className="py-2 px-4">{emp.range}</td>
                  <td className="py-2 px-4">{emp.distributor}</td>
                  <td className="py-2 px-4">{emp.date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
