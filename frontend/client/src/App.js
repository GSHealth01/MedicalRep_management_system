// src/App.js
import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

// Existing imports
import LoginPage        from './Pages/LoginPage';
import RepDetailsReport from './components/Repdetails_report';
import RepDashboard     from './components/RepDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import ItineraryForm    from './components/ItineraryForm';

// Summary Components
import StockingSummary    from './components/SummaryComponent/StockingSummary';
import ExpensesSummary    from './components/SummaryComponent/ExpensesSummary';
import RemarkSummary      from './components/SummaryComponent/RemarkSummary';
import SampleSummary      from './components/SummaryComponent/SampleSummary';
import DoctorCallSummary  from './components/SummaryComponent/Doctor_Call_Summary';
import ChemistCallSummary from './components/SummaryComponent/Chemist_Call_Summary';


import SummariesPage from './Pages/Summaries';

// 🔹 Admin imports
import AdminLayout      from './layouts/AdminLayout';
import AdminPortal      from './Pages/AdminPortal';
import ManageSectors    from './Pages/ManageSections';
import ManageEmployees  from './Pages/ManageEmployees';   // ✅ NEW
import ManageProducts from './Pages/ManageProduct';
import ManageDistributors from "./Pages/ManageDistributors";
import ManageDoctors from "./Pages/ManageDoctors";
import ManageTeams from "./Pages/ManageTeams";
import ManageRoles from "./Pages/ManageRole";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Role selection or login */}
        <Route path="/" element={<LoginPage />} />

        {/* Rep side */}
        <Route path="/rep-dashboard" element={<RepDashboard />} />
        <Route path="/itineraryForm" element={<ItineraryForm />} />
        <Route path="/add-rep"       element={<RepDetailsReport />} />

        {/* Manager side */}
        <Route path="/manager-dashboard" element={<ManagerDashboard />} />

        {/* Summaries */}
        <Route path="/summaries" element={<SummariesPage />} />
        <Route path="/summaries/stocking"      element={<StockingSummary />} />
        <Route path="/summaries/expenses"      element={<ExpensesSummary />} />
        <Route path="/summaries/remark"        element={<RemarkSummary />} />
        <Route path="/summaries/sample"        element={<SampleSummary />} />
        <Route path="/summaries/doctor-calls"  element={<DoctorCallSummary />} />
        <Route path="/summaries/chemist-calls" element={<ChemistCallSummary />} />

        {/* 🔹 Admin section with layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="portal"     element={<AdminPortal />} />
          <Route path="sectors"    element={<ManageSectors />} />
          <Route path="employees"  element={<ManageEmployees />} /> 
          <Route path="dashboard"  element={<h1>Admin Dashboard Page</h1>} />
          <Route path="profile"    element={<h1>Admin Profile Page</h1>} />
          <Route path="products"  element={<ManageProducts />} /> 
          <Route path="/admin/distributors" element={<ManageDistributors />} />
          <Route path="/admin/doctors" element={<ManageDoctors />} />
          <Route path="/admin/teams" element={<ManageTeams />} />
          <Route path="/admin/roles" element={<ManageRoles />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}




