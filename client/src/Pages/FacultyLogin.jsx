import React, { useState } from 'react';
import Navbar from '../Components/UniversalNavbar';
import axios from 'axios';
import { Eye, EyeOff, GraduationCap, BookOpen, Users, ChevronRight, Award, Settings } from 'lucide-react';
import { adminLogin } from '../api';

const FacultyLogin = () => {
  const [loginEmail, setLoginEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    
    setEmailError('');
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateEmail(loginEmail)) return;
    
    try {
      setLoading(true);
      setMessage('');

      const API_BASE_URL = 'https://cpms-latest.onerender.com/api';
      const endpoint = "/auth/login";

      const response = await adminLogin({
        emailId: loginEmail,
        password: loginPassword,
        expectedRole: "faculty"
      });

      console.log('Login response:', response.data);

      sessionStorage.setItem("token", response.data.token);
      sessionStorage.setItem("faculty", JSON.stringify(response.data.faculty));
      
      if (rememberMe) {
        sessionStorage.setItem("faculty_email", loginEmail);
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

  return (
    <>
      <Navbar />
      {/* ✅ FIXED: Added proper spacing for navbar */}
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 relative overflow-hidden pt-20">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

        {/* ✅ UPDATED: Better centering with navbar consideration */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] px-4 py-8">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl blur-lg opacity-75"></div>
                <div className="relative bg-gradient-to-r from-emerald-600 to-teal-600 p-4 rounded-2xl">
                  <GraduationCap className="h-10 w-10 text-white" />
                </div>
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent">
                  Faculty Portal
                </h1>
                <p className="text-emerald-200/80 text-sm">VIT Academic System</p>
              </div>
            </div>
          </div>

          {/* Main Login Card */}
          <div className="w-full max-w-md">
            <div className="relative">
              {/* Card Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 rounded-2xl blur-xl"></div>
              
              {/* Main Card */}
              <div className="relative bg-white/95 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/20">
                {/* Card Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl mb-4 shadow-lg">
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Faculty Login</h2>
                  <p className="text-gray-600">Access your academic dashboard</p>
                </div>

                {/* Message Display */}
                {message && (
                  <div className={`p-4 mb-6 rounded-r-lg border-l-4 ${
                    message.includes("Successful") 
                      ? "bg-emerald-50 border-emerald-500" 
                      : "bg-red-50 border-red-500"
                  }`}>
                    <div className="flex items-center">
                      {message.includes("Successful") ? (
                        <svg className="h-5 w-5 text-emerald-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className={`font-medium ${
                        message.includes("Successful") ? "text-emerald-700" : "text-red-700"
                      }`}>
                        {message}
                      </span>
                    </div>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-6">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                      Email Address
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                      <input
                        id="email"
                        type="email"
                        placeholder="faculty@vit.edu"
                        value={loginEmail}
                        onChange={(e) => {
                          setLoginEmail(e.target.value);
                          if (emailError) validateEmail(e.target.value);
                        }}
                        onBlur={() => validateEmail(loginEmail)}
                        className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-emerald-500/20 transition-all duration-200 bg-white/80 backdrop-blur-sm ${
                          emailError 
                            ? 'border-red-300 focus:border-red-500' 
                            : 'border-gray-200 focus:border-emerald-500'
                        }`}
                        disabled={loading}
                      />
                    </div>
                    {emailError && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {emailError}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                      Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={() => setRememberMe(!rememberMe)}
                        className="w-4 h-4 text-emerald-600 border-2 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                        disabled={loading}
                      />
                      <span className="text-sm font-medium text-gray-700">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleNavigate('/forgot-password')}
                      className="text-sm font-semibold text-emerald-600 hover:text-emerald-800 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <BookOpen className="h-5 w-5" />
                        <span>Access Portal</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    )}
                  </button>
                </form>

                {/* Admin Login Link */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => handleNavigate("/admin/login")}
                    className="w-full text-center py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl transition-all duration-200 border-2 border-gray-200 hover:border-gray-300"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <span>Administrator Portal</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </button>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center">
                  <div className="relative">
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
            </div>
          </div>

          {/* Bottom Features */}
          <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-md text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <GraduationCap className="h-6 w-6 text-emerald-300 mx-auto mb-1" />
              <p className="text-xs text-emerald-200 font-medium">Course Management</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <Users className="h-6 w-6 text-teal-300 mx-auto mb-1" />
              <p className="text-xs text-teal-200 font-medium">Student Guidance</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <Award className="h-6 w-6 text-cyan-300 mx-auto mb-1" />
              <p className="text-xs text-cyan-200 font-medium">Evaluation Tools</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FacultyLogin;
