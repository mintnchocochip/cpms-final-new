import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, X, Users, Mail, Phone, MapPin, Calendar, BookOpen, Eye, 
  Edit, Trash2, Plus, Download, Search, AlertTriangle, Check, Filter,
  Building2, GraduationCap, Database, FileSpreadsheet, CheckCircle,
  XCircle, RefreshCw, Settings, ChevronDown, ChevronRight, BarChart3,
  Grid3X3, Award
} from 'lucide-react';
import Navbar from "../Components/UniversalNavbar";
import { 
  getAllFaculty, 
  deleteFacultyByEmployeeId, 
  updateFaculty,
  getFacultyProjects 
} from '../api';

// Helper functions for specialization normalization
const normalizeSpecialization = (spec) => {
  if (!spec) return '';
  return spec
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9]/g, '');
};

const specializationMapping = {
  'aiml': 'AI/ML',
  'datascience': 'Data Science', 
  'cybersecurity': 'Cyber Security',
  'iot': 'IoT',
  'blockchain': 'Blockchain',
  'cloudcomputing': 'Cloud Computing',
  'vlsi': 'VLSI',
  'softwareengineering': 'Software Engineering',
  'general': 'General'
};

const reverseSpecializationMapping = Object.entries(specializationMapping)
  .reduce((acc, [key, value]) => {
    acc[normalizeSpecialization(value)] = value;
    return acc;
  }, {});

