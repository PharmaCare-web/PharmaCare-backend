import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FiHome, FiUsers, FiPackage, FiShoppingCart, 
  FiDollarSign, FiFileText, FiBell, FiSettings 
} from 'react-icons/fi';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user } = useAuth();
  const location = useLocation();

  const getMenuItems = () => {
    switch (user?.role_name) {
      case 'Admin':
        return [
          { name: 'Dashboard', path: '/admin/dashboard', icon: FiHome },
          { name: 'Managers', path: '/admin/managers', icon: FiUsers },
        ];
      case 'Manager':
        return [
          { name: 'Dashboard', path: '/manager/dashboard', icon: FiHome },
          { name: 'Staff', path: '/manager/staff', icon: FiUsers },
          { name: 'Medicines', path: '/manager/medicines', icon: FiPackage },
          { name: 'Reports', path: '/manager/reports/sales', icon: FiFileText },
          { name: 'Notifications', path: '/manager/notifications', icon: FiBell },
        ];
      case 'Pharmacist':
        return [
          { name: 'Dashboard', path: '/pharmacist/dashboard', icon: FiHome },
          { name: 'Medicines', path: '/pharmacist/medicines', icon: FiPackage },
          { name: 'Create Sale', path: '/pharmacist/sales/new', icon: FiShoppingCart },
          { name: 'Reports', path: '/pharmacist/reports', icon: FiFileText },
        ];
      case 'Cashier':
        return [
          { name: 'Dashboard', path: '/cashier/dashboard', icon: FiHome },
          { name: 'Pending Payments', path: '/cashier/payments/pending', icon: FiDollarSign },
          { name: 'Returns', path: '/cashier/returns', icon: FiFileText },
          { name: 'Reports', path: '/cashier/reports/payments', icon: FiFileText },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-30
        transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 transition-transform duration-300 ease-in-out
        w-64 bg-white shadow-lg
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 bg-primary-600">
            <h1 className="text-xl font-bold text-white">PharmaCare</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center px-6 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600
                    transition-colors duration-200
                    ${isActive ? 'bg-primary-50 text-primary-600 border-r-4 border-primary-600' : ''}
                  `}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                {user?.full_name?.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                <p className="text-xs text-gray-500">{user?.role_name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
