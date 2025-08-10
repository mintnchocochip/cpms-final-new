import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Components/UniversalNavbar";
import SchoolDeptSelector from "../Components/SchoolDeptSelector";

const AdminSchoolSelection = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectorVisible, setSelectorVisible] = useState(true);
  const navigate = useNavigate();

  // Authentication check on component mount
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const role = sessionStorage.getItem('role');
    
    if (!token || role !== 'admin') {
      navigate('/admin/login');
      return;
    }
  }, [navigate]);

  const handleSubmit = async (selection) => {
    console.log('AdminSchoolSelection: Received selection:', selection);
    setIsLoading(true);
    setError("");

    try {
      // Validate selection before storing
      if (!selection.school || !selection.department) {
        throw new Error('Invalid selection: Missing school or department');
      }

      // Store selection in sessionStorage
      sessionStorage.setItem('adminContext', JSON.stringify(selection));
      
      console.log('AdminSchoolSelection: Stored context:', selection);
      
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Hide selector before navigation
      setSelectorVisible(false);
      
      // Navigate to panel management as requested
      navigate("/admin/panel-management");
      
    } catch (err) {
      console.error("Navigation error:", err);
      setError(`Failed to process selection: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRechoose = () => {
    console.log('AdminSchoolSelection: Rechoose called - No clearing needed');
    // Removed all clearing logic as requested
    setError("");
    setSelectorVisible(true);
  };

  // Check if user already has a valid context and redirect
  useEffect(() => {
    const checkExistingContext = () => {
      const existingContext = sessionStorage.getItem('adminContext');
      if (existingContext) {
        try {
          const parsed = JSON.parse(existingContext);
          if (parsed.school && parsed.department) {
            console.log('Found existing context, redirecting to panel management...');
            navigate("/admin/panel-management");
            return;
          }
        } catch (error) {
          console.log('Invalid existing context format');
        }
      }
    };

    const timer = setTimeout(checkExistingContext, 100);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <>
      <Navbar userType="admin" />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-1/2 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-2xl">
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
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                    <button 
                      onClick={() => setError('')}
                      className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                    >
                      Dismiss
                    </button>
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

            <SchoolDeptSelector
              isVisible={selectorVisible && !isLoading}
              onSubmit={handleSubmit}
              onRechoose={handleRechoose}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </>
  );
};

export default AdminSchoolSelection;
