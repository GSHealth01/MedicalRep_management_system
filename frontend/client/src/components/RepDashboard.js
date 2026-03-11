import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, getAllocatedPriceByDesignationCode } from '../services/api';
import logo from '../assets/gsh.logo.png';
import {
  FaPhone,
  FaClinicMedical,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaRoute,
  FaGasPump,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaMoon,
  FaCheckCircle,
  FaTimesCircle
} from 'react-icons/fa';
import './RepDashboard.css';

// Get available months from data - returns format like "March 2026"
const getAvailableMonths = (itineraries, dcrs) => {
  const months = new Set();
  
  // Add months from itineraries - convert from "2026-03" to "March 2026"
  itineraries.forEach(itinerary => {
    if (itinerary.month) {
      // Handle both "2026-03" and "March 2026" formats
      let monthStr = itinerary.month;
      if (monthStr.match(/^\d{4}-\d{2}$/)) {
        const [year, month] = monthStr.split('-');
        const date = new Date(`${year}-${month}-01`);
        monthStr = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      }
      months.add(monthStr);
    }
  });
  
  // Add months from DCRs - already in "Month Year" format
  Object.keys(dcrs).forEach(monthYear => {
    months.add(monthYear);
  });
  
  // Sort months in chronological order
  const sortedMonths = Array.from(months).sort((a, b) => {
    const dateA = new Date(a + '-01');
    const dateB = new Date(b + '-01');
    return dateB - dateA; // Most recent first
  });
  
  return sortedMonths;
};

