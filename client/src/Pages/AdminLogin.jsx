import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../App";
import Navbar from "../Components/UniversalNavbar";
import { adminLogin } from "../api";
import axios from "axios";
import { Eye, EyeOff, Shield, AlertCircle, Mail, Lock } from "lucide-react";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await adminLogin({
        emailId: email,
        password,
        expectedRole: "admin",
      });
      const token = response.data?.token;

      if (!token) throw new Error("No token received");

      // ✅ DEFAULT to Super Admin Mode
      sessionStorage.setItem("token", token);
      sessionStorage.setItem("role", "admin");
      sessionStorage.setItem("adminContext", JSON.stringify({ skipped: true }));
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Update context
      login(token, "admin");

      // ✅ Go directly to admin panel management
      navigate("/admin/panel-management");
    } catch (err) {
      console.error("Login error:", err);
      const msg =
        err.response?.data?.message || "Login failed. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      {/* ✅ Enhanced layout - login form visible immediately without scrolling */}
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="w-full max-w-md mt-20">
          {/* ✅ Enhanced design with better visual hierarchy */}
          <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl border border-white/20 overflow-hidden">
            {/* Header section with icon */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 ">
              <div className="flex flex-col items-center text-center">
               
                <h1 className="text-2xl font-bold text-white mb-1">Admin Portal</h1>
               
              </div>
            </div>

            {/* Form section */}
            <div className="px-8 py-6">
              {error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      placeholder="admin@vit.ac.in"
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Password field */}
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
                      value={password}
                      placeholder="Enter your password"
                      onChange={(e) => setPassword(e.target.value)}
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

                {/* Remember me and forgot password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-200"
                    />
                    <span className="ml-2 text-sm text-gray-700">Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                    onClick={() => handleNavigate("/forgot-password")}
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {isLoading ? (
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
                      Admin Login
                    </>
                  )}
                </button>

                {/* Faculty login link */}
                <div className="text-center pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200"
                    onClick={() => navigate("/login")}
                  >
                    Are you Faculty? <span className="text-blue-600 hover:text-blue-800">Login here</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              VIT Administrative Portal • Secure Access
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLogin;
