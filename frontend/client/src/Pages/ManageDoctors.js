// src/Pages/ManageDoctors.jsx
import { useState } from "react";
import DoctorForm from "../components/DoctorForm";

export default function ManageDoctors() {
  const [doctors, setDoctors] = useState([]);

  const handleAddDoctor = (doctor) => {
    setDoctors([...doctors, doctor]);
    alert(`Doctor ${doctor.doctorName} added ✅`);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Manage Doctors</h1>

      {/* Doctor Form */}
      <DoctorForm onSubmit={handleAddDoctor} />

      {/* Doctor Table */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Doctor List</h2>
        <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="py-2 px-4 text-center">Name</th>
              <th className="py-2 px-4 text-center">Contact</th>
              <th className="py-2 px-4 text-center">Email</th>
              <th className="py-2 px-4 text-center">Speciality</th>
              <th className="py-2 px-4 text-center">Categorization</th>
              <th className="py-2 px-4 text-center">Date</th>
            </tr>
          </thead>
          <tbody>
            {doctors.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  No doctors added yet
                </td>
              </tr>
            ) : (
              doctors.map((doc, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4 text-center">{doc.doctorName}</td>
                  <td className="py-2 px-4 text-center">{doc.contactNumber}</td>
                  <td className="py-2 px-4 text-center">{doc.email}</td>
                  <td className="py-2 px-4 text-center">{doc.speciality}</td>
                  <td className="py-2 px-4 text-center">{doc.categorization}</td>
                  <td className="py-2 px-4 text-center">{doc.date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
