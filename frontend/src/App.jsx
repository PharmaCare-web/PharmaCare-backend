import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import ForgotPassword from './pages/auth/ForgotPassword';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import ManagerManagement from './pages/admin/ManagerManagement';

// Manager pages
import ManagerDashboard from './pages/manager/Dashboard';
import StaffManagement from './pages/manager/StaffManagement';
import MedicineInventory from './pages/manager/MedicineInventory';
import ManagerReports from './pages/manager/Reports';

// Pharmacist pages
import PharmacistDashboard from './pages/pharmacist/Dashboard';
import MedicineSearch from './pages/pharmacist/MedicineSearch';
import CreateSale from './pages/pharmacist/CreateSale';
import PharmacistReports from './pages/pharmacist/Reports';

// Cashier pages
import CashierDashboard from './pages/cashier/Dashboard';
import PendingPayments from './pages/cashier/PendingPayments';
import ProcessReturns from './pages/cashier/ProcessReturns';
import CashierReports from './pages/cashier/Reports';

// Shared pages
import Profile from './pages/shared/Profile';
import ChangePassword from './pages/shared/ChangePassword';
import Unauthorized from './pages/shared/Unauthorized';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastContainer 
          position="top-right" 
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<PrivateRoute allowedRoles={['Admin']} />}>
            <Route index element={<Navigate to="/admin/dashboard" />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="managers" element={<ManagerManagement />} />
          </Route>

          {/* Manager Routes */}
          <Route path="/manager" element={<PrivateRoute allowedRoles={['Manager']} />}>
            <Route index element={<Navigate to="/manager/dashboard" />} />
            <Route path="dashboard" element={<ManagerDashboard />} />
            <Route path="staff" element={<StaffManagement />} />
            <Route path="medicines" element={<MedicineInventory />} />
            <Route path="reports/*" element={<ManagerReports />} />
            <Route path="notifications" element={<div className="p-6"><h1 className="text-2xl font-bold">Notifications</h1><p className="mt-4 text-gray-600">Notifications page coming soon</p></div>} />
          </Route>

          {/* Pharmacist Routes */}
          <Route path="/pharmacist" element={<PrivateRoute allowedRoles={['Pharmacist']} />}>
            <Route index element={<Navigate to="/pharmacist/dashboard" />} />
            <Route path="dashboard" element={<PharmacistDashboard />} />
            <Route path="medicines" element={<MedicineSearch />} />
            <Route path="sales/new" element={<CreateSale />} />
            <Route path="reports" element={<PharmacistReports />} />
          </Route>

          {/* Cashier Routes */}
          <Route path="/cashier" element={<PrivateRoute allowedRoles={['Cashier']} />}>
            <Route index element={<Navigate to="/cashier/dashboard" />} />
            <Route path="dashboard" element={<CashierDashboard />} />
            <Route path="payments/pending" element={<PendingPayments />} />
            <Route path="returns" element={<ProcessReturns />} />
            <Route path="reports/*" element={<CashierReports />} />
          </Route>

          {/* Shared Protected Routes */}
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />

          {/* Error Routes */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
