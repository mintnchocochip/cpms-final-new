import React from 'react';
import { Settings, Database } from 'lucide-react';
import Navbar from "../Components/UniversalNavbar";

const LoadingScreen = ({ type = 'default' }) => {
  return (
    <>
      <Navbar />
      <div className="pt-16 sm:pt-20 pl-4 sm:pl-24 min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-12 max-w-sm sm:max-w-md mx-auto text-center">
          <div className="relative mb-6 sm:mb-8">
            <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-4 border-slate-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              {type === 'context' ? 
                <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 animate-pulse" /> :
                <Database className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 animate-pulse" />
              }
            </div>
          </div>
          <h3 className="text-lg sm:text-2xl font-bold text-slate-800 mb-3">
            {type === 'context' ? 'Loading Admin Context' : 'Processing'}
          </h3>
          <p className="text-sm sm:text-base text-slate-600">
            {type === 'context' ? 'Loading admin context...' : 'Please wait...'}
          </p>
        </div>
      </div>
    </>
  );
};

export default LoadingScreen;
