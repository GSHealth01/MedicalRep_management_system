import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/gsh.logo.png';
import { FaBars, FaTimes, FaSignOutAlt } from 'react-icons/fa';
import {
  FaPhone,
  FaClinicMedical,
  FaRoute,
  FaBoxOpen,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUsers,
  FaFileAlt,
  FaRoute as FaItinerary
} from 'react-icons/fa';
import '../components/RepDashboard.css';

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

export default function EmployeeStatus() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, logout } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [itineraries, setItineraries] = useState([]);
  const [dcrs, setDcrs] = useState({});
  const [productCategories, setProductCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Map abbreviations to full designations
  const designationMap = {
    'SE': 'Senior Executive',
    'TM': 'Territory Manager',
    'PM': 'Product Manager',
    'JE': 'Junior Executive',
    'FC': 'Field Coordinator',
    'OM': 'Operations Manager',
    'MR': 'Medical Representative',
    'ADMIN': 'Administrator'
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch employee data
        const employeesResponse = await api.get('/users/employees');
        const employees = employeesResponse.data.data || [];
        const emp = employees.find(e => e.id === parseInt(id));
        if (!emp) {
          setError('Employee not found');
          return;
        }
        setEmployee(emp);

        // Fetch products for revenue calculation
        const productsResponse = await api.get('/products', { params: { limit: 500 } });
        const productsData = productsResponse.data.data?.items || [];
        const categories = transformProductsToCategories(productsData);
        setProductCategories(categories);

        // Fetch itineraries for this employee
        const itinerariesResponse = await api.get(`/itineraries?employeeId=${id}`);
        setItineraries(itinerariesResponse.data.data || []);

        // Fetch DCRs for this employee
        const dcrsResponse = await api.get(`/dcrs?employeeId=${id}`);
        setDcrs(dcrsResponse.data.dcrs || {});

      } catch (err) {
        console.error('Error fetching employee data:', err);
        setError('Failed to load employee data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Compute Quick Stats for this employee
  const computeQuickStats = () => {
    let totalDoctorCalls = 0;
    let totalChemistCalls = 0;
    let totalMileage = 0;
    let totalRevenue = 0;
    let totalItineraries = itineraries.length;
    let totalDcrs = Object.values(dcrs).reduce((sum, monthDcrs) => sum + monthDcrs.length, 0);

    itineraries.forEach(itinerary => {
      itinerary.entries.forEach(entry => {
        totalDoctorCalls += entry.doctorCalls || 0;
        totalChemistCalls += entry.chemistCalls || 0;
        totalMileage += entry.mileage || 0;
      });
    });

    Object.values(dcrs).forEach(monthDcrs => {
      monthDcrs.forEach(dcr => {
        const revenue = dcr.callReport ? dcr.callReport.reduce((sum, doctor) => sum + calculateDoctorTotal(doctor, productCategories), 0) : 0;
        // Calculate expenses
        let expenses = 0;
        if (dcr.dailyExpenses) {
          if (dcr.dailyExpenses.bata) expenses += 50;
          if (dcr.dailyExpenses.nightOut) expenses += 50;
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
        totalRevenue += revenue + expenses;
      });
    });

    return {
      totalDoctorCalls,
      totalChemistCalls,
      totalMileage,
      totalRevenue,
      totalItineraries,
      totalDcrs
    };
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const quickStatsData = computeQuickStats();

  const quickStats = [
    { title: 'Doctor Calls', value: quickStatsData.totalDoctorCalls, icon: <FaPhone />, color: 'bg-blue-500' },
    { title: 'Chemist Calls', value: quickStatsData.totalChemistCalls, icon: <FaClinicMedical />, color: 'bg-green-500' },
    { title: 'Total Mileage', value: `${quickStatsData.totalMileage} km`, icon: <FaRoute />, color: 'bg-yellow-500' },
    { title: 'Revenue', value: `Rs. ${quickStatsData.totalRevenue.toFixed(2)}`, icon: <FaBoxOpen />, color: 'bg-purple-500' },
    { title: 'Itineraries', value: quickStatsData.totalItineraries, icon: <FaItinerary />, color: 'bg-indigo-500' },
    { title: 'Daily Call Reports', value: quickStatsData.totalDcrs, icon: <FaFileAlt />, color: 'bg-red-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading employee data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-red-500 text-center">
          <p className="text-lg font-semibold">Error loading employee</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500 text-center">
          <p className="text-lg font-semibold">Employee not found</p>
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
          <li onClick={() => navigate(user?.designation === 'OM' ? '/om-dashboard' : '/rep-dashboard')}>Overview</li>
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

      <div className="main-content">
        <div className="min-h-screen bg-gray-100 py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <button
                onClick={() => navigate(user?.designation === 'OM' ? '/om-dashboard' : '/rep-dashboard')}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Back to Dashboard
              </button>
            </div>
        {/* Employee Profile Header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8 text-white">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-20 w-20 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {employee.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-6">
                <h1 className="text-3xl font-bold">{employee.name}</h1>
                <p className="text-blue-100 text-lg">{designationMap[employee.designation] || employee.designation}</p>
                <div className="flex items-center mt-2 space-x-4">
                  <div className="flex items-center">
                    <FaMapMarkerAlt className="mr-1" />
                    <span>{employee.sector?.range || 'N/A'} - {employee.sector?.agency || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <FaUsers className="mr-1" />
                    <span>{employee.team?.name || 'N/A'}</span>
                  </div>
                  {employee.join_date && (
                    <div className="flex items-center">
                      <FaCalendarAlt className="mr-1" />
                      <span>Joined {new Date(employee.join_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {quickStats.map((stat, i) => (
            <div key={i} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${stat.color} text-white mr-4`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-gray-600">{stat.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center"
              onClick={() => navigate(`/itineraries?employeeId=${id}`)}
            >
              <FaItinerary className="mr-2" />
              View Itineraries
            </button>
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center"
              onClick={() => navigate(`/dcr-reports?employeeId=${id}`)}
            >
              <FaFileAlt className="mr-2" />
              View Daily Call Reports
            </button>
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}