export default function RepDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [itineraries, setItineraries] = useState([]);
  const [dcrs, setDcrs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [allocatedPrices, setAllocatedPrices] = useState(null);
  const [availableMonths, setAvailableMonths] = useState([]);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch itineraries
        const itinerariesResponse = await api.get('/itineraries');
        const itinerariesData = itinerariesResponse.data.data || [];
        setItineraries(itinerariesData);

        // Fetch DCRs
        const dcrsResponse = await api.get('/dcrs');
        const dcrsData = dcrsResponse.data.dcrs || {};
        setDcrs(dcrsData);

        // Get available months
        const months = getAvailableMonths(itinerariesData, dcrsData);
        setAvailableMonths(months);

        // Set default selected month to most recent
        if (months.length > 0) {
          setSelectedMonth(months[0]);
        }

        // Fetch allocated prices based on user designation
        if (user?.designation) {
          try {
            const pricesResponse = await getAllocatedPriceByDesignationCode(user.designation);
            if (pricesResponse.data) {
              setAllocatedPrices(pricesResponse.data);
            }
          } catch (priceErr) {
            console.error('Error fetching allocated prices:', priceErr);
          }
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.designation]);

  // Calculate dashboard metrics for selected month
  const calculateMetrics = () => {
    if (!selectedMonth) return null;

    // Convert selectedMonth to "Month Year" format if needed
    let monthKey = selectedMonth;
    if (monthKey.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = monthKey.split('-');
      const date = new Date(`${year}-${month}-01`);
      monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    }

    // Filter DCRs for selected month
    const monthDcrs = dcrs[monthKey] || [];
    
    // Filter itineraries for selected month
    const monthItineraries = itineraries.filter(it => {
      let itMonth = it.month;
      if (itMonth && itMonth.match(/^\d{4}-\d{2}$/)) {
        const [year, m] = itMonth.split('-');
        const date = new Date(`${year}-${m}-01`);
        itMonth = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      }
      return itMonth === monthKey;
    });
    
    // Calculate scheduled values from itinerary
    let scheduledDoctorCalls = 0;
    let scheduledChemistCalls = 0;
    let scheduledMileage = 0;
    
    monthItineraries.forEach(itinerary => {
      if (itinerary.entries && Array.isArray(itinerary.entries)) {
        itinerary.entries.forEach(entry => {
          scheduledDoctorCalls += parseInt(entry.doctorCalls) || 0;
          scheduledChemistCalls += parseInt(entry.chemistCalls) || 0;
          scheduledMileage += parseFloat(entry.mileage) || 0;
        });
      }
    });

    // Calculate actual values from DCR
    let actualDoctorCalls = 0;
    let actualChemistCalls = 0;
    let actualMileage = 0;
    let totalFuelPumped = 0;
    let totalFuelCost = 0;
    let bataDays = 0;
    let nightOutDays = 0;
    let nightOutReturnDays = 0;

    monthDcrs.forEach(dcr => {
      // Count doctors and chemists from callReport
      if (dcr.callReport && Array.isArray(dcr.callReport)) {
        dcr.callReport.forEach(entry => {
          if (entry.doctor) actualDoctorCalls++;
          if (entry.chemist) actualChemistCalls++;
        });
      }

      // Calculate actual mileage (closing - opening + private)
      // Handle both cases: closing >= opening and closing < opening
      if (dcr.mileage) {
        let opening = parseFloat(dcr.mileage.openingMileage) || 0;
        let closing = parseFloat(dcr.mileage.closingMileage) || 0;
        
        // If opening/closing not available, try alternative field names
        if (opening === 0 && dcr.mileage.odometerStart) {
          opening = parseFloat(dcr.mileage.odometerStart) || 0;
        }
        if (closing === 0 && dcr.mileage.odometerEnd) {
          closing = parseFloat(dcr.mileage.odometerEnd) || 0;
        }
        
        // Calculate mileage - handle both cases
        if (closing >= opening && closing > 0 && opening > 0) {
          // Normal case: closing is greater than or equal to opening
          actualMileage += (closing - opening);
        } else if (closing > 0 && opening > 0) {
          // Closing is less than opening - use absolute difference (odometer might have been reset)
          actualMileage += Math.abs(closing - opening);
        }

        // Fuel pumped and fuel cost from DCR mileage
        totalFuelPumped += parseFloat(dcr.mileage?.fuelPumped) || 0;
        totalFuelCost += parseFloat(dcr.mileage?.cost) || 0;
      }

      // Count bata and night out days
      if (dcr.dailyExpenses) {
        if (dcr.dailyExpenses.bata) bataDays++;
        if (dcr.dailyExpenses.nightOut) nightOutDays++;
        if (dcr.dailyExpenses.nightOutReturn) nightOutReturnDays++;
      }
    });

    // Calculate percentages
    const doctorCallsPercentage = scheduledDoctorCalls > 0 
      ? (actualDoctorCalls / scheduledDoctorCalls) * 100 
      : 0;
    const chemistCallsPercentage = scheduledChemistCalls > 0 
      ? (actualChemistCalls / scheduledChemistCalls) * 100 
      : 0;
    const mileagePercentage = scheduledMileage > 0 
      ? (actualMileage / scheduledMileage) * 100 
      : 0;

    // Calculate exceeded mileage (actual - scheduled, positive means exceeded)
    // Show 0 if not exceeded (negative value)
    const exceededMileage = Math.max(0, actualMileage - scheduledMileage);

    // Calculate exceeded fuel cost = totalFuelCost - monthlyFuelAllocation
    // Show 0 if not exceeded (negative value)
    const monthlyFuelAllocation = allocatedPrices?.monthlyFuel || 0;
    const exceededFuelCost = Math.max(0, totalFuelCost - monthlyFuelAllocation);

    // Calculate expenses based on designation
    const dailyBataAmount = allocatedPrices?.dailyBata || 0;
    const nightOutAmount = allocatedPrices?.nightOut || 0;
    const nightOutReturnAmount = allocatedPrices?.nightOutReturn || 0;
    
    const totalBata = bataDays * dailyBataAmount;
    const totalNightOut = (nightOutDays * nightOutAmount) + (nightOutReturnDays * nightOutReturnAmount);

    return {
      // Doctor Calls
      scheduledDoctorCalls,
      actualDoctorCalls,
      doctorCallsPercentage,
      
      // Chemist Calls
      scheduledChemistCalls,
      actualChemistCalls,
      chemistCallsPercentage,
      
      // Mileage
      scheduledMileage,
      actualMileage,
      mileagePercentage,
      
      // Exceeded Mileage
      exceededMileage,
      totalFuelPumped,
      totalFuelCost,
      exceededFuelCost,
      
      // Expenses
      bataDays,
      totalBata,
      nightOutDays,
      nightOutReturnDays,
      totalNightOut,
      
      // Counts
      dcrCount: monthDcrs.length,
      itineraryCount: monthItineraries.length
    };
  };

  const metrics = calculateMetrics();

  // Helper to get color based on percentage
  const getPercentageColor = (percentage) => {
    if (percentage >= 100) return 'text-green-600';
    return 'text-red-600';
  };

  // Helper to get background color based on percentage
  const getPercentageBgColor = (percentage) => {
    if (percentage >= 100) return 'bg-green-100 border-green-300';
    return 'bg-red-100 border-red-300';
  };

  // Helper to get background color for Mileage (inverted logic)
  const getMileageBgColor = (percentage) => {
    if (percentage >= 100) return 'bg-red-100 border-red-300';
    return 'bg-green-100 border-green-300';
  };

  // Helper to get text color for Mileage (inverted logic)
  const getMileageTextColor = (percentage) => {
    if (percentage >= 100) return 'text-red-600';
    return 'text-green-600';
  };

  // Helper to get icon for Mileage (inverted logic)
  const getMileageIcon = (percentage) => {
    if (percentage >= 100) return <FaTimesCircle className="text-red-600" />;
    return <FaCheckCircle className="text-green-600" />;
  };

  // Helper to get icon based on percentage
  const getPercentageIcon = (percentage) => {
    if (percentage >= 100) return <FaCheckCircle className="text-green-600" />;
    return <FaTimesCircle className="text-red-600" />;
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-wrapper">
        <div className="flex items-center justify-center py-20">
          <div className="text-red-500 text-center">
            <p className="text-lg font-semibold">Error loading dashboard</p>
            <p>{error}</p>
          </div>
        </div>
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
          {sidebarOpen ? <FaTimes/> : <FaBars/>}
        </button>
        <img src={logo} alt="GSH Logo" className="logo" />
        <nav className="sidebar-nav">
          <ul>
            <li className="active">Overview</li>
            <li onClick={() => navigate('/itineraries')}>Itinerary</li>
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

      {/* Main content */}
      <div className="main-content">
        {/* Top bar */}
        <header className="topbar">
          <div className="actions">
            <span className="user-info">
              Welcome, {user?.name || 'User'}
            </span>
          </div>
        </header>

        {/* Month Selector */}
        <div className="month-selector-container">
          <label htmlFor="month-select" className="month-label">
            <FaCalendarAlt className="mr-2" />
            Select Month:
          </label>
          <select
            id="month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="month-select"
          >
            {availableMonths.length === 0 ? (
              <option value="">No data available</option>
            ) : (
              availableMonths.map(month => (
                <option key={month} value={month}>{month}</option>
              ))
            )}
          </select>
          {user?.designation && (
            <span className="designation-badge">
              Designation: {user.designation}
            </span>
          )}
        </div>

        {selectedMonth && metrics && (
          <>
            {/* Overview Cards */}
            <section className="overview-cards">
              {/* Doctor Calls Card */}
              <div className={`overview-card ${getPercentageBgColor(metrics.doctorCallsPercentage)}`}>
                <div className="card-header">
                  <div className="card-icon">
                    <FaPhone />
                  </div>
                  <div className="card-title">
                    <h3>Doctor Calls</h3>
                    <p className="card-subtitle">for {selectedMonth}</p>
                  </div>
                  <div className="card-percentage">
                    {getPercentageIcon(metrics.doctorCallsPercentage)}
                    <span className={getPercentageColor(metrics.doctorCallsPercentage)}>
                      {metrics.doctorCallsPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="card-content">
                  <div className="metric-value">
                    <span className="actual-value">{metrics.actualDoctorCalls}</span>
                    <span className="separator">/</span>
                    <span className="scheduled-value">{metrics.scheduledDoctorCalls}</span>
                  </div>
                  <p className="metric-label">Actual / Scheduled</p>
                </div>
              </div>

              {/* Chemist Calls Card */}
              <div className={`overview-card ${getPercentageBgColor(metrics.chemistCallsPercentage)}`}>
                <div className="card-header">
                  <div className="card-icon">
                    <FaClinicMedical />
                  </div>
                  <div className="card-title">
                    <h3>Chemist Calls</h3>
                    <p className="card-subtitle">for {selectedMonth}</p>
                  </div>
                  <div className="card-percentage">
                    {getPercentageIcon(metrics.chemistCallsPercentage)}
                    <span className={getPercentageColor(metrics.chemistCallsPercentage)}>
                      {metrics.chemistCallsPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="card-content">
                  <div className="metric-value">
                    <span className="actual-value">{metrics.actualChemistCalls}</span>
                    <span className="separator">/</span>
                    <span className="scheduled-value">{metrics.scheduledChemistCalls}</span>
                  </div>
                  <p className="metric-label">Actual / Scheduled</p>
                </div>
              </div>

              {/* Total Mileage Card */}
              <div className={`overview-card ${getMileageBgColor(metrics.mileagePercentage)}`}>
                <div className="card-header">
                  <div className="card-icon">
                    <FaRoute />
                  </div>
                  <div className="card-title">
                    <h3>Total Mileage</h3>
                    <p className="card-subtitle">for {selectedMonth}</p>
                  </div>
                  <div className="card-percentage">
                    {getMileageIcon(metrics.mileagePercentage)}
                    <span className={getMileageTextColor(metrics.mileagePercentage)}>
                      {metrics.mileagePercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="card-content">
                  <div className="metric-value">
                    <span className="actual-value">{metrics.actualMileage.toFixed(1)} km</span>
                    <span className="separator">/</span>
                    <span className="scheduled-value">{metrics.scheduledMileage.toFixed(1)} km</span>
                  </div>
                  <p className="metric-label">Actual / Scheduled</p>
                </div>
              </div>
            </section>

            {/* Exceeded Mileage Section */}
            <section className="details-section">
              <h3 className="section-title">
                <FaRoute /> Mileage Details
              </h3>
              <div className="exceeded-mileage-cards">
                <div className="exceeded-card">
                  <div className="exceeded-icon">
                    <FaRoute />
                  </div>
                  <div className="exceeded-content">
                    <p className="exceeded-label">Exceeded Mileage</p>
                    <p className="exceeded-value">{(metrics.exceededMileage || 0).toFixed(1)} km</p>
                    <p className="exceeded-detail">
                      (Actual: {(metrics.actualMileage || 0).toFixed(1)} km - Scheduled: {(metrics.scheduledMileage || 0).toFixed(1)} km)
                    </p>
                  </div>
                </div>

                <div className="exceeded-card">
                  <div className="exceeded-icon">
                    <FaGasPump />
                  </div>
                  <div className="exceeded-content">
                    <p className="exceeded-label">Total Fuel Pumped</p>
                    <p className="exceeded-value">{(metrics.totalFuelPumped || 0).toFixed(2)} L</p>
                    <p className="exceeded-detail">
                      Cost: Rs. {((metrics.totalFuelCost) || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="exceeded-card highlight">
                  <div className="exceeded-icon">
                    <FaMoneyBillWave />
                  </div>
                  <div className="exceeded-content">
                    <p className="exceeded-label">Exceeded Fuel Cost</p>
                    <p className="exceeded-value">Rs. {((metrics.exceededFuelCost) || 0).toFixed(2)}</p>
                    <p className="exceeded-detail">
                      (Total Fuel Cost: Rs. {(metrics.totalFuelCost || 0).toFixed(2)} - Monthly Allocation: Rs. {(allocatedPrices?.monthlyFuel || 0)})
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Expenses Section */}
            <section className="details-section">
              <h3 className="section-title">
                <FaMoneyBillWave /> Expenses
              </h3>
              <div className="expenses-cards">
                <div className="expense-card">
                  <div className="expense-icon">
                    <FaCheckCircle />
                  </div>
                  <div className="expense-content">
                    <p className="expense-label">Total Daily Bata</p>
                    <p className="expense-days">{metrics.bataDays} day(s)</p>
                    <p className="expense-amount">
                      Rs. {metrics.totalBata.toFixed(2)}
                      <span className="expense-rate">
                        (Rs. {allocatedPrices?.dailyBata || 0}/day)
                      </span>
                    </p>
                  </div>
                </div>

                <div className="expense-card">
                  <div className="expense-icon">
                    <FaMoon />
                  </div>
                  <div className="expense-content">
                    <p className="expense-label">Night Out</p>
                    <p className="expense-days">
                      {metrics.nightOutDays} night(s)
                    </p>
                    <p className="expense-amount">
                      Rs. {(metrics.nightOutDays * (allocatedPrices?.nightOut || 0)).toFixed(2)}
                      <span className="expense-rate">
                        (Rs. {allocatedPrices?.nightOut || 0}/night)
                      </span>
                    </p>
                  </div>
                </div>

                <div className="expense-card">
                  <div className="expense-icon">
                    <FaMoon />
                  </div>
                  <div className="expense-content">
                    <p className="expense-label">Night Out Return</p>
                    <p className="expense-days">
                      {metrics.nightOutReturnDays} return(s)
                    </p>
                    <p className="expense-amount">
                      Rs. {(metrics.nightOutReturnDays * (allocatedPrices?.nightOutReturn || 0)).toFixed(2)}
                      <span className="expense-rate">
                        (Rs. {allocatedPrices?.nightOutReturn || 0}/return)
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Summary Stats */}
            <section className="summary-stats">
              <div className="summary-item">
                <span className="summary-label">Total DCRs Submitted:</span>
                <span className="summary-value">{metrics.dcrCount}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Itinerary Status:</span>
                <span className="summary-value">{metrics.itineraryCount > 0 ? 'Available' : 'Not Available'}</span>
              </div>
            </section>
          </>
        )}

        {!selectedMonth && (
          <div className="no-data-message">
            <p>No month data available. Please create itineraries and DCRs to see your dashboard.</p>
          </div>
        )}
      </div>
    </div>
  );
}
