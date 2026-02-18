import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import API from '../utils/api';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      toast.error('Invalid reset link');
      navigate('/login');
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await API.post('/auth/reset-password', { token, password });
      toast.success('Password reset successfully! 🎉');
      navigate('/login', { 
        state: { message: 'Password reset successfully! Please login with your new password.' }
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, text: '', color: '' };
    if (password.length < 6) return { strength: 1, text: 'Too short', color: 'text-red-500' };
    if (password.length < 8) return { strength: 2, text: 'Weak', color: 'text-orange-500' };
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { strength: 3, text: 'Medium', color: 'text-yellow-500' };
    }
    return { strength: 4, text: 'Strong', color: 'text-green-500' };
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full card">
        <div className="text-center mb-6">
          <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Reset Password</h2>
          <p className="text-gray-600">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="New Password"
              className="input-field pl-10 pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {password && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Password strength:</span>
                <span className={passwordStrength.color}>{passwordStrength.text}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    passwordStrength.strength === 1 ? 'bg-red-500 w-1/4' :
                    passwordStrength.strength === 2 ? 'bg-orange-500 w-2/4' :
                    passwordStrength.strength === 3 ? 'bg-yellow-500 w-3/4' :
                    passwordStrength.strength === 4 ? 'bg-green-500 w-full' : 'w-0'
                  }`}
                ></div>
              </div>
            </div>
          )}

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm New Password"
              className="input-field pl-10 pr-10"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {confirmPassword && password !== confirmPassword && (
            <p className="text-red-500 text-sm">Passwords do not match</p>
          )}

          {confirmPassword && password === confirmPassword && password.length >= 6 && (
            <div className="flex items-center space-x-2 text-green-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Passwords match</span>
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary w-full flex items-center justify-center"
            disabled={loading || password !== confirmPassword || password.length < 6}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Reset Password
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Remember your password?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Back to Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;