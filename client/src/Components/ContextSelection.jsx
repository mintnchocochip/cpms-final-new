import React from 'react';
import { Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../Components/UniversalNavbar";

const ContextSelection = ({ onSelectContext, error }) => {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div className="pt-16 sm:pt-20 pl-4 sm:pl-24 min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center px-4">
        <div className="max-w-sm sm:max-w-md mx-auto text-center p-6 sm:p-8 bg-white rounded-2xl shadow-2xl">
          <div className="mb-6">
            <Building2 className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-blue-600 mb-4" />
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900 mb-2">
              Admin Context Required
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mb-6">
              {error || "Please select your school and department to access project creation"}
            </p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={onSelectContext}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
              Select School & Department
            </button>
            
            <button
              onClick={() => navigate("/admin")}
              className="w-full bg-slate-500 hover:bg-slate-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all text-sm sm:text-base"
            >
              Back to Admin Dashboard
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContextSelection;
