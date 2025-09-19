import React, { useState } from 'react';
import Navbar from '../Components/UniversalNavbar';
import axios from 'axios';
import { Eye, EyeOff, Mail, Hash, Shield, AlertCircle, Lock } from 'lucide-react';
import { adminLogin } from '../api';

const FacultyLogin = () => {
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [identifierError, setIdentifierError] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateIdentifier = (identifier) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    const empIdRegex = /^[A-Za-z0-9]+$/;
    
    if (!identifier) {
      setIdentifierError('Email or Employee ID is required');
      return false;
    }
    
    const isEmail = emailRegex.test(identifier);
    const isEmpId = empIdRegex.test(identifier);
    
    if (!isEmail && !isEmpId) {
      setIdentifierError('Please enter a valid email address or employee ID');
      return false;
    }
    
    setIdentifierError('');
    return true;
  };

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

      const API_BASE_URL = 'http://localhost:5000/api';
      const endpoint = "/auth/login";

      const response = await adminLogin({
        emailId: loginIdentifier,
        password: loginPassword,
        expectedRole: "faculty"
      });

      console.log('Login response:', response.data);

      sessionStorage.setItem("token", response.data.token);
      sessionStorage.setItem("faculty", JSON.stringify(response.data.faculty));
      
      if (rememberMe) {
        sessionStorage.setItem("faculty_identifier", loginIdentifier);
      }
      
      setMessage("Login Successful!");
      
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

  const getPlaceholder = () => {
    if (!loginIdentifier) return "Email or Employee ID";
    const type = detectInputType(loginIdentifier);
    return type === 'email' ? "faculty@vit.ac.in" : "EMP001";
  };

  const getInputIcon = () => {
    if (!loginIdentifier) return <Mail className="h-5 w-5 text-gray-400" />;
    const type = detectInputType(loginIdentifier);
    return type === 'email' ? 
      <Mail className="h-5 w-5 text-gray-400" /> : 
      <Hash className="h-5 w-5 text-gray-400" />;
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="w-full max-w-md mt-20">
          <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold text-white mb-1">Faculty Portal</h1>
              </div>
            </div>

            <div className="px-8 py-6">
              {message && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                    <p className="text-red-700 text-sm font-medium">{message}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label htmlFor="identifier" className="block text-sm font-semibold text-gray-700 mb-2">
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
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
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
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors duration-200"
                      onClick={togglePasswordVisibility}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={() => setRememberMe(!rememberMe)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-200"
                    />
                    <span className="ml-2 text-sm text-gray-700">Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                    onClick={() => handleNavigate('/forgot-password')}
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Shield className="h-5 w-5 mr-2" />
                      Faculty Login
                    </>
                  )}
                </button>

                <div className="text-center pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200"
                    onClick={() => handleNavigate("/admin/login")}
                  >
                    Are you an Admin? <span className="text-blue-600 hover:text-blue-800">Login here</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              VIT Faculty Portal • Secure Access
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default FacultyLogin;
