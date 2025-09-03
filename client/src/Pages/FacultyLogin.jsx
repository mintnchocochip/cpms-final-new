import React, { useState } from 'react';
import Navbar from '../Components/UniversalNavbar';
import axios from 'axios';
import { Eye, EyeOff, Mail, Hash, BookOpen, CheckCircle, AlertCircle, Lock } from 'lucide-react';
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
    <div className=" bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <Navbar />
      
      <div className="flex justify-center items-center pt-20 px-4 py-8 h-150">
        <div className="w-full max-w-md">
          {/* Main Login Card */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
            {/* Header Section with Gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-2 text-center">
    
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Faculty Portal</h2>
            
            </div>

            {/* Form Section */}
            <div className="p-6 sm:p-8">
              {message && (
                <div 
                  className={`px-4 py-3 rounded-lg relative mb-6 ${
                    message.includes("Successful") 
                      ? "bg-green-50 border border-green-200 text-green-800"
                      : "bg-red-50 border border-red-200 text-red-800"
                  }`} 
                  role="alert"
                >
                  <div className="flex items-center">
                    {message.includes("Successful") ? (
                      <CheckCircle className="h-5 w-5 mr-3 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 mr-3 text-red-600" />
                    )}
                    <span className="text-sm font-medium">{message}</span>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label htmlFor="identifier" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address or Employee ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
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
                      className={`pl-12 w-full p-4 border-2 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-sm ${
                        identifierError 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                          : 'border-gray-200 hover:border-gray-300'
                      } ${loading ? 'bg-gray-50' : 'bg-white'}`}
                      disabled={loading}
                    />
                  </div>
                  {identifierError && (
                    <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {identifierError}
                    </p>
                  )}
                  
                  
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input 
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className={`pl-12 pr-12 w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-sm hover:border-gray-300 ${
                        loading ? 'bg-gray-50' : 'bg-white'
                      }`}
                      disabled={loading}
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none p-1 rounded transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
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
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
                    />
                    <label htmlFor="remember-me" className="ml-3 block text-sm text-gray-700 font-medium">
                      Remember me
                    </label>
                  </div>
                  <div>
                    <button 
                      type="button" 
                      onClick={() => handleNavigate('/forgot-password')}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full flex justify-center items-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-6 rounded-xl font-semibold focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-75 disabled:transform-none"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-5 h-5 mr-2" />
                      Sign In to Portal
                    </>
                  )}
                </button>
              </form>
              
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => handleNavigate("/admin/login")}
                  className="w-full text-center text-blue-600 hover:text-blue-800 font-semibold py-3 px-4 rounded-xl border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300"
                >
                  Administrator Access →
                </button>
              </div>

              <div className="relative mt-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">
                    VIT Faculty Portal
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Help Card */}


          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              © 2025 VIT Chennai Campus - Faculty Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyLogin;
