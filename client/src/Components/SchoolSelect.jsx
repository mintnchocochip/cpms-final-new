import React, { useState, useEffect } from 'react';
import { Search, GraduationCap, Building2, X, ChevronDown } from 'lucide-react';

const SchoolProgramSelector = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  allowClose = false, 
  title = "Select Your School & Program",
  subtitle = "Choose your school and program to continue"
}) => {
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [schoolSearch, setSchoolSearch] = useState('');
  const [programSearch, setProgramSearch] = useState('');
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);

  // School options
  const schools = 

  // Program options based on selected school
  const programsBySchool = {
    'SCOPE': [
      'B.Tech. Computer Science and Engineering',
      'B.Tech. Computer Science and Engineering (Artificial Intelligence and Machine Learning)',
      'B.Tech. Computer Science and Engineering (Cyber Physical Systems)',
      'B.Tech. Computer Science and Engineering (Artificial Intelligence and Robotics)',
      'B.Tech. Computer Science and Engineering (Data Science)',
      'B.Tech. Computer Science and Engineering (Cyber Security)',
      'B.Sc. Computer Science',
    //   'MTech IT'
    ],
    'SELECT': [
      'B.Tech. Electrical and Electronics Engineering',
      'B.Tech. Electrical and Computer Science Engineering',
    //   'BTech EEE with Smart Grid',
    //   'BTech ETE',
    //   'BTech Instrumentation',
    //   'MTech EEE',
    //   'MTech Control Systems'
    ],
    'SENSE': [
      'B. Tech in Electronics and Communication Engineering',
      'B. Tech in Electronics and Computer Engineering',
      'B. Tech in Electronics Engineering (VLSI Design and Technology)',
    //   'BTech ECE with Communication Systems',
    //   'BTech Biomedical Engineering',
    //   'MTech ECE',
    //   'MTech VLSI'
    ],
    'SSL': [
      'BBA',
      'MBA',
      'MBA with Business Analytics',
      'MBA with Digital Marketing',
      'BBA with Digital Marketing',
      'BBA with International Business'
    ],
    'SAS': [
      'BSc Mathematics',
      'BSc Physics',
      'BSc Chemistry',
      'BSc Statistics',
      'MSc Mathematics',
      'MSc Physics',
      'MSc Applied Mathematics'
    ],
    'SMEC': [
      'B.Tech. Mechanical Engineering',
      'B.Tech. Mechatronics and Automation',
      'B.Tech. Mechanical Engineering (Electric Vehicles)',
    //   'BTech Production Engineering',
    //   'MTech Mechanical Engineering',
    //   'MTech Thermal Engineering'
    ],
    'SCE': [
      'B.Tech Civil Engineering',
      'B.Tech Civil Engineering(In Collaboration with L & T)',
    //   'BTech Structural Engineering',
    //   'MTech Civil Engineering', 
    //   'MTech Environmental Engineering',
    //   'MTech Transportation Engineering'
    ]
  };

  // Filter schools based on search
  const filteredSchools = schools.filter(school =>
    school.toLowerCase().includes(schoolSearch.toLowerCase())
  );

  // Filter programs based on search
  const filteredPrograms = selectedSchool 
    ? (programsBySchool[selectedSchool] || []).filter(program =>
        program.toLowerCase().includes(programSearch.toLowerCase())
      )
    : [];

  // Reset program when school changes
  useEffect(() => {
    setSelectedProgram('');
    setProgramSearch('');
    setShowProgramDropdown(false);
  }, [selectedSchool]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setShowSchoolDropdown(false);
        setShowProgramDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSchoolSelect = (school) => {
    setSelectedSchool(school);
    setSchoolSearch(school);
    setShowSchoolDropdown(false);
  };

  const handleProgramSelect = (program) => {
    setSelectedProgram(program);
    setProgramSearch(program);
    setShowProgramDropdown(false);
  };

  const handleSubmit = () => {
    if (selectedSchool && selectedProgram) {
      onSubmit({ 
        school: selectedSchool, 
        program: selectedProgram,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleReset = () => {
    setSelectedSchool('');
    setSelectedProgram('');
    setSchoolSearch('');
    setProgramSearch('');
    setShowSchoolDropdown(false);
    setShowProgramDropdown(false);
  };

  const handleClose = () => {
    if (allowClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">{title}</h2>
                <p className="text-blue-100 mt-1">{subtitle}</p>
              </div>
            </div>
            {allowClose && (
              <button
                onClick={handleClose}
                className="text-white hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-white hover:bg-opacity-20"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="space-y-8">
            {/* School Selection */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                <Building2 className="h-5 w-5 text-blue-600" />
                Select School
              </label>
              <div className="relative dropdown-container">
                <div className="relative">
                  <input
                    type="text"
                    value={schoolSearch}
                    onChange={(e) => {
                      setSchoolSearch(e.target.value);
                      setShowSchoolDropdown(true);
                    }}
                    onFocus={() => setShowSchoolDropdown(true)}
                    placeholder="Search and select school..."
                    className="w-full p-4 pr-12 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-gray-700 placeholder-gray-400"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                    <Search className="h-5 w-5 text-gray-400" />
                    <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showSchoolDropdown ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                
                {showSchoolDropdown && (
                  <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    {filteredSchools.length > 0 ? (
                      filteredSchools.map((school) => (
                        <button
                          key={school}
                          onClick={() => handleSchoolSelect(school)}
                          className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                            selectedSchool === school ? 'bg-blue-100 text-blue-800 font-semibold' : 'text-gray-700'
                          }`}
                        >
                          {school}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-gray-500 text-center">
                        No schools found matching "{schoolSearch}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Program Selection */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                <GraduationCap className="h-5 w-5 text-purple-600" />
                Select Program
                {!selectedSchool && (
                  <span className="text-sm font-normal text-gray-500">(Select school first)</span>
                )}
              </label>
              <div className="relative dropdown-container">
                <div className="relative">
                  <input
                    type="text"
                    value={programSearch}
                    onChange={(e) => {
                      setProgramSearch(e.target.value);
                      if (selectedSchool) setShowProgramDropdown(true);
                    }}
                    onFocus={() => selectedSchool && setShowProgramDropdown(true)}
                    placeholder={selectedSchool ? "Search and select program..." : "Select school first..."}
                    disabled={!selectedSchool}
                    className={`w-full p-4 pr-12 border-2 rounded-xl transition-all duration-200 text-gray-700 placeholder-gray-400 ${
                      selectedSchool 
                        ? 'border-gray-200 focus:ring-4 focus:ring-purple-100 focus:border-purple-500' 
                        : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    }`}
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                    <Search className={`h-5 w-5 ${selectedSchool ? 'text-gray-400' : 'text-gray-300'}`} />
                    <ChevronDown className={`h-5 w-5 transition-transform ${
                      selectedSchool ? 'text-gray-400' : 'text-gray-300'
                    } ${showProgramDropdown ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                
                {showProgramDropdown && selectedSchool && (
                  <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    {filteredPrograms.length > 0 ? (
                      filteredPrograms.map((program) => (
                        <button
                          key={program}
                          onClick={() => handleProgramSelect(program)}
                          className={`w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                            selectedProgram === program ? 'bg-purple-100 text-purple-800 font-semibold' : 'text-gray-700'
                          }`}
                        >
                          {program}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-gray-500 text-center">
                        No programs found matching "{programSearch}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Selected Summary */}
          {(selectedSchool || selectedProgram) && (
            <div className="mt-8 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-2">Current Selection:</h3>
              <div className="space-y-1">
                {selectedSchool && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <span className="text-gray-700">School: <strong>{selectedSchool}</strong></span>
                  </div>
                )}
                {selectedProgram && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-purple-600" />
                    <span className="text-gray-700">Program: <strong>{selectedProgram}</strong></span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleReset}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-semibold transition-colors disabled:opacity-50"
              disabled={!selectedSchool && !selectedProgram}
            >
              Reset Selection
            </button>
            <div className="flex gap-4">
              {allowClose && (
                <button
                  onClick={handleClose}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all duration-200"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={!selectedSchool || !selectedProgram}
                className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  selectedSchool && selectedProgram
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolProgramSelector;