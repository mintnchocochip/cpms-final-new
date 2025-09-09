import React, { useState, useEffect, useMemo } from 'react';
import { Bot, X } from 'lucide-react';

const AutoCreatePanel = ({
  isOpen,
  onClose,
  facultyList,
  adminContext,
  onSuccess,
  onError,
  autoCreatePanelManual,
  setIsCreating,
  usedFacultyIds = []
}) => {
  const [formData, setFormData] = useState({
    department: '',
    numPanels: '',
    panelSize: '',
    school: '',
    error: '',
    allDepartments: false
  });
  const [isLoading, setIsLoading] = useState(false);

  // ✅ FIXED: Ensure faculty list is valid before processing
  const validFacultyList = useMemo(() => {
    if (!Array.isArray(facultyList)) {
      console.warn('Faculty list is not an array:', facultyList);
      return [];
    }
    return facultyList.filter(f => f && f._id && f.employeeId && f.name);
  }, [facultyList]);

  // ✅ FIXED: Auto-fill and reset form when modal opens/closes
  useEffect(() => {
    console.log('useEffect triggered - isOpen:', isOpen, 'adminContext:', adminContext);
    console.log('Valid faculty list:', validFacultyList);
    
    if (!isOpen) {
      setFormData({ 
        department: '', 
        numPanels: '', 
        panelSize: '', 
        school: '',
        error: '', 
        allDepartments: false 
      });
    } else {
      // ✅ FIXED: Auto-fill school AND department from admin context
      if (adminContext && !adminContext.skipped) {
        const newFormData = {
          school: adminContext.school || 'SCOPE',
          department: adminContext.department || 'BTech', // ✅ Force set department
          numPanels: '',
          panelSize: '',
          error: '',
          allDepartments: false
        };
        
        console.log('Setting form data from admin context:', newFormData);
        setFormData(newFormData);
      } else if (adminContext && adminContext.skipped) {
        // For skipped mode, only reset fields
        setFormData(prev => ({ 
          ...prev, 
          school: '',
          department: '' 
        }));
      }
    }
  }, [isOpen, adminContext, validFacultyList]);

  // Filter faculty excluding those already in panels
  const availableFaculty = useMemo(() => {
    let filtered = validFacultyList || [];

    if (adminContext && !adminContext.skipped) {
      const { school, department } = adminContext;
      filtered = validFacultyList.filter(faculty => {
        const facultySchools = Array.isArray(faculty.school) ? faculty.school : [faculty.school];
        const facultyDepts = Array.isArray(faculty.department) ? faculty.department : [faculty.department];
        
        const schoolMatch = school ? facultySchools.includes(school) : true;
        const deptMatch = department ? facultyDepts.includes(department) : true;
        
        return schoolMatch && deptMatch;
      });
    }

    // ✅ FIXED: Filter out faculty already in panels
    const availableFiltered = filtered.filter(faculty => !usedFacultyIds.includes(faculty._id));
    console.log('Available faculty after filtering:', availableFiltered);
    return availableFiltered;
  }, [validFacultyList, adminContext, usedFacultyIds]);

  // Get available schools (only if admin skipped)
  const availableSchools = useMemo(() => {
    if (!adminContext?.skipped) return [];
    
    const schools = new Set();
    availableFaculty.forEach(faculty => {
      if (Array.isArray(faculty.school)) {
        faculty.school.forEach(school => schools.add(school));
      } else if (faculty.school) {
        schools.add(faculty.school);
      }
    });
    return Array.from(schools);
  }, [availableFaculty, adminContext]);

  // Get available departments
  const availableDepartments = useMemo(() => {
    const depts = new Set();
    availableFaculty.forEach(faculty => {
      if (Array.isArray(faculty.department)) {
        faculty.department.forEach(dept => depts.add(dept));
      } else if (faculty.department) {
        depts.add(faculty.department);
      }
    });
    const deptArray = Array.from(depts);
    
    console.log('Available departments:', deptArray);
    
    if (adminContext?.skipped && deptArray.length > 1) {
      return ['__ALL__', ...deptArray];
    }
    return deptArray;
  }, [availableFaculty, adminContext]);

  // Calculate faculty count for selected department
  const facultyCountForDept = useMemo(() => {
    if (!formData.department) return 0;
    
    if (formData.department === '__ALL__') {
      return availableFaculty.length;
    }
    
    const count = availableFaculty.filter((faculty) => {
      const deptField = Array.isArray(faculty.department) ? faculty.department : [faculty.department];
      return deptField.includes(formData.department);
    }).length;
    
    console.log(`Faculty count for ${formData.department}:`, count);
    return count;
  }, [formData.department, availableFaculty]);

  const handleInputChange = (field, value) => {
    console.log(`Changing ${field} to:`, value);
    setFormData(prev => ({ 
      ...prev, 
      [field]: value, 
      error: '',
      allDepartments: field === 'department' && value === '__ALL__'
    }));
  };

  const handleConfirm = async () => {
    const numPanels = parseInt(formData.numPanels);
    const panelSize = parseInt(formData.panelSize);
    const selectedDept = formData.department;
    const selectedSchool = formData.school;

    console.log('=== HANDLE CONFIRM START ===');
    console.log('Form data at handleConfirm:', formData);
    console.log('selectedDept:', selectedDept);
    console.log('selectedSchool:', selectedSchool);
    console.log('availableFaculty:', availableFaculty);
    console.log('numPanels:', numPanels);
    console.log('panelSize:', panelSize);

    // ✅ ENHANCED: Better validation with detailed logging
    if (!selectedSchool) {
      console.log('❌ Validation failed: No school selected');
      setFormData(prev => ({ ...prev, error: "Please select a school" }));
      return;
    }

    if (!selectedDept) {
      console.log('❌ Validation failed: No department selected');
      setFormData(prev => ({ ...prev, error: "Please select a department" }));
      return;
    }

    if (!panelSize || panelSize <= 0) {
      console.log('❌ Validation failed: Invalid panel size');
      setFormData(prev => ({ ...prev, error: "Please enter a valid panel size" }));
      return;
    }

    // For single department mode, validate numPanels
    if (selectedDept !== '__ALL__' && (!numPanels || numPanels <= 0)) {
      console.log('❌ Validation failed: Invalid number of panels');
      setFormData(prev => ({ ...prev, error: "Please enter a valid number of panels" }));
      return;
    }

    // ✅ FIXED: Better faculty availability check
    if (availableFaculty.length === 0) {
      console.log('❌ No available faculty found');
      setFormData(prev => ({ ...prev, error: "No faculty available for panel creation" }));
      return;
    }

    // Handle department processing
    let departmentsToProcess = [];
    
    if (selectedDept === '__ALL__') {
      const allDepts = new Set();
      availableFaculty.forEach(faculty => {
        if (Array.isArray(faculty.department)) {
          faculty.department.forEach(dept => allDepts.add(dept));
        } else if (faculty.department) {
          allDepts.add(faculty.department);
        }
      });
      departmentsToProcess = Array.from(allDepts);
    } else {
      departmentsToProcess = [selectedDept];
    }

    console.log('Departments to process:', departmentsToProcess);

    // ✅ ENHANCED: Better department processing with validation
    const departments = {};
    
    for (const dept of departmentsToProcess) {
      console.log(`Processing department: ${dept}`);
      
      const deptFaculty = availableFaculty.filter((faculty) => {
        const deptField = Array.isArray(faculty.department) ? faculty.department : [faculty.department];
        const matches = deptField.includes(dept);
        console.log(`Faculty ${faculty.name} (${faculty.employeeId}) matches ${dept}:`, matches, 'Departments:', deptField);
        return matches;
      });

      console.log(`Faculty for ${dept}:`, deptFaculty.map(f => `${f.name} (${f.employeeId})`));

      if (deptFaculty.length < panelSize) {
        console.log(`❌ Not enough faculty for ${dept}: ${deptFaculty.length} < ${panelSize}`);
        continue;
      }

      const maxPanelsForDept = Math.floor(deptFaculty.length / panelSize);
      const panelsForDept = selectedDept === '__ALL__' ? maxPanelsForDept : numPanels;
      
      console.log(`${dept}: ${deptFaculty.length} faculty, max panels: ${maxPanelsForDept}, requested: ${panelsForDept}`);
      
      if (panelsForDept > 0 && deptFaculty.length >= panelSize) {
        // ✅ FIXED: Ensure all faculty have valid employeeId
        const validFaculties = deptFaculty.filter(f => f.employeeId);
        if (validFaculties.length >= panelSize) {
          departments[dept] = {
            panelsNeeded: panelsForDept,
            panelSize: panelSize,
            faculties: validFaculties.map(f => f.employeeId)
          };
          console.log(`✅ Created department config for ${dept}:`, departments[dept]);
        } else {
          console.log(`❌ Not enough faculty with valid employeeId for ${dept}`);
        }
      }
    }

    console.log('Final departments object:', departments);
    console.log('Number of departments:', Object.keys(departments).length);

    // Validation for single department mode
    if (selectedDept !== '__ALL__') {
      const maxPanels = Math.floor(facultyCountForDept / panelSize);
      if (numPanels > maxPanels) {
        console.log(`❌ Too many panels requested: ${numPanels} > ${maxPanels}`);
        setFormData(prev => ({
          ...prev,
          error: `Cannot create ${numPanels} panels with panel size ${panelSize}. Only ${maxPanels} panels are possible with ${facultyCountForDept} available faculty for ${selectedDept}.`,
        }));
        return;
      }
    }

    // Check if any departments can be processed
    if (Object.keys(departments).length === 0) {
      console.log('❌ No departments created! This is why you get {force: true}');
      setFormData(prev => ({ ...prev, error: "No departments have enough available faculty to create panels" }));
      return;
    }

    // ✅ FINAL PAYLOAD CONSTRUCTION
    const requestPayload = {
      school: selectedSchool,
      departments: departments
    };

    console.log('=== FINAL PAYLOAD ===');
    console.log('requestPayload:', JSON.stringify(requestPayload, null, 2));
    console.log('=== END PAYLOAD ===');

    try {
      setIsLoading(true);
      setIsCreating(true);
      
      // ✅ FIXED: Ensure we're calling the right function
      console.log('Calling autoCreatePanelManual with payload:', requestPayload);
      const result = await autoCreatePanelManual(requestPayload);
      console.log('API response:', result);
      
      const successMessage = selectedDept === '__ALL__' 
        ? `Successfully created panels for ${Object.keys(departments).length} departments`
        : `Successfully created ${numPanels} panels for ${selectedDept} department`;
        
      onSuccess(successMessage);
      onClose();
    } catch (error) {
      console.error("Auto create panel error:", error);
      console.error("Error details:", error.response?.data);
      onError("Auto panel creation failed. Please try again.");
    } finally {
      setIsLoading(false);
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4 mb-4">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900">Auto Create Panels</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Configure panel creation parameters</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              disabled={isLoading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Admin context info */}
          {adminContext && (
            <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-600">
                <strong>Mode:</strong> {adminContext.skipped 
                  ? 'All Schools & Departments' 
                  : `${adminContext.school} - ${adminContext.department}`}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {availableFaculty.length} available faculty (excluding {usedFacultyIds.length} already in panels)
              </p>
              {/* ✅ DEBUG INFO */}
              <p className="text-xs text-slate-400 mt-1">
                Total faculty: {validFacultyList.length} | Available departments: {availableDepartments.length}
              </p>
            </div>
          )}
          
          <div className="mb-4 sm:mb-6 space-y-4">
            {/* School selection if admin skipped */}
            {adminContext?.skipped && (
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                  School *
                </label>
                <select
                  value={formData.school}
                  onChange={(e) => handleInputChange('school', e.target.value)}
                  className="w-full p-2 sm:p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                  disabled={isLoading}
                >
                  <option value="">Select School</option>
                  {availableSchools.map(school => (
                    <option key={school} value={school}>{school}</option>
                  ))}
                </select>
              </div>
            )}

            {/* ✅ FIXED: Department with auto-fill and disable logic */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                Department *
              </label>
              <select
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className={`w-full p-2 sm:p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base ${
                  adminContext && !adminContext.skipped ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                disabled={isLoading || (adminContext && !adminContext.skipped)}
              >
                <option value="">Select Department</option>
                {availableDepartments.map(dept => (
                  <option key={dept} value={dept}>
                    {dept === '__ALL__' ? 'All Departments' : dept}
                  </option>
                ))}
              </select>
              
              {/* Show context pre-selection message */}
              {adminContext && !adminContext.skipped && formData.department && (
                <p className="text-xs text-blue-600 mt-2 font-medium">
                  ✓ Department pre-selected from your context: {formData.department}
                </p>
              )}
              
              {formData.department && facultyCountForDept > 0 && (
                <p className="text-xs text-emerald-600 mt-2 font-medium">
                  ✓ {facultyCountForDept} faculty members available 
                  {formData.department === '__ALL__' ? ' across all departments' : ` in ${formData.department}`}
                </p>
              )}
              {formData.department && facultyCountForDept === 0 && (
                <p className="text-xs text-red-600 mt-2 font-medium">
                  ⚠️ No faculty members available
                </p>
              )}
            </div>
            
            {/* Only show panel count for single department */}
            {formData.department && formData.department !== '__ALL__' && (
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                  Number of Panels *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.numPanels}
                  onChange={(e) => handleInputChange('numPanels', e.target.value)}
                  className="w-full p-2 sm:p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                  placeholder="Enter number of panels"
                  disabled={isLoading}
                />
              </div>
            )}
            
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                Panel Size (Faculty per Panel) *
              </label>
              <input
                type="number"
                min="2"
                value={formData.panelSize}
                onChange={(e) => handleInputChange('panelSize', e.target.value)}
                className="w-full p-2 sm:p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                placeholder="Enter panel size (e.g., 2, 3)"
                disabled={isLoading}
              />
            </div>
            
            {formData.error && (
              <div className="mt-2 p-2 sm:p-3 bg-red-50 rounded-lg border-l-4 border-red-300">
                <p className="text-xs sm:text-sm text-red-800">{formData.error}</p>
              </div>
            )}
            
            <div className="mt-2 p-2 sm:p-3 bg-blue-50 rounded-lg border-l-4 border-blue-300">
              <p className="text-xs sm:text-sm text-blue-800">
                <strong>Note:</strong> {formData.department === '__ALL__' 
                  ? 'Maximum panels will be created for each department based on available faculty.'
                  : 'Faculty will be automatically selected from the chosen department based on experience (employee ID order).'}
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
              className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all text-sm sm:text-base disabled:opacity-50"
              disabled={isLoading || facultyCountForDept < 2}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create Panels'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoCreatePanel;
