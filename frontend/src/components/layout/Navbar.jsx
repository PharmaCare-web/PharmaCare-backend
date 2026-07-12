import { useAuth } from '../../context/AuthContext';
import { FiMenu, FiUser, FiLogOut } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6">
      <button
        onClick={toggleSidebar}
        className="text-gray-500 hover:text-gray-700 focus:outline-none lg:hidden"
      >
        <FiMenu className="w-6 h-6" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center space-x-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
          <p className="text-xs text-gray-500">{user?.branch_name || 'System Admin'}</p>
        </div>

        <button
          onClick={() => navigate('/profile')}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
          title="Profile"
        >
          <FiUser className="w-5 h-5" />
        </button>

        <button
          onClick={handleLogout}
          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition"
          title="Logout"
        >
          <FiLogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
