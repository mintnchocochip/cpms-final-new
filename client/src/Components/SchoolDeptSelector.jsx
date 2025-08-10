import React, { useState, useEffect } from 'react';
import { Building2, BookOpen, ChevronDown } from 'lucide-react';

const SchoolDeptSelector = ({ isVisible, onSubmit, onRechoose }) => {
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);

  // School options
  const schools = [
    'School of Computing',
    'School of Electrical'
  ];

  // Department options based on selected school
  const departmentsBySchool = {
    'School of Computing': ['CSE'],
    'School of Electrical': ['EEE']
  };

  // Get filtered departments based on selected school
  const availableDepartments = selectedSchool ? departmentsBySchool[selectedSchool] || [] : [];

  // Reset department when school changes
  useEffect(() => {
    setSelectedDepartment('');
    setShowDepartmentDropdown(false);
  }, [selectedSchool]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setShowSchoolDropdown(false);
        setShowDepartmentDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSchoolSelect = (school) => {
    setSelectedSchool(school);
    setShowSchoolDropdown(false);
  };

  const handleDepartmentSelect = (department) => {
    setSelectedDepartment(department);
    setShowDepartmentDropdown(false);
  };

  const handleSubmit = () => {
    if (selectedSchool && selectedDepartment) {
      const selection = {
        school: selectedSchool,
        department: selectedDepartment
      };
      
      // Store in sessionStorage with key "adminContext"
      sessionStorage.setItem('adminContext', JSON.stringify(selection));
      
      onSubmit(selection);
    }
  };

  const handleRechoose = () => {
    setSelectedSchool('');
    setSelectedDepartment('');
    setShowSchoolDropdown(false);
    setShowDepartmentDropdown(false);
    
    // Clear from sessionStorage
    sessionStorage.removeItem('adminContext');
    
    onRechoose();
  };

  // Load from sessionStorage on component mount
  useEffect(() => {
    const savedContext = sessionStorage.getItem('adminContext');
    if (savedContext) {
      try {
        const parsed = JSON.parse(savedContext);
        setSelectedSchool(parsed.school || '');
        setSelectedDepartment(parsed.department || '');
      } catch (error) {
        console.error('Failed to parse adminContext from sessionStorage:', error);
      }
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className=" pt-10 fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className=" bg-[linear-gradient(130deg,_rgba(36,85,163,1)_23%,_rgba(52,151,219,1)_52%,_rgba(52,142,219,1)_58%,_rgba(52,131,219,1)_65%,_rgba(40,116,166,1)_74%)] p-6 text-white">
          <h2 className="text-2xl font-bold text-center">
            Select School & Department
          </h2>
          <p className="text-blue-100 text-center mt-2">
            Choose your administrative context
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* School Selection */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-lg font-semibold text-gray-800">
              <Building2 className="h-5 w-5 text-blue-600" />
              Select School
            </label>
            
            <div className="relative dropdown-container">
              <button
                onClick={() => setShowSchoolDropdown(!showSchoolDropdown)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-left flex items-center justify-between bg-white hover:bg-gray-50"
              >
                <span className={selectedSchool ? 'text-gray-700' : 'text-gray-400'}>
                  {selectedSchool || 'Choose a school...'}
                </span>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showSchoolDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showSchoolDropdown && (
                <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl">
                  {schools.map((school) => (
                    <button
                      key={school}
                      onClick={() => handleSchoolSelect(school)}
                      className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                        selectedSchool === school ? 'bg-blue-100 text-blue-800 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      {school}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Department Selection */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-lg font-semibold text-gray-800">
              <BookOpen className="h-5 w-5 text-purple-600" />
              Select Department
              {!selectedSchool && (
                <span className="text-sm font-normal text-gray-500">(Select school first)</span>
              )}
            </label>
            
            <div className="relative dropdown-container">
              <button
                onClick={() => selectedSchool && setShowDepartmentDropdown(!showDepartmentDropdown)}
                disabled={!selectedSchool}
                className={`w-full p-4 border-2 rounded-xl transition-all duration-200 text-left flex items-center justify-between ${
                  selectedSchool 
                    ? 'border-gray-200 focus:ring-4 focus:ring-purple-100 focus:border-purple-500 bg-white hover:bg-gray-50' 
                    : 'border-gray-200 bg-gray-100 cursor-not-allowed'
                }`}
              >
                <span className={selectedDepartment ? 'text-gray-700' : 'text-gray-400'}>
                  {selectedDepartment || (selectedSchool ? 'Choose a department...' : 'Select school first')}
                </span>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showDepartmentDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showDepartmentDropdown && selectedSchool && (
                <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl">
                  {availableDepartments.map((department) => (
                    <button
                      key={department}
                      onClick={() => handleDepartmentSelect(department)}
                      className={`w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                        selectedDepartment === department ? 'bg-purple-100 text-purple-800 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      {department}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Items Display */}
          {(selectedSchool || selectedDepartment) && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-800 mb-3">Current Selection:</h4>
              <div className="space-y-2">
                {selectedSchool && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <span className="text-gray-700">School: <strong>{selectedSchool}</strong></span>
                  </div>
                )}
                {selectedDepartment && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-purple-600" />
                    <span className="text-gray-700">Department: <strong>{selectedDepartment}</strong></span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleRechoose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-semibold transition-colors disabled:opacity-50"
              disabled={!selectedSchool && !selectedDepartment}
            >
              Rechoose
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedSchool || !selectedDepartment}
              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${
                selectedSchool && selectedDepartment
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolDeptSelector;
