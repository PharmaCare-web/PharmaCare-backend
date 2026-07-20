import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, logout, changePassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if this is a mandatory password change (from temporary password)
  const isTemporary = location.state?.isTemporary || false;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    if (currentPassword === newPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    setLoading(true);

    try {
      const result = await changePassword(currentPassword, newPassword, confirmPassword);

      if (result.success) {
        toast.success('Password changed successfully');
        
        if (isTemporary) {
          // If this was a temporary password change, redirect to dashboard
          setTimeout(() => {
            const roleRoutes = {
              Admin: '/admin/dashboard',
              Manager: '/manager/dashboard',
              Pharmacist: '/pharmacist/dashboard',
              Cashier: '/cashier/dashboard',
            };
            navigate(roleRoutes[user?.role_name] || '/');
          }, 1500);
        } else {
          // If this was a regular password change, stay on the page or go back
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }
      } else {
        toast.error(result.error);
      }

    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isTemporary) {
      // If this is a temporary password change, logout instead of cancel
      logout();
    } else {
      // Regular password change - go back or to dashboard
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Change Password</h1>
            {isTemporary && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 text-sm">
                  You are using a temporary password. Please create a new secure password to continue.
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                placeholder="Enter your current password"
                required
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                placeholder="Enter your new password"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 6 characters long
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                placeholder="Confirm your new password"
                required
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Changing Password...' : 'Change Password'}
              </button>
              
              {!isTemporary && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition font-medium"
                >
                  Cancel
                </button>
              )}
            </div>

            {isTemporary && (
              <button
                type="button"
                onClick={handleCancel}
                className="w-full mt-4 text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Logout and return to login page
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
