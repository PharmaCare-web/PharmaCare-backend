import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        const response = await api.get('/auth/me');
        setUser(response.users);
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, users, mustChangePassword } = response;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(users));
      
      // Store temporary password status separately
      if (mustChangePassword) {
        localStorage.setItem('mustChangePassword', 'true');
      } else {
        localStorage.removeItem('mustChangePassword');
      }
      
      setUser(users);

      if (mustChangePassword) {
        toast.info('Please change your temporary password');
        navigate('/change-password', { state: { isTemporary: true } });
        return { success: true, mustChangePassword: true };
      }

      toast.success(`Welcome back, ${users.full_name}!`);
      redirectBasedOnRole(users.role_name);

      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        (error.request ? 'Cannot connect to server. Make sure the backend is running on port 10000.' : 'Login failed');
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      toast.success('Registration successful! Please verify your email.');
      navigate('/verify-email', { state: { email: userData.email } });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('mustChangePassword');
      setUser(null);
      navigate('/login');
      toast.info('Logged out successfully');
    }
  };

  const redirectBasedOnRole = (roleName) => {
    const roleRoutes = {
      Admin: '/admin/dashboard',
      Manager: '/manager/dashboard',
      Pharmacist: '/pharmacist/dashboard',
      Cashier: '/cashier/dashboard',
    };
    navigate(roleRoutes[roleName] || '/');
  };

  const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    try {
      const response = await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      
      // Clear the temporary password flag on successful change
      localStorage.removeItem('mustChangePassword');
      
      return { success: true, message: response.message };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to change password' 
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
