import React from 'react';
import { Plus, AlertCircle } from 'lucide-react';

const StudentSection = ({ 
  students, 
  fieldErrors, 
  onStudentChange, 
  onAddStudent, 
  onRemoveStudent 
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <label className="block text-xs sm:text-sm font-semibold text-slate-700">
          Team Members <span className="text-red-500">*</span>
          <span className="text-xs text-slate-500 ml-2">
            ({students.length}/3 students)
          </span>
        </label>
        <button
          type="button"
          onClick={onAddStudent}
          disabled={students.length >= 3}
          className={`flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-sm font-medium ${
            students.length >= 3
              ? "bg-slate-300 text-slate-500 cursor-not-allowed"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          }`}
        >
          <Plus size={16} className="mr-1" />
          Add Student
        </button>
      </div>

      <div className="space-y-4">
        {students.map((student, index) => (
          <div key={index} className="p-4 sm:p-6 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-base sm:text-lg text-slate-800">Student {index + 1}</h4>
              {students.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveStudent(index)}
                  className="text-red-600 hover:text-red-800 text-xs sm:text-sm font-medium transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Student Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={student.name || ""} // ✅ Controlled with fallback
                  onChange={(e) => onStudentChange(index, 'name', e.target.value)}
                  placeholder="John Doe"
                  className={`w-full p-2 sm:p-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all ${
                    fieldErrors[`student_${index}_name`] ? 'border-red-500 bg-red-50' : 'border-slate-200'
                  }`}
                />
                {fieldErrors[`student_${index}_name`] && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {fieldErrors[`student_${index}_name`]}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Registration No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={student.regNo || ""} // ✅ Controlled with fallback
                  onChange={(e) => onStudentChange(index, 'regNo', e.target.value)}
                  placeholder="21BCE1001"
                  className={`w-full p-2 sm:p-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all ${
                    fieldErrors[`student_${index}_regNo`] ? 'border-red-500 bg-red-50' : 'border-slate-200'
                  }`}
                />
                {fieldErrors[`student_${index}_regNo`] && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {fieldErrors[`student_${index}_regNo`]}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Email ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={student.emailId || ""} // ✅ Controlled with fallback
                  onChange={(e) => onStudentChange(index, 'emailId', e.target.value)}
                  placeholder="john.doe@vitstudent.ac.in"
                  className={`w-full p-2 sm:p-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all ${
                    fieldErrors[`student_${index}_emailId`] ? 'border-red-500 bg-red-50' : 'border-slate-200'
                  }`}
                />
                {fieldErrors[`student_${index}_emailId`] && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {fieldErrors[`student_${index}_emailId`]}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentSection;
