import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Components/UniversalNavbar";
import SchoolDeptSelector from "../Components/SchoolDeptSelector";

const AdminSchoolSelection = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectorVisible, setSelectorVisible] = useState(true);
  const [autoRedirect, setAutoRedirect] = useState(false);
  const navigate = useNavigate();

  const stableNavigate = useCallback((path) => {
    navigate(path);
  }, [navigate]);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const role = sessionStorage.getItem('role');
    
    if (!token || role !== 'admin') {
      stableNavigate('/admin/login');
      return;
    }

    const existingContext = sessionStorage.getItem('adminContext');
    if (existingContext) {
      try {
        const parsed = JSON.parse(existingContext);
        // Only auto-redirect for super admin mode
        if (parsed.skipped) {
          console.log('Auto-redirecting to super admin mode...');
          setAutoRedirect(true);
          setSelectorVisible(false);
          
          setTimeout(() => {
            stableNavigate("/admin/panel-management");
          }, 500);
          return;
        }
      } catch (error) {
        console.log('Invalid context, showing selector...');
        sessionStorage.removeItem('adminContext');
      }
    }

    setSelectorVisible(true);
    setAutoRedirect(false);
  }, [stableNavigate]);

  const handleSubmit = useCallback(async (selection) => {
    console.log('AdminSchoolSelection: Received selection:', selection);
    setIsLoading(true);
    setError("");

    try {
      if (!selection.school || !selection.department) {
        throw new Error('Invalid selection: Missing school or department');
      }

      sessionStorage.setItem('adminContext', JSON.stringify(selection));
      console.log('AdminSchoolSelection: Stored context:', selection);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setSelectorVisible(false);
      
      const returnPath = sessionStorage.getItem('adminReturnPath');
      if (returnPath) {
        console.log('Returning to:', returnPath);
        sessionStorage.removeItem('adminReturnPath');
        stableNavigate(returnPath);
      } else {
        console.log('No return path, defaulting to panel-management');
        stableNavigate("/admin/panel-management");
      }
      
    } catch (err) {
      console.error("Navigation error:", err);
      setError(`Failed to process selection: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [stableNavigate]);

  const handleSkip = useCallback(async () => {
    console.log('AdminSchoolSelection: Skip selected');
    setIsLoading(true);
    setError("");

    try {
      const skipContext = { skipped: true };
      sessionStorage.setItem('adminContext', JSON.stringify(skipContext));
      console.log('AdminSchoolSelection: Stored skip context:', skipContext);

      await new Promise(resolve => setTimeout(resolve, 300));
      setSelectorVisible(false);

      const returnPath = sessionStorage.getItem('adminReturnPath');
      if (returnPath) {
        console.log('Returning to:', returnPath);
        sessionStorage.removeItem('adminReturnPath');
        stableNavigate(returnPath);
      } else {
        stableNavigate("/admin/panel-management");
      }
    } catch (err) {
      console.error("Skip navigation error:", err);
      setError(`Failed to skip selection: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [stableNavigate]);

  const handleRechoose = useCallback(() => {
    console.log('AdminSchoolSelection: Rechoose called');
    setError("");
    setSelectorVisible(true);
  }, []);

  const dismissError = useCallback(() => setError(''), []);

  if (autoRedirect) {
    return (
      <>
        <Navbar userType="admin" />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Loading Admin Panel...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar userType="admin" />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Administrative Setup</h1>
              <p className="text-lg text-gray-600 mb-2">Welcome to the Admin Panel</p>
              <p className="text-gray-500">Please select your school and department to configure your administrative context</p>
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
                    <button onClick={dismissError} className="mt-2 text-xs text-red-600 hover:text-red-800 underline">
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Loading overlay */}
            {isLoading && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 999999 }}>
                <div className="bg-white p-6 rounded-xl shadow-xl flex items-center space-x-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="text-gray-700 font-medium">Processing selection...</span>
                </div>
              </div>
            )}

            {/* Selector Component */}
            <SchoolDeptSelector
              isVisible={selectorVisible && !isLoading}
              onSubmit={handleSubmit}
              onRechoose={handleRechoose}
              onSkip={handleSkip}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSchoolSelection;
