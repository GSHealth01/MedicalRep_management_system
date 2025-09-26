// src/Pages/ManageTeams.jsx
import { useState } from "react";
import TeamForm from "../components/TeamForm";

export default function ManageTeams() {
  const [teams, setTeams] = useState([]);

  const handleAddTeam = (team) => {
    setTeams([...teams, team]);
    alert(`Team "${team.teamName}" added ✅`);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Manage Teams</h1>

      {/* Team Form */}
      <TeamForm onSubmit={handleAddTeam} />

      {/* Teams Table */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Team List</h2>
        <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="py-2 px-4 text-center">Team Name</th>
              <th className="py-2 px-4 text-center">Senior Executives (SE)</th>
              <th className="py-2 px-4 text-center">Territory Managers (TM)</th>
              <th className="py-2 px-4 text-center">Product Managers (PM)</th>
              <th className="py-2 px-4 text-center">Junior Executives (JE)</th>
              <th className="py-2 px-4 text-center">Field Coordinators (FC)</th>
              <th className="py-2 px-4 text-center">Medical Reps (MR)</th>
            </tr>
          </thead>
          <tbody>
            {teams.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4 text-gray-500">
                  No teams created yet
                </td>
              </tr>
            ) : (
              teams.map((team, index) => (
                <tr key={index} className="border-b hover:bg-gray-50 text-center">
                  <td className="py-2 px-4">{team.teamName}</td>
                  <td className="py-2 px-4">{team.ses?.join(", ") || "-"}</td>
                  <td className="py-2 px-4">{team.tms?.join(", ") || "-"}</td>
                  <td className="py-2 px-4">{team.pms?.join(", ") || "-"}</td>
                  <td className="py-2 px-4">{team.jes?.join(", ") || "-"}</td>
                  <td className="py-2 px-4">{team.fcs?.join(", ") || "-"}</td>
                  <td className="py-2 px-4">{team.mrs?.join(", ") || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
