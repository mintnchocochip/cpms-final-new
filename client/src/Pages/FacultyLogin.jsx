import React, { useState } from 'react';
import Navbar from '../Components/UniversalNavbar';
import axios from 'axios';
import { Eye, EyeOff, Mail, Hash } from 'lucide-react';
import { adminLogin } from '../api';

const FacultyLogin = () => {
  const [loginIdentifier, setLoginIdentifier] = useState(''); // Changed from loginEmail
  const [identifierError, setIdentifierError] = useState(''); // Changed from emailError
  const [loginPassword, setLoginPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Updated validation function to handle both email and employee ID
  const validateIdentifier = (identifier) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    const empIdRegex = /^[A-Za-z0-9]+$/; // Based on your schema pattern
    
    if (!identifier) {
      setIdentifierError('Email or Employee ID is required');
      return false;
    }
    
    // Check if it's an email or employee ID
    const isEmail = emailRegex.test(identifier);
    const isEmpId = empIdRegex.test(identifier);
    
    if (!isEmail && !isEmpId) {
      setIdentifierError('Please enter a valid email address or employee ID');
      return false;
    }
    
    setIdentifierError('');
    return true;
  };

  // Detect input type for better UX
  const detectInputType = (value) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return emailRegex.test(value) ? 'email' : 'employeeId';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateIdentifier(loginIdentifier)) return;
    
    try {
      setLoading(true);
      setMessage('');

      const API_BASE_URL = 'https://cpms-latest.onerender.com/api';
      const endpoint = "/auth/login";

      const response = await adminLogin({
        emailId: loginIdentifier, // Backend will handle both email and empId
        password: loginPassword,
        expectedRole: "faculty"
      });

      console.log('Login response:', response.data);

      // Store both token AND faculty data
      sessionStorage.setItem("token", response.data.token);
      sessionStorage.setItem("faculty", JSON.stringify(response.data.faculty));
      
      if (rememberMe) {
        sessionStorage.setItem("faculty_identifier", loginIdentifier); // Changed from faculty_email
      }
      
      setMessage("Login Successful!");
      
      // Redirect based on role
      if (response.data.faculty.role === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/Guide';
      }
    } catch (error) {
      console.error("❌ Login Error:", error.response?.data || error);
      setMessage(error.response?.data?.message || error.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path) => {
    window.location.href = path;
  };

  // Get placeholder text based on input
  const getPlaceholder = () => {
    if (!loginIdentifier) return "Email or Employee ID";
    const type = detectInputType(loginIdentifier);
    return type === 'email' ? "faculty@vit.ac.in" : "EMP001";
  };

  // Get icon based on input type
  const getInputIcon = () => {
    if (!loginIdentifier) return <Mail className="h-5 w-5 text-gray-400" />;
    const type = detectInputType(loginIdentifier);
    return type === 'email' ? 
      <Mail className="h-5 w-5 text-gray-400" /> : 
      <Hash className="h-5 w-5 text-gray-400" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      <Navbar />
      
      <div className="flex justify-center items-center pt-24 px-4">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-200">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-blue-700 p-4 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Faculty Login</h2>
            <p className="text-gray-500 text-sm mt-1">Access your VIT faculty portal</p>
          </div>

          {message && (
            <div 
              className={`px-4 py-3 rounded relative mb-4 ${
                message.includes("Successful") 
                  ? "bg-green-100 border-l-4 border-green-500 text-green-700"
                  : "bg-red-50 border-l-4 border-red-500 text-red-700"
              }`} 
              role="alert"
            >
              <div className="flex">
                {message.includes("Successful") ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="block sm:inline">{message}</span>
              </div>
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address or Employee ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {getInputIcon()}
                </div>
                <input 
                  id="identifier"
                  type="text" 
                  placeholder={getPlaceholder()}
                  value={loginIdentifier}
                  onChange={(e) => {
                    setLoginIdentifier(e.target.value);
                    if (identifierError) validateIdentifier(e.target.value);
                  }}
                  onBlur={() => validateIdentifier(loginIdentifier)}
                  className={`pl-10 w-full p-3 border rounded-md transition focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${identifierError ? 'border-red-500' : 'border-gray-300'}`}
                  disabled={loading}
                />
              </div>
              {identifierError && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {identifierError}
                </p>
              )}
              
              {/* Helper text to show what format is detected */}
              {loginIdentifier && !identifierError && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  {detectInputType(loginIdentifier) === 'email' ? (
                    <>
                      <Mail className="h-3 w-3" />
                      Detected as email address
                    </>
                  ) : (
                    <>
                      <Hash className="h-3 w-3" />
                      Detected as employee ID
                    </>
                  )}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input 
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="pl-10 pr-10 w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  disabled={loading}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff size={20} className="text-gray-500" />
                    ) : (
                      <Eye size={20} className="text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <div>
                <button 
                  type="button" 
                  onClick={() => handleNavigate('/forgot-password')}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full flex justify-center items-center bg-blue-700 text-white py-3 px-4 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-75"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>
          
          <div className="mt-4">
            <button
              type="button"
              onClick={() => handleNavigate("/admin/login")}
              className="w-full text-center text-blue-600 hover:text-blue-800 font-semibold py-2 px-4 rounded-md border border-blue-200 hover:border-blue-300 transition"
            >
              Are you an administrator? Login here
            </button>
          </div>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                VIT Faculty Portal
              </span>
            </div>
          </div>

          {/* Help text */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              <strong>Login Options:</strong><br/>
              • Email: faculty@vit.ac.in<br/>
              • Employee ID: EMP001
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyLogin;
