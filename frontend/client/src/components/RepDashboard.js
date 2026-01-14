import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

export default function RepDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const kpis = [
    { title: 'Total Calls',       value: 540, icon: <FaPhone /> },
    { title: 'Total Orders',      value:  75, icon: <FaBoxOpen /> },
    { title: 'Upcoming Visits',   value:  12, icon: <FaCalendarAlt /> },
    { title: 'Active Pharmacies', value:  48, icon: <FaClinicMedical /> },
  ];

  // Chart: weekly calls vs orders
  const chartData = [
    { week: 'Wk1', calls: 130, orders: 22 },
    { week: 'Wk2', calls: 145, orders: 18 },
    { week: 'Wk3', calls: 170, orders: 20 },
    { week: 'Wk4', calls:  95, orders: 15 },
  ];

  // Recent activities table
  const recent = [
    { pharmacy: 'Pharmacy A', orders: 5,  lastVisit: '2025-04-12', status: 'Active'   },
    { pharmacy: 'Pharmacy B', orders: 2,  lastVisit: '2025-04-11', status: 'Pending'  },
    { pharmacy: 'Pharmacy C', orders: 7,  lastVisit: '2025-04-10', status: 'Active'   },
    { pharmacy: 'Pharmacy D', orders: 3,  lastVisit: '2025-04-09', status: 'Inactive' },
    { pharmacy: 'Pharmacy E', orders: 1,  lastVisit: '2025-04-08', status: 'Active'   },
  ];

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
            <h3>Weekly Calls vs Orders</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="calls"  name="Calls"  fill="#4f46e5" />
                <Bar dataKey="orders" name="Orders" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="panel table-panel">
            <h3>Recent Activities</h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Pharmacy</th>
                    <th>Orders</th>
                    <th>Last Visit</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r,i) => (
                    <tr key={i}>
                      <td>{r.pharmacy}</td>
                      <td>{r.orders}</td>
                      <td>{r.lastVisit}</td>
                      <td>
                        <span className={`badge badge-${r.status.toLowerCase()}`}>
                          {r.status}
                        </span>
                      </td>
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
