import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  FaPhone,
  FaBoxOpen,
  FaCalendarAlt,
  FaClinicMedical,
  FaSearch,
  FaBell,
  FaBars,
  FaTimes,
  FaSignOutAlt
} from 'react-icons/fa';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import './RepDashboard.css';

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
          if (stateInfo.sampling && stateInfo.samplingQty) {
            total += (priceInfo.samplingPrice || 0) * (parseInt(stateInfo.samplingQty) || 0);
          }
          if (stateInfo.stocking && stateInfo.stockingQty) {
            total += (priceInfo.stockingPrice || 0) * (parseInt(stateInfo.stockingQty) || 0);
          }
          if (stateInfo.detailed) {
            total += (priceInfo.detailedPrice || 0);
          }
        }
      });
    }
  });
  return total;
};

export default function RepDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [itineraries, setItineraries] = useState([]);
  const [dcrs, setDcrs] = useState({});
  const [productCategories, setProductCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
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

  // Compute KPIs from real data
  const computeKPIs = () => {
    const totalItineraries = itineraries.length;
    const totalDcrs = Object.values(dcrs).reduce((sum, monthDcrs) => sum + monthDcrs.length, 0);

    let totalDoctorCalls = 0;
    let totalChemistCalls = 0;
    let totalMileage = 0;
    let upcomingVisits = 0;
    const activeAreas = new Set();
    const today = new Date().toISOString().split('T')[0];

    itineraries.forEach(itinerary => {
      itinerary.entries.forEach(entry => {
        totalDoctorCalls += entry.doctorCalls || 0;
        totalChemistCalls += entry.chemistCalls || 0;
        totalMileage += entry.mileage || 0;
        if (entry.area) activeAreas.add(entry.area);
        if (entry.date >= today) upcomingVisits++;
      });
    });

    let totalRevenue = 0;
    Object.values(dcrs).forEach(monthDcrs => {
      monthDcrs.forEach(dcr => {
        if (dcr.callReport) {
          dcr.callReport.forEach(doctor => {
            totalRevenue += calculateDoctorTotal(doctor, productCategories);
          });
        }
      });
    });

    return {
      totalItineraries,
      totalDcrs,
      totalDoctorCalls,
      totalChemistCalls,
      totalMileage,
      totalRevenue,
      upcomingVisits,
      activeAreasCount: activeAreas.size
    };
  };

  const kpisData = computeKPIs();

  // Compute chart data: monthly doctor calls vs revenue
  const computeChartData = () => {
    const monthlyData = {};

    // From itineraries: group doctor calls by month
    itineraries.forEach(itinerary => {
      const month = new Date(itinerary.month + '-01').toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthlyData[month]) monthlyData[month] = { calls: 0, revenue: 0 };
      itinerary.entries.forEach(entry => {
        monthlyData[month].calls += entry.doctorCalls || 0;
      });
    });

    // From DCRs: group revenue by month
    Object.entries(dcrs).forEach(([monthYear, monthDcrs]) => {
      const month = new Date(monthYear.replace(' ', ' 1, ')).toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthlyData[month]) monthlyData[month] = { calls: 0, revenue: 0 };
      monthDcrs.forEach(dcr => {
        if (dcr.callReport) {
          dcr.callReport.forEach(doctor => {
            monthlyData[month].revenue += calculateDoctorTotal(doctor, productCategories);
          });
        }
      });
    });

    // Convert to array and sort by date
    return Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => new Date(a.month.replace(' ', ' 1, ')) - new Date(b.month.replace(' ', ' 1, ')))
      .slice(-4); // Last 4 months
  };

  const chartData = computeChartData();

  const kpis = [
    { title: 'Total Doctor Calls', value: kpisData.totalDoctorCalls, icon: <FaPhone /> },
    { title: 'Total Revenue',      value: `Rs. ${kpisData.totalRevenue.toFixed(2)}`, icon: <FaBoxOpen /> },
    { title: 'Upcoming Visits',    value: kpisData.upcomingVisits, icon: <FaCalendarAlt /> },
    { title: 'Active Areas',       value: kpisData.activeAreasCount, icon: <FaClinicMedical /> },
  ];


  // Recent activities: recent DCRs
  const computeRecentActivities = () => {
    const allDcrs = [];
    Object.values(dcrs).forEach(monthDcrs => {
      allDcrs.push(...monthDcrs);
    });
    return allDcrs
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
      .map(dcr => ({
        date: dcr.date,
        area: dcr.area,
        town: dcr.town,
        revenue: dcr.callReport ? dcr.callReport.reduce((sum, doctor) => sum + calculateDoctorTotal(doctor, productCategories), 0) : 0
      }));
  };

  const recent = computeRecentActivities();

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
        <h2 className="logo">GSH Health</h2>
        <nav className="sidebar-nav">
          <ul>
            <li className={activeTab === 'Overview' ? 'active' : ''} onClick={() => setActiveTab('Overview')}>Overview</li>
            <li className={activeTab === 'Itinerary' ? 'active' : ''} onClick={() => navigate('/itineraries')}>Itinerary</li>
            <li className={activeTab === 'Reports' ? 'active' : ''} onClick={() => navigate('/dcr-reports')}>Reports</li>
            <li className={activeTab === 'Settings' ? 'active' : ''} onClick={() => setActiveTab('Settings')}>Settings</li>
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
          <div className="search">
            <FaSearch />
            <input type="text" placeholder="Search…" />
          </div>
          <div className="actions">
            <FaBell className="icon" />
            <span className="user-info">
              Welcome, {user?.name || 'User'}
            </span>
            <img
              className="avatar"
              src="https://i.pravatar.cc/40?img=3"
              alt="Rep Avatar"
            />
          </div>
        </header>

        {/* KPI Cards */}
        <section className="kpi-cards">
          {kpis.map((k,i) => (
            <div key={i} className="kpi-card">
              <div className="kpi-icon">{k.icon}</div>
              <div className="kpi-text">
                <p className="kpi-value">{k.value}</p>
                <p className="kpi-title">{k.title}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Charts + Table */}
        <section className="panels">
          <div className="panel chart-panel">
            <h3>Monthly Doctor Calls vs Revenue</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="calls"  name="Doctor Calls"  fill="#4f46e5" />
                <Bar dataKey="revenue" name="Revenue (Rs.)" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="panel table-panel">
            <h3>Recent DCR Reports</h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Area</th>
                    <th>Town</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r,i) => (
                    <tr key={i}>
                      <td>{new Date(r.date).toLocaleDateString()}</td>
                      <td>{r.area || 'N/A'}</td>
                      <td>{r.town || 'N/A'}</td>
                      <td>Rs. {r.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
