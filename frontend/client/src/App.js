// src/App.js
import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

//Existing imports
import LoginPage        from './Pages/LoginPage';
import DcrReport        from './components/DCR_report';  
import RepDashboard     from './components/RepDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import ItineraryForm    from './components/ItineraryForm';

//Summary Components
import StockingSummary    from './components/SummaryComponent/StockingSummary';
import ExpensesSummary    from './components/SummaryComponent/ExpensesSummary';
import RemarkSummary      from './components/SummaryComponent/RemarkSummary';
import SampleSummary      from './components/SummaryComponent/SampleSummary';
import DoctorCallSummary  from './components/SummaryComponent/Doctor_Call_Summary';
import ChemistCallSummary from './components/SummaryComponent/Chemist_Call_Summary';

import SummariesPage from './Pages/Summaries';

//Admin import
import AdminLayout        from './layouts/AdminLayout';
import AdminPortal        from './Pages/AdminPortal';
import ManageSectors      from './Pages/ManageSections';
import ManageEmployees    from './Pages/ManageEmployees';  
import ManageProducts     from './Pages/ManageProduct';
import ManageDistributors from "./Pages/ManageDistributors";
import ManageDoctors      from "./Pages/ManageDoctors";
import ManageTeams        from "./Pages/ManageTeams";
import ManageRoles        from "./Pages/ManageRole";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/rep-dashboard" element={<RepDashboard />} />
        <Route path="/itineraryForm" element={<ItineraryForm />} />
        <Route path="/DCR_report"   element={<DcrReport />} /> 
        <Route path="/manager-dashboard" element={<ManagerDashboard />} />
        <Route path="/summaries" element={<SummariesPage />} />
        <Route path="/summaries/stocking" element={<StockingSummary />} />
        <Route path="/summaries/expenses" element={<ExpensesSummary />} />
        <Route path="/summaries/remark" element={<RemarkSummary />} />
        <Route path="/summaries/sample" element={<SampleSummary />} />
        <Route path="/summaries/doctor-calls" element={<DoctorCallSummary />} />
        <Route path="/summaries/chemist-calls" element={<ChemistCallSummary />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="portal" element={<AdminPortal />} />
          <Route path="sectors" element={<ManageSectors />} />
          <Route path="employees" element={<ManageEmployees />} /> 
          <Route path="dashboard"element={<h1>Admin Dashboard Page</h1>} />
          <Route path="profile" element={<h1>Admin Profile Page</h1>} />
          <Route path="products" element={<ManageProducts />} /> 
          <Route path="distributors" element={<ManageDistributors />} /> 
          <Route path="doctors" element={<ManageDoctors />} />
          <Route path="teams" element={<ManageTeams />} />
          <Route path="roles" element={<ManageRoles />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
