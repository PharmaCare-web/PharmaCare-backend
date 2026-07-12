import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { adminAPI } from '../../api/admin.api';
import { FaCheckCircle, FaBan, FaUserClock } from 'react-icons/fa';

const ManagerManagement = () => {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'activated'
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchManagers();
  }, [filter]);

  const fetchManagers = async () => {
    setLoading(true);
    try {
      let response;
      if (filter === 'pending') {
        response = await adminAPI.getPendingManagers();
        setManagers(response?.data || []);
      } else if (filter === 'activated') {
        response = await adminAPI.getActivatedManagers();
        setManagers(response?.data || []);
      } else {
        response = await adminAPI.getAllManagers();
        setManagers(response?.data?.all || []);
      }
    } catch (error) {
      toast.error('Failed to fetch managers');
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
      fetchManagers();
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
      fetchManagers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to deactivate manager');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <FaCheckCircle className="mr-1" />
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <FaUserClock className="mr-1" />
        Pending
      </span>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manager Management</h1>
        <button
          onClick={fetchManagers}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setFilter('all')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition ${
              filter === 'all'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Managers
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition ${
              filter === 'pending'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Activation
          </button>
          <button
            onClick={() => setFilter('activated')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition ${
              filter === 'activated'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Activated
          </button>
        </nav>
      </div>

      {/* Managers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Loading managers...</p>
          </div>
        ) : managers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No managers found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manager
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {manager.branch_name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {manager.location || ''}
                      </div>
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
                          className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded-md text-red-700 bg-white hover:bg-red-50 transition disabled:opacity-50"
                        >
                          <FaBan className="mr-1" />
                          {actionLoading === manager.user_id ? 'Processing...' : 'Deactivate'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(manager.user_id)}
                          disabled={actionLoading === manager.user_id}
                          className="inline-flex items-center px-3 py-1.5 border border-green-300 rounded-md text-green-700 bg-white hover:bg-green-50 transition disabled:opacity-50"
                        >
                          <FaCheckCircle className="mr-1" />
                          {actionLoading === manager.user_id ? 'Processing...' : 'Activate'}
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

export default ManagerManagement;
