import React from 'react';
import { Settings, Plus, Upload } from 'lucide-react';

const ProjectTabs = ({ activeTab, onTabChange }) => {
  return (
    <div className="mx-4 sm:mx-8 mb-6 sm:mb-8">
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8">
        <div className="flex items-center space-x-3 mb-4 sm:mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
            <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <h2 className="text-lg sm:text-2xl font-bold text-slate-800">Project Creation Mode</h2>
        </div>
        
        <div className="inline-flex bg-slate-100 rounded-xl p-1.5 shadow-inner w-full sm:w-auto justify-center">
          <button
            onClick={() => onTabChange('single')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center space-x-2 ${
              activeTab === 'single'
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105"
                : "text-slate-600 hover:text-slate-800 hover:bg-slate-200"
            }`}
          >
            <Plus size={16} />
            <span>Single Project</span>
          </button>
          <button
            onClick={() => onTabChange('bulk')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center space-x-2 ${
              activeTab === 'bulk'
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105"
                : "text-slate-600 hover:text-slate-800 hover:bg-slate-200"
            }`}
          >
            <Upload size={16} />
            <span>Bulk Upload</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectTabs;
