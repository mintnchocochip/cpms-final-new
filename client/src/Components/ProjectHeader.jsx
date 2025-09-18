import React from 'react';
import { Database } from 'lucide-react';
import { displaySpecialization } from './utils/formatters';

const ProjectHeader = ({ 
  isAllMode, 
  schoolFromContext, 
  departmentFromContext, 
  specializationFromContext, 
  onSelectContext 
}) => {
  return (
    <div className="mb-6 sm:mb-8 mx-4 sm:mx-8 bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-4 sm:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="bg-white/20 p-2 sm:p-3 rounded-xl">
              <Database className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-white">Project Creation</h1>
              <p className="text-indigo-100 mt-1 text-sm sm:text-base">Create and manage student projects</p>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="text-left sm:text-right">
                <div className="text-white/90 text-xs sm:text-sm">Current Context</div>
                <div className="text-white font-semibold text-sm sm:text-base">
                  {isAllMode ? 'All Schools & Departments' : `${schoolFromContext} - ${departmentFromContext}`}
                  {!isAllMode && specializationFromContext && specializationFromContext.length > 0 && (
                    <div className="text-white/80 text-xs mt-1">
                      {specializationFromContext.map(spec => displaySpecialization(spec)).join(', ')}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={onSelectContext}
                className="bg-white/20 hover:bg-white/30 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base w-full sm:w-auto"
              >
                Change Context
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectHeader;
