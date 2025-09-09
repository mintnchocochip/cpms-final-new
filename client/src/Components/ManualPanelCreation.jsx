import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus } from 'lucide-react';

const ManualPanelCreation = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  facultyList, // ✅ This is now pre-filtered in parent to exclude assigned faculty
  loading, 
  adminContext,
  usedFacultyIds = [] // ✅ Now contains employee IDs instead of MongoDB _ids
}) => {
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSelectedMembers([]);
      setSelectedSchool('');
      setSelectedDepartment('');
    }
  }, [isOpen]);

  // ✅ UPDATED: Compare using employee IDs instead of MongoDB _ids
  const filteredFaculty = useMemo(() => {
    console.log('=== FILTERING FACULTY IN MANUAL CREATION ===');
    console.log('Original facultyList:', facultyList?.length || 0);
    console.log('Used faculty employee IDs:', usedFacultyIds);
    
    if (!facultyList || !Array.isArray(facultyList)) {
      console.log('No faculty list provided or invalid:', facultyList);
      return [];
    }

    let filtered = facultyList;

    // Apply admin context filtering if not skipped
    if (adminContext && !adminContext.skipped) {
      const { school, department } = adminContext;
      filtered = facultyList.filter(faculty => {
        const facultySchools = Array.isArray(faculty.school) ? faculty.school : [faculty.school];
        const facultyDepts = Array.isArray(faculty.department) ? faculty.department : [faculty.department];

        const schoolMatch = school ? facultySchools.includes(school) : true;
        const deptMatch = department ? facultyDepts.includes(department) : true;

        return schoolMatch && deptMatch;
      });
      console.log('After admin context filtering:', filtered.length);
    }

    // ✅ UPDATED: Exclude used faculty by employeeId instead of _id
    const beforeExclusion = filtered.length;
    filtered = filtered.filter(faculty => {
      if (!faculty.employeeId) {
        console.log(`Faculty without employeeId: ${faculty.name}`);
        return false;
      }
      
      const isUsed = usedFacultyIds.includes(faculty.employeeId.toString());
      if (isUsed) {
        console.log(`Excluding used faculty: ${faculty.name} (${faculty.employeeId})`);
      } else {
        console.log(`Including available faculty: ${faculty.name} (${faculty.employeeId})`);
      }
      return !isUsed;
    });
    
    console.log(`After excluding used faculty: ${filtered.length} (excluded ${beforeExclusion - filtered.length})`);
    console.log('Final filtered faculty:', filtered.map(f => `${f.name} (${f.employeeId})`));
    console.log('=== END FILTERING ===');

    return filtered;
  }, [facultyList, adminContext, usedFacultyIds]);

  // Get available schools from filtered faculty
  const availableSchools = useMemo(() => {
    const schools = new Set();
    filteredFaculty.forEach(faculty => {
      if (Array.isArray(faculty.school)) {
        faculty.school.forEach(school => schools.add(school));
      } else if (faculty.school) {
        schools.add(faculty.school);
      }
    });
    return Array.from(schools);
  }, [filteredFaculty]);

  // Get available departments from filtered faculty
  const availableDepartments = useMemo(() => {
    const departments = new Set();
    filteredFaculty.forEach(faculty => {
      if (Array.isArray(faculty.department)) {
        faculty.department.forEach(dept => departments.add(dept));
      } else if (faculty.department) {
        departments.add(faculty.department);
      }
    });
    return Array.from(departments);
  }, [filteredFaculty]);

  const toggleSelection = (employeeId) => {
    setSelectedMembers(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const selectAll = () => {
    const allEmployeeIds = filteredFaculty.map(f => f.employeeId);
    setSelectedMembers(allEmployeeIds);
  };

  const clearAll = () => setSelectedMembers([]);

  const handleSubmit = () => {
    if (selectedMembers.length < 2) {
      alert("Please select at least two distinct faculty members.");
      return;
    }
    
    const payload = {
      memberEmployeeIds: selectedMembers,
      ...(selectedSchool && { school: selectedSchool }),
      ...(selectedDepartment && { department: selectedDepartment })
    };
    
    onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                Create Panel Manually
              </h3>
              <p className="text-slate-600 mt-1">
                Select faculty members to create a new evaluation panel
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              disabled={loading}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* School and Department Selection - Only show if admin skipped context */}
          {adminContext?.skipped && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  School (Optional)
                </label>
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="w-full p-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="">Auto-detect from faculty</option>
                  {availableSchools.map(school => (
                    <option key={school} value={school}>{school}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Department (Optional)
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full p-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="">Auto-detect from faculty</option>
                  {availableDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ✅ UPDATED: Show current context info with employee ID exclusion info */}
          {!adminContext?.skipped && (
            <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
              <p className="text-sm text-green-800">
                <strong>Showing faculty for:</strong> {adminContext?.school} - {adminContext?.department}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {filteredFaculty.length} faculty members available (excluding {usedFacultyIds.length} already assigned by employee ID)
              </p>
            </div>
          )}

          {/* ✅ UPDATED: Faculty Selection with employee ID exclusion info */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-slate-800">
                Select Faculty Members ({selectedMembers.length} selected, minimum 2 required)
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  disabled={loading}
                >
                  Select All
                </button>
                <button
                  onClick={clearAll}
                  className="text-sm px-3 py-1 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                  disabled={loading}
                >
                  Clear All
                </button>
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto border-2 border-slate-200 rounded-xl p-4 bg-slate-50">
              {filteredFaculty.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  {usedFacultyIds.length > 0 
                    ? "No faculty members available (all are already assigned to panels by employee ID or filtered out)."
                    : "No faculty members available for the selected filters."
                  }
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredFaculty.map((faculty) => (
                    <label 
                      key={faculty.employeeId} 
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white transition-colors cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(faculty.employeeId)}
                        onChange={() => toggleSelection(faculty.employeeId)}
                        disabled={loading}
                        className="w-4 h-4 text-blue-600 border-2 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                          {faculty.name}
                        </div>
                        <div className="text-sm text-slate-500">
                          ID: {faculty.employeeId}
                        </div>
                        {Array.isArray(faculty.department) && faculty.department.length > 0 && (
                          <div className="text-xs text-slate-400">
                            {faculty.department.join(', ')}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-200">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || selectedMembers.length < 2}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              title={selectedMembers.length < 2 ? 'Select at least two faculty members' : ''}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                  Creating Panel...
                </>
              ) : (
                `Create Panel (${selectedMembers.length} members)`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualPanelCreation;
