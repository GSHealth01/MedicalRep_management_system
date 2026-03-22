import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  FaUsers,
  FaSync,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaUser
} from 'react-icons/fa';
import './RepDashboard.css';

// ─────────────────────────────────────────────
// Designation helpers
// ─────────────────────────────────────────────
const DESIGNATION_NAMES = {
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

const getDesignationName = (code) => DESIGNATION_NAMES[code] || code || '-';

// ─────────────────────────────────────────────
// TeamEmployeeOverview – shows subordinates
// ─────────────────────────────────────────────
function TeamEmployeeOverview() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    const fetchSubordinates = async () => {
      try {
        const response = await api.get('/users/team-subordinates');
        setEmployees(response.data.data || []);
      } catch (err) {
        console.error('Error fetching team subordinates:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubordinates();
  }, []);

  const sortedEmployees = useMemo(() => {
    return [...employees].sort((a, b) => {
      let aValue, bValue;
      if (sortBy === 'range') {
        aValue = a.sector?.range || '';
        bValue = b.sector?.range || '';
      } else if (sortBy === 'agency') {
        aValue = a.sector?.agency || '';
        bValue = b.sector?.agency || '';
      } else {
        aValue = a.name || '';
        bValue = b.name || '';
      }
      return sortOrder === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  }, [employees, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return <FaSort className="text-gray-400" />;
    return sortOrder === 'asc' ? <FaSortUp className="text-blue-600" /> : <FaSortDown className="text-blue-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading team members...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Team Overview</h2>
        <p className="text-sm text-gray-500 mt-1">
          Showing team members below your level in the hierarchy
        </p>
      </div>

      {employees.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <FaUsers className="text-5xl mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No team members found</p>
          <p className="text-sm mt-1">Either you have no team assigned or there are no members below your designation.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  <button className="flex items-center gap-1" onClick={() => handleSort('name')}>
                    Name {getSortIcon('name')}
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Emp No
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Designation
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  <button className="flex items-center gap-1" onClick={() => handleSort('range')}>
                    Range {getSortIcon('range')}
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  <button className="flex items-center gap-1" onClick={() => handleSort('agency')}>
                    Agency {getSortIcon('agency')}
                  </button>
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {sortedEmployees.map((emp) => (
                <tr
                  key={emp.id}
                  className="hover:bg-blue-50 cursor-pointer transition-colors duration-150"
                  onClick={() => navigate(`/employee-rep-dashboard/${emp.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                        <FaUser className="text-blue-600 text-sm" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{emp.emp_no || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {getDesignationName(emp.designation)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {emp.sector?.range || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {emp.sector?.agency || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/employee-rep-dashboard/${emp.id}`); }}
                      className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Dashboard
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500 border-t">
            {employees.length} team member{employees.length !== 1 ? 's' : ''} found
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Month helper (same as OMDashboard)
// ─────────────────────────────────────────────
const getAvailableMonths = (itineraries, dcrs) => {
  const months = new Set();
  itineraries.forEach(it => {
    if (it.month) {
      let m = it.month;
      if (m.match(/^\d{4}-\d{2}$/)) {
        const [y, mo] = m.split('-');
        m = new Date(`${y}-${mo}-01`).toLocaleString('default', { month: 'long', year: 'numeric' });
      }
      months.add(m);
    }
  });
  Object.keys(dcrs).forEach(m => months.add(m));
  return Array.from(months).sort((a, b) => new Date(b + '-01') - new Date(a + '-01'));
};

// ─────────────────────────────────────────────
// Main TeamDashboard component
// ─────────────────────────────────────────────
export default function TeamDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'Overview');

  const [itineraries, setItineraries] = useState([]);
  const [dcrs, setDcrs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [allocatedPrices, setAllocatedPrices] = useState(null);
  const [availableMonths, setAvailableMonths] = useState([]);

  const handleLogout = () => { logout(); navigate('/', { replace: true }); };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [itinRes, dcrRes] = await Promise.all([
        api.get('/itineraries'),
        api.get('/dcrs')
      ]);

      const itinData = itinRes.data.data || [];
      const dcrData = dcrRes.data.dcrs || {};
      setItineraries(itinData);
      setDcrs(dcrData);

      const months = getAvailableMonths(itinData, dcrData);
      setAvailableMonths(months);
      if (months.length > 0) setSelectedMonth(prev => prev || months[0]);

      if (user?.designation) {
        try {
          const priceRes = await getAllocatedPriceByDesignationCode(user.designation);
          if (priceRes.data) setAllocatedPrices(priceRes.data);
        } catch (_) {}
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await fetchData(); } catch (_) {} finally { setRefreshing(false); }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.designation]);

  // ── Metrics calculation (identical to OMDashboard) ──
  const calculateMetrics = () => {
    if (!selectedMonth) return null;
    let monthKey = selectedMonth;
    if (monthKey.match(/^\d{4}-\d{2}$/)) {
      const [y, m] = monthKey.split('-');
      monthKey = new Date(`${y}-${m}-01`).toLocaleString('default', { month: 'long', year: 'numeric' });
    }
    const monthDcrs = dcrs[monthKey] || [];
    const monthItineraries = itineraries.filter(it => {
      let itm = it.month;
      if (itm && itm.match(/^\d{4}-\d{2}$/)) {
        const [y, m] = itm.split('-');
        itm = new Date(`${y}-${m}-01`).toLocaleString('default', { month: 'long', year: 'numeric' });
      }
      return itm === monthKey;
    });

    let scheduledDoctorCalls = 0, scheduledChemistCalls = 0, scheduledMileage = 0;
    monthItineraries.forEach(it => {
      (it.entries || []).forEach(e => {
        scheduledDoctorCalls += parseInt(e.doctorCalls) || 0;
        scheduledChemistCalls += parseInt(e.chemistCalls) || 0;
        scheduledMileage += parseFloat(e.mileage) || 0;
      });
    });

    let actualDoctorCalls = 0, actualChemistCalls = 0, actualMileage = 0;
    let totalFuelPumped = 0, totalFuelCost = 0;
    let bataDays = 0, nightOutDays = 0, nightOutReturnDays = 0;

    monthDcrs.forEach(dcr => {
      (dcr.callReport || []).forEach(entry => {
        if (entry.doctor) actualDoctorCalls++;
        if (entry.chemist) actualChemistCalls++;
      });
      if (dcr.mileage) {
        const opening = parseFloat(dcr.mileage.openingMileage || dcr.mileage.odometerStart) || 0;
        const closing = parseFloat(dcr.mileage.closingMileage || dcr.mileage.odometerEnd) || 0;
        if (closing > 0 && opening > 0) actualMileage += Math.abs(closing - opening);
        totalFuelPumped += parseFloat(dcr.mileage.fuelPumped) || 0;
        totalFuelCost   += parseFloat(dcr.mileage.cost) || 0;
      }
      if (dcr.dailyExpenses) {
        if (dcr.dailyExpenses.bata) bataDays++;
        if (dcr.dailyExpenses.nightOut) nightOutDays++;
        if (dcr.dailyExpenses.nightOutReturn) nightOutReturnDays++;
      }
    });

    const doctorCallsPercentage  = scheduledDoctorCalls  > 0 ? (actualDoctorCalls  / scheduledDoctorCalls)  * 100 : 0;
    const chemistCallsPercentage = scheduledChemistCalls > 0 ? (actualChemistCalls / scheduledChemistCalls) * 100 : 0;
    const mileagePercentage = scheduledMileage > 0 ? (actualMileage / scheduledMileage) * 100 : 0;
    const exceededMileage = Math.max(0, actualMileage - scheduledMileage);
    const monthlyFuelAllocation = allocatedPrices?.monthlyFuel || 0;
    const exceededFuelCost = Math.max(0, totalFuelCost - monthlyFuelAllocation);
    const dailyBataAmount = allocatedPrices?.dailyBata || 0;
    const nightOutAmount = allocatedPrices?.nightOut || 0;
    const nightOutReturnAmount = allocatedPrices?.nightOutReturn || 0;
    const totalBata = bataDays * dailyBataAmount;
    const totalNightOut = (nightOutDays * nightOutAmount) + (nightOutReturnDays * nightOutReturnAmount);

    return {
      scheduledDoctorCalls, actualDoctorCalls, doctorCallsPercentage,
      scheduledChemistCalls, actualChemistCalls, chemistCallsPercentage,
      scheduledMileage, actualMileage, mileagePercentage,
      exceededMileage, totalFuelPumped, totalFuelCost, exceededFuelCost,
      bataDays, totalBata, nightOutDays, nightOutReturnDays, totalNightOut,
      dcrCount: monthDcrs.length, itineraryCount: monthItineraries.length
    };
  };

  const metrics = calculateMetrics();

  // Color helpers
  const getPercentageColor   = (p) => p >= 100 ? 'text-green-600' : 'text-red-600';
  const getPercentageBgColor = (p) => p >= 100 ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300';
  const getMileageBgColor    = (p) => p >= 100 ? 'bg-red-100 border-red-300' : 'bg-green-100 border-green-300';
  const getMileageTextColor  = (p) => p >= 100 ? 'text-red-600' : 'text-green-600';
  const getMileageIcon   = (p) => p >= 100 ? <FaTimesCircle className="text-red-600" />   : <FaCheckCircle className="text-green-600" />;
  const getPercentageIcon = (p) => p >= 100 ? <FaCheckCircle className="text-green-600" /> : <FaTimesCircle className="text-red-600" />;

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="flex items-center justify-center py-20" style={{ flex: 1 }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-wrapper">
        <div className="flex items-center justify-center py-20" style={{ flex: 1 }}>
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
        <button className="toggle-btn" onClick={() => setSidebarOpen(o => !o)}>
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
        <img src={logo} alt="GSH Logo" className="logo" />
        <nav className="sidebar-nav">
          <ul>
            <li
              className={activeTab === 'Overview' ? 'active' : ''}
              onClick={() => setActiveTab('Overview')}
            >
              Overview
            </li>
            <li
              className={activeTab === 'Employee Overview' ? 'active' : ''}
              onClick={() => setActiveTab('Employee Overview')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <FaUsers style={{ fontSize: '0.9rem' }} />
              Team Overview
            </li>
            <li onClick={() => navigate('/itineraries')}>Itinerary</li>
            <li onClick={() => navigate('/dcr-reports')}>Reports</li>
          </ul>
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn-sidebar" onClick={handleLogout} title="Logout">
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
            {activeTab === 'Overview' && (
              <FaSync
                className={`icon ${refreshing ? 'spinning' : ''}`}
                onClick={handleRefresh}
                title="Refresh Data"
                style={{ cursor: 'pointer' }}
              />
            )}
            <span className="user-info">
              Welcome, {user?.name || 'User'}
              <span className="designation-badge" style={{ marginLeft: '0.75rem' }}>
                {getDesignationName(user?.designation)}
              </span>
            </span>
          </div>
        </header>

        {/* ── Overview Tab ── */}
        {activeTab === 'Overview' && (
          <>
            {/* Month Selector */}
            <div className="month-selector-container">
              <label htmlFor="team-month-select" className="month-label">
                <FaCalendarAlt className="mr-2" />
                Select Month:
              </label>
              <select
                id="team-month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="month-select"
              >
                {availableMonths.length === 0 ? (
                  <option value="">No data available</option>
                ) : (
                  availableMonths.map(m => <option key={m} value={m}>{m}</option>)
                )}
              </select>
              {user?.designation && (
                <span className="designation-badge">
                  Designation: {getDesignationName(user.designation)}
                </span>
              )}
            </div>

            {selectedMonth && metrics && (
              <>
                {/* Overview Cards */}
                <section className="overview-cards">
                  {/* Doctor Calls */}
                  <div className={`overview-card ${getPercentageBgColor(metrics.doctorCallsPercentage)}`}>
                    <div className="card-header">
                      <div className="card-icon"><FaPhone /></div>
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

                  {/* Chemist Calls */}
                  <div className={`overview-card ${getPercentageBgColor(metrics.chemistCallsPercentage)}`}>
                    <div className="card-header">
                      <div className="card-icon"><FaClinicMedical /></div>
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

                  {/* Mileage */}
                  <div className={`overview-card ${getMileageBgColor(metrics.mileagePercentage)}`}>
                    <div className="card-header">
                      <div className="card-icon"><FaRoute /></div>
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
                  <h3 className="section-title"><FaRoute /> Mileage Details</h3>
                  <div className="exceeded-mileage-cards">
                    <div className="exceeded-card">
                      <div className="exceeded-icon"><FaRoute /></div>
                      <div className="exceeded-content">
                        <p className="exceeded-label">Exceeded Mileage</p>
                        <p className="exceeded-value">{(metrics.exceededMileage || 0).toFixed(1)} km</p>
                        <p className="exceeded-detail">
                          (Actual: {(metrics.actualMileage || 0).toFixed(1)} km - Scheduled: {(metrics.scheduledMileage || 0).toFixed(1)} km)
                        </p>
                      </div>
                    </div>
                    <div className="exceeded-card">
                      <div className="exceeded-icon"><FaGasPump /></div>
                      <div className="exceeded-content">
                        <p className="exceeded-label">Total Fuel Pumped</p>
                        <p className="exceeded-value">{(metrics.totalFuelPumped || 0).toFixed(2)} L</p>
                        <p className="exceeded-detail">Cost: Rs. {(metrics.totalFuelCost || 0).toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="exceeded-card highlight">
                      <div className="exceeded-icon"><FaMoneyBillWave /></div>
                      <div className="exceeded-content">
                        <p className="exceeded-label">Exceeded Fuel Cost</p>
                        <p className="exceeded-value">Rs. {(metrics.exceededFuelCost || 0).toFixed(2)}</p>
                        <p className="exceeded-detail">
                          (Total: Rs. {(metrics.totalFuelCost || 0).toFixed(2)} - Allocation: Rs. {allocatedPrices?.monthlyFuel || 0})
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Expenses */}
                <section className="details-section">
                  <h3 className="section-title"><FaMoneyBillWave /> Expenses</h3>
                  <div className="expenses-cards">
                    <div className="expense-card">
                      <div className="expense-icon"><FaCheckCircle /></div>
                      <div className="expense-content">
                        <p className="expense-label">Total Daily Bata</p>
                        <p className="expense-days">{metrics.bataDays} day(s)</p>
                        <p className="expense-amount">
                          Rs. {metrics.totalBata.toFixed(2)}
                          <span className="expense-rate">(Rs. {allocatedPrices?.dailyBata || 0}/day)</span>
                        </p>
                      </div>
                    </div>
                    <div className="expense-card">
                      <div className="expense-icon"><FaMoon /></div>
                      <div className="expense-content">
                        <p className="expense-label">Night Out</p>
                        <p className="expense-days">{metrics.nightOutDays} night(s)</p>
                        <p className="expense-amount">
                          Rs. {(metrics.nightOutDays * (allocatedPrices?.nightOut || 0)).toFixed(2)}
                          <span className="expense-rate">(Rs. {allocatedPrices?.nightOut || 0}/night)</span>
                        </p>
                      </div>
                    </div>
                    <div className="expense-card">
                      <div className="expense-icon"><FaMoon /></div>
                      <div className="expense-content">
                        <p className="expense-label">Night Out Return</p>
                        <p className="expense-days">{metrics.nightOutReturnDays} return(s)</p>
                        <p className="expense-amount">
                          Rs. {(metrics.nightOutReturnDays * (allocatedPrices?.nightOutReturn || 0)).toFixed(2)}
                          <span className="expense-rate">(Rs. {allocatedPrices?.nightOutReturn || 0}/return)</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Summary */}
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
          </>
        )}

        {/* ── Team Overview Tab ── */}
        {activeTab === 'Employee Overview' && <TeamEmployeeOverview />}
      </div>
    </div>
  );
}
