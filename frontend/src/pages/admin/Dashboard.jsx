import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../api/admin.api';
import { toast } from 'react-toastify';
import { FaCheckCircle, FaBan, FaUserClock, FaUsers, FaBriefcase, FaBuilding } from 'react-icons/fa';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalManagers: 0,
    pendingManagers: 0,
    activeManagers: 0,
    totalBranches: 0
  });
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [managersData, branchesData] = await Promise.all([
        adminAPI.getAllManagers(),
        adminAPI.getBranchList().catch(() => ({ branches: [] }))
      ]);

      const allManagers = managersData?.data?.all || managersData?.data?.pending || [];
      const pending = managersData?.data?.pending || allManagers.filter((m) => !m.is_active);
      const active = managersData?.data?.activated || allManagers.filter((m) => m.is_active);

      setStats({
        totalManagers: allManagers.length,
        pendingManagers: pending.length,
        activeManagers: active.length,
        totalBranches: branchesData?.data?.length || 0
      });

      // Show only pending managers by default
      setManagers(pending);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (userId) => {
    if (!window.confirm('Are you sure you want to activate this manager?')) {
      return;
    }

    setActionLoading(userId);
    try {
      await adminAPI.activateManager(userId);
      toast.success('Manager activated successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to activate manager');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this manager?')) {
      return;
    }

    setActionLoading(userId);
    try {
      await adminAPI.deactivateManager(userId);
      toast.success('Manager deactivated successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to deactivate manager');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Pending
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">Welcome back, {user?.full_name}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Managers</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalManagers}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FaUsers className="text-2xl text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approval</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pendingManagers}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <FaUserClock className="text-2xl text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Managers</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.activeManagers}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FaCheckCircle className="text-2xl text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Branches</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalBranches}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <FaBuilding className="text-2xl text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Pending Managers Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Pending Manager Approvals</h2>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-sm text-gray-600">Loading...</p>
          </div>
        ) : managers.length === 0 ? (
          <div className="p-8 text-center">
            <FaCheckCircle className="mx-auto text-4xl text-gray-400 mb-3" />
            <p className="text-gray-600">No pending manager approvals</p>
            <p className="text-sm text-gray-500 mt-1">All managers are activated</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manager Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch Information
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {managers.map((manager) => (
                  <tr key={manager.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {manager.full_name}
                        </div>
                        <div className="text-sm text-gray-500">{manager.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {manager.branch_name || 'Not assigned'}
                      </div>
                      {manager.location && (
                        <div className="text-sm text-gray-500">{manager.location}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(manager.is_active)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(manager.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {manager.is_active ? (
                        <button
                          onClick={() => handleDeactivate(manager.user_id)}
                          disabled={actionLoading === manager.user_id}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          <FaBan className="mr-1" />
                          {actionLoading === manager.user_id ? 'Processing...' : 'Deactivate'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(manager.user_id)}
                          disabled={actionLoading === manager.user_id}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          <FaCheckCircle className="mr-1" />
                          {actionLoading === manager.user_id ? 'Processing...' : 'Approve'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
