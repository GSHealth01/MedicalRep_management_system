import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  FaTimesCircle,
  FaArrowLeft,
  FaUser,
  FaMapMarkerAlt,
  FaUsers
} from 'react-icons/fa';
import './RepDashboard.css';

// Get available months from data - returns format like "March 2026"
const getAvailableMonths = (itineraries, dcrs) => {
  const months = new Set();
  
  itineraries.forEach(itinerary => {
    if (itinerary.month) {
      let monthStr = itinerary.month;
      if (monthStr.match(/^\d{4}-\d{2}$/)) {
        const [year, month] = monthStr.split('-');
        const date = new Date(`${year}-${month}-01`);
        monthStr = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      }
      months.add(monthStr);
    }
  });
  
  Object.keys(dcrs).forEach(monthYear => {
    months.add(monthYear);
  });
  
  const sortedMonths = Array.from(months).sort((a, b) => {
    const dateA = new Date(a + '-01');
    const dateB = new Date(b + '-01');
    return dateB - dateA;
  });
  
  return sortedMonths;
};

const designationMap = {
  'OM':   'Operations Manager',
  'SM':   'Senior Manager',
  'MGR':  'Manager',
  'PM':   'Products Manager',
  'TM':   'Territory Manager',
  'PPES': 'Product Promotion Executive - Senior',
  'PPEJ': 'Product Promotion Executive - Junior',
  'FC':   'Field Coordinator',
  'MR':   'Medical Representative',
  'ADMIN':'Admin'
};

// Designations with hierarchy access (can view subordinate dashboards)
const HIERARCHY_DESIGNATIONS = ['OM', 'SM', 'MGR', 'PM', 'TM', 'PPES', 'PPEJ', 'FC'];

const getHomeDashboard = (designation) => {
  if (designation === 'OM') return '/om-dashboard';
  if (['SM','MGR','PM','TM','PPES','PPEJ','FC'].includes(designation)) return '/team-dashboard';
  return '/rep-dashboard';
};

