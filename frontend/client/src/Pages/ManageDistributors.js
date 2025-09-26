// src/Pages/ManageDistributors.jsx
import { useState } from "react";
import DistributorForm from "../components/DistributorForm";

export default function ManageDistributors() {
  const [distributors, setDistributors] = useState([]);

  const handleAddDistributor = (distributor) => {
    setDistributors([...distributors, distributor]);
    alert(`Distributor ${distributor.distributorName} added ✅`);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Manage Distributors</h1>

      {/* Distributor Form */}
      <DistributorForm onSubmit={handleAddDistributor} />

      {/* Distributor Table */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Distributor List</h2>
        <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="py-2 px-4 text-center">Distributor Name</th>
              <th className="py-2 px-4 text-center">Area</th>
              <th className="py-2 px-4 text-center">Town</th>
              <th className="py-2 px-4 text-center">Route</th>
              <th className="py-2 px-4 text-center">Date</th>
            </tr>
          </thead>
          <tbody>
            {distributors.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-500">
                  No distributors added yet
                </td>
              </tr>
            ) : (
              distributors.map((dist, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4 text-center">{dist.distributorName}</td>
                  <td className="py-2 px-4 text-center">{dist.area}</td>
                  <td className="py-2 px-4 text-center">{dist.town}</td>
                  <td className="py-2 px-4 text-center">{dist.date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
