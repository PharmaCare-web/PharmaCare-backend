import { useAuth } from '../../context/AuthContext';

const ManagerDashboard = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Manager Dashboard</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-700">Welcome, {user?.full_name}!</p>
        <p className="text-gray-500 mt-2">Branch: {user?.branch_name}</p>
        <p className="text-gray-500 mt-4">Manager dashboard content coming soon...</p>
      </div>
    </div>
  );
};

export default ManagerDashboard;
