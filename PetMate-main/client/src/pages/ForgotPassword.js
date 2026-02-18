import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import API from '../utils/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await API.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Password reset link sent! 📧');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full card">
        <div className="text-center mb-6">
          <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Forgot Password?</h2>
          <p className="text-gray-600">
            {sent 
              ? "We've sent a password reset link to your email"
              : "Enter your email address and we'll send you a link to reset your password"
            }
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                placeholder="Enter your email"
                className="input-field pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary w-full flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Send Reset Link
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">
                Check your email for a password reset link. It may take a few minutes to arrive.
              </p>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>Didn't receive the email?</p>
              <button
                onClick={() => {
                  setSent(false);
                  setEmail('');
                }}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        <div className="text-center mt-6">
          <Link 
            to="/login" 
            className="text-gray-600 hover:text-gray-800 flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;