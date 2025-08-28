import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, X, Users, Mail, Phone, MapPin, Calendar, BookOpen, Eye, 
  Edit, Trash2, Plus, Download, Search, AlertTriangle, Check, Filter 
} from 'lucide-react';
import Navbar from "../Components/UniversalNavbar";
import { 
  getAllFaculty, 
  deleteFacultyByEmployeeId, 
  updateFaculty,
  getFacultyProjects 
} from '../api';

// Faculty Edit Modal Component
// Faculty Edit Modal Component
const FacultyEditModal = ({ faculty, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    emailId: '',
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
  const departmentOptions = ['BTech', 'MTech (Integrated)', 'MCA'];
  const specializationOptions = [
    'AI/ML', 'Data Science', 'Cyber Security', 'IoT', 
    'Blockchain', 'Cloud Computing', 'VLSI', 'Software Engineering', 'General'
  ];

  // ✅ FIXED: Initialize form data when faculty prop changes
 // ✅ FIXED: Initialize form data when faculty prop changes with normalization
useEffect(() => {
  if (faculty) {
    setFormData({
      name: faculty.name || '',
      emailId: faculty.emailId || '',
      employeeId: faculty.employeeId || '',
      role: faculty.role || 'faculty',
      // ✅ Handle both array and string formats for school
      school: Array.isArray(faculty.schools) 
        ? faculty.schools 
        : Array.isArray(faculty.school)
        ? faculty.school 
        : (faculty.school ? [faculty.school] : []),
      // ✅ Handle both array and string formats for department  
      department: Array.isArray(faculty.departments) 
        ? faculty.departments 
        : Array.isArray(faculty.department) 
        ? faculty.department 
        : (faculty.department ? [faculty.department] : []),
      // ✅ FIXED: Normalize specializations for matching
      specialization: Array.isArray(faculty.specialization) 
        ? faculty.specialization.map(spec => {
            const normalized = normalizeSpecialization(spec);
            return reverseSpecializationMapping[normalized] || spec;
          })
        : (faculty.specialization ? [faculty.specialization] : []),
      imageUrl: faculty.imageUrl || ''
    });
    // Clear any previous errors
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

      if (formData.school.length === 0 || formData.department.length === 0 || formData.specialization.length === 0) {
        throw new Error('At least one school, department, and specialization must be selected');
      }

      // Rename fields to match backend expectation
      const updatePayload = {
        ...formData,
        schools: formData.school,
        departments: formData.department,
        // specialization stays the same
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Edit Faculty Details</h2>
            <button onClick={onClose} className="text-white hover:text-gray-200 p-2">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee ID *
                </label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="emailId"
                  value={formData.emailId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            {/* Academic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Academic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schools * (Select multiple)
                </label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-32 overflow-y-auto">
                  {schoolOptions.map(school => (
                    <label key={school} className="flex items-center space-x-2 mb-1">
                      <input
                        type="checkbox"
                        checked={formData.school.includes(school)}
                        onChange={() => handleMultiSelect('school', school)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{school}</span>
                    </label>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Selected: {formData.school.join(', ') || 'None'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departments * (Select multiple)
                </label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-32 overflow-y-auto">
                  {departmentOptions.map(dept => (
                    <label key={dept} className="flex items-center space-x-2 mb-1">
                      <input
                        type="checkbox"
                        checked={formData.department.includes(dept)}
                        onChange={() => handleMultiSelect('department', dept)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{dept}</span>
                    </label>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Selected: {formData.department.join(', ') || 'None'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specializations * (Select multiple)
                </label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-32 overflow-y-auto">
                  {specializationOptions.map(spec => (
                    <label key={spec} className="flex items-center space-x-2 mb-1">
                      <input
                        type="checkbox"
                        checked={formData.specialization.includes(spec)}
                        onChange={() => handleMultiSelect('specialization', spec)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{spec}</span>
                    </label>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Selected: {formData.specialization.join(', ') || 'None'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

// Add this helper function at the top of both files
const normalizeSpecialization = (spec) => {
  if (!spec) return '';
  return spec
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '')  // Remove all spaces
    .replace(/[^a-zA-Z0-9]/g, ''); // Remove special characters for comparison
};

// Create a mapping for display purposes
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

// Reverse mapping for finding matches
const reverseSpecializationMapping = Object.entries(specializationMapping)
  .reduce((acc, [key, value]) => {
    acc[normalizeSpecialization(value)] = value;
    return acc;
  }, {});

// Team Popup Component
const TeamPopup = ({ team, onClose }) => {
  if (!team) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">{team.title || team.name || 'Project Details'}</h2>
              {team.domain && team.domain !== 'N/A' && (
                <span className="bg-blue-400 text-blue-100 px-3 py-1 rounded-full text-sm font-medium">
                  {team.domain}
                </span>
              )}
            </div>
            <button
              className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white hover:bg-opacity-20 rounded-lg"
              onClick={onClose}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3 text-gray-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Team Members
            </h3>
            {team.students && team.students.length > 0 ? (
              <div className="grid gap-3">
                {team.students.map((student, idx) => (
                  <div key={student._id || idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-800">{student.name || 'N/A'}</h4>
                        <p className="text-sm text-gray-600">
                          Registration: <span className="font-mono">{student.regNo || 'N/A'}</span>
                        </p>
                        {student.emailId && (
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <Mail className="h-3 w-3" />
                            {student.emailId}
                          </p>
                        )}
                        {student.school && (
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {student.school} - {student.department}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {student.department && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {student.department}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No team members listed</p>
              </div>
            )}
          </div>

          {(team.school || team.department || team.specialization) && (
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3 text-gray-800">Project Information</h3>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-2">
                {team.school && (
                  <p className="text-sm">
                    <span className="font-medium">School:</span> {team.school}
                  </p>
                )}
                {team.department && (
                  <p className="text-sm">
                    <span className="font-medium">Department:</span> {team.department}
                  </p>
                )}
                {team.specialization && (
                  <p className="text-sm">
                    <span className="font-medium">Specialization:</span> {team.specialization}
                  </p>
                )}
              </div>
            </div>
          )}

          {team.faculty && (
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3 text-gray-800">Faculty Assignment</h3>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm">
                  <span className="font-medium">Employee ID:</span> {team.faculty.employeeId}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Role:</span> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    team.faculty.role === 'guide' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {team.faculty.role}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-4 rounded-b-xl">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="bg-red-100 p-3 rounded-full mr-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Faculty</h3>
              <p className="text-sm text-gray-600">This action cannot be undone</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-gray-700">
              Are you sure you want to delete <strong>{faculty.name}</strong> ({faculty.employeeId})?
            </p>
            <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-700">
                ⚠️ This will permanently remove the faculty member and may affect associated projects.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

// CSV Download Function
const downloadCSV = (facultyList) => {
  const headers = [
    'Faculty Name', 'Employee ID', 'Email ID', 'Role', 'Schools', 'Departments', 'Specializations'
  ];
  const rows = facultyList.map(f => [
    f.name || 'N/A', 
    f.employeeId || 'N/A', 
    f.emailId || 'N/A', 
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
  const [error, setError] = useState(null);
  const [facultyProjects, setFacultyProjects] = useState({});
  const [loadingProjects, setLoadingProjects] = useState({});
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [deletingFaculty, setDeletingFaculty] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    school: 'all',
    department: 'all',
    specialization: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);

  const schoolOptions = ['SCOPE', 'SENSE', 'SELECT', 'SMEC', 'SCE'];
  const departmentOptions = ['BTech', 'MTech (Integrated)', 'MCA'];
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

  // Fetch faculty projects
  const fetchFacultyProjects = async (employeeId) => {
    try {
      setLoadingProjects(prev => ({ ...prev, [employeeId]: true }));
      const response = await getFacultyProjects(employeeId);
      
      let projectData = { guide: [], panel: [], total: 0, lastUpdated: new Date().toISOString() };
      
      if (response.data?.success && response.data.data) {
        const guideProjects = response.data.data.guideProjects || [];
        const panelProjects = response.data.data.panelProjects || [];
        
        projectData = {
          guide: guideProjects.map(project => ({
            ...project,
            title: project.name,
            students: project.students || []
          })),
          panel: panelProjects.map(project => ({
            ...project,
            title: project.name,
            students: project.students || []
          })),
          total: guideProjects.length + panelProjects.length,
          lastUpdated: new Date().toISOString()
        };
      }

      setFacultyProjects(prev => ({
        ...prev,
        [employeeId]: projectData
      }));

      return projectData;
    } catch (error) {
      console.error(`Error fetching projects for ${employeeId}:`, error);
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

  // ✅ FIXED: Fetch faculty list with proper error handling
  const fetchFacultyData = async (schoolFilter = null, departmentFilter = null, specializationFilter = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentUser = getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error('Admin access required. Please login as admin.');
      }
      
      console.log('Fetching faculty with filters:', { schoolFilter, departmentFilter, specializationFilter });
      
      // ✅ FIXED: Use the corrected API call
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
    } catch (err) {
      console.error('Error fetching faculty list:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch faculty list');
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    
    // Fetch data with new filters
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
        alert('Faculty updated successfully!');
        
        // Refresh the list
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
        // Remove from local state
        setFacultyList(prev => 
          prev.filter(faculty => faculty.employeeId !== deletingFaculty.employeeId)
        );
        setFilteredFacultyList(prev => 
          prev.filter(faculty => faculty.employeeId !== deletingFaculty.employeeId)
        );
        
        // Clear expanded details if it was the deleted faculty
        if (expandedIndex !== null && filteredFacultyList[expandedIndex]?.employeeId === deletingFaculty.employeeId) {
          setExpandedIndex(null);
        }
        
        // Clear projects cache
        setFacultyProjects(prev => {
          const newProjects = { ...prev };
          delete newProjects[deletingFaculty.employeeId];
          return newProjects;
        });
        
        alert('Faculty deleted successfully!');
      } else {
        throw new Error(response.data?.message || 'Failed to delete faculty');
      }
    } catch (error) {
      console.error('Error deleting faculty:', error);
      alert('Error deleting faculty: ' + (error.response?.data?.message || error.message));
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
        <Navbar userType="admin" />
        <div className='min-h-screen bg-gray-50 overflow-x-hidden'>
          <div className="p-20 pl-28">
            <div className='shadow-md rounded-lg bg-white p-10'>
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <div className="text-xl text-gray-600">Loading faculty list...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar userType="admin" />
      <div className='min-h-screen bg-gray-50 overflow-x-hidden'>
        <div className="p-20 pl-28">
          <div className='shadow-md rounded-lg bg-white p-10'>
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-bold font-roboto text-4xl text-gray-800 mb-2">
                  Faculty Management
                </h3>
                <p className="text-gray-600">Manage faculty members and their assignments</p>
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, ID, email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border pl-10 pr-3 py-2 rounded-lg shadow w-80 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                    showFilters ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                >
                  {refreshing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
                <button
                  onClick={() => downloadCSV(filteredFacultyList)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
                  disabled={filteredFacultyList.length === 0}
                >
                  <Download className="h-4 w-4" />
                  Download CSV
                </button>
              </div>
            </div>

            {/* Filters Section */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-800">Filter Faculty</h4>
                    <button
                      onClick={clearFilters}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Clear All Filters
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        School
                      </label>
                      <select
                        value={filters.school}
                        onChange={(e) => handleFilterChange('school', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Schools</option>
                        {schoolOptions.map(school => (
                          <option key={school} value={school}>{school}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <select
                        value={filters.department}
                        onChange={(e) => handleFilterChange('department', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Departments</option>
                        {departmentOptions.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Specialization
                      </label>
                      <select
                        value={filters.specialization}
                        onChange={(e) => handleFilterChange('specialization', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Specializations</option>
                        {specializationOptions.map(spec => (
                          <option key={spec} value={spec}>{spec}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Active Filters Display */}
                  {(filters.school !== 'all' || filters.department !== 'all' || filters.specialization !== 'all') && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-2">Active filters:</p>
                      <div className="flex flex-wrap gap-2">
                        {filters.school !== 'all' && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                            School: {filters.school}
                            <button
                              onClick={() => handleFilterChange('school', 'all')}
                              className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        )}
                        {filters.department !== 'all' && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                            Department: {filters.department}
                            <button
                              onClick={() => handleFilterChange('department', 'all')}
                              className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        )}
                        {filters.specialization !== 'all' && (
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                            Specialization: {filters.specialization}
                            <button
                              onClick={() => handleFilterChange('specialization', 'all')}
                              className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error message */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  <strong>Error:</strong> {error}
                </div>
              </div>
            )}

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-100 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-800">{facultyList.length}</div>
                <div className="text-blue-600">Total Faculty</div>
              </div>
              <div className="bg-green-100 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-800">
                  {facultyList.filter(f => f.role !== 'admin').length}
                </div>
                <div className="text-green-600">Faculty Members</div>
              </div>
              <div className="bg-purple-100 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-800">
                  {facultyList.filter(f => f.role === 'admin').length}
                </div>
                <div className="text-purple-600">Administrators</div>
              </div>
              <div className="bg-orange-100 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-800">
                  {filteredFacultyList.length}
                </div>
                <div className="text-orange-600">
                  {search || filters.school !== 'all' || filters.department !== 'all' || filters.specialization !== 'all' 
                    ? 'Filtered Results' 
                    : 'Active Faculty'}
                </div>
              </div>
            </div>

            {/* Search/Filter results info */}
            {(search || filters.school !== 'all' || filters.department !== 'all' || filters.specialization !== 'all') && (
              <div className="mb-4 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center">
                  <Search className="inline h-4 w-4 mr-1" />
                  Showing {filteredFacultyList.length} of {facultyList.length} faculty members
                  {filteredFacultyList.length === 0 && (
                    <span className="text-orange-600 ml-2">- Try different search terms or filters</span>
                  )}
                </div>
              </div>
            )}

            {/* Faculty Table */}
            {filteredFacultyList.length === 0 && !search && filters.school === 'all' && filters.department === 'all' && filters.specialization === 'all' ? (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No faculty members found</p>
                <p className="text-sm">Faculty members will appear here once added</p>
              </div>
            ) : filteredFacultyList.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No matches found</p>
                <p className="text-sm">Try adjusting your search terms or filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border text-left">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-4 border font-semibold">Name</th>
                      <th className="p-4 border font-semibold">Employee ID</th>
                      <th className="p-4 border font-semibold">Email</th>
                      <th className="p-4 border font-semibold">Schools</th>
                      <th className="p-4 border font-semibold">Departments</th>
                      <th className="p-4 border font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFacultyList.map((f, i) => (
                      <React.Fragment key={f._id || i}>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 border">
                            <div className="flex items-center gap-3">
                              {f.imageUrl && (
                                <img 
                                  src={f.imageUrl} 
                                  alt={f.name}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              )}
                              <div>
                                <span className="font-medium text-gray-900">{f.name || 'N/A'}</span>
                                {f.specialization && Array.isArray(f.specialization) && f.specialization.length > 0 && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {f.specialization.slice(0, 2).join(', ')}
                                    {f.specialization.length > 2 && '...'}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 border">
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                              {f.employeeId || 'N/A'}
                            </span>
                          </td>
                          <td className="p-4 border">
                            <a 
                              href={`mailto:${f.emailId}`} 
                              className="text-blue-600 hover:underline text-sm"
                            >
                              {f.emailId || 'N/A'}
                            </a>
                          </td>
                          <td className="p-4 border">
                            <div className="text-sm">
                              {Array.isArray(f.school) ? (
                                f.school.length > 2 ? (
                                  <div>
                                    <div>{f.school.slice(0, 2).join(', ')}</div>
                                    <div className="text-xs text-gray-500">+{f.school.length - 2} more</div>
                                  </div>
                                ) : (
                                  f.school.join(', ')
                                )
                              ) : (f.school || 'N/A')}
                            </div>
                          </td>
                          <td className="p-4 border">
                            <div className="text-sm">
                              {Array.isArray(f.department) ? (
                                f.department.length > 2 ? (
                                  <div>
                                    <div>{f.department.slice(0, 2).join(', ')}</div>
                                    <div className="text-xs text-gray-500">+{f.department.length - 2} more</div>
                                  </div>
                                ) : (
                                  f.department.join(', ')
                                )
                              ) : (f.department || 'N/A')}
                            </div>
                          </td>
                          <td className="p-4 border">
                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={() => toggleDetails(i)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 flex items-center gap-1"
                                disabled={loadingProjects[f.employeeId]}
                                title="View detailed information"
                              >
                                {loadingProjects[f.employeeId] ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                                <span className="hidden sm:inline">
                                  {expandedIndex === i ? 'Hide' : 'View'}
                                </span>
                              </button>
                              <button
                                onClick={() => setEditingFaculty(f)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 flex items-center gap-1"
                                title="Edit faculty details"
                              >
                                <Edit className="h-4 w-4" />
                                <span className="hidden sm:inline">Edit</span>
                              </button>
                              <button
                                onClick={() => setDeletingFaculty(f)}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 flex items-center gap-1"
                                title="Delete faculty"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Expanded Details Row */}
                        <AnimatePresence>
                          {expandedIndex === i && (
                            <motion.tr
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="bg-gray-50"
                            >
                              <td colSpan="6" className="p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                  {/* Faculty Details */}
                                  <div className="space-y-4">
                                    <h4 className="font-semibold text-lg text-gray-800 border-b pb-2">
                                      Faculty Information
                                    </h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <label className="text-sm font-medium text-gray-600">Full Name:</label>
                                        <p className="text-gray-900 font-medium">{f.name || 'N/A'}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-600">Employee ID:</label>
                                        <p className="text-gray-900 font-mono">{f.employeeId || 'N/A'}</p>
                                      </div>
                                      <div className="md:col-span-2">
                                        <label className="text-sm font-medium text-gray-600">Email Address:</label>
                                        <a 
                                          href={`mailto:${f.emailId}`} 
                                          className="text-blue-600 hover:underline block"
                                        >
                                          {f.emailId || 'N/A'}
                                        </a>
                                      </div>
                                    </div>

                                    {/* Academic Information */}
                                    <div className="border-t pt-4">
                                      <h5 className="font-medium text-gray-800 mb-3">Academic Associations</h5>
                                      <div className="space-y-3">
                                        <div>
                                          <label className="text-sm font-medium text-gray-600">Schools:</label>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {Array.isArray(f.school) && f.school.length > 0 ? (
                                              f.school.map((school, idx) => (
                                                <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                                  {school}
                                                </span>
                                              ))
                                            ) : (
                                              <span className="text-gray-500 text-sm">{f.school || 'None'}</span>
                                            )}
                                          </div>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-gray-600">Departments:</label>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {Array.isArray(f.department) && f.department.length > 0 ? (
                                              f.department.map((dept, idx) => (
                                                <span key={idx} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                                  {dept}
                                                </span>
                                              ))
                                            ) : (
                                              <span className="text-gray-500 text-sm">{f.department || 'None'}</span>
                                            )}
                                          </div>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-gray-600">Specializations:</label>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {Array.isArray(f.specialization) && f.specialization.length > 0 ? (
                                              f.specialization.map((spec, idx) => (
                                                <span key={idx} className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                                                  {spec}
                                                </span>
                                              ))
                                            ) : (
                                              <span className="text-gray-500 text-sm">{f.specialization || 'None'}</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Project Assignments */}
                                  <div className="space-y-4">
                                    <h4 className="font-semibold text-lg text-gray-800 border-b pb-2">
                                      Project Assignments
                                    </h4>
                                    
                                    {loadingProjects[f.employeeId] ? (
                                      <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                                        <span className="text-gray-600">Loading project details...</span>
                                      </div>
                                    ) : facultyProjects[f.employeeId] ? (
                                      <div className="space-y-4">
                                        {facultyProjects[f.employeeId].error ? (
                                          <div className="text-sm text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
                                            <div className="flex items-center mb-2">
                                              <AlertTriangle className="h-4 w-4 mr-2" />
                                              <strong>Error loading projects:</strong>
                                            </div>
                                            <div>{facultyProjects[f.employeeId].error}</div>
                                          </div>
                                        ) : (
                                          <>
                                            {/* Project Summary */}
                                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                              <div className="flex items-center justify-between mb-3">
                                                <span className="font-medium text-blue-800">Total Projects:</span>
                                                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                                  {facultyProjects[f.employeeId].total}
                                                </span>
                                              </div>
                                              <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="text-center">
                                                  <div className="text-lg font-semibold text-green-700">
                                                    {facultyProjects[f.employeeId].guide.length}
                                                  </div>
                                                  <div className="text-green-600">Guide Projects</div>
                                                </div>
                                                <div className="text-center">
                                                  <div className="text-lg font-semibold text-orange-700">
                                                    {facultyProjects[f.employeeId].panel.length}
                                                  </div>
                                                  <div className="text-orange-600">Panel Projects</div>
                                                </div>
                                              </div>
                                            </div>
                                            
                                            {/* Guide Projects */}
                                            {facultyProjects[f.employeeId].guide.length > 0 && (
                                              <div>
                                                <h5 className="font-medium text-gray-800 mb-3 flex items-center">
                                                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                                  Guide Projects ({facultyProjects[f.employeeId].guide.length})
                                                </h5>
                                                <div className="space-y-2">
                                                  {facultyProjects[f.employeeId].guide.map((project, j) => (
                                                    <div key={project._id || j} className="bg-green-50 p-3 rounded-lg border border-green-200">
                                                      <div className="flex items-center justify-between">
                                                        <div>
                                                          <span className="font-medium text-green-800">
                                                            {project.title || project.name || `Project ${j + 1}`}
                                                          </span>
                                                          {project.students && project.students.length > 0 && (
                                                            <span className="text-green-600 text-sm ml-2">
                                                              ({project.students.length} students)
                                                            </span>
                                                          )}
                                                          {project.specialization && (
                                                            <div className="text-xs text-green-600 mt-1">
                                                              {project.specialization}
                                                            </div>
                                                          )}
                                                        </div>
                                                        <button
                                                          onClick={() => handleTeamClick(project)}
                                                          className="text-green-700 hover:text-green-900 transition-colors p-2 hover:bg-green-100 rounded"
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
                                            {facultyProjects[f.employeeId].panel.length > 0 && (
                                              <div>
                                                <h5 className="font-medium text-gray-800 mb-3 flex items-center">
                                                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                                                  Panel Projects ({facultyProjects[f.employeeId].panel.length})
                                                </h5>
                                                <div className="space-y-2">
                                                  {facultyProjects[f.employeeId].panel.map((project, j) => (
                                                    <div key={project._id || j} className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                                      <div className="flex items-center justify-between">
                                                        <div>
                                                          <span className="font-medium text-orange-800">
                                                            {project.title || project.name || `Project ${j + 1}`}
                                                          </span>
                                                          {project.students && project.students.length > 0 && (
                                                            <span className="text-orange-600 text-sm ml-2">
                                                              ({project.students.length} students)
                                                            </span>
                                                          )}
                                                          {project.specialization && (
                                                            <div className="text-xs text-orange-600 mt-1">
                                                              {project.specialization}
                                                            </div>
                                                          )}
                                                        </div>
                                                        <button
                                                          onClick={() => handleTeamClick(project)}
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
                                            {facultyProjects[f.employeeId].total === 0 && (
                                              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                                                <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                                <p className="font-medium">No Project Assignments</p>
                                                <p className="text-sm">This faculty member has no current project assignments</p>
                                              </div>
                                            )}

                                            {/* Last Updated */}
                                            {facultyProjects[f.employeeId].lastUpdated && (
                                              <div className="text-xs text-gray-400 text-center pt-3 border-t">
                                                Last updated: {new Date(facultyProjects[f.employeeId].lastUpdated).toLocaleString()}
                                              </div>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                                        <Eye className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                        <p className="font-medium">Click "View" to load project information</p>
                                        <p className="text-sm">Project assignments will be displayed here</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
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
