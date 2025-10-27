// src/components/ItineraryForm.js
import React, { useState, useEffect } from "react";
import { distributors } from "../data/distributors";
import { api } from "../services/api";

export default function ItineraryForm() {
  const [repName, setRepName] = useState("");
  const [distributor, setDistributor] = useState("");
  const [month, setMonth] = useState("2025-04");
  const [itinerary, setItinerary] = useState([]);
  const [daysInMonth, setDaysInMonth] = useState(0);

  // build rows whenever month changes
  useEffect(() => {
    if (!month) return;
    const [y, m] = month.split("-").map((n) => +n);
    const dim = new Date(y, m, 0).getDate();
    setDaysInMonth(dim);

    const rows = Array.from({ length: dim }, (_, i) => ({
      date: `${month}-${String(i + 1).padStart(2, "0")}`,
      dayNo: i + 1,
      area: "",
      doctorCalls: "",
      chemistCalls: "",
      mileage: "",
      nightOutArea: "",
    }));
    setItinerary(rows);
  }, [month]);

  const updateRow = (idx, field, value) => {
    setItinerary((rows) => {
      const copy = [...rows];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { repName, distributor, month, itinerary };
    try {
      await api.post("/itineraries", payload);
      alert("Itinerary saved!");
    } catch {
      alert("Save failed");
    }
  };

  const minDate = `${month}-01`;
  const maxDate = `${month}-${String(daysInMonth).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-lg w-full max-w-7xl mx-auto flex flex-col"
      >
        {/* Header */}
        <h2 className="text-2xl font-semibold text-center py-4 border-b bg-gray-50">
          Monthly Itinerary Planner
        </h2>

        {/* Top fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 py-4 border-b">
          <label className="flex flex-col text-sm font-medium">
            Rep Name
            <input
              type="text"
              value={repName}
              onChange={(e) => setRepName(e.target.value)}
              required
              className="mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-200"
            />
          </label>

          <label className="flex flex-col text-sm font-medium">
            Distributor
            <select
              value={distributor}
              onChange={(e) => setDistributor(e.target.value)}
              required
              className="mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-200"
            >
              <option value="">– select –</option>
              {distributors.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col text-sm font-medium">
            Month
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              min="2025-01"
              required
              className="mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-200"
            />
          </label>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 border text-left">Date</th>
                <th className="px-3 py-2 border text-center">Day No</th>
                <th className="px-3 py-2 border text-left">Area</th>
                <th className="px-3 py-2 border text-center">Doctor Calls</th>
                <th className="px-3 py-2 border text-center">Chemist Calls</th>
                <th className="px-3 py-2 border text-center">Mileage (km)</th>
                <th className="px-3 py-2 border text-left">Night Out Area</th>
              </tr>
            </thead>
            <tbody>
              {itinerary.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-2 py-1 border">
                    <input
                      type="date"
                      value={row.date}
                      min={minDate}
                      max={maxDate}
                      onChange={(e) => updateRow(i, "date", e.target.value)}
                      required
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring focus:ring-blue-200 text-sm"
                    />
                  </td>
                  <td className="px-2 py-1 border text-center">{row.dayNo}</td>
                  <td className="px-2 py-1 border">
                    <input
                      type="text"
                      value={row.area}
                      onChange={(e) => updateRow(i, "area", e.target.value)}
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring focus:ring-blue-200 text-sm"
                    />
                  </td>
                  <td className="px-2 py-1 border">
                    <input
                      type="number"
                      min="0"
                      value={row.doctorCalls}
                      onChange={(e) =>
                        updateRow(i, "doctorCalls", e.target.value)
                      }
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring focus:ring-blue-200 text-sm"
                    />
                  </td>
                  <td className="px-2 py-1 border">
                    <input
                      type="number"
                      min="0"
                      value={row.chemistCalls}
                      onChange={(e) =>
                        updateRow(i, "chemistCalls", e.target.value)
                      }
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring focus:ring-blue-200 text-sm"
                    />
                  </td>
                  <td className="px-2 py-1 border">
                    <input
                      type="number"
                      min="0"
                      value={row.mileage}
                      onChange={(e) => updateRow(i, "mileage", e.target.value)}
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring focus:ring-blue-200 text-sm"
                    />
                  </td>
                  <td className="px-2 py-1 border">
                    <input
                      type="text"
                      placeholder="Overnight area"
                      value={row.nightOutArea}
                      onChange={(e) =>
                        updateRow(i, "nightOutArea", e.target.value)
                      }
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring focus:ring-blue-200 text-sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-center bg-gray-50">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-200"
          >
            Save Itinerary
          </button>
        </div>
      </form>
    </div>
  );
}
