import React from 'react';
import { AlertCircle } from 'lucide-react';
import { 
  schoolOptions, 
  departmentOptions, 
  specializationOptionsDisplay, 
  typeOptionsDisplay 
} from './utils/constants';
import { displaySpecialization, displayType } from './utils/formatters';

const ProjectFormFields = ({ 
  project, 
  isAllMode, 
  fieldErrors, 
  specializationFromContext, 
  typeFromContext,
  onChange 
}) => {
  return (
    <>
      {/* Project Name */}
      <div>
        <label htmlFor="name" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
          Project Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="AI Chatbot System"
          className={`block w-full px-3 sm:px-4 py-2 sm:py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm sm:text-base placeholder-slate-400 ${
            fieldErrors.name ? 'border-red-500 bg-red-50' : 'border-slate-200'
          }`}
          value={project.name || ""} // ✅ Controlled with fallback
          onChange={onChange}
          required
        />
        {fieldErrors.name && (
          <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            {fieldErrors.name}
          </p>
        )}
      </div>

      {/* School Selection (Only in All Mode) */}
      {isAllMode && (
        <div>
          <label htmlFor="school" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
            School <span className="text-red-500">*</span>
          </label>
          <select
            id="school"
            name="school"
            value={project.school || ""} // ✅ Controlled with fallback
            onChange={onChange}
            className="block w-full px-3 sm:px-4 py-2 sm:py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm sm:text-base"
            required
          >
            <option value="">Select School</option>
            {schoolOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      )}

      {/* Department Selection (Only in All Mode) */}
      {isAllMode && (
        <div>
          <label htmlFor="department" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
            Department <span className="text-red-500">*</span>
          </label>
          <select
            id="department"
            name="department"
            value={project.department || ""} // ✅ Controlled with fallback
            onChange={onChange}
            className="block w-full px-3 sm:px-4 py-2 sm:py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm sm:text-base"
            required
          >
            <option value="">Select Department</option>
            {departmentOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      )}

      {/* Guide Faculty Employee ID */}
      <div>
        <label htmlFor="guideFacultyEmpId" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
          Guide Faculty Employee ID <span className="text-red-500">*</span>
        </label>
        <input
          id="guideFacultyEmpId"
          name="guideFacultyEmpId"
          type="text"
          placeholder="FAC101"
          className={`block w-full px-3 sm:px-4 py-2 sm:py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm sm:text-base placeholder-slate-400 ${
            fieldErrors.guideFacultyEmpId ? 'border-red-500 bg-red-50' : 'border-slate-200'
          }`}
          value={project.guideFacultyEmpId || ""} // ✅ Controlled with fallback
          onChange={onChange}
          required
        />
        {fieldErrors.guideFacultyEmpId && (
          <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            {fieldErrors.guideFacultyEmpId}
          </p>
        )}
      </div>

      {/* Specialization Selection */}
      <div>
        <label htmlFor="specialization" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
          Specialization <span className="text-red-500">*</span>
        </label>
        {!isAllMode && specializationFromContext && specializationFromContext.length > 0 ? (
          <div className="p-3 sm:p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
            <span className="text-blue-800 font-semibold text-sm sm:text-base">
              {specializationFromContext.map(spec => displaySpecialization(spec)).join(', ')}
            </span>
            <p className="text-xs text-blue-600 mt-1">From admin context</p>
          </div>
        ) : (
          <select
            id="specialization"
            name="specialization"
            value={project.specialization || ""} // ✅ Controlled with fallback
            onChange={onChange}
            className={`block w-full px-3 sm:px-4 py-2 sm:py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm sm:text-base ${
              fieldErrors.specialization ? 'border-red-500 bg-red-50' : 'border-slate-200'
            }`}
            required
          >
            <option value="">Select Specialization</option>
            {specializationOptionsDisplay.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )}
      </div>

      {/* Type Selection */}
      <div>
        <label htmlFor="type" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
          Type <span className="text-red-500">*</span>
        </label>
        {!isAllMode && typeFromContext && typeFromContext.length > 0 ? (
          <div className="p-3 sm:p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
            <span className="text-blue-800 font-semibold text-sm sm:text-base">
              {typeFromContext.map(typ => displayType(typ)).join(', ')}
            </span>
            <p className="text-xs text-blue-600 mt-1">From admin context</p>
          </div>
        ) : (
          <select
            id="type"
            name="type"
            value={project.type || ""} // ✅ Controlled with fallback
            onChange={onChange}
            className={`block w-full px-3 sm:px-4 py-2 sm:py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm sm:text-base ${
              fieldErrors.type ? 'border-red-500 bg-red-50' : 'border-slate-200'
            }`}
            required
          >
            <option value="">Select Type</option>
            {typeOptionsDisplay.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )}
      </div>
    </>
  );
};

export default ProjectFormFields;
