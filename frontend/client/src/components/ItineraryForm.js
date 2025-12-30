// src/components/ItineraryForm.js
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function ItineraryForm() {
  const navigate = useNavigate();
  const { id, mode } = useParams();
  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const { user } = useAuth();
  const [repName, setRepName] = useState("");
  const [distributor, setDistributor] = useState("");
  const [town, setTown] = useState("");
  const [month, setMonth] = useState("2025-04");
  const [itinerary, setItinerary] = useState([]);
  const [daysInMonth, setDaysInMonth] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userDistributors, setUserDistributors] = useState([]);

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
      town: "",
      doctorCalls: "",
      chemistCalls: "",
      mileage: "",
      nightOutArea: "",
    }));
    setItinerary(rows);
  }, [month]);

  const fetchUserDistributors = async () => {
    try {
      const response = await api.get("/users/profile");
      console.log("Full API response:", response);
      console.log("Response data:", response.data);
      // The backend returns data directly in response.data, not response.data.data
      const userData = response.data.user || response.data;
      console.log("User profile data:", userData);
      console.log("Distributors array:", userData.distributors);
      console.log("Distributors array length:", userData.distributors?.length);
      setUserDistributors(userData.distributors || []);
      // Set the first distributor as default if available
      if (userData.distributors && userData.distributors.length > 0) {
        const firstDistributor = userData.distributors[0];
        console.log("First distributor object:", firstDistributor);
        console.log("First distributor type:", typeof firstDistributor);
        console.log("First distributor keys:", Object.keys(firstDistributor));
        console.log("Distributor name:", firstDistributor.name);
        const distributorName = firstDistributor.name;
        setDistributor(distributorName);
        console.log("Setting distributor:", distributorName);
      } else {
        console.log("No distributors found in user data");
      }
    } catch (error) {
      console.error("Failed to fetch user distributors:", error);
    }
  };

  // Load user distributors when component mounts
  useEffect(() => {
    if (user?.id) {
      fetchUserDistributors();
    }
  }, [user?.id]);

  const loadItinerary = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await api.get(`/itineraries/${id}`);
      const data = response.data.data;
      setRepName(data.repName);
      setDistributor(data.distributor);
      setTown(data.town || "");
      setMonth(data.month);
      setItinerary(
        data.entries.map((entry) => ({
          date: entry.date,
          dayNo: entry.dayNo,
          area: entry.area || "",
          town: entry.town || "",
          doctorCalls: entry.doctorCalls || "",
          chemistCalls: entry.chemistCalls || "",
          mileage: entry.mileage || "",
          nightOutArea: entry.nightOutArea || "",
        }))
      );
    } catch (error) {
      console.error("Load failed:", error);
      alert("Failed to load itinerary");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Load data if viewing or editing
  useEffect(() => {
    if ((isViewMode || isEditMode) && id) {
      loadItinerary();
    }
  }, [isViewMode, isEditMode, id, loadItinerary]);

  const updateRow = (idx, field, value) => {
    setItinerary((rows) => {
      const copy = [...rows];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      repName: user?.name || repName,
      distributor,
      town,
      month,
      itinerary
    };
    console.log("Submitting itinerary:", payload);
    try {
      let response;
      if (id && (isEditMode || (!isViewMode && !isEditMode))) {
        // Editing existing itinerary (either explicit edit mode or create mode with ID)
        response = await api.put(`/itineraries/${id}`, payload);
        alert("Itinerary updated successfully!");
      } else {
        // Creating new itinerary
        response = await api.post("/itineraries", payload);
        alert("Itinerary saved!");
      }
      console.log("Save response:", response);
      navigate("/itineraries");
    } catch (error) {
      console.error("Save failed:", error);
      let errorMessage = error.response?.data?.message || error.message;
      
      // Provide user-friendly message for duplicate itinerary error
      if (error.response?.status === 409) {
        errorMessage = "An itinerary already exists for this month. Please edit the existing itinerary or delete it first.";
      }
      
      alert(`Save failed: ${errorMessage}`);
    }
  };

  const minDate = `${month}-01`;
  const maxDate = `${month}-${String(daysInMonth).padStart(2, "0")}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
        <span className="ml-3 text-gray-600">Loading itinerary…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-lg w-full max-w-7xl mx-auto flex flex-col"
      >
        {/* Header */}
        <h2 className="text-2xl font-semibold text-center py-4 border-b bg-gray-50">
          {isViewMode ? "View Itinerary" : "Monthly Itinerary Planner"}
        </h2>

        {/* Top fields */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-6 py-4 border-b">
          <label className="flex flex-col text-sm font-medium">
            Rep Name
            <div
              className="mt-1 px-3 py-2 border rounded-md bg-gray-100 text-gray-700"
              style={{ minHeight: '40px', display: 'flex', alignItems: 'center' }}
            >
              {user?.name || 'Not logged in'}
            </div>
          </label>

          <label className="flex flex-col text-sm font-medium">
            Distributor
            <div
              className="mt-1 px-3 py-2 border rounded-md bg-gray-100 text-gray-700"
              style={{ minHeight: '40px', display: 'flex', alignItems: 'center' }}
            >
              {userDistributors.length > 0
                ? userDistributors.map((d, index) => {
                    console.log(`Distributor ${index}:`, d);
                    console.log(`Distributor ${index} name:`, d.name);
                    console.log(`Distributor ${index} type:`, typeof d);
                    console.log(`Distributor ${index} keys:`, Object.keys(d));
                    return d.name || 'Unknown Distributor';
                  }).join(', ')
                : (() => {
                    console.log('No distributors in userDistributors array');
                    console.log('userDistributors:', userDistributors);
                    console.log('userDistributors length:', userDistributors.length);
                    return 'No distributors assigned';
                  })()
              }
            </div>
          </label>

          <label className="flex flex-col text-sm font-medium">
            Month
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              min="2025-01"
              required
              disabled={isViewMode}
              className="mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-200 disabled:bg-gray-100"
            />
          </label>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 border text-left w-40">Date</th>
                <th className="px-3 py-2 border text-center w-20">Day No</th>
                <th className="px-3 py-2 border text-left w-40">Area</th>
                <th className="px-3 py-2 border text-left w-36">Town</th>
                <th className="px-3 py-2 border text-center w-32">
                  Doctor Calls
                </th>
                <th className="px-3 py-2 border text-center w-32">
                  Chemist Calls
                </th>
                <th className="px-3 py-2 border text-center w-32">
                  Mileage (km)
                </th>
                <th className="px-3 py-2 border text-left w-48">
                  Night Out Area
                </th>
              </tr>
            </thead>
            <tbody>
              {itinerary.map((row, i) => (
                <tr
                  key={i}
                  className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-2 py-1 border w-40">
                    <input
                      type="date"
                      value={row.date}
                      min={minDate}
                      max={maxDate}
                      onChange={(e) =>
                        updateRow(i, "date", e.target.value)
                      }
                      required
                      disabled={isViewMode}
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring focus:ring-blue-200 text-sm disabled:bg-gray-100"
                    />
                  </td>

                  <td className="px-2 py-1 border text-center w-20">
                    {row.dayNo}
                  </td>

                  <td className="px-2 py-1 border w-40">
                    <input
                      type="text"
                      value={row.area}
                      onChange={(e) =>
                        updateRow(i, "area", e.target.value)
                      }
                      disabled={isViewMode}
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring focus:ring-blue-200 text-sm disabled:bg-gray-100"
                    />
                  </td>

                  {/* NEW: Town cell to match Town column */}
                  <td className="px-2 py-1 border w-36">
                    <input
                      type="text"
                      value={row.town}
                      onChange={(e) =>
                        updateRow(i, "town", e.target.value)
                      }
                      disabled={isViewMode}
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring focus:ring-blue-200 text-sm disabled:bg-gray-100"
                    />
                  </td>

                  <td className="px-2 py-1 border w-32">
                    <input
                      type="number"
                      min="0"
                      value={row.doctorCalls}
                      onChange={(e) =>
                        updateRow(i, "doctorCalls", e.target.value)
                      }
                      disabled={isViewMode}
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring focus:ring-blue-200 text-sm disabled:bg-gray-100"
                    />
                  </td>

                  <td className="px-2 py-1 border w-32">
                    <input
                      type="number"
                      min="0"
                      value={row.chemistCalls}
                      onChange={(e) =>
                        updateRow(i, "chemistCalls", e.target.value)
                      }
                      disabled={isViewMode}
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring focus:ring-blue-200 text-sm disabled:bg-gray-100"
                    />
                  </td>

                  <td className="px-2 py-1 border w-32">
                    <input
                      type="number"
                      min="0"
                      value={row.mileage}
                      onChange={(e) =>
                        updateRow(i, "mileage", e.target.value)
                      }
                      disabled={isViewMode}
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring focus:ring-blue-200 text-sm disabled:bg-gray-100"
                    />
                  </td>

                  <td className="px-2 py-1 border w-48">
                    <input
                      type="text"
                      placeholder="Overnight area"
                      value={row.nightOutArea}
                      onChange={(e) =>
                        updateRow(i, "nightOutArea", e.target.value)
                      }
                      disabled={isViewMode}
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring focus:ring-blue-200 text-sm disabled:bg-gray-100"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-center bg-gray-50">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate("/itineraries")}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-200"
            >
              Back
            </button>
            {!isViewMode && (
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-200"
              >
                Save Itinerary
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