// Faculty Edit Modal Component
const FacultyEditModal = ({ faculty, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    emailId: '',
    phoneNumber:'',
    employeeId: '',
    role: 'faculty',
    school: [],
    department: [],
    specialization: [],
    imageUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const schoolOptions = ['SCOPE', 'SENSE', 'SELECT', 'SMEC', 'SCE'];
  const departmentOptions = ['BTech', 'MIS','MIA','MCA 1st Year','MCA 2nd Year','MCS','MCB','MAI'];
  const specializationOptions = [
    'AI/ML', 'Data Science', 'Cyber Security', 'IoT', 
    'Blockchain', 'Cloud Computing', 'VLSI', 'Software Engineering', 'General'
  ];

  useEffect(() => {
    if (faculty) {
      setFormData({
        name: faculty.name || '',
        emailId: faculty.emailId || '',
        phoneNumber: faculty.phoneNumber || '',
        employeeId: faculty.employeeId || '',
        role: faculty.role || 'faculty',
        school: Array.isArray(faculty.schools) 
          ? faculty.schools 
          : Array.isArray(faculty.school)
          ? faculty.school 
          : (faculty.school ? [faculty.school] : []),
        department: Array.isArray(faculty.departments) 
          ? faculty.departments 
          : Array.isArray(faculty.department) 
          ? faculty.department 
          : (faculty.department ? [faculty.department] : []),
        specialization: Array.isArray(faculty.specialization) 
          ? faculty.specialization.map(spec => {
              const normalized = normalizeSpecialization(spec);
              return reverseSpecializationMapping[normalized] || spec;
            })
          : (faculty.specialization ? [faculty.specialization] : []),
        imageUrl: faculty.imageUrl || ''
      });
      setError('');
    }
  }, [faculty]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMultiSelect = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value) 
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.name || !formData.emailId || !formData.employeeId) {
        throw new Error('Name, Email, and Employee ID are required');
      }

      if (!formData.emailId.endsWith('@vit.ac.in')) {
        throw new Error('Email must end with @vit.ac.in');
      }

      if(formData.phoneNumber.length === 0){
        throw new Error('Invalid Phone number, Length of Phone number should be 10');
      }

      if (formData.school.length === 0 || formData.department.length === 0 || formData.specialization.length === 0) {
        throw new Error('At least one school, department, and specialization must be selected');
      }

      const updatePayload = {
        ...formData,
        schools: formData.school,
        departments: formData.department,
      };

      await onSave(updatePayload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update faculty');
    } finally {
      setLoading(false);
    }
  };

  if (!faculty) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-4 sm:p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-lg sm:text-2xl font-bold">Edit Faculty Details</h2>
            <button onClick={onClose} className="text-white hover:text-gray-200 p-2 hover:bg-white/20 rounded-lg transition-all">
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 sm:p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2" />
                <span className="text-red-700 text-sm sm:text-base font-semibold">{error}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Basic Information */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-slate-800">Basic Information</h3>
              
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm sm:text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">
                  Employee ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm sm:text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="emailId"
                  value={formData.emailId}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm sm:text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm sm:text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm sm:text-base"
                >
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">
                  Image URL <span className="text-slate-400">(Optional)</span>
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm sm:text-base"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            {/* Academic Information */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-slate-800">Academic Information</h3>
              
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">
                  Schools <span className="text-red-500">*</span> (Select multiple)
                </label>
                <div className="border-2 border-slate-200 rounded-xl p-2 sm:p-3 max-h-28 sm:max-h-32 overflow-y-auto">
                  {schoolOptions.map(school => (
                    <label key={school} className="flex items-center space-x-2 mb-1 hover:bg-slate-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={formData.school.includes(school)}
                        onChange={() => handleMultiSelect('school', school)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs sm:text-sm">{school}</span>
                    </label>
                  ))}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Selected: {formData.school.join(', ') || 'None'}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">
                  Departments <span className="text-red-500">*</span> (Select multiple)
                </label>
                <div className="border-2 border-slate-200 rounded-xl p-2 sm:p-3 max-h-28 sm:max-h-32 overflow-y-auto">
                  {departmentOptions.map(dept => (
                    <label key={dept} className="flex items-center space-x-2 mb-1 hover:bg-slate-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={formData.department.includes(dept)}
                        onChange={() => handleMultiSelect('department', dept)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs sm:text-sm">{dept}</span>
                    </label>
                  ))}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Selected: {formData.department.join(', ') || 'None'}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">
                  Specializations <span className="text-red-500">*</span> (Select multiple)
                </label>
                <div className="border-2 border-slate-200 rounded-xl p-2 sm:p-3 max-h-28 sm:max-h-32 overflow-y-auto">
                  {specializationOptions.map(spec => (
                    <label key={spec} className="flex items-center space-x-2 mb-1 hover:bg-slate-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={formData.specialization.includes(spec)}
                        onChange={() => handleMultiSelect('specialization', spec)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs sm:text-sm">{spec}</span>
                    </label>
                  ))}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Selected: {formData.specialization.join(', ') || 'None'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 sm:px-6 py-2 sm:py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium text-sm sm:text-base shadow-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Update Faculty
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ✅ FIXED: Team Popup Component with venue display
const TeamPopup = ({ team, onClose }) => {
  if (!team) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-4 sm:p-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg sm:text-2xl font-bold mb-2">{team.title || team.name || 'Project Details'}</h2>
              <div className="flex flex-wrap gap-2">
                {team.specialization && team.specialization !== 'N/A' && (
                  <span className="bg-white/20 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                    {team.specialization}
                  </span>
                )}
                {/* ✅ Show venue if available */}
                {team.panel?.venue && (
                  <span className="bg-emerald-500/20 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {team.panel.venue}
                  </span>
                )}
              </div>
            </div>
            <button
              className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/20 rounded-lg"
              onClick={onClose}
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <h3 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3 text-slate-800 flex items-center gap-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              Team Members
            </h3>
            {team.students && team.students.length > 0 ? (
              <div className="grid gap-3">
                {team.students.map((student, idx) => (
                  <div key={student._id || idx} className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-slate-800 text-sm sm:text-base">{student.name || 'N/A'}</h4>
                        <p className="text-xs sm:text-sm text-slate-600">
                          Registration: <span className="font-mono">{student.regNo || 'N/A'}</span>
                        </p>
                        {student.emailId && (
                          <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-1 mt-1">
                            <Mail className="h-3 w-3" />
                            {student.emailId}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 text-slate-500 bg-slate-50 rounded-xl">
                <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 text-slate-300" />
                <p className="text-sm sm:text-base">No team members listed</p>
              </div>
            )}
          </div>

          {/* ✅ Project Information with venue display */}
          <div className="mb-4 sm:mb-6">
            <h3 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3 text-slate-800">Project Information</h3>
            <div className="bg-blue-50 p-3 sm:p-4 rounded-xl border border-blue-200 space-y-2">
              {team.school && (
                <p className="text-xs sm:text-sm">
                  <span className="font-medium">School:</span> {team.school}
                </p>
              )}
              {team.department && (
                <p className="text-xs sm:text-sm">
                  <span className="font-medium">Department:</span> {team.department}
                </p>
              )}
              {team.specialization && (
                <p className="text-xs sm:text-sm">
                  <span className="font-medium">Specialization:</span> {team.specialization}
                </p>
              )}
              {/* ✅ Display venue in project information */}
              {team.panel?.venue && (
                <p className="text-xs sm:text-sm">
                  <span className="font-medium">Venue:</span> {team.panel.venue}
                </p>
              )}
              {/* ✅ Display panel members */}
              {team.panel?.members && team.panel.members.length > 0 && (
                <p className="text-xs sm:text-sm">
                  <span className="font-medium">Panel Members:</span> {team.panel.members.map(member => member.name).join(', ')}
                </p>
              )}
            </div>
          </div>

          {/* Guide Faculty Information */}
          {team.guideFaculty && (
            <div className="mb-4 sm:mb-6">
              <h3 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3 text-slate-800">Guide Faculty</h3>
              <div className="bg-emerald-50 p-3 sm:p-4 rounded-xl border border-emerald-200">
                <p className="text-xs sm:text-sm">
                  <span className="font-medium">Name:</span> {team.guideFaculty.name}
                </p>
                <p className="text-xs sm:text-sm">
                  <span className="font-medium">Employee ID:</span> {team.guideFaculty.employeeId}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-50 p-3 sm:p-4 rounded-b-2xl">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-slate-600 hover:bg-slate-700 text-white px-4 sm:px-6 py-2 rounded-lg font-medium text-sm sm:text-base transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmationModal = ({ faculty, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  if (!faculty) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md">
        <div className="p-4 sm:p-6">
          <div className="flex items-center mb-3 sm:mb-4">
            <div className="bg-red-100 p-2 sm:p-3 rounded-full mr-3 sm:mr-4">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900">Delete Faculty</h3>
              <p className="text-xs sm:text-sm text-slate-600">This action cannot be undone</p>
            </div>
          </div>

          <div className="mb-4 sm:mb-6">
            <p className="text-sm sm:text-base text-slate-700">
              Are you sure you want to delete <strong>{faculty.name}</strong> ({faculty.employeeId})?
            </p>
            <div className="mt-2 sm:mt-3 p-3 sm:p-4 bg-red-50 rounded-xl border border-red-200">
              <p className="text-xs sm:text-sm text-red-700">
                ⚠️ This will permanently remove the faculty member and may affect associated projects.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 sm:gap-3">
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-slate-700 border-2 border-slate-300 rounded-lg hover:bg-slate-50 transition-all font-medium text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Faculty
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ NEW: Excel Export Function
const downloadExcel = (facultyList) => {
  console.log('📊 Starting Excel export for', facultyList.length, 'faculty members');
  
  // Prepare data in the same format as your template
  const excelData = facultyList.map(faculty => {
    // Handle array fields properly
    const schoolStr = Array.isArray(faculty.school) 
      ? faculty.school.join(',') 
      : (faculty.school || '');
    
    const departmentStr = Array.isArray(faculty.department) 
      ? faculty.department.join(',') 
      : (faculty.department || ''); // ✅ Can be empty as requested
    
    const specializationStr = Array.isArray(faculty.specialization) 
      ? faculty.specialization.join(',') 
      : (faculty.specialization || 'general');

    return {
      'name': faculty.name || '',
      'employeeId': faculty.employeeId || '',
      'emailId': faculty.emailId || '',
      'phoneNumber': faculty.phoneNumber || '',
      'password': '', // Empty for security - don't export passwords
      'role': faculty.role || 'faculty',
      'school': schoolStr,
      'department': departmentStr, // ✅ Can be empty
      'specializations': specializationStr,
      'imageUrl': faculty.imageUrl || ''
    };
  });

  console.log('📋 Excel data prepared:', excelData.slice(0, 2)); // Log first 2 records

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths for better readability
  const columnWidths = [
    { wch: 25 }, // name
    { wch: 15 }, // employeeId
    { wch: 30 }, // emailId
    { wch: 15 }, // phoneNumber
    { wch: 15 }, // password
    { wch: 10 }, // role
    { wch: 20 }, // school
    { wch: 25 }, // department
    { wch: 30 }, // specializations
    { wch: 40 }  // imageUrl
  ];
  worksheet['!cols'] = columnWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Faculty Template');

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
  
  // Download file
  const fileName = `faculty_export_${new Date().toISOString().split('T')[0]}.xlsx`;
  saveAs(data, fileName);
  
  console.log('✅ Excel file downloaded:', fileName);
};

// ✅ UPDATED: CSV Download Function (keep existing functionality)
const downloadCSV = (facultyList) => {
  const headers = [
    'Faculty Name', 'Employee ID', 'Email ID', 'Phone Number', 'Role', 'Schools', 'Departments', 'Specializations'
  ];
  const rows = facultyList.map(f => [
    f.name || 'N/A', 
    f.employeeId || 'N/A', 
    f.emailId || 'N/A',
    f.phoneNumber || 'N/A',
    f.role || 'faculty',
    Array.isArray(f.school) ? f.school.join('; ') : (f.school || 'N/A'),
    Array.isArray(f.department) ? f.department.join('; ') : (f.department || 'N/A'),
    Array.isArray(f.specialization) ? f.specialization.join('; ') : (f.specialization || 'N/A')
  ]);
  
  const csvContent = 'data:text/csv;charset=utf-8,' + 
    headers.join(',') + '\n' + 
    rows.map(e => e.map(field => `"${field}"`).join(',')).join('\n');
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `faculty_list_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};



// Main Component
const FacultyListView = () => {
  const [facultyList, setFacultyList] = useState([]);
  const [filteredFacultyList, setFilteredFacultyList] = useState([]);
  const [search, setSearch] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [facultyProjects, setFacultyProjects] = useState({});
  const [loadingProjects, setLoadingProjects] = useState({});
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [deletingFaculty, setDeletingFaculty] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Notification state
  const [notification, setNotification] = useState({
    isVisible: false,
    type: "",
    title: "",
    message: "",
  });

  // Show notification function
  const showNotification = useCallback((type, title, message, duration = 4000) => {
    setNotification({
      isVisible: true,
      type,
      title,
      message,
    });

    setTimeout(() => {
      setNotification(prev => ({ ...prev, isVisible: false }));
    }, duration);
  }, []);

  // Hide notification function
  const hideNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  }, []);

  // Filter states
  const [filters, setFilters] = useState({
    school: 'all',
    department: 'all',
    specialization: 'all'
  });

  const schoolOptions = ['SCOPE', 'SENSE', 'SELECT', 'SMEC', 'SCE'];
  const departmentOptions = ['BTech', 'MIS','MIA','MCA 1st Year','MCA 2nd Year','MCS','MCB','MAI'];
  const specializationOptions = [
    'AI/ML', 'Data Science', 'Cyber Security', 'IoT', 
    'Blockchain', 'Cloud Computing', 'VLSI', 'Software Engineering', 'General'
  ];

  // Auth check function
  const getCurrentUser = () => {
    const token = sessionStorage.getItem('token');
    if (!token) return null;
    
    try {
      const payload = token.split('.')[1];
      const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decodedPayload);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  };

  // ✅ FIXED: Fetch faculty projects with proper data handling
  const fetchFacultyProjects = async (employeeId) => {
    try {
      setLoadingProjects(prev => ({ ...prev, [employeeId]: true }));
      console.log(`🔍 Fetching projects for faculty: ${employeeId}`);
      
      const response = await getFacultyProjects(employeeId);
      console.log(`📊 API response for ${employeeId}:`, response);
      
      let projectData = { guide: [], panel: [], total: 0, lastUpdated: new Date().toISOString() };
      
      if (response.data?.success && response.data.data) {
        const { guideProjects = [], panelProjects = [] } = response.data.data;
        
        console.log(`📋 Guide projects for ${employeeId}:`, guideProjects.length);
        console.log(`📋 Panel projects for ${employeeId}:`, panelProjects.length);
        
        // ✅ Map guide projects with proper structure
        const mappedGuideProjects = guideProjects.map(project => ({
          ...project,
          title: project.name,
          students: project.students || [],
          // Include venue information if available
          venue: project.panel?.venue || null,
          panel: project.panel || null
        }));
        
        // ✅ Map panel projects with proper structure and venue information
        const mappedPanelProjects = panelProjects.map(project => ({
          ...project,
          title: project.name,
          students: project.students || [],
          // ✅ Include venue and panel member information
          venue: project.panel?.venue || null,
          panel: project.panel || null
        }));
        
        projectData = {
          guide: mappedGuideProjects,
          panel: mappedPanelProjects,
          total: mappedGuideProjects.length + mappedPanelProjects.length,
          lastUpdated: new Date().toISOString()
        };
        
        console.log(`✅ Processed project data for ${employeeId}:`, projectData);
      } else {
        console.log(`⚠️ No project data found for ${employeeId}`);
      }

      setFacultyProjects(prev => ({
        ...prev,
        [employeeId]: projectData
      }));

      return projectData;
    } catch (error) {
      console.error(`❌ Error fetching projects for ${employeeId}:`, error);
      const errorData = { 
        guide: [], 
        panel: [], 
        total: 0, 
        error: error.response?.data?.message || error.message,
        lastUpdated: new Date().toISOString()
      };
      
      setFacultyProjects(prev => ({
        ...prev,
        [employeeId]: errorData
      }));
      
      return errorData;
    } finally {
      setLoadingProjects(prev => ({ ...prev, [employeeId]: false }));
    }
  };

  // Fetch faculty list
  const fetchFacultyData = async (schoolFilter = null, departmentFilter = null, specializationFilter = null) => {
    try {
      setLoading(true);
      
      const currentUser = getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error('Admin access required. Please login as admin.');
      }
      
      console.log('Fetching faculty with filters:', { schoolFilter, departmentFilter, specializationFilter });
      
      const response = await getAllFaculty(
        schoolFilter === 'all' ? null : schoolFilter,
        departmentFilter === 'all' ? null : departmentFilter,
        specializationFilter === 'all' ? null : specializationFilter
      );
      
      console.log('Faculty API response:', response);
      
      let facultyData = [];
      if (response?.data?.success && response.data.data) {
        facultyData = response.data.data;
      } else if (response?.data && Array.isArray(response.data)) {
        facultyData = response.data;
      } else {
        console.warn('Unexpected response format:', response);
      }
      
      setFacultyList(facultyData);
      setFilteredFacultyList(facultyData);
      
      if (facultyData.length > 0) {
        showNotification("success", "Data Loaded", `Successfully loaded ${facultyData.length} faculty members`);
      }
    } catch (err) {
      console.error('Error fetching faculty list:', err);
      showNotification("error", "Fetch Failed", err.response?.data?.message || err.message || 'Failed to fetch faculty list');
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    
    fetchFacultyData(
      newFilters.school,
      newFilters.department,
      newFilters.specialization
    );
  };

  // Clear all filters
  const clearFilters = () => {
    const newFilters = { school: 'all', department: 'all', specialization: 'all' };
    setFilters(newFilters);
    fetchFacultyData();
  };

  // Apply search to filtered list
  const applySearch = () => {
    if (!search.trim()) {
      setFilteredFacultyList(facultyList);
      return;
    }

    const filtered = facultyList.filter(f => 
      f.name?.toLowerCase().includes(search.toLowerCase()) ||
      f.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
      f.emailId?.toLowerCase().includes(search.toLowerCase()) ||
      (Array.isArray(f.school) ? f.school.join(' ') : f.school || '').toLowerCase().includes(search.toLowerCase()) ||
      (Array.isArray(f.department) ? f.department.join(' ') : f.department || '').toLowerCase().includes(search.toLowerCase())
    );
    
    setFilteredFacultyList(filtered);
  };

  // Apply search when search term changes
  useEffect(() => {
    const debounceTimer = setTimeout(applySearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [search, facultyList]);

  // Handle faculty edit
  const handleEditFaculty = async (updatedData) => {
    try {
      const response = await updateFaculty(editingFaculty.employeeId, updatedData);
      
      if (response.data?.success) {
        showNotification("success", "Faculty Updated", 'Faculty updated successfully!');
        await fetchFacultyData(filters.school, filters.department, filters.specialization);
      } else {
        throw new Error(response.data?.message || 'Failed to update faculty');
      }
    } catch (error) {
      console.error('Error updating faculty:', error);
      throw error;
    }
  };

  // Handle faculty delete
  const handleDeleteFaculty = async () => {
    try {
      const response = await deleteFacultyByEmployeeId(deletingFaculty.employeeId);
      
      if (response.data?.success) {
        setFacultyList(prev => 
          prev.filter(faculty => faculty.employeeId !== deletingFaculty.employeeId)
        );
        setFilteredFacultyList(prev => 
          prev.filter(faculty => faculty.employeeId !== deletingFaculty.employeeId)
        );
        
        if (expandedIndex !== null && filteredFacultyList[expandedIndex]?.employeeId === deletingFaculty.employeeId) {
          setExpandedIndex(null);
        }
        
        setFacultyProjects(prev => {
          const newProjects = { ...prev };
          delete newProjects[deletingFaculty.employeeId];
          return newProjects;
        });
        
        showNotification("success", "Faculty Deleted", 'Faculty deleted successfully!');
      } else {
        throw new Error(response.data?.message || 'Failed to delete faculty');
      }
    } catch (error) {
      console.error('Error deleting faculty:', error);
      showNotification("error", "Delete Failed", 'Error deleting faculty: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeletingFaculty(null);
    }
  };

  // Handle team click
  const handleTeamClick = (project) => {
    setSelectedTeam(project);
  };

  // Toggle details
  const toggleDetails = async (index) => {
    const faculty = filteredFacultyList[index];
    
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else {
      setExpandedIndex(index);
      
      if (!facultyProjects[faculty.employeeId]) {
        await fetchFacultyProjects(faculty.employeeId);
      }
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFacultyData(filters.school, filters.department, filters.specialization);
    setRefreshing(false);
  };

  // Load data on mount
  useEffect(() => {
    fetchFacultyData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="pt-16 sm:pt-20 pl-4 sm:pl-24 min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-12 max-w-sm sm:max-w-md mx-auto text-center">
            <div className="relative mb-6 sm:mb-8">
              <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-4 border-slate-200 border-t-blue-600 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 animate-pulse" />
              </div>
            </div>
            <h3 className="text-lg sm:text-2xl font-bold text-slate-800 mb-3">Loading Faculty Database</h3>
            <p className="text-sm sm:text-base text-slate-600">Retrieving faculty records and project assignments...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="pt-16 sm:pt-20 pl-4 sm:pl-24 min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
        
        {/* Page Header */}
        <div className="mb-6 sm:mb-8 mx-4 sm:mx-8 bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-4 sm:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="bg-white/20 p-2 sm:p-3 rounded-xl">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold text-white">Faculty Management</h1>
                  <p className="text-indigo-100 mt-1 text-sm sm:text-base">Manage faculty members and their project assignments</p>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
                <div className="text-center">
                  <div className="text-white/90 text-xs sm:text-sm">Total Faculty</div>
                  <div className="text-white font-semibold text-lg sm:text-xl">{facultyList.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="mx-4 sm:mx-8 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs sm:text-sm font-medium">Total Faculty</p>
                  <p className="text-xl sm:text-3xl font-bold mt-1">{facultyList.length}</p>
                </div>
                <div className="bg-white/20 p-2 sm:p-3 rounded-xl">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-xs sm:text-sm font-medium">Faculty Members</p>
                  <p className="text-xl sm:text-3xl font-bold mt-1">{facultyList.filter(f => f.role !== 'admin').length}</p>
                </div>
                <div className="bg-white/20 p-2 sm:p-3 rounded-xl">
                  <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-xs sm:text-sm font-medium">Administrators</p>
                  <p className="text-xl sm:text-3xl font-bold mt-1">{facultyList.filter(f => f.role === 'admin').length}</p>
                </div>
                <div className="bg-white/20 p-2 sm:p-3 rounded-xl">
                  <Settings className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-xs sm:text-sm font-medium">Filtered Results</p>
                  <p className="text-xl sm:text-3xl font-bold mt-1">{filteredFacultyList.length}</p>
                </div>
                <div className="bg-white/20 p-2 sm:p-3 rounded-xl">
                  <Filter className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters Panel */}
       {/* ✅ UPDATED: Enhanced Search and Control Panel */}
<div className="mx-4 sm:mx-8 mb-6 sm:mb-8">
  <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-8 mb-6">
      {/* Search Section */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, or email..."
            className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm sm:text-base"
          />
        </div>
      </div>

      {/* Filter Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center space-x-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all duration-300 font-medium text-sm"
      >
        <Filter className="h-4 w-4" />
        <span>Filters</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
      </button>

      {/* ✅ NEW: Export Options */}
      <div className="flex gap-2">
        <button
          onClick={() => downloadExcel(filteredFacultyList)}
          disabled={filteredFacultyList.length === 0}
          className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg text-sm"
          title={`Export ${filteredFacultyList.length} faculty records to Excel (Template Format)`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span className="hidden sm:inline">Excel ({filteredFacultyList.length})</span>
          <span className="sm:hidden">XLS</span>
        </button>
        
        <button
          onClick={() => downloadCSV(filteredFacultyList)}
          disabled={filteredFacultyList.length === 0}
          className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg text-sm"
          title={`Export ${filteredFacultyList.length} faculty records to CSV`}
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">CSV ({filteredFacultyList.length})</span>
          <span className="sm:hidden">CSV</span>
        </button>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold disabled:opacity-50 transition-all duration-300 transform hover:scale-105 shadow-lg text-sm"
          title="Refresh faculty data"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          <span className="sm:hidden">↻</span>
        </button>
      </div>
    </div>

    {/* ✅ UPDATED: Filter Panel */}
    <AnimatePresence>
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-4 border-t border-slate-200">
            {/* School Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">School</label>
              <select
                value={filters.school}
                onChange={(e) => handleFilterChange('school', e.target.value)}
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Schools</option>
                {schoolOptions.map(school => (
                  <option key={school} value={school}>{school}</option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Department</label>
              <select
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Departments</option>
                {departmentOptions.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Specialization Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Specialization</label>
              <select
                value={filters.specialization}
                onChange={(e) => handleFilterChange('specialization', e.target.value)}
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Specializations</option>
                {specializationOptions.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-all duration-200 text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
</div>


        {/* Faculty Data Display */}
        <div className="mx-4 sm:mx-8 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl shadow-lg">
            {filteredFacultyList.length === 0 ? (
              <div className="text-center py-12 sm:py-20">
                <div className="mx-auto w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-6 sm:mb-8">
                  <Users className="h-12 w-12 sm:h-16 sm:w-16 text-slate-400" />
                </div>
                <h3 className="text-lg sm:text-2xl font-bold text-slate-600 mb-3">No Faculty Found</h3>
                <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto">
                  No faculty members match your current search and filter criteria. Try adjusting your filters to find the records you're looking for.
                </p>
              </div>
            ) : (
              <div className="p-4 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-8 gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
                      <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <h2 className="text-lg sm:text-2xl font-bold text-slate-800">
                      Faculty Records ({filteredFacultyList.length.toLocaleString()})
                    </h2>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {filteredFacultyList.map((faculty, index) => {
                    const isExpanded = expandedIndex === index;
                    
                    return (
                      <div
                        key={faculty._id || index}
                        className="border border-slate-200 rounded-xl bg-gradient-to-r from-white to-slate-50 hover:shadow-lg transition-all duration-300"
                      >
                        <div
                          className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={() => toggleDetails(index)}
                        >
                          <div className="flex items-center space-x-3 sm:space-x-4 w-full">
                            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl">
                              {isExpanded ? (
                                <ChevronDown className="text-blue-600 h-5 w-5 sm:h-6 sm:w-6" />
                              ) : (
                                <ChevronRight className="text-blue-600 h-5 w-5 sm:h-6 sm:w-6" />
                              )}
                            </div>
                            {faculty.imageUrl && (
                              <img 
                                src={faculty.imageUrl} 
                                alt={faculty.name}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-slate-200"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="font-bold text-base sm:text-xl text-slate-800 mb-1 sm:mb-2">
                                {faculty.name}
                              </h4>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 sm:space-x-6 text-xs sm:text-sm text-slate-600">
                                <span className="flex items-center space-x-1 mb-1 sm:mb-0">
                                  <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span>{faculty.employeeId}</span>
                                </span>
                                <span className="mb-1 sm:mb-0">{faculty.emailId}</span>
                                {Array.isArray(faculty.school) ? (
                                  <span>{faculty.school.join(', ')}</span>
                                ) : (
                                  <span>{faculty.school}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 sm:space-x-3 mt-2 sm:mt-0">
                            {faculty.role === 'admin' && (
                              <span className="bg-purple-100 text-purple-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold flex items-center space-x-1">
                                <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>Admin</span>
                              </span>
                            )}
                            {Array.isArray(faculty.specialization) && faculty.specialization.length > 0 && (
                              <span className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                                {faculty.specialization.length} specializations
                              </span>
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-slate-200 p-4 sm:p-6 bg-slate-50">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                              {/* Faculty Details */}
                              <div className="space-y-3 sm:space-y-4">
                                <h4 className="font-bold text-base sm:text-xl mb-4 sm:mb-6 text-slate-800 flex items-center space-x-2">
                                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                                  <span>Faculty Information</span>
                                </h4>
                                
                                <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-3 sm:space-y-4">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                      <label className="text-xs sm:text-sm font-semibold text-slate-600">Full Name:</label>
                                      <p className="text-sm sm:text-base text-slate-900 font-medium">{faculty.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <label className="text-xs sm:text-sm font-semibold text-slate-600">Employee ID:</label>
                                      <p className="text-sm sm:text-base text-slate-900 font-mono">{faculty.employeeId || 'N/A'}</p>
                                    </div>
                                    <div className="sm:col-span-2">
                                      <label className="text-xs sm:text-sm font-semibold text-slate-600">Email Address:</label>
                                      <a 
                                        href={`mailto:${faculty.emailId}`} 
                                        className="text-blue-600 hover:underline block text-sm sm:text-base"
                                      >
                                        {faculty.emailId || 'N/A'}
                                      </a>
                                    </div>
                                    <div className="sm:col-span-2">
                                      <label className="text-xs sm:text-sm font-semibold text-slate-600">Phone Number:</label>
                                      <a 
                                        href={`tel:${faculty.phoneNumber}`} 
                                        className="text-blue-600 hover:underline block text-sm sm:text-base"
                                      >
                                        {faculty.phoneNumber || 'N/A'}
                                      </a>
                                    </div>
                                  </div>

                                  {/* Academic Information */}
                                  <div className="border-t pt-3 sm:pt-4">
                                    <h5 className="font-medium text-sm sm:text-base text-slate-800 mb-2 sm:mb-3">Academic Associations</h5>
                                    <div className="space-y-2 sm:space-y-3">
                                      <div>
                                        <label className="text-xs sm:text-sm font-semibold text-slate-600">Schools:</label>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {Array.isArray(faculty.school) && faculty.school.length > 0 ? (
                                            faculty.school.map((school, idx) => (
                                              <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                                {school}
                                              </span>
                                            ))
                                          ) : (
                                            <span className="text-slate-500 text-xs sm:text-sm">{faculty.school || 'None'}</span>
                                          )}
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-xs sm:text-sm font-semibold text-slate-600">Departments:</label>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {Array.isArray(faculty.department) && faculty.department.length > 0 ? (
                                            faculty.department.map((dept, idx) => (
                                              <span key={idx} className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs">
                                                {dept}
                                              </span>
                                            ))
                                          ) : (
                                            <span className="text-slate-500 text-xs sm:text-sm">{faculty.department || 'None'}</span>
                                          )}
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-xs sm:text-sm font-semibold text-slate-600">Specializations:</label>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {Array.isArray(faculty.specialization) && faculty.specialization.length > 0 ? (
                                            faculty.specialization.map((spec, idx) => (
                                              <span key={idx} className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                                                {spec}
                                              </span>
                                            ))
                                          ) : (
                                            <span className="text-slate-500 text-xs sm:text-sm">{faculty.specialization || 'None'}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="border-t pt-3 sm:pt-4">
                                    <div className="flex space-x-2 sm:space-x-3">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingFaculty(faculty);
                                        }}
                                        className="flex items-center space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium transition-all"
                                      >
                                        <Edit className="h-4 w-4" />
                                        <span>Edit</span>
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeletingFaculty(faculty);
                                        }}
                                        className="flex items-center space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs sm:text-sm font-medium transition-all"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        <span>Delete</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Project Assignments */}
                              <div className="space-y-3 sm:space-y-4">
                                <h4 className="font-bold text-base sm:text-xl mb-4 sm:mb-6 text-slate-800 flex items-center space-x-2">
                                  <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                                  <span>Project Assignments</span>
                                </h4>
                                
                                {loadingProjects[faculty.employeeId] ? (
                                  <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                                    <div className="relative mb-3 sm:mb-4">
                                      <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-slate-200 border-t-blue-600"></div>
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 animate-pulse" />
                                      </div>
                                    </div>
                                    <span className="text-sm sm:text-base text-slate-600">Loading project details...</span>
                                  </div>
                                ) : facultyProjects[faculty.employeeId] ? (
                                  <div className="space-y-3 sm:space-y-4">
                                    {facultyProjects[faculty.employeeId].error ? (
                                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6">
                                        <div className="flex items-center space-x-3 text-red-800">
                                          <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
                                          <div>
                                            <span className="font-bold block text-sm sm:text-base">Error Loading Projects</span>
                                            <span className="text-xs sm:text-sm text-red-700">{facultyProjects[faculty.employeeId].error}</span>
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        {/* Project Summary */}
                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
                                          <div className="flex items-center justify-between mb-3 sm:mb-4">
                                            <span className="font-semibold text-blue-800 text-sm sm:text-base">Total Projects:</span>
                                            <span className="bg-blue-600 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold">
                                              {facultyProjects[faculty.employeeId].total}
                                            </span>
                                          </div>
                                          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                                            <div className="text-center">
                                              <div className="text-lg sm:text-lg font-semibold text-emerald-700">
                                                {facultyProjects[faculty.employeeId].guide.length}
                                              </div>
                                              <div className="text-emerald-600">Guide Projects</div>
                                            </div>
                                            <div className="text-center">
                                              <div className="text-lg sm:text-lg font-semibold text-orange-700">
                                                {facultyProjects[faculty.employeeId].panel.length}
                                              </div>
                                              <div className="text-orange-600">Panel Projects</div>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {/* Guide Projects */}
                                        {facultyProjects[faculty.employeeId].guide.length > 0 && (
                                          <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 shadow-sm">
                                            <h5 className="font-medium text-sm sm:text-base text-slate-800 mb-3 sm:mb-4 flex items-center">
                                              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-500 rounded-full mr-2"></div>
                                              Guide Projects ({facultyProjects[faculty.employeeId].guide.length})
                                            </h5>
                                            <div className="space-y-2 sm:space-y-3">
                                              {facultyProjects[faculty.employeeId].guide.map((project, j) => (
                                                <div key={project._id || j} className="bg-emerald-50 p-3 sm:p-4 rounded-lg border border-emerald-200">
                                                  <div className="flex items-center justify-between">
                                                    <div>
                                                      <span className="font-medium text-emerald-800 text-sm sm:text-base">
                                                        {project.title || project.name || `Project ${j + 1}`}
                                                      </span>
                                                      {project.students && project.students.length > 0 && (
                                                        <span className="text-emerald-600 text-xs sm:text-sm ml-2">
                                                          ({project.students.length} students)
                                                        </span>
                                                      )}
                                                      {project.specialization && (
                                                        <div className="text-xs text-emerald-600 mt-1">
                                                          {project.specialization}
                                                        </div>
                                                      )}
                                                      {/* ✅ Show venue for guide projects if available */}
                                                      {project.venue && (
                                                        <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                                                          <MapPin className="w-3 h-3" />
                                                          Venue: {project.venue}
                                                        </div>
                                                      )}
                                                    </div>
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleTeamClick(project);
                                                      }}
                                                      className="text-emerald-700 hover:text-emerald-900 transition-colors p-2 hover:bg-emerald-100 rounded"
                                                      title="View project details"
                                                    >
                                                      <Eye className="h-4 w-4" />
                                                    </button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Panel Projects */}
                                        {facultyProjects[faculty.employeeId].panel.length > 0 && (
                                          <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 shadow-sm">
                                            <h5 className="font-medium text-sm sm:text-base text-slate-800 mb-3 sm:mb-4 flex items-center">
                                              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-orange-500 rounded-full mr-2"></div>
                                              Panel Projects ({facultyProjects[faculty.employeeId].panel.length})
                                            </h5>
                                            <div className="space-y-2 sm:space-y-3">
                                              {facultyProjects[faculty.employeeId].panel.map((project, j) => (
                                                <div key={project._id || j} className="bg-orange-50 p-3 sm:p-4 rounded-lg border border-orange-200">
                                                  <div className="flex items-center justify-between">
                                                    <div>
                                                      <span className="font-medium text-orange-800 text-sm sm:text-base">
                                                        {project.title || project.name || `Project ${j + 1}`}
                                                      </span>
                                                      {project.students && project.students.length > 0 && (
                                                        <span className="text-orange-600 text-xs sm:text-sm ml-2">
                                                          ({project.students.length} students)
                                                        </span>
                                                      )}
                                                      {project.specialization && (
                                                        <div className="text-xs text-orange-600 mt-1">
                                                          {project.specialization}
                                                        </div>
                                                      )}
                                                      {/* ✅ Show venue for panel projects */}
                                                      {project.venue && (
                                                        <div className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                                                          <MapPin className="w-3 h-3" />
                                                          Venue: {project.venue}
                                                        </div>
                                                      )}
                                                    </div>
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleTeamClick(project);
                                                      }}
                                                      className="text-orange-700 hover:text-orange-900 transition-colors p-2 hover:bg-orange-100 rounded"
                                                      title="View project details"
                                                    >
                                                      <Eye className="h-4 w-4" />
                                                    </button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* No Projects */}
                                        {facultyProjects[faculty.employeeId].total === 0 && (
                                          <div className="text-center py-8 sm:py-12 text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                                            <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-slate-300" />
                                            <p className="font-medium text-sm sm:text-base">No Project Assignments</p>
                                            <p className="text-xs sm:text-sm">This faculty member has no current project assignments</p>
                                          </div>
                                        )}

                                        {/* Last Updated */}
                                        {facultyProjects[faculty.employeeId].lastUpdated && (
                                          <div className="text-xs text-slate-400 text-center pt-3 border-t">
                                            Last updated: {new Date(facultyProjects[faculty.employeeId].lastUpdated).toLocaleString()}
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-center py-8 sm:py-12 text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                                    <Eye className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-slate-300" />
                                    <p className="font-medium text-sm sm:text-base">Click to Load Project Information</p>
                                    <p className="text-xs sm:text-sm">Project assignments will be displayed here</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Notification */}
        {notification.isVisible && (
          <div className="fixed top-20 sm:top-24 right-4 sm:right-8 z-50 max-w-xs sm:max-w-md w-full">
            <div className={`transform transition-all duration-500 ease-out ${
              notification.isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
            }`}>
              <div className={`rounded-xl shadow-2xl border-l-4 p-4 sm:p-6 ${
                notification.type === "success" 
                  ? "bg-emerald-50 border-emerald-400" 
                  : "bg-red-50 border-red-400"
              }`}>
                <div className="flex items-start">
                  <div className={`flex-shrink-0 ${
                    notification.type === "success" ? "text-emerald-500" : "text-red-500"
                  }`}>
                    {notification.type === "success" ? (
                      <div className="relative">
                        <div className="animate-ping absolute inline-flex h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-emerald-400 opacity-75"></div>
                        <CheckCircle className="relative inline-flex h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                    ) : (
                      <XCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                    )}
                  </div>
                  <div className="ml-3 sm:ml-4 flex-1">
                    <h3 className={`text-xs sm:text-sm font-bold ${
                      notification.type === "success" ? "text-emerald-800" : "text-red-800"
                    }`}>
                      {notification.title}
                    </h3>
                    <p className={`mt-1 text-xs sm:text-sm ${
                      notification.type === "success" ? "text-emerald-700" : "text-red-700"
                    }`}>
                      {notification.message}
                    </p>
                  </div>
                  <button
                    onClick={hideNotification}
                    className={`flex-shrink-0 ml-3 ${
                      notification.type === "success" 
                        ? "text-emerald-400 hover:text-emerald-600" 
                        : "text-red-400 hover:text-red-600"
                    } transition-colors`}
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Modals */}
        <FacultyEditModal 
          faculty={editingFaculty} 
          onClose={() => setEditingFaculty(null)} 
          onSave={handleEditFaculty}
        />
        
        <DeleteConfirmationModal
          faculty={deletingFaculty}
          onClose={() => setDeletingFaculty(null)}
          onConfirm={handleDeleteFaculty}
        />
        
        <TeamPopup 
          team={selectedTeam} 
          onClose={() => setSelectedTeam(null)} 
        />
      </div>
    </>
  );
};

export default FacultyListView;
