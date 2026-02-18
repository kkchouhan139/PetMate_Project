import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, RefreshCw, CheckCircle } from 'lucide-react';
import API from '../utils/api';

const VerifyOTP = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/register');
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [email, navigate]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      toast.error('Please enter complete OTP');
      return;
    }

    setLoading(true);
    try {
      await API.post('/auth/verify-otp', { email, otp: otpString });
      toast.success('Email verified successfully! 🎉');
      navigate('/login', { state: { message: 'Registration completed! Please login.' } });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    try {
      await API.post('/auth/resend-otp', { email });
      toast.success('New OTP sent to your email');
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full card">
        <div className="text-center mb-6">
          <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Verify Your Email</h2>
          <p className="text-gray-600">
            We've sent a 6-digit code to<br />
            <span className="font-semibold text-primary-600">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center space-x-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none"
              />
            ))}
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
                <CheckCircle className="w-5 h-5 mr-2" />
                Verify Email
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-600 mb-2">Didn't receive the code?</p>
          {timer > 0 ? (
            <p className="text-sm text-gray-500">Resend in {timer}s</p>
          ) : (
            <button
              onClick={handleResendOTP}
              disabled={resendLoading}
              className="text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center mx-auto"
            >
              {resendLoading ? (
                <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Resend OTP
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;