import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../layout/DashboardLayout';

const PrivateRoute = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has temporary password and needs to change it
  // Skip this check if already on the change-password page
  const mustChangePassword = localStorage.getItem('mustChangePassword') === 'true';
  
  if (mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" state={{ isTemporary: true }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role_name)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <DashboardLayout>
      {children || <Outlet />}
    </DashboardLayout>
  );
};

export default PrivateRoute;
