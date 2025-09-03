// ForgotPassword.jsx - Modified version of your code
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Components/UniversalNavbar';
import { sendOTP, verifyOTPAndResetPassword, resendOTP } from '../api'; // Import API functions

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: Verify code, 3: New password
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [countdown, setCountdown] = useState(0);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    // At least 6 characters (simplified from your 8 char requirement)
    return password.length >= 6;
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      setMessage({ 
        text: 'Please enter a valid email address', 
        type: 'error' 
      });
      return;
    }

    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Use API function instead of direct axios
      const response = await sendOTP(email);
      
      setMessage({ 
        text: response.message || 'A verification code has been sent to your email', 
        type: 'success' 
      });
      setStep(2);
      setCountdown(600); // 10 minute countdown (Twilio default)
    } catch (error) {
      console.error("Reset request error:", error);
      setMessage({ 
        text: error.response?.data?.message || 'Failed to send reset code. Please try again.',
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    
    if (!resetCode.trim()) {
      setMessage({ 
        text: 'Please enter the verification code', 
        type: 'error' 
      });
      return;
    }

    if (!validatePassword(newPassword)) {
      setMessage({ 
        text: 'Password must be at least 6 characters long', 
        type: 'error' 
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ 
        text: 'Passwords do not match', 
        type: 'error' 
      });
      return;
    }

    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Use API function for verify and reset in one step
      const response = await verifyOTPAndResetPassword(email, resetCode, newPassword, confirmPassword);
      
      setMessage({ 
        text: response.message || 'Password reset successful! Redirecting to login...', 
        type: 'success' 
      });
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        // Check if email contains "admin" to redirect to the appropriate login page
        const isAdmin = email.includes('admin');
        navigate(isAdmin ? '/admin/login' : '/login');
      }, 3000);
    } catch (error) {
      console.error("Code verification error:", error);
      setMessage({ 
        text: error.response?.data?.message || 'Invalid or expired code',
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationCode = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Use API function for resend
      const response = await resendOTP(email);
      
      setMessage({ 
        text: response.message || 'A new verification code has been sent to your email', 
        type: 'success' 
      });
      setCountdown(600); // Reset the countdown
    } catch (error) {
      console.error("Resend code error:", error);
      setMessage({ 
        text: error.response?.data?.message || 'Failed to resend code',
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      <Navbar showLeftMenu={false} />
      
      <div className="flex justify-center items-center pt-24 px-4">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-200">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-blue-700 p-4 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Forgot Password</h2>
            <p className="text-gray-500 text-sm mt-1">
              {step === 1 && "Enter your email to reset your password"}
              {step === 2 && "Enter the verification code and new password"}
            </p>
          </div>

          {message.text && (
            <div 
              className={`px-4 py-3 rounded relative mb-4 ${
                message.type === 'success' 
                  ? "bg-green-100 border-l-4 border-green-500 text-green-700"
                  : "bg-red-50 border-l-4 border-red-500 text-red-700"
              }`}
              role="alert"
            >
              <div className="flex">
                {message.type === 'success' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="block sm:inline">{message.text}</span>
              </div>
            </div>
          )}
          
          {step === 1 && (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input 
                    id="email"
                    type="email" 
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full flex justify-center items-center bg-blue-700 text-white py-2 px-4 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-75"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending OTP...
                  </>
                ) : 'Send OTP'}
              </button>
            </form>
          )}
          
          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label htmlFor="resetCode" className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                <input 
                  id="resetCode"
                  type="text" 
                  placeholder="Enter OTP code"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-center text-lg tracking-wider"
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input 
                    id="newPassword"
                    type="password" 
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input 
                    id="confirmPassword"
                    type="password" 
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {countdown > 0 && (
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Code expires in <span className="font-medium">{formatTime(countdown)}</span>
                  </p>
                </div>
              )}

              <button 
                type="submit" 
                className="w-full flex justify-center items-center bg-blue-700 text-white py-2 px-4 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-75"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Resetting Password...
                  </>
                ) : 'Reset Password'}
              </button>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={resendVerificationCode}
                  className={`text-sm font-medium ${
                    countdown > 0 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-blue-600 hover:text-blue-500'
                  }`}
                  disabled={countdown > 0 || isLoading}
                >
                  Didn't receive a code? Resend
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Remember your password?</span>{' '}
            <a
              href="/login"
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              Back to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
