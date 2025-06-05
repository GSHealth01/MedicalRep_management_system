// src/App.js
import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import RoleSelection    from './components/RoleSelection';
import LoginPage        from './components/LoginPage';
import RepDetailsReport from './components/Repdetails_report';
import RepDashboard     from './components/RepDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import ItineraryForm    from './components/ItineraryForm';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Role selection */}
        <Route path="/" element={<RoleSelection />} />

        {/* Login for manager or rep */}
        <Route path="/login/:role" element={<LoginPage />} />

        {/* Public pages */}
        <Route path="/rep-dashboard"  element={<RepDashboard />} />
        <Route path="/itineraryForm"  element={<ItineraryForm />} />

        {/* Direct rep form */}
        <Route path="/add-rep" element={<RepDetailsReport />} />

        {/* Manager dashboard */}
        <Route path="/manager-dashboard" element={<ManagerDashboard />} />

        {/* Fallback to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}


