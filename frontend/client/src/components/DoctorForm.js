// src/components/DoctorForm.jsx
import { useState } from "react";

export default function DoctorForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    doctorName: "",
    contactNumber: "",
    email: "",
    speciality: "",
    categorization: "",
    date: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(formData);

    // reset form
    setFormData({
      doctorName: "",
      contactNumber: "",
      email: "",
      speciality: "",
      categorization: "",
      date: "",
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl bg-white shadow-lg rounded-lg p-6 space-y-4"
    >
      {/* Doctor Name */}
      <div>
        <label className="block text-gray-700 mb-1">Doctor Name</label>
        <input
          type="text"
          name="doctorName"
          value={formData.doctorName}
          onChange={handleChange}
          placeholder="Enter doctor's name"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Contact Number */}
      <div>
        <label className="block text-gray-700 mb-1">Contact Number</label>
        <input
          type="tel"
          name="contactNumber"
          value={formData.contactNumber}
          onChange={handleChange}
          placeholder="Enter contact number"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-gray-700 mb-1">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter email address"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Speciality */}
      <div>
        <label className="block text-gray-700 mb-1">Speciality</label>
        <input
          type="text"
          name="speciality"
          value={formData.speciality}
          onChange={handleChange}
          placeholder="Enter speciality"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Categorization */}
      <div>
        <label className="block text-gray-700 mb-1">Categorization</label>
        <input
          type="text"
          name="categorization"
          value={formData.categorization}
          onChange={handleChange}
          placeholder="Enter categorization"
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
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
      >
        Add Doctor
      </button>
    </form>
  );
}
