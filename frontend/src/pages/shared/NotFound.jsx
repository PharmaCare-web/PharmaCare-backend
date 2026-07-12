import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NotFound = () => {
  const { user } = useAuth();

  const homePath = {
    Admin: '/admin/dashboard',
    Manager: '/manager/dashboard',
    Pharmacist: '/pharmacist/dashboard',
    Cashier: '/cashier/dashboard',
  }[user?.role_name] || '/login';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white rounded-lg shadow p-8 text-center max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-600 mb-6">The page you are looking for does not exist.</p>
        <Link
          to={homePath}
          className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
