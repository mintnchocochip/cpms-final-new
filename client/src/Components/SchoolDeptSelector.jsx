import React, { useState, useEffect } from "react";

// Simple departments that apply to all schools
const DEPARTMENTS = [
  "BTech",
  "MTech (Integrated)", 
  "MCA"
];

// Simple school list
const SCHOOLS = [
  "SCOPE",
  "SENSE", 
  "SELECT",
  "SMEC",
  "SCE"
];

const SchoolDeptSelector = ({ isVisible, onSubmit, onRechoose, onSkip }) => {
  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setSelectedDepartment(""); // Reset department when school changes
  }, [selectedSchool]);

  const handleSubmit = async () => {
    if (!selectedSchool || !selectedDepartment) {
      alert("Please select both school and department");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        school: selectedSchool,
        department: selectedDepartment,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      await onSkip();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 999999 }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg" style={{ zIndex: 1000000 }}>
        <div className="bg-blue-600 text-white p-6 rounded-t-xl">
          <h2 className="text-2xl font-bold text-center mb-2">Select School & Department</h2>
          <p className="text-blue-100 text-center">Choose your administrative context</p>
        </div>
        
        <div className="p-6">
          {/* Super Admin Mode */}
          <div className="mb-6">
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-orange-800 mb-1 flex items-center">
                    🚀 Super Admin Mode
                  </h3>
                  <p className="text-orange-700 text-sm">
                    Skip selection to manage all schools and departments at once
                  </p>
                </div>
                <button
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 whitespace-nowrap ml-4"
                >
                  {isSubmitting ? "Loading..." : "Manage All"}
                </button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-500 font-medium">OR SELECT SPECIFIC</span>
            </div>
          </div>

          {/* School Selection */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select School <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option value="">Choose a school...</option>
              {SCHOOLS.map((school) => (
                <option key={school} value={school}>
                  {school}
                </option>
              ))}
            </select>
          </div>

          {/* Department Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Department <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              disabled={!selectedSchool}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {selectedSchool ? "Select department..." : "Select school first"}
              </option>
              {selectedSchool && DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={onRechoose}
              disabled={isSubmitting}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50"
            >
              Rechoose
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedSchool || !selectedDepartment || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-2 rounded-lg font-semibold transition-all duration-200"
            >
              {isSubmitting ? "Submitting..." : "Submit Selection"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolDeptSelector;
