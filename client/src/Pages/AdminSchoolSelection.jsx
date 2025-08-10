import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Components/UniversalNavbar";
import SchoolDeptSelector from "../Components/SchoolDeptSelector";

const AdminSchoolSelection = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Authentication check on component mount
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const role = sessionStorage.getItem('role');
    
    if (!token || role !== 'admin') {
      // Redirect to admin login if no valid admin token found
      navigate('/admin-login');
      return;
    }
  }, [navigate]);

  const handleSubmit = async (selection) => {
    setIsLoading(true);
    setError("");

    try {
      // Store selection in sessionStorage with key "adminContext"
      sessionStorage.setItem('adminContext', JSON.stringify(selection));
      
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Navigate to admin panel management
      navigate("/admin/panel-management");
    } catch (err) {
      console.error("Navigation error:", err);
      setError("Failed to process selection. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRechoose = () => {
    try {
      // Clear sessionStorage "adminContext" key
      sessionStorage.removeItem('adminContext');
      setError("");
      
      // The SchoolDeptSelector component handles its own reset internally
      console.log("Admin context cleared, selector reset");
    } catch (err) {
      console.error("Error clearing admin context:", err);
      setError("Failed to reset selection. Please refresh the page.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-1/2 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-2xl">
            {/* Header section */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">
                Administrative Setup
              </h1>
              <p className="text-lg text-gray-600 mb-2">
                Welcome to the Admin Panel
              </p>
              <p className="text-gray-500">
                Please select your school and department to configure your administrative context
              </p>
            </div>

            {/* Error display */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading overlay */}
            {isLoading && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-xl shadow-xl flex items-center space-x-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="text-gray-700 font-medium">Processing selection...</span>
                </div>
              </div>
            )}

            {/* School Department Selector */}
            <SchoolDeptSelector
              isVisible={true}
              onSubmit={handleSubmit}
              onRechoose={handleRechoose}
            />
          </div>
        </div>
      </div>

      {/* Add some custom animations */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </>
  );
};

export default AdminSchoolSelection;
