import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import logo from '../assets/gsh.logo.png';
import {
  FaPhone,
  FaBoxOpen,
  FaClinicMedical,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaChevronDown,
  FaChevronUp,
  FaRoute,
  FaFileAlt,
  FaSync
} from 'react-icons/fa';
import './RepDashboard.css';

import EmployeeOverview from './EmployeeOverview';

// Function to transform products from API to expected format
const transformProductsToCategories = (products) => {
  const categories = {};

  products.forEach(product => {
    if (product.variants && product.variants.length > 0) {
      // Use product name as category
      categories[product.name] = product.variants.map(variant => ({
        name: `${product.name} ${variant.strength || ''} ${variant.pack_size || ''}`.trim(),
        samplingPrice: variant.sampling_price || 0,
        stockingPrice: variant.stocking_price || 0,
        detailedPrice: variant.detailed_price || 0
      }));
    }
  });

  return categories;
};

const calculateDoctorTotal = (doctorRow, productCategories) => {
  let total = 0;
  if (!doctorRow || !doctorRow.productData) return total;

  Object.keys(productCategories).forEach(category => {
    if (productCategories[category] && doctorRow.productData[category]) {
      const productsWithPrices = productCategories[category];
      const productStates = doctorRow.productData[category];

      productsWithPrices.forEach((priceInfo, index) => {
        if (index < productStates.length) {
          const stateInfo = productStates[index];
          // Only stocking/wholeale has quantity and price
          if (stateInfo.stocking && stateInfo.stockingQty) {
            total += (priceInfo.stockingPrice || 0) * (parseInt(stateInfo.stockingQty) || 0);
          }
        }
      });
    }
  });
  return total;
};

const calculateChemistTotal = (chemistRow, productCategories) => {
  let total = 0;
  if (!chemistRow || !chemistRow.productData) return total;

  Object.keys(productCategories).forEach(category => {
    if (productCategories[category] && chemistRow.productData[category]) {
      const productsWithPrices = productCategories[category];
      const productStates = chemistRow.productData[category];

      productsWithPrices.forEach((priceInfo, index) => {
        if (index < productStates.length) {
          const stateInfo = productStates[index];
          // Chemist uses wholesaleQty
          if (stateInfo.wholesaleQty) {
            total += (priceInfo.stockingPrice || 0) * (parseInt(stateInfo.wholesaleQty) || 0);
          }
        }
      });
    }
  });
  return total;
};

