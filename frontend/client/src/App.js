import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

//Existing imports
import LoginPage        from './Pages/LoginPage';
import DcrReport        from './components/DCR_report';
import DCRReportsDashboard from './components/DCRReportsDashboard';
import RepDashboard     from './components/RepDashboard';
import EmployeeStatus   from './components/EmployeeStatus';
import ManagerDashboard from './components/ManagerDashboard';
import ItineraryForm    from './components/ItineraryForm';
import ItineraryList    from './Pages/ItineraryList';

//Forgot Password imports
import ForgotPasswordStep1 from './Pages/ForgotPasswordStep1';
import ForgotPasswordStep3 from './Pages/ForgotPasswordStep3';

//Summary Components
import StockingSummary    from './components/SummaryComponent/StockingSummary';
import ExpensesSummary    from './components/SummaryComponent/ExpensesSummary';
import RemarkSummary      from './components/SummaryComponent/RemarkSummary';
import SampleSummary      from './components/SummaryComponent/SampleSummary';
import DoctorCallSummary  from './components/SummaryComponent/Doctor_Call_Summary';
import ChemistCallSummary from './components/SummaryComponent/Chemist_Call_Summary';

import SummariesPage from './Pages/Summaries';

import ProtectedAdmin, { ProtectedUser } from './components/ProtectedRoute';

//Admin import
import AdminLayout        from './layouts/AdminLayout';
import AdminPortal        from './Pages/AdminPortal';
import ManageSectors      from './Pages/Ranges';
import ManageEmployees    from './Pages/ManageEmployees';
import ManageProducts     from './Pages/ManageProduct';
import ManageDistributors from "./Pages/ManageDistributors";
import ManageDoctors      from "./Pages/ManageDoctors";
import ManageChemists      from "./Pages/ManageChemists";
import ManageTeams        from "./Pages/ManageTeams";
import ManageAllocatedPrices from "./Pages/ManageAllocatedPrices";
// Removed ManageRoles import

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/forgot-password/step1" element={<ForgotPasswordStep1 />} />
        <Route path="/forgot-password/step3" element={<ForgotPasswordStep3 />} />
        <Route path="/rep-dashboard" element={<RepDashboard />} />
        <Route path="/itineraries" element={<ProtectedUser><ItineraryList /></ProtectedUser>} />
        <Route path="/itineraryForm/:id?/:mode?" element={<ProtectedUser><ItineraryForm /></ProtectedUser>} />
        <Route path="/dcr-reports" element={<ProtectedUser><DCRReportsDashboard /></ProtectedUser>} />
        <Route path="/DCR_report"   element={<DcrReport />} />
        <Route path="/employee-status/:id" element={<EmployeeStatus />} />
        <Route path="/manager-dashboard" element={<ManagerDashboard />} />
        <Route path="/summaries" element={<SummariesPage />} />
        <Route path="/summaries/stocking" element={<StockingSummary />} />
        <Route path="/summaries/expenses" element={<ExpensesSummary />} />
        <Route path="/summaries/remark" element={<RemarkSummary />} />
        <Route path="/summaries/sample" element={<SampleSummary />} />
        <Route path="/summaries/doctor-calls" element={<DoctorCallSummary />} />
        <Route path="/summaries/chemist-calls" element={<ChemistCallSummary />} />
        
        <Route
          path="/admin"
          element={
            <ProtectedAdmin>
              <AdminLayout />
            </ProtectedAdmin>
          }
        >
          <Route index element={<Navigate to="portal" replace />} />
          <Route path="portal" element={<AdminPortal />} />
          <Route path="sectors" element={<ManageSectors />} />
          <Route path="employees" element={<ManageEmployees />} />
          <Route path="products" element={<ManageProducts />} />
          <Route path="doctors" element={<ManageDoctors />} />
          <Route path="chemists" element={<ManageChemists />} />
          <Route path="distributors" element={<ManageDistributors />} />
          <Route path="teams" element={<ManageTeams />} />
          <Route path="allocated-prices" element={<ManageAllocatedPrices />} />
          {/* Removed roles route */}
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
