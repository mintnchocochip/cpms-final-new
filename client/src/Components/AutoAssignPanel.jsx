import React, { useState, useEffect, useMemo } from 'react';
import { Zap, X } from 'lucide-react';

const AutoAssignPanel = ({
  isOpen,
  onClose,
  facultyList,
  panelsLength,
  onSuccess,
  onError,
  autoAssignPanelsToProjects,
  setIsAssigning
}) => {
  const [formData, setFormData] = useState({
    bufferPanels: '',
    department: '',
    error: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ bufferPanels: '', department: '', error: '' });
    }
  }, [isOpen]);

  // Get available departments
  const availableDepartments = useMemo(() => {
    const depts = new Set();
    facultyList.forEach(faculty => {
      if (Array.isArray(faculty.department)) {
        faculty.department.forEach(dept => depts.add(dept));
      } else if (faculty.department) {
        depts.add(faculty.department);
      }
    });
    return Array.from(depts);
  }, [facultyList]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value, error: '' }));
  };

  const handleConfirm = async () => {
    const bufferPanels = parseInt(formData.bufferPanels) || 0;
    const selectedDept = formData.department;

    // Validation
    if (bufferPanels < 0) {
      setFormData(prev => ({ ...prev, error: "Buffer panels cannot be negative" }));
      return;
    }

    if (bufferPanels >= panelsLength) {
      setFormData(prev => ({
        ...prev,
        error: `Buffer panels cannot be greater than or equal to total panels (${panelsLength})`
      }));
      return;
    }

    const requestPayload = {
      buffer: bufferPanels,
      ...(selectedDept && { department: selectedDept })
    };

    try {
      setIsLoading(true);
      setIsAssigning(true);
      await autoAssignPanelsToProjects(requestPayload);
      onSuccess(`Teams have been automatically assigned with ${bufferPanels} buffer panels`);
      onClose();
    } catch (error) {
      console.error("Auto assign error:", error);
      onError("Auto-assignment failed. Please try again.");
    } finally {
      setIsLoading(false);
      setIsAssigning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4 mb-4">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900">Auto Assign Teams</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Configure automatic team assignment</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              disabled={isLoading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="mb-4 sm:mb-6 space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                Buffer Panels (Optional)
              </label>
              <input
                type="number"
                min="0"
                value={formData.bufferPanels}
                onChange={(e) => handleInputChange('bufferPanels', e.target.value)}
                className="w-full p-2 sm:p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm sm:text-base"
                placeholder="Enter buffer panels (default: 0)"
                disabled={isLoading}
              />
              <p className="text-xs text-slate-500 mt-1">
                Number of panels to keep unassigned as buffer
              </p>
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                Department (Optional)
              </label>
              <select
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className="w-full p-2 sm:p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm sm:text-base"
                disabled={isLoading}
              >
                <option value="">All Departments</option>
                {availableDepartments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
            {formData.error && (
              <div className="mt-2 p-2 sm:p-3 bg-red-50 rounded-lg border-l-4 border-red-300">
                <p className="text-xs sm:text-sm text-red-800">{formData.error}</p>
              </div>
            )}
            
            <div className="mt-2 p-2 sm:p-3 bg-purple-50 rounded-lg border-l-4 border-purple-300">
              <p className="text-xs sm:text-sm text-purple-800">
                <strong>Note:</strong> Teams will be automatically assigned to panels while avoiding guide conflicts.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-all text-sm sm:text-base"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all text-sm sm:text-base disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                  Assigning...
                </>
              ) : (
                'Assign Teams'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoAssignPanel;
