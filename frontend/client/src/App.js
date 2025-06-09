// src/App.js
import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';


import LoginPage        from './Pages/LoginPage';
import RepDetailsReport from './components/Repdetails_report';
import RepDashboard     from './components/RepDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import ItineraryForm    from './components/ItineraryForm';

// Import each individual summary component:
import StockingSummary    from './components/SummaryComponent/StockingSummary';
import ExpensesSummary    from './components/SummaryComponent/ExpensesSummary';
import RemarkSummary      from './components/SummaryComponent/RemarkSummary';
import SampleSummary      from './components/SummaryComponent/SampleSummary';
import DoctorCallSummary  from './components/SummaryComponent/Doctor_Call_Summary';
import ChemistCallSummary from './components/SummaryComponent/Chemist_Call_Summary';

import SummariesPage from './Pages/Summaries';
 

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Role selection or login */}
        <Route path="/" element={<LoginPage />} />

        {/* Public pages */}
        <Route path="/rep-dashboard"     element={<RepDashboard />} />
        <Route path="/itineraryForm"     element={<ItineraryForm />} />
        <Route path="/add-rep"           element={<RepDetailsReport />} />
        <Route path="/manager-dashboard" element={<ManagerDashboard />} />

        {/* Summaries grid */}
        <Route path="/summaries" element={<SummariesPage />} />

        {/* Individual summary routes: */}
        <Route path="/summaries/stocking"      element={<StockingSummary />} />
        <Route path="/summaries/expenses"      element={<ExpensesSummary />} />
        <Route path="/summaries/remark"        element={<RemarkSummary />} />
        <Route path="/summaries/sample"        element={<SampleSummary />} />
        <Route path="/summaries/doctor-calls"  element={<DoctorCallSummary />} />
        <Route path="/summaries/chemist-calls" element={<ChemistCallSummary />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