export default function EmployeeRepDashboard() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [employee, setEmployee] = useState(null);
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

        // Fetch employee profile — try all users endpoint so any designation is found
        let emp = null;
        try {
          const subRes = await api.get('/users/team-subordinates');
          const subs = subRes.data.data || [];
          emp = subs.find(e => e.id === parseInt(id));
        } catch (_) {}
        if (!emp) {
          // Fallback: search employees endpoint
          try {
            const empRes = await api.get('/users/employees');
            const emps = empRes.data.data || [];
            emp = emps.find(e => e.id === parseInt(id));
          } catch (_) {}
        }
        if (!emp) {
          setError('Employee not found or you do not have permission to view this dashboard');
          return;
        }
        setEmployee(emp);

        // Fetch itineraries for this employee
        const itinerariesResponse = await api.get(`/itineraries?employeeId=${id}`);
        const itinerariesData = itinerariesResponse.data.data || [];
        setItineraries(itinerariesData);

        // Fetch DCRs for this employee
        const dcrsResponse = await api.get(`/dcrs?employeeId=${id}`);
        const dcrsData = dcrsResponse.data.dcrs || {};
        setDcrs(dcrsData);

        // Get available months
        const months = getAvailableMonths(itinerariesData, dcrsData);
        setAvailableMonths(months);

        if (months.length > 0) {
          setSelectedMonth(months[0]);
        }

        // Fetch allocated prices based on employee's designation
        if (emp?.designation) {
          try {
            const pricesResponse = await getAllocatedPriceByDesignationCode(emp.designation);
            if (pricesResponse.data) {
              setAllocatedPrices(pricesResponse.data);
            }
          } catch (priceErr) {
            console.error('Error fetching allocated prices:', priceErr);
          }
        }

      } catch (err) {
        console.error('Error fetching employee dashboard data:', err);
        setError('Failed to load employee dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  // Calculate dashboard metrics for selected month (same logic as RepDashboard)
  const calculateMetrics = () => {
    if (!selectedMonth) return null;

    let monthKey = selectedMonth;
    if (monthKey.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = monthKey.split('-');
      const date = new Date(`${year}-${month}-01`);
      monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    }

    const monthDcrs = dcrs[monthKey] || [];
    
    const monthItineraries = itineraries.filter(it => {
      let itMonth = it.month;
      if (itMonth && itMonth.match(/^\d{4}-\d{2}$/)) {
        const [year, m] = itMonth.split('-');
        const date = new Date(`${year}-${m}-01`);
        itMonth = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      }
      return itMonth === monthKey;
    });
    
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

    let actualDoctorCalls = 0;
    let actualChemistCalls = 0;
    let actualMileage = 0;
    let totalFuelPumped = 0;
    let totalFuelCost = 0;
    let bataDays = 0;
    let nightOutDays = 0;
    let nightOutReturnDays = 0;

    monthDcrs.forEach(dcr => {
      if (dcr.callReport && Array.isArray(dcr.callReport)) {
        dcr.callReport.forEach(entry => {
          if (entry.doctor) actualDoctorCalls++;
          if (entry.chemist) actualChemistCalls++;
        });
      }

      if (dcr.mileage) {
        let opening = parseFloat(dcr.mileage.openingMileage) || 0;
        let closing = parseFloat(dcr.mileage.closingMileage) || 0;
        
        if (opening === 0 && dcr.mileage.odometerStart) {
          opening = parseFloat(dcr.mileage.odometerStart) || 0;
        }
        if (closing === 0 && dcr.mileage.odometerEnd) {
          closing = parseFloat(dcr.mileage.odometerEnd) || 0;
        }
        
        if (closing >= opening && closing > 0 && opening > 0) {
          actualMileage += (closing - opening);
        } else if (closing > 0 && opening > 0) {
          actualMileage += Math.abs(closing - opening);
        }

        totalFuelPumped += parseFloat(dcr.mileage?.fuelPumped) || 0;
        totalFuelCost += parseFloat(dcr.mileage?.cost) || 0;
      }

      if (dcr.dailyExpenses) {
        if (dcr.dailyExpenses.bata) bataDays++;
        if (dcr.dailyExpenses.nightOut) nightOutDays++;
        if (dcr.dailyExpenses.nightOutReturn) nightOutReturnDays++;
      }
    });

    const doctorCallsPercentage = scheduledDoctorCalls > 0 
      ? (actualDoctorCalls / scheduledDoctorCalls) * 100 
      : 0;
    const chemistCallsPercentage = scheduledChemistCalls > 0 
      ? (actualChemistCalls / scheduledChemistCalls) * 100 
      : 0;
    const mileagePercentage = scheduledMileage > 0 
      ? (actualMileage / scheduledMileage) * 100 
      : 0;

    const exceededMileage = Math.max(0, actualMileage - scheduledMileage);
    const monthlyFuelAllocation = allocatedPrices?.monthlyFuel || 0;
    const exceededFuelCost = Math.max(0, totalFuelCost - monthlyFuelAllocation);

    const dailyBataAmount = allocatedPrices?.dailyBata || 0;
    const nightOutAmount = allocatedPrices?.nightOut || 0;
    const nightOutReturnAmount = allocatedPrices?.nightOutReturn || 0;
    
    const totalBata = bataDays * dailyBataAmount;
    const totalNightOut = (nightOutDays * nightOutAmount) + (nightOutReturnDays * nightOutReturnAmount);

    return {
      scheduledDoctorCalls,
      actualDoctorCalls,
      doctorCallsPercentage,
      scheduledChemistCalls,
      actualChemistCalls,
      chemistCallsPercentage,
      scheduledMileage,
      actualMileage,
      mileagePercentage,
      exceededMileage,
      totalFuelPumped,
      totalFuelCost,
      exceededFuelCost,
      bataDays,
      totalBata,
      nightOutDays,
      nightOutReturnDays,
      totalNightOut,
      dcrCount: monthDcrs.length,
      itineraryCount: monthItineraries.length
    };
  };

  const metrics = calculateMetrics();

  const getPercentageColor = (percentage) => {
    if (percentage >= 100) return 'text-green-600';
    return 'text-red-600';
  };

  const getPercentageBgColor = (percentage) => {
    if (percentage >= 100) return 'bg-green-100 border-green-300';
    return 'bg-red-100 border-red-300';
  };

  const getMileageBgColor = (percentage) => {
    if (percentage >= 100) return 'bg-red-100 border-red-300';
    return 'bg-green-100 border-green-300';
  };

  const getMileageTextColor = (percentage) => {
    if (percentage >= 100) return 'text-red-600';
    return 'text-green-600';
  };

  const getMileageIcon = (percentage) => {
    if (percentage >= 100) return <FaTimesCircle className="text-red-600" />;
    return <FaCheckCircle className="text-green-600" />;
  };

  const getPercentageIcon = (percentage) => {
    if (percentage >= 100) return <FaCheckCircle className="text-green-600" />;
    return <FaTimesCircle className="text-red-600" />;
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="flex items-center justify-center py-20" style={{ flex: 1, marginLeft: '220px' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading employee dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-wrapper">
        <div className="flex items-center justify-center py-20" style={{ flex: 1, marginLeft: '220px' }}>
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
            <li className="active">Employee Dashboard</li>
            <li onClick={() => navigate(getHomeDashboard(user?.designation))}>
              ← Team Overview
            </li>
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
          <button
            onClick={() => navigate(getHomeDashboard(user?.designation))}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#e0e7ff',
              color: '#3730a3',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem'
            }}
          >
            <FaArrowLeft /> Back to Team Overview
          </button>
          <div className="actions">
            <span className="user-info">
              Viewing: {employee?.name || 'Employee'} | Logged in as: {user?.name || 'Manager'}
            </span>
          </div>
        </header>

        {/* Employee Profile Banner */}
        {employee && (
          <div style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
            color: 'white',
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              fontWeight: 'bold',
              flexShrink: 0
            }}>
              {employee.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>{employee.name}</h2>
              <p style={{ margin: '0.25rem 0 0 0', color: 'rgba(255,255,255,0.85)', fontSize: '1rem' }}>
                {designationMap[employee.designation] || employee.designation}
              </p>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.75)' }}>
                {employee.sector && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <FaMapMarkerAlt />
                    {employee.sector.range} – {employee.sector.agency}
                  </span>
                )}
                {employee.team && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <FaUsers />
                    {employee.team.name}
                  </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <FaUser />
                  Emp No: {employee.emp_no || 'N/A'}
                </span>
              </div>
            </div>
            {/* Action buttons for OM */}
            <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
              <button
                onClick={() => navigate(`/itineraries?employeeId=${id}`)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.4)',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '0.875rem'
                }}
              >
                View Itineraries
              </button>
              <button
                onClick={() => navigate(`/dcr-reports?employeeId=${id}`)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.4)',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '0.875rem'
                }}
              >
                View DCR Reports
              </button>
            </div>
          </div>
        )}

        {/* Month Selector */}
        <div className="month-selector-container">
          <label htmlFor="emp-month-select" className="month-label">
            <FaCalendarAlt className="mr-2" />
            Select Month:
          </label>
          <select
            id="emp-month-select"
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
          {employee?.designation && (
            <span className="designation-badge">
              Designation: {employee.designation}
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

            {/* Mileage Details */}
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
            <p>No month data available for this employee. They haven't submitted any itineraries or DCRs yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
