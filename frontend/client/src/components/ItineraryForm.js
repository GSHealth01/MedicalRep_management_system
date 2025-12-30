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
  const [month, setMonth] = useState("");
  const [itinerary, setItinerary] = useState([]);
  const [daysInMonth, setDaysInMonth] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("pending");

  // Build rows whenever month changes (only for new forms)
  useEffect(() => {
    if (!month || isEditMode || isViewMode) return;
    
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
  }, [month, isEditMode, isViewMode]);

  const fetchUserDistributors = useCallback(async () => {
    try {
      const response = await api.get("/users/profile");
      const userData = response.data.user || response.data;
      
      // Set the first distributor as default if available
      if (userData.distributors && userData.distributors.length > 0) {
        const firstDistributor = userData.distributors[0];
        let distributorName = '';
        let distributorTown = '';
        
        if (firstDistributor.distributor && firstDistributor.distributor.name) {
          distributorName = firstDistributor.distributor.name;
          distributorTown = firstDistributor.distributor.coverage_town || '';
        } else if (firstDistributor.name) {
          distributorName = firstDistributor.name;
          distributorTown = firstDistributor.coverage_town || '';
        }
        
        if (distributorName && !isEditMode && !isViewMode) {
          setDistributor(distributorName);
          setTown(distributorTown);
        }
      }
    } catch (error) {
      console.error("Failed to fetch user distributors:", error);
    }
  }, [isEditMode, isViewMode]);

  useEffect(() => {
    if (user?.id && !isEditMode && !isViewMode) {
      fetchUserDistributors();
    }
  }, [user?.id, isEditMode, isViewMode, fetchUserDistributors]);

  const loadItinerary = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/itineraries/${id}`);
      const data = response.data.data;
      
      console.log("Loading itinerary data:", data);
      
      // Set basic fields
      setRepName(data.repName || "");
      setDistributor(data.distributor || "");
      setTown(data.town || "");
      setMonth(data.month || "");
      setStatus(data.status || "pending");
      
      // Build full month structure
      const [year, monthNum] = data.month.split("-").map((n) => +n);
      const dim = new Date(year, monthNum, 0).getDate();
      setDaysInMonth(dim);
      
      console.log(`Building ${dim} days for ${data.month}`);
      
      // Create full month template
      const fullMonthRows = Array.from({ length: dim }, (_, i) => {
        const day = i + 1;
        const date = `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return {
          date: date,
          dayNo: day,
          area: "",
          town: "",
          doctorCalls: "",
          chemistCalls: "",
          mileage: "",
          nightOutArea: "",
        };
      });
      
      // Merge with saved entries
      const entries = data.entries || [];
      console.log(`Found ${entries.length} saved entries`);
      
      const mergedRows = fullMonthRows.map(fullRow => {
        const savedEntry = entries.find(entry => entry.date === fullRow.date);
        if (savedEntry) {
          console.log(`Merging data for ${fullRow.date}:`, savedEntry);
          return {
            date: savedEntry.date,
            dayNo: savedEntry.dayNo || fullRow.dayNo,
            area: savedEntry.area || "",
            town: savedEntry.town || "",
            doctorCalls: savedEntry.doctorCalls ?? "",
            chemistCalls: savedEntry.chemistCalls ?? "",
            mileage: savedEntry.mileage ?? "",
            nightOutArea: savedEntry.nightOutArea || "",
          };
        }
        return fullRow;
      });
      
      console.log(`Setting ${mergedRows.length} rows in state`);
      setItinerary(mergedRows);
      
    } catch (error) {
      console.error("Load failed:", error);
      alert("Failed to load itinerary");
      navigate("/itineraries");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  // Load data if viewing or editing
  useEffect(() => {
    if ((isViewMode || isEditMode) && id) {
      console.log('Loading itinerary for ID:', id, 'Mode:', mode);
      loadItinerary();
    }
  }, [isViewMode, isEditMode, id, mode, loadItinerary]);

  const updateRow = (idx, field, value) => {
    setItinerary((rows) => {
      const copy = [...rows];
      copy[idx] = { ...copy[idx], [field]: value };
      checkCompletion(copy);
      return copy;
    });
  };

  const checkCompletion = (updatedItinerary) => {
    const allFilled = updatedItinerary.every(row =>
      row.date &&
      row.area &&
      row.town &&
      row.doctorCalls !== "" &&
      row.chemistCalls !== "" &&
      row.mileage !== ""
    );
    
    setStatus(allFilled ? "completed" : "pending");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!distributor || distributor.trim() === '') {
      showErrorToast("Please select a distributor before saving");
      return;
    }
    
    if (!month) {
      showErrorToast("Please select a month before saving");
      return;
    }
    
    // Only include entries that have at least some data
    const validEntries = itinerary.filter(entry =>
      entry.area || entry.town || entry.doctorCalls || entry.chemistCalls || entry.mileage
    );
    
    if (validEntries.length === 0) {
      showErrorToast("Please fill in at least one itinerary entry");
      return;
    }
    
    const payload = {
      repName: user?.name || repName,
      distributor: distributor.trim(),
      town: town.trim(),
      month,
      status,
      itinerary: validEntries.map(entry => ({
        date: entry.date,
        dayNo: entry.dayNo,
        area: entry.area || null,
        town: entry.town || null,
        doctorCalls: parseInt(entry.doctorCalls) || 0,
        chemistCalls: parseInt(entry.chemistCalls) || 0,
        mileage: parseFloat(entry.mileage) || 0,
        nightOutArea: entry.nightOutArea || null
      }))
    };
    
    console.log("Submitting payload:", payload);
    setLoading(true);
    
    try {
      if (isEditMode && id) {
        await api.put(`/itineraries/${id}`, payload);
        showSuccessToast("Itinerary updated successfully!");
      } else {
        await api.post("/itineraries", payload);
        showSuccessToast("Itinerary saved successfully!");
      }
      navigate("/itineraries");
    } catch (error) {
      console.error("Save failed:", error);
      let errorMessage = error.response?.data?.message || error.message;
      
      if (error.response?.status === 409) {
        errorMessage = "An itinerary already exists for this month. Please edit the existing itinerary or delete it first.";
      } else if (error.response?.status === 400) {
        errorMessage = "Invalid data provided. Please check all required fields.";
      }
      
      showErrorToast(`Save failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const showSuccessToast = (message) => {
    showToast(message, 'success');
  };

  const showErrorToast = (message) => {
    showToast(message, 'error');
  };

  const showToast = (message, type) => {
    const toast = document.createElement('div');
    toast.textContent = message;
    
    Object.assign(toast.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      borderRadius: '8px',
      color: 'white',
      fontWeight: '500',
      fontSize: '14px',
      zIndex: '9999',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      transition: 'all 0.3s ease',
      opacity: '0',
      transform: 'translateX(100%)',
      backgroundColor: type === 'success' ? '#10b981' : '#ef4444'
    });
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    }, 10);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  const minDate = month ? `${month}-01` : "";
  const maxDate = month ? `${month}-${String(daysInMonth).padStart(2, "0")}` : "";

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
          {isViewMode ? "View Itinerary" : isEditMode ? "Edit Itinerary" : "Monthly Itinerary Planner"}
        </h2>

        {/* Top fields */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-6 py-4 border-b">
          <label className="flex flex-col text-sm font-medium">
            Rep Name
            <div
              className="mt-1 px-3 py-2 border rounded-md bg-gray-100 text-gray-700"
              style={{ minHeight: '40px', display: 'flex', alignItems: 'center' }}
            >
              {user?.name || repName || 'Not logged in'}
            </div>
          </label>

          <label className="flex flex-col text-sm font-medium">
            Distributor
            <div
              className="mt-1 px-3 py-2 border rounded-md bg-gray-100 text-gray-700"
              style={{ minHeight: '40px', display: 'flex', alignItems: 'center' }}
            >
              {distributor || 'No distributor assigned'}
            </div>
          </label>

          <label className="flex flex-col text-sm font-medium">
            Town
            <input
              type="text"
              value={town}
              onChange={(e) => setTown(e.target.value)}
              disabled={isViewMode}
              className="mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-200 disabled:bg-gray-100"
            />
          </label>

          <label className="flex flex-col text-sm font-medium">
            Month
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              min="2025-01"
              required
              disabled={isViewMode || isEditMode}
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
                <th className="px-3 py-2 border text-center w-32">Doctor Calls</th>
                <th className="px-3 py-2 border text-center w-32">Chemist Calls</th>
                <th className="px-3 py-2 border text-center w-32">Mileage (km)</th>
                <th className="px-3 py-2 border text-left w-48">Night Out Area</th>
              </tr>
            </thead>
            <tbody>
              {itinerary.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-2 py-1 border w-40">
                    <input
                      type="date"
                      value={row.date}
                      min={minDate}
                      max={maxDate}
                      onChange={(e) => updateRow(i, "date", e.target.value)}
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
                      onChange={(e) => updateRow(i, "area", e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring focus:ring-blue-200 text-sm disabled:bg-gray-100"
                    />
                  </td>

                  <td className="px-2 py-1 border w-36">
                    <input
                      type="text"
                      value={row.town}
                      onChange={(e) => updateRow(i, "town", e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring focus:ring-blue-200 text-sm disabled:bg-gray-100"
                    />
                  </td>

                  <td className="px-2 py-1 border w-32">
                    <input
                      type="number"
                      min="0"
                      value={row.doctorCalls}
                      onChange={(e) => updateRow(i, "doctorCalls", e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring focus:ring-blue-200 text-sm disabled:bg-gray-100"
                    />
                  </td>

                  <td className="px-2 py-1 border w-32">
                    <input
                      type="number"
                      min="0"
                      value={row.chemistCalls}
                      onChange={(e) => updateRow(i, "chemistCalls", e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring focus:ring-blue-200 text-sm disabled:bg-gray-100"
                    />
                  </td>

                  <td className="px-2 py-1 border w-32">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.mileage}
                      onChange={(e) => updateRow(i, "mileage", e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring focus:ring-blue-200 text-sm disabled:bg-gray-100"
                    />
                  </td>

                  <td className="px-2 py-1 border w-48">
                    <input
                      type="text"
                      placeholder="Overnight area"
                      value={row.nightOutArea}
                      onChange={(e) => updateRow(i, "nightOutArea", e.target.value)}
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
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-200 disabled:opacity-50"
              >
                {loading ? 'Saving...' : (isEditMode ? 'Update Itinerary' : 'Save Itinerary')}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}