export default function OMDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [itineraries, setItineraries] = useState([]);
  const [dcrs, setDcrs] = useState({});
  const [productCategories, setProductCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Refetch data
      const productsResponse = await api.get('/products', { params: { limit: 500 } });
      const productsData = productsResponse.data.data?.items || [];
      const categories = transformProductsToCategories(productsData);
      setProductCategories(categories);

      const itinerariesResponse = await api.get('/itineraries');
      setItineraries(itinerariesResponse.data.data || []);

      const dcrsResponse = await api.get('/dcrs');
      setDcrs(dcrsResponse.data.dcrs || {});
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewItinerary = (itinerary) => {
    navigate(`/itineraryForm/${itinerary.id}/view`);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch products for revenue calculation
        const productsResponse = await api.get('/products', { params: { limit: 500 } });
        const productsData = productsResponse.data.data?.items || [];
        const categories = transformProductsToCategories(productsData);
        setProductCategories(categories);

        // Fetch itineraries
        const itinerariesResponse = await api.get('/itineraries');
        setItineraries(itinerariesResponse.data.data || []);

        // Fetch DCRs
        const dcrsResponse = await api.get('/dcrs');
        setDcrs(dcrsResponse.data.dcrs || {});

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Compute Quick Stats from real data
  const computeQuickStats = () => {
    let totalDoctorCalls = 0;
    let totalChemistCalls = 0;
    let totalMileage = 0;
    let totalRevenue = 0;

    itineraries.forEach(itinerary => {
      itinerary.entries.forEach(entry => {
        totalDoctorCalls += entry.doctorCalls || 0;
        totalChemistCalls += entry.chemistCalls || 0;
        totalMileage += entry.mileage || 0;
      });
    });

    Object.values(dcrs).forEach(monthDcrs => {
      monthDcrs.forEach(dcr => {
        // Calculate doctor revenue
        const doctorRevenue = dcr.callReport 
          ? dcr.callReport.filter(entry => entry.doctor).reduce((sum, doctor) => sum + calculateDoctorTotal(doctor, productCategories), 0) 
          : 0;
        
        // Calculate chemist revenue
        const chemistRevenue = dcr.callReport 
          ? dcr.callReport.filter(entry => entry.chemist).reduce((sum, chemist) => sum + calculateChemistTotal(chemist, productCategories), 0) 
          : 0;
        
        totalRevenue += doctorRevenue + chemistRevenue;
        
        // Calculate expenses
        let expenses = 0;
        if (dcr.dailyExpenses) {
          if (dcr.dailyExpenses.bata) expenses += 50;
          if (dcr.dailyExpenses.nightOut) expenses += 50;
          if (dcr.dailyExpenses.nightOutReturn) expenses += 50;
          if (dcr.dailyExpenses.fuel) expenses += 50;
        }
        if (dcr.otherBills?.details) {
          expenses += parseFloat(dcr.otherBills.details.parking?.amount || 0);
          expenses += parseFloat(dcr.otherBills.details.highway?.amount || 0);
          expenses += parseFloat(dcr.otherBills.details.other?.amount || 0);
        }
        if (dcr.mileage?.cost) {
          expenses += parseFloat(dcr.mileage.cost || 0);
        }
        totalRevenue += expenses;
      });
    });

    return {
      totalDoctorCalls,
      totalChemistCalls,
      totalMileage,
      totalRevenue
    };
  };

  const quickStatsData = computeQuickStats();

  const quickStats = [
    { title: 'Doctor Calls', value: quickStatsData.totalDoctorCalls, icon: <FaPhone /> },
    { title: 'Chemist Calls', value: quickStatsData.totalChemistCalls, icon: <FaClinicMedical /> },
    { title: 'Total Mileage', value: `${quickStatsData.totalMileage} km`, icon: <FaRoute /> },
    { title: 'Revenue', value: `Rs. ${quickStatsData.totalRevenue.toFixed(2)}`, icon: <FaBoxOpen /> },
  ];

  // Group itineraries by month
  const groupItinerariesByMonth = () => {
    const grouped = {};
    itineraries.forEach(itinerary => {
      const month = itinerary.month;
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push(itinerary);
    });
    return grouped;
  };

  const itinerariesByMonth = groupItinerariesByMonth();

  // Group DCRs by month
  const groupDcrsByMonth = () => {
    const grouped = {};
    Object.entries(dcrs).forEach(([monthYear, monthDcrs]) => {
      // monthYear is like "January 2026"
      const month = monthYear;
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push(...monthDcrs);
    });
    return grouped;
  };

  const dcrsByMonth = groupDcrsByMonth();

  // State for expanded items
  const [expandedItineraries, setExpandedItineraries] = useState(new Set());
  const [expandedDcrs, setExpandedDcrs] = useState(new Set());

  const toggleItinerary = (month) => {
    const newExpanded = new Set(expandedItineraries);
    if (newExpanded.has(month)) {
      newExpanded.delete(month);
    } else {
      newExpanded.add(month);
    }
    setExpandedItineraries(newExpanded);
  };

  const toggleDcr = (dcrId) => {
    const newExpanded = new Set(expandedDcrs);
    if (newExpanded.has(dcrId)) {
      newExpanded.delete(dcrId);
    } else {
      newExpanded.add(dcrId);
    }
    setExpandedDcrs(newExpanded);
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
            <li className={activeTab === 'Overview' ? 'active' : ''} onClick={() => setActiveTab('Overview')}>Overview</li>
            <li className={activeTab === 'Employee Overview' ? 'active' : ''} onClick={() => setActiveTab('Employee Overview')}>Employee Overview</li>
            <li className={activeTab === 'Itinerary' ? 'active' : ''} onClick={() => navigate('/itineraries')}>Itinerary</li>
            <li className={activeTab === 'Reports' ? 'active' : ''} onClick={() => navigate('/dcr-reports')}>Reports</li>
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
            <FaSync className={`icon ${refreshing ? 'spinning' : ''}`} onClick={handleRefresh} title="Refresh Data" />
            <span className="user-info">
              Welcome, {user?.name || 'User'}
            </span>
          </div>
        </header>

        {/* Conditional rendering based on activeTab */}
        {activeTab === 'Overview' && (
          <>
            {/* Quick Stats */}
            <section className="quick-stats">
              {quickStats.map((stat,i) => (
                <div key={i} className="stat-card">
                  <div className="stat-icon">{stat.icon}</div>
                  <div className="stat-text">
                    <p className="stat-value">{stat.value}</p>
                    <p className="stat-title">{stat.title}</p>
                  </div>
                </div>
              ))}
            </section>

            {/* Itinerary Details */}
            <section className="details-section">
              <h3 className="section-title"><FaRoute /> Itinerary Details</h3>
              {Object.keys(itinerariesByMonth).length === 0 ? (
                <p>No itineraries found.</p>
              ) : (
                Object.entries(itinerariesByMonth).map(([month, monthItineraries]) => (
                  <div key={month} className="detail-card">
                    <div className="detail-header">
                      <div onClick={() => toggleItinerary(month)} style={{ flex: 1, cursor: 'pointer' }}>
                        <h4>{new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })} ({monthItineraries[0]?.status === 'completed' ? 'Completed' : 'Pending'})</h4>
                      </div>
                      <button
                        onClick={() => handleViewItinerary(monthItineraries[0])}
                        className="view-btn"
                        title="View Itinerary"
                      >
                        View
                      </button>
                      <div onClick={() => toggleItinerary(month)} style={{ cursor: 'pointer' }}>
                        {expandedItineraries.has(month) ? <FaChevronUp /> : <FaChevronDown />}
                      </div>
                    </div>
                    {expandedItineraries.has(month) && (
                      <div className="detail-content">
                        {monthItineraries.flatMap(itinerary =>
                          itinerary.entries.map((entry, eidx) => (
                            <div key={`${month}-${eidx}`} className="itinerary-item">
                              <strong>Date:</strong> {entry.date} |
                              <strong>Area:</strong> {entry.area || 'N/A'} |
                              <strong>Doctor Calls:</strong> {entry.doctorCalls || 0} |
                              <strong>Chemist Calls:</strong> {entry.chemistCalls || 0} |
                              <strong>Mileage:</strong> {entry.mileage || 0} km
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </section>

            {/* DCR Details */}
            <section className="details-section">
              <h3 className="section-title"><FaFileAlt /> Daily Call Reports Details</h3>
              {Object.keys(dcrsByMonth).length === 0 ? (
                <p>No DCR reports found.</p>
              ) : (
                Object.entries(dcrsByMonth).map(([month, monthDcrs]) => (
                  <div key={month} className="detail-card">
                    <div className="detail-header" onClick={() => toggleDcr(month)}>
                      <h4>{month}</h4>
                      <span>{monthDcrs.length} DCR(s)</span>
                      {expandedDcrs.has(month) ? <FaChevronUp /> : <FaChevronDown />}
                    </div>
                    {expandedDcrs.has(month) && (
                      <div className="detail-content">
                        {monthDcrs.map((dcr) => {
                          const doctorRevenue = dcr.callReport 
                            ? dcr.callReport.filter(entry => entry.doctor).reduce((sum, doctor) => sum + calculateDoctorTotal(doctor, productCategories), 0) 
                            : 0;
                          const chemistRevenue = dcr.callReport 
                            ? dcr.callReport.filter(entry => entry.chemist).reduce((sum, chemist) => sum + calculateChemistTotal(chemist, productCategories), 0) 
                            : 0;
                          
                          // Calculate expenses
                          let expenses = 0;
                          if (dcr.dailyExpenses) {
                            if (dcr.dailyExpenses.bata) expenses += 50;
                            if (dcr.dailyExpenses.nightOut) expenses += 50;
                            if (dcr.dailyExpenses.nightOutReturn) expenses += 50;
                            if (dcr.dailyExpenses.fuel) expenses += 50;
                          }
                          if (dcr.otherBills?.details) {
                            expenses += parseFloat(dcr.otherBills.details.parking?.amount || 0);
                            expenses += parseFloat(dcr.otherBills.details.highway?.amount || 0);
                            expenses += parseFloat(dcr.otherBills.details.other?.amount || 0);
                          }
                          if (dcr.mileage?.cost) {
                            expenses += parseFloat(dcr.mileage.cost || 0);
                          }
                          
                          return (
                            <div key={dcr.id || dcr.date} className="dcr-summary">
                              <h5>{new Date(dcr.date).toLocaleDateString()}</h5>
                              <p><strong>Total wholesale orders (Doctors):</strong> Rs. {doctorRevenue.toFixed(2)}</p>
                              <p><strong>Total chemist orders:</strong> Rs. {chemistRevenue.toFixed(2)}</p>
                              <p><strong>Expenses Total:</strong> Rs. {expenses.toFixed(2)}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))
              )}
            </section>
          </>
        )}

        {activeTab === 'Employee Overview' && <EmployeeOverview />}
      </div>
    </div>
  );
}