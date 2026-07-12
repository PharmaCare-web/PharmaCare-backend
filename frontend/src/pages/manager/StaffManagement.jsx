import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { managerAPI } from '../../api/manager.api';
import { FaUserPlus, FaTrash, FaKey, FaCheckCircle, FaBan, FaEnvelope } from 'react-icons/fa';

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [pendingCode, setPendingCode] = useState({ code: '', email: '', message: '' });
  const [verifyData, setVerifyData] = useState({ email: '', verification_code: '' });
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role_ids: [3],
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await managerAPI.getAllStaff();
      setStaff(response?.data || []);
    } catch (error) {
      toast.error('Failed to load staff');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();

    try {
      console.log('📧 [CREATE STAFF] Starting request with:', formData);
      const response = await managerAPI.createStaff(formData);
      console.log('📧 [CREATE STAFF] Full response:', response);
      console.log('📧 [CREATE STAFF] Response type:', typeof response);
      console.log('📧 [CREATE STAFF] Response keys:', Object.keys(response || {}));
      
      // The axios interceptor returns response.data, so we get { success, message, data }
      const result = response?.data || {};
      console.log('📧 [CREATE STAFF] Result from response.data:', result);
      console.log('📧 [CREATE STAFF] emailSent:', result.emailSent);
      console.log('📧 [CREATE STAFF] verificationCode:', result.verificationCode);
      console.log('📧 [CREATE STAFF] emailError:', result.emailError);

      if (result.emailSent) {
        toast.success('Staff created! Verification code sent to their email.');
      } else {
        toast.warning('Staff created, but email was not sent.');
        if (result.verificationCode) {
          console.log('📧 [CREATE STAFF] Showing verification code modal');
          setPendingCode({
            code: result.verificationCode,
            email: formData.email,
            message: result.emailError || 'SMTP is not configured on the server.',
          });
          setShowCodeModal(true);
        }
        if (result.emailError) {
          toast.info(result.emailError, { autoClose: 8000 });
        }
      }

      setShowAddModal(false);
      setFormData({ full_name: '', email: '', role_ids: [3] });
      fetchStaff();
    } catch (error) {
      console.error('📧 [CREATE STAFF] Error:', error);
      console.error('📧 [CREATE STAFF] Error response:', error.response);
      toast.error(error.response?.data?.message || 'Failed to create staff');
    }
  };

  const handleResendVerification = async (userId, email) => {
    try {
      const response = await managerAPI.resendStaffVerification(userId);
      const result = response?.data || response || {};
      console.log('📧 Resend verification response:', result);

      if (result.emailSent) {
        toast.success(`Verification code resent to ${email}`);
      } else if (result.verificationCode) {
        setPendingCode({
          code: result.verificationCode,
          email,
          message: result.emailError || 'Email could not be sent.',
        });
        setShowCodeModal(true);
        toast.warning('Email not sent. Share the verification code manually.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend verification code');
    }
  };

  const handleResetPassword = async (userId, name) => {
    if (!window.confirm(`Reset password for ${name}?`)) return;

    try {
      const response = await managerAPI.resetStaffPassword(userId);
      const result = response?.data || response || {};
      console.log('📧 Reset password response:', result);

      if (result.emailSent) {
        toast.success('New temporary password sent to staff email.');
      } else if (result.temporaryPassword) {
        toast.info(`Temporary Password: ${result.temporaryPassword}`, {
          autoClose: false,
          closeButton: true,
        });
        toast.warning('Email not sent. Share this password with the staff member.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleRemoveStaff = async (userId, name) => {
    if (!window.confirm(`Remove ${name} from staff?`)) return;

    try {
      await managerAPI.removeStaff(userId);
      toast.success('Staff removed successfully');
      fetchStaff();
    } catch (error) {
      toast.error('Failed to remove staff');
    }
  };

  const handleVerifyStaff = async (e) => {
    e.preventDefault();

    try {
      const response = await managerAPI.verifyStaff(verifyData);
      const result = response?.data || response || {};
      console.log('📧 Verify staff response:', result);

      if (result.emailSent) {
        toast.success('Staff verified! Temporary password sent to their email.');
      } else {
        toast.success('Staff verified and activated!');
        if (result.temporaryPassword) {
          toast.info(`Temporary Password: ${result.temporaryPassword}`, {
            autoClose: false,
            closeButton: true,
          });
          toast.warning('Email not sent. Share this password with the staff member.');
        }
      }

      setShowVerifyModal(false);
      setVerifyData({ email: '', verification_code: '' });
      fetchStaff();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowVerifyModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <FaCheckCircle className="mr-2" />
            Verify Staff
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <FaUserPlus className="mr-2" />
            Add Staff
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Loading staff...</p>
          </div>
        ) : staff.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No staff members yet</p>
            <p className="text-sm mt-2">Click &quot;Add Staff&quot; to create your first team member</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staff.map((member) => (
                <tr key={member.user_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{member.full_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{member.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      member.role_name === 'Pharmacist'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {member.role_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {member.is_active ? (
                      <span className="flex items-center text-sm text-green-600">
                        <FaCheckCircle className="mr-1" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center text-sm text-yellow-600">
                        <FaBan className="mr-1" /> Pending Verification
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {!member.is_active && (
                      <button
                        onClick={() => handleResendVerification(member.user_id, member.email)}
                        className="text-purple-600 hover:text-purple-900 mr-3"
                        title="Resend Verification Code"
                      >
                        <FaEnvelope />
                      </button>
                    )}
                    <button
                      onClick={() => handleResetPassword(member.user_id, member.full_name)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="Reset Password"
                    >
                      <FaKey />
                    </button>
                    <button
                      onClick={() => handleRemoveStaff(member.user_id, member.full_name)}
                      className="text-red-600 hover:text-red-900"
                      title="Remove Staff"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Add New Staff</h2>
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={formData.role_ids[0]}
                  onChange={(e) => setFormData({ ...formData, role_ids: [parseInt(e.target.value, 10)] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value={3}>Pharmacist</option>
                  <option value={4}>Cashier</option>
                </select>
              </div>
              <p className="text-sm text-gray-600">
                A verification code will be sent to the staff member&apos;s email. If email is not configured,
                the code will be shown to you after creation.
              </p>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700">
                  Create Staff
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showVerifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Verify Staff Email</h2>
            <p className="text-sm text-gray-600 mb-4">
              Enter the staff member&apos;s email and the verification code they received.
            </p>
            <form onSubmit={handleVerifyStaff} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Staff Email</label>
                <input
                  type="email"
                  value={verifyData.email}
                  onChange={(e) => setVerifyData({ ...verifyData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="staff@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
                <input
                  type="text"
                  value={verifyData.verification_code}
                  onChange={(e) => setVerifyData({ ...verifyData, verification_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="6-digit code"
                  required
                  maxLength={6}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                  Verify & Activate
                </button>
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-2 text-yellow-700">Verification Code</h2>
            <p className="text-sm text-gray-600 mb-4">
              Email could not be sent to <strong>{pendingCode.email}</strong>.
            </p>
            <p className="text-xs text-gray-500 mb-4">{pendingCode.message}</p>
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 text-center mb-4">
              <p className="text-sm text-gray-600 mb-2">Share this code with the staff member:</p>
              <p className="text-4xl font-bold tracking-widest text-primary-600">{pendingCode.code}</p>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Then use <strong>Verify Staff</strong> to activate their account.
            </p>
            <button
              onClick={() => {
                setShowCodeModal(false);
                setVerifyData({ email: pendingCode.email, verification_code: pendingCode.code });
                setShowVerifyModal(true);
              }}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 mb-2"
            >
              Open Verify Staff
            </button>
            <button
              onClick={() => setShowCodeModal(false)}
              className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
