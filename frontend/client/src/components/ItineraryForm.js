// src/components/ItineraryForm.js
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import logo from '../assets/gsh.logo.png';
import { FaBars, FaTimes, FaSignOutAlt, FaUsers } from 'react-icons/fa';
import './RepDashboard.css';

export default function ItineraryForm() {
  const navigate = useNavigate();
  const { id, mode } = useParams();
  const [searchParams] = useSearchParams();
  const employeeId = searchParams.get('employeeId');
  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };
  
  // Night out options
  const NIGHT_OUT_OPTIONS = ["", "Night Out", "Daily Bata", "Half Night Out"];
  
  const [repName, setRepName] = useState("");
  const [distributor, setDistributor] = useState("");
  const [town, setTown] = useState("");
  const [month, setMonth] = useState("");
  const [itinerary, setItinerary] = useState([]);
  const [daysInMonth, setDaysInMonth] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("pending");
  
  // New state for storing all distributors
  const [allDistributors, setAllDistributors] = useState([]);

  // Build rows whenever month changes (only for new forms)
  useEffect(() => {
    if (!month || isEditMode || isViewMode) return;
    
    const [y, m] = month.split("-").map((n) => +n);
    const dim = new Date(y, m, 0).getDate();
    setDaysInMonth(dim);

    // Generate dates and filter out Sundays (day 0)
    const rows = [];
    let consecutiveDayNo = 1;
    for (let i = 1; i <= dim; i++) {
      const date = new Date(y, m - 1, i);
      const dayOfWeek = date.getDay();
      
      // Skip Sundays (dayOfWeek === 0)
      if (dayOfWeek === 0) continue;
      
      rows.push({
        date: `${month}-${String(i).padStart(2, "0")}`,
        dayNo: consecutiveDayNo++,
        area: "",
        town: "",
        doctorCalls: "",
        chemistCalls: "",
        mileage: "",
        nightOutArea: "",
      });
    }
    setItinerary(rows);
  }, [month, isEditMode, isViewMode]);

  const fetchUserDistributors = useCallback(async () => {
    try {
      const response = await api.get("/users/profile");
      const userData = response.data.user || response.data;
      
      // Handle both single distributor (for backward compatibility) and multiple distributors
      if (userData.distributors && userData.distributors.length > 0) {
        // Store all distributors for dropdown
        const distributorList = userData.distributors.map(d => ({
          code: d.distributor_code || d.distributor?.distributor_code,
          name: d.name || d.distributor?.name || d.distributor_code,
          town: d.coverage_town || d.distributor?.coverage_town,
          route: d.route || d.distributor?.route,
          area: d.area?.name || d.distributor?.area?.name || ''
        }));
        
        setAllDistributors(distributorList);
        
        // If not in edit or view mode, select first distributor as default
        if (!isEditMode && !isViewMode) {
          if (distributorList.length > 0) {
            const firstDist = distributorList[0];
            setDistributor(firstDist.name);
            setTown(firstDist.town);
          }
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
      // First fetch user profile to get distributors
      const profileResponse = await api.get("/users/profile");
      const userData = profileResponse.data.user || profileResponse.data;
      
      // Handle both single distributor (for backward compatibility) and multiple distributors
      if (userData.distributors && userData.distributors.length > 0) {
        const distributorList = userData.distributors.map(d => ({
          code: d.distributor_code || d.distributor?.distributor_code,
          name: d.name || d.distributor?.name || d.distributor_code,
          town: d.coverage_town || d.distributor?.coverage_town,
          route: d.route || d.distributor?.route,
          area: d.area?.name || d.distributor?.area?.name || ''
        }));
        setAllDistributors(distributorList);
      }
      
      const response = await api.get(`/itineraries/${id}`, { params: employeeId ? { employeeId } : {} });
      const data = response.data.data;
      
      console.log("Loading itinerary data:", data);
      
      // Set basic fields
      setRepName(data.repName || "");
      setDistributor(data.distributor || "");
      setTown(data.town || "");
      setMonth(data.month || "");
      setStatus(data.status || "pending");
      
      // Find and set the selected distributor code for edit mode
      if (data.distributor && userData.distributors) {
        const matchedDist = userData.distributors.find(d => 
          d.name === data.distributor || 
          d.distributor?.name === data.distributor
        );
        if (matchedDist) {
          setDistributor(matchedDist.name || matchedDist.distributor?.name || data.distributor);
        }
      }
      
      // Build full month structure
      const [year, monthNum] = data.month.split("-").map((n) => +n);
      const dim = new Date(year, monthNum, 0).getDate();
      setDaysInMonth(dim);
      
      console.log(`Building ${dim} days for ${data.month}`);
      
      // Build full month structure (excluding Sundays)
      const fullMonthRows = [];
      let consecutiveDayNo = 1;
      for (let i = 1; i <= dim; i++) {
        const date = new Date(year, monthNum - 1, i);
        const dayOfWeek = date.getDay();
        
        // Skip Sundays (dayOfWeek === 0)
        if (dayOfWeek === 0) continue;
        
        const dateStr = `${year}-${String(monthNum).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
        fullMonthRows.push({
          date: dateStr,
          dayNo: consecutiveDayNo++,
          area: "",
          town: "",
          doctorCalls: "",
          chemistCalls: "",
          mileage: "",
          nightOutArea: "",
        });
      }
      
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
    <div className="dashboard-wrapper">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <button 
          className="toggle-btn"
          onClick={() => setSidebarOpen(o => !o)}
        >
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
        <img src={logo} alt="GSH Logo" className="logo" />
        <nav className="sidebar-nav">
          <ul>
            <li onClick={() => {
              const d = user?.designation;
              if (d === 'OM') navigate('/om-dashboard');
              else if (['SM','MGR','PM','TM','PPES','PPEJ','FC'].includes(d)) navigate('/team-dashboard');
              else navigate('/rep-dashboard');
            }}>Overview</li>
            {user?.designation === 'OM' && (
              <li 
                onClick={() => navigate('/om-dashboard', { state: { tab: 'Employee Overview' } })}
              >
                Employee Overview
              </li>
            )}
            {['SM','MGR','PM','TM','PPES','PPEJ','FC'].includes(user?.designation) && (
              <li 
                onClick={() => navigate('/team-dashboard', { state: { tab: 'Employee Overview' } })}
              >
                Team Overview
              </li>
            )}
            <li className="active" onClick={() => navigate('/itineraries')}>Itinerary</li>
            <li onClick={() => navigate('/dcr-reports')}>Reports</li>
          </ul>
        </nav>
        <div className="sidebar-footer">
          <button 
            className="logout-btn-sidebar"
            onClick={handleLogout}
            title="Logout"
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="main-content">
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
              {allDistributors.length > 0 
                ? allDistributors.map(d => d.name).join(', ') 
                : (distributor || 'No distributor assigned')}
            </div>
          </label>

          <label className="flex flex-col text-sm font-medium">
            Town - Route
            <div
              className="mt-1 px-3 py-2 border rounded-md bg-gray-100 text-gray-700"
              style={{ minHeight: '40px', display: 'flex', alignItems: 'center' }}
            >
              {allDistributors.length > 0 
                ? [...new Set(allDistributors.map(d => d.town).filter(Boolean))].join(', ') 
                : (town || 'No town assigned')}
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
                <th className="px-3 py-2 border text-left w-36">Town - Route</th>
                <th className="px-3 py-2 border text-center w-32">Doctor Calls</th>
                <th className="px-3 py-2 border text-center w-32">Chemist Calls</th>
                <th className="px-3 py-2 border text-center w-32">Scheduled Mileage (km)</th>
                <th className="px-3 py-2 border text-left w-48">Allowance Type</th>
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
                    <select
                      value={row.nightOutArea || ""}
                      onChange={(e) => updateRow(i, "nightOutArea", e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring focus:ring-blue-200 text-sm disabled:bg-gray-100"
                    >
                      {NIGHT_OUT_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option === "" ? "Select" : option}
                        </option>
                      ))}
                    </select>
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
              onClick={() => navigate(`/itineraries${employeeId ? `?employeeId=${employeeId}` : ''}`)}
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
    </div>
    </div>
  );
}