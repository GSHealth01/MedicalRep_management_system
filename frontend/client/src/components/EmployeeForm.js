// src/components/EmployeeForm.jsx
import { useState } from "react";

export default function EmployeeForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    username: "",
    empNo: "",
    designation: "",
    birthday: "",
    joinDate: "",
    promotionDate: "",
    agency: "",
    range: "",
    distributor: "",
    date: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(formData);

    setFormData({
      username: "",
      empNo: "",
      designation: "",
      birthday: "",
      joinDate: "",
      promotionDate: "",
      agency: "",
      range: "",
      distributor: "",
      date: "",
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl bg-white shadow-lg rounded-lg p-6 space-y-4"
    >
      {/* Username */}
      <div>
        <label className="block text-gray-700 mb-1">Username</label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Enter username"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Employee No */}
      <div>
        <label className="block text-gray-700 mb-1">Employee No</label>
        <input
          type="text"
          name="empNo"
          value={formData.empNo}
          onChange={handleChange}
          placeholder="Enter employee number"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Birthday */}
      <div>
        <label className="block text-gray-700 mb-1">Birthday</label>
        <input
          type="date"
          name="birthday"
          value={formData.birthday}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Join Date */}
      <div>
        <label className="block text-gray-700 mb-1">Join Date</label>
        <input
          type="date"
          name="joinDate"
          value={formData.joinDate}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Designation */}
      <div>
        <label className="block text-gray-700 mb-1">Designation</label>
        <select
          name="designation"
          value={formData.designation}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select designation</option>
          <option value="MR">Medical Rep</option>
          <option value="FC">Field Coordinator</option>
          <option value="JE">Junior Executive</option>
          <option value="SE">Senior Executive</option>
          <option value="TM">Territory Manager</option>
          <option value="PM">Product Manager</option>
        </select>
      </div>

      {/* Promotion Date (exclude for MR) */}
      {formData.designation && formData.designation !== "MR" && (
        <div>
          <label className="block text-gray-700 mb-1">
            Date of Promotion as {formData.designation}
          </label>
          <input
            type="date"
            name="promotionDate"
            value={formData.promotionDate}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Agency */}
      <div>
        <label className="block text-gray-700 mb-1">Agency</label>
        <select
          name="agency"
          value={formData.agency}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select agency</option>
          <option value="A1">A1</option>
          <option value="A2">A2</option>
          <option value="A3">A3</option>
        </select>
      </div>

      {/* Range */}
      <div>
        <label className="block text-gray-700 mb-1">Range</label>
        <input
          type="text"
          name="range"
          value={formData.range}
          onChange={handleChange}
          placeholder="Enter range"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Distributor */}
      <div>
        <label className="block text-gray-700 mb-1">Distributor</label>
        <input
          type="text"
          name="distributor"
          value={formData.distributor}
          onChange={handleChange}
          placeholder="Enter distributor"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Date */}
      <div>
        <label className="block text-gray-700 mb-1">Date</label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
      >
        Add Employee
      </button>
    </form>
  );
}
