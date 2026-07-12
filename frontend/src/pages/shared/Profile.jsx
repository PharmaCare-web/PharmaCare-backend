import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Profile</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Full Name</label>
            <p className="text-gray-900 mt-1">{user?.full_name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="text-gray-900 mt-1">{user?.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Role</label>
            <p className="text-gray-900 mt-1">{user?.role_name}</p>
          </div>
          {user?.branch_name && (
            <div>
              <label className="text-sm font-medium text-gray-500">Branch</label>
              <p className="text-gray-900 mt-1">{user?.branch_name}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
