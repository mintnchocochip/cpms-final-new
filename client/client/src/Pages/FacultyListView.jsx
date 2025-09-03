// FacultyListView.jsx - Fixed import and Cancel icon usage
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Users, Mail, Phone, MapPin, Calendar, BookOpen, Eye, Edit2, Trash2, Save } from 'lucide-react';
import Navbar from "../Components/UniversalNavbar";
import { getAllFaculty } from '../api';

// Inline Edit Component - Fixed Cancel icon
const InlineEdit = ({ value, onSave, onCancel, field, type = "text" }) => {
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    if (editValue.trim() !== value) {
      onSave(editValue.trim());
    } else {
      onCancel();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyPress}
        className="border border-blue-300 rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:border-blue-500"
        autoFocus
        placeholder={`Enter ${field}`}
      />
      <button
        onClick={handleSave}
        className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-100"
        title="Save"
      >
        <Save className="h-4 w-4" />
      </button>
      <button
        onClick={onCancel}
        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100"
        title="Cancel"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmModal = ({ faculty, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-100 p-3 rounded-full">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Delete Faculty</h3>
              <p className="text-sm text-gray-600">This action cannot be undone</p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-700">
              Are you sure you want to delete <span className="font-semibold">{faculty.name}</span>?
            </p>
            <div className="mt-2 text-xs text-gray-500">
              <p>Employee ID: {faculty.employeeId}</p>
              <p>Email: {faculty.emailId}</p>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Delete Faculty
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// TeamPopup Component
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
                        {student.phone && (
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <Phone className="h-3 w-3" />
                            {student.phone}
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

          {team.faculty && (
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3 text-gray-800">Faculty Assignment</h3>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
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

          {(team.description || team.technologies || team.objectives) && (
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3 text-gray-800">Additional Details</h3>
              <div className="space-y-3">
                {team.description && (
                  <div>
                    <span className="font-medium text-gray-600">Description:</span>
                    <p className="text-gray-800 mt-1">{team.description}</p>
                  </div>
                )}
                {team.technologies && (
                  <div>
                    <span className="font-medium text-gray-600">Technologies:</span>
                    <p className="text-gray-800 mt-1">{team.technologies}</p>
                  </div>
                )}
                {team.objectives && (
                  <div>
                    <span className="font-medium text-gray-600">Objectives:</span>
                    <p className="text-gray-800 mt-1">{team.objectives}</p>
                  </div>
                )}
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

const downloadCSV = (facultyList) => {
  const headers = ['Faculty Name', 'Employee ID', 'Email ID', 'Role'];
  const rows = facultyList.map(f => [
    f.name || 'N/A', 
    f.employeeId || 'N/A', 
    f.emailId || 'N/A', 
    f.role || 'N/A'
  ]);
  let csvContent = 'data:text/csv;charset=utf-8,' + 
    headers.join(',') + '\n' + 
    rows.map(e => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "faculty_list.csv");
  document.body.appendChild(link);
  link.click();
};

const FacultyListView = () => {
  const [facultyList, setFacultyList] = useState([]);
  const [search, setSearch] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [showNotif, setShowNotif] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [facultyProjects, setFacultyProjects] = useState({});
  const [loadingProjects, setLoadingProjects] = useState({});
  const [selectedTeam, setSelectedTeam] = useState(null);
  
  // Edit and Delete states
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Edit handlers with frontend functionality
  const handleEditFaculty = (faculty, field) => {
    setEditingFaculty(faculty._id);
    setEditingField(field);
  };

  const handleSaveEdit = (facultyId, field, newValue) => {
    // Update frontend state immediately
    setFacultyList(prev => prev.map(f => 
      f._id === facultyId 
        ? { ...f, [field]: newValue }
        : f
    ));
    
    setEditingFaculty(null);
    setEditingField(null);
    
    // TODO: Integrate backend for EDIT
    console.log('Saving edit:', { facultyId, field, newValue });
    // Backend integration point - replace with actual API call
  };

  const handleCancelEdit = () => {
    setEditingFaculty(null);
    setEditingField(null);
  };

  // Delete handlers with frontend functionality
  const handleDeleteFaculty = (faculty) => {
    setDeleteConfirm(faculty);
  };

  const confirmDelete = (faculty) => {
    // Remove from frontend state immediately
    setFacultyList(prev => prev.filter(f => f._id !== faculty._id));
    setDeleteConfirm(null);
    
    // TODO: Integrate backend for DELETE
    console.log('Deleting faculty:', faculty);
    // Backend integration point - replace with actual API call
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  // JWT token decoder function
  const decodeJWT = (token) => {
    try {
      if (!token || typeof token !== 'string') return null;
      
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = parts[1];
      const padding = '='.repeat((4 - payload.length % 4) % 4);
      const paddedPayload = payload + padding;
      const decodedBytes = atob(paddedPayload);
      
      return JSON.parse(decodedBytes);
    } catch (error) {
      console.log('Failed to decode JWT:', error);
      return null;
    }
  };

  const getCurrentUser = () => {
    try {
      const possibleKeys = ['token', 'jwt', 'authToken', 'accessToken', 'faculty', 'user', 'admin', 'currentUser'];
      
      for (const key of possibleKeys) {
        const userData = sessionStorage.getItem(key);
        if (userData) {
          try {
            const parsed = JSON.parse(userData);
            if (parsed && (parsed.role || parsed.id || parsed.employeeId)) {
              return parsed;
            }
          } catch (parseError) {
            const decoded = decodeJWT(userData);
            if (decoded && (decoded.role || decoded.id || decoded.employeeId)) {
              console.log(`Successfully decoded JWT from key '${key}':`, decoded);
              return decoded;
            }
          }
        }
      }
      
      console.log('No valid user data found in sessionStorage');
      return {};
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return {};
    }
  };

  const fetchFacultyProjects = async (employeeId) => {
    try {
      setLoadingProjects(prev => ({ ...prev, [employeeId]: true }));
      
      const token = sessionStorage.getItem('token') || sessionStorage.getItem('jwt') || sessionStorage.getItem('authToken');
      
      const response = await fetch(`https://cpms-latest.onrender.com/api/faculty/${employeeId}/projects`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Raw API response for ${employeeId}:`, data);

      let guideProjects = [];
      let panelProjects = [];

      if (data.success && data.data) {
        if (data.data.guideProjects && Array.isArray(data.data.guideProjects)) {
          guideProjects = data.data.guideProjects.map((project, index) => ({
            _id: project._id || `guide-${employeeId}-${index}`,
            title: project.name,
            name: project.name,
            projectName: project.name,
            domain: project.domain || 'N/A',
            type: 'guide',
            status: 'Active',
            assignedDate: new Date().toISOString(),
            faculty: {
              employeeId: employeeId,
              role: 'guide'
            },
            students: project.students || []
          }));
        }

        if (data.data.panelProjects && Array.isArray(data.data.panelProjects)) {
          panelProjects = data.data.panelProjects.map((project, index) => ({
            _id: project._id || `panel-${employeeId}-${index}`,
            title: project.name,
            name: project.name,
            projectName: project.name,
            domain: project.domain || 'N/A',
            type: 'panel',
            status: 'Active',
            assignedDate: new Date().toISOString(),
            faculty: {
              employeeId: employeeId,
              role: 'panel'
            },
            students: project.students || []
          }));
        }
      }

      const projectData = {
        guide: guideProjects,
        panel: panelProjects,
        total: guideProjects.length + panelProjects.length,
        lastUpdated: new Date().toISOString()
      };

      console.log(`Processed project data for ${employeeId}:`, projectData);

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
        error: error.message,
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

  const handleTeamClick = (project) => {
    setSelectedTeam(project);
  };

  useEffect(() => {
    const fetchFacultyData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('=== FETCHING FACULTY LIST FROM BACKEND ===');
        
        const currentUser = getCurrentUser();
        console.log('Current user:', currentUser);
        
        const isAdmin = currentUser.role === 'admin' || 
                       currentUser.role === 'Admin' || 
                       currentUser.employeeId?.includes('ADMIN') ||
                       currentUser.emailId === 'admin@vit.ac.in';
        
        console.log('Is admin check:', {
          role: currentUser.role,
          employeeId: currentUser.employeeId,
          emailId: currentUser.emailId,
          isAdmin: isAdmin
        });
        
        if (!isAdmin) {
          throw new Error('Admin access required. Please login as admin.');
        }
        
        const response = await getAllFaculty();
        console.log('Faculty API response:', response);
        
        let facultyData = [];
        if (response?.data?.success && response.data.data) {
          facultyData = response.data.data;
        } else if (response?.data?.faculties) {
          facultyData = response.data.faculties;
        } else if (response?.data && Array.isArray(response.data)) {
          facultyData = response.data;
        } else if (response?.success && response.data) {
          facultyData = response.data;
        }
        
        console.log('Processed faculty data:', facultyData);
        setFacultyList(facultyData);
        
      } catch (err) {
        console.error('Error fetching faculty list:', err);
        setError(err.message || 'Failed to fetch faculty list');
        
        const dummyData = [
          { 
            _id: 'dummy1',
            name: 'Dr. Sandeep', 
            employeeId: 'EMP001', 
            emailId: 'sandeep@vit.ac.in',
            role: 'faculty',
            imageUrl: ''
          },
          { 
            _id: 'dummy2',
            name: 'Prof. Kavitha', 
            employeeId: 'EMP002', 
            emailId: 'kavitha@vit.ac.in',
            role: 'faculty',
            imageUrl: ''
          }
        ];
        setFacultyList(dummyData);
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyData();
  }, []);

  const filteredList = facultyList.filter(f => 
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
    f.emailId?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleDetails = async (index) => {
    const faculty = filteredList[index];
    
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else {
      setExpandedIndex(index);
      
      if (!facultyProjects[faculty.employeeId]) {
        await fetchFacultyProjects(faculty.employeeId);
      }
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className='min-h-screen bg-gray-50 overflow-x-hidden'>
          <div className="p-8 lg:p-20 lg:pl-28">
            <div className='shadow-md rounded-lg bg-white p-8 lg:p-10'>
              <div className="flex items-center justify-center h-64">
                <div className="text-xl text-gray-600">Loading faculty list...</div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className='min-h-screen bg-gray-50 overflow-x-hidden'>
        <div className="p-8 lg:p-20 lg:pl-28">
          <div className='shadow-md rounded-lg bg-white p-8 lg:p-10'>
            <div className="space-y-6">
              {/* Header Section */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <h3 className="font-bold font-roboto text-3xl lg:text-4xl text-gray-800 mb-2">
                    Faculty Management
                  </h3>
                  <p className="text-gray-600 text-sm">Manage faculty members and their project assignments</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  <input
                    type="text"
                    placeholder="Search by name, ID, or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border border-gray-300 px-4 py-2 rounded-lg shadow-sm w-full lg:w-80 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => downloadCSV(filteredList)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 whitespace-nowrap"
                    disabled={filteredList.length === 0}
                  >
                    Download CSV
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="bg-red-100 p-2 rounded-full mr-3">
                      <X className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <strong>Error:</strong> {error}
                      <div className="text-sm mt-1">Showing dummy data for development purposes.</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                  <div className="text-3xl font-bold text-blue-800 mb-1">{facultyList.length}</div>
                  <div className="text-blue-600 font-medium">Total Faculty</div>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                  <div className="text-3xl font-bold text-green-800 mb-1">
                    {facultyList.filter(f => f.role !== 'admin').length}
                  </div>
                  <div className="text-green-600 font-medium">Faculty Members</div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                  <div className="text-3xl font-bold text-purple-800 mb-1">
                    {facultyList.filter(f => f.role === 'admin').length}
                  </div>
                  <div className="text-purple-600 font-medium">Administrators</div>
                </div>
              </div>

              {/* Search Results Info */}
              {search && (
                <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                  Showing {filteredList.length} of {facultyList.length} faculty members
                </div>
              )}

              {/* Faculty Table */}
              {filteredList.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                  <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <div className="text-lg mb-2">
                    {search ? 'No faculty members found matching your search.' : 'No faculty members found.'}
                  </div>
                  <p className="text-sm">Faculty members will appear here once added to the system.</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Faculty Details</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Employee ID</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Role</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredList.map((f, i) => (
                          <React.Fragment key={f._id || i}>
                            <tr className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
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
                                    {editingFaculty === f._id && editingField === 'name' ? (
                                      <InlineEdit
                                        value={f.name || ''}
                                        onSave={(newValue) => handleSaveEdit(f._id, 'name', newValue)}
                                        onCancel={handleCancelEdit}
                                        field="name"
                                      />
                                    ) : (
                                      <div
                                        className="font-medium text-gray-800 cursor-pointer hover:text-blue-600 transition-colors"
                                        onClick={() => handleEditFaculty(f, 'name')}
                                        title="Click to edit"
                                      >
                                        {f.name || 'N/A'}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                {editingFaculty === f._id && editingField === 'employeeId' ? (
                                  <InlineEdit
                                    value={f.employeeId || ''}
                                    onSave={(newValue) => handleSaveEdit(f._id, 'employeeId', newValue)}
                                    onCancel={handleCancelEdit}
                                    field="employee ID"
                                  />
                                ) : (
                                  <div
                                    className="text-gray-600 cursor-pointer hover:text-blue-600 transition-colors font-mono text-sm"
                                    onClick={() => handleEditFaculty(f, 'employeeId')}
                                    title="Click to edit"
                                  >
                                    {f.employeeId || 'N/A'}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {editingFaculty === f._id && editingField === 'emailId' ? (
                                  <InlineEdit
                                    value={f.emailId || ''}
                                    onSave={(newValue) => handleSaveEdit(f._id, 'emailId', newValue)}
                                    onCancel={handleCancelEdit}
                                    field="email"
                                    type="email"
                                  />
                                ) : (
                                  <div
                                    className="text-gray-600 cursor-pointer hover:text-blue-600 transition-colors"
                                    onClick={() => handleEditFaculty(f, 'emailId')}
                                    title="Click to edit"
                                  >
                                    {f.emailId || 'N/A'}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  f.role === 'admin' 
                                    ? 'bg-red-100 text-red-800 border border-red-200' 
                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}>
                                  {f.role || 'faculty'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => toggleDetails(i)}
                                    className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={loadingProjects[f.employeeId]}
                                    title={expandedIndex === i ? 'Hide Details' : 'View Details'}
                                  >
                                    {loadingProjects[f.employeeId] ? (
                                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteFaculty(f)}
                                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-all duration-200 hover:scale-105"
                                    title="Delete Faculty"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            <AnimatePresence>
                              {expandedIndex === i && (
                                <motion.tr
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="bg-gray-50"
                                >
                                  <td colSpan="5" className="px-6 py-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                      {/* Faculty Information */}
                                      <div className="bg-white p-6 rounded-xl border border-gray-200">
                                        <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                          <div className="bg-blue-100 p-2 rounded-full">
                                            <Users className="h-4 w-4 text-blue-600" />
                                          </div>
                                          Faculty Information
                                        </h4>
                                        <div className="space-y-3">
                                          <div className="flex justify-between">
                                            <span className="font-medium text-gray-600">Name:</span>
                                            <span className="text-gray-800">{f.name || 'N/A'}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="font-medium text-gray-600">Employee ID:</span>
                                            <span className="text-gray-800 font-mono">{f.employeeId || 'N/A'}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="font-medium text-gray-600">Email:</span>
                                            <a 
                                              href={`mailto:${f.emailId}`} 
                                              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                                            >
                                              {f.emailId || 'N/A'}
                                            </a>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="font-medium text-gray-600">Role:</span>
                                            <span className="text-gray-800 capitalize">{f.role || 'faculty'}</span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Project Assignments */}
                                      <div className="bg-white p-6 rounded-xl border border-gray-200">
                                        <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                          <div className="bg-green-100 p-2 rounded-full">
                                            <BookOpen className="h-4 w-4 text-green-600" />
                                          </div>
                                          Project Assignments
                                        </h4>
                                        {loadingProjects[f.employeeId] ? (
                                          <div className="flex items-center justify-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            <span className="ml-3 text-gray-600">Loading projects...</span>
                                          </div>
                                        ) : facultyProjects[f.employeeId] ? (
                                          <div className="space-y-4">
                                            {facultyProjects[f.employeeId].error ? (
                                              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                                                <div className="flex items-center">
                                                  <X className="w-4 h-4 mr-2" />
                                                  <strong>Error loading projects:</strong>
                                                </div>
                                                <div className="mt-1 text-sm">{facultyProjects[f.employeeId].error}</div>
                                              </div>
                                            ) : (
                                              <>
                                                <div className="text-center mb-4">
                                                  <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold">
                                                    Total Projects: {facultyProjects[f.employeeId].total}
                                                  </span>
                                                </div>
                                                
                                                {facultyProjects[f.employeeId].guide.length > 0 && (
                                                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                                    <h5 className="font-medium text-green-800 mb-3">
                                                      Guide Projects ({facultyProjects[f.employeeId].guide.length})
                                                    </h5>
                                                    <div className="space-y-2">
                                                      {facultyProjects[f.employeeId].guide.map((project, j) => (
                                                        <div key={project._id || j} className="flex items-center justify-between p-3 bg-white rounded border border-green-100">
                                                          <div>
                                                            <div className="font-medium text-gray-800">
                                                              {project.title || project.name || project.projectName || `Project ${j + 1}`}
                                                            </div>
                                                            {project.students && project.students.length > 0 && (
                                                              <div className="text-sm text-gray-600 mt-1">
                                                                {project.students.length} student{project.students.length !== 1 ? 's' : ''}
                                                              </div>
                                                            )}
                                                          </div>
                                                          <button
                                                            onClick={() => handleTeamClick(project)}
                                                            className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100 transition-all"
                                                            title="View project details"
                                                          >
                                                            <Eye className="h-4 w-4" />
                                                          </button>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </div>
                                                )}
                                                
                                                {facultyProjects[f.employeeId].panel.length > 0 && (
                                                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                                    <h5 className="font-medium text-orange-800 mb-3">
                                                      Panel Projects ({facultyProjects[f.employeeId].panel.length})
                                                    </h5>
                                                    <div className="space-y-2">
                                                      {facultyProjects[f.employeeId].panel.map((project, j) => (
                                                        <div key={project._id || j} className="flex items-center justify-between p-3 bg-white rounded border border-orange-100">
                                                          <div>
                                                            <div className="font-medium text-gray-800">
                                                              {project.title || project.name || project.projectName || `Project ${j + 1}`}
                                                            </div>
                                                            {project.students && project.students.length > 0 && (
                                                              <div className="text-sm text-gray-600 mt-1">
                                                                {project.students.length} student{project.students.length !== 1 ? 's' : ''}
                                                              </div>
                                                            )}
                                                          </div>
                                                          <button
                                                            onClick={() => handleTeamClick(project)}
                                                            className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100 transition-all"
                                                            title="View project details"
                                                          >
                                                            <Eye className="h-4 w-4" />
                                                          </button>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </div>
                                                )}
                                                
                                                {facultyProjects[f.employeeId].total === 0 && (
                                                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                                                    <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                                    <div>No project assignments found</div>
                                                  </div>
                                                )}

                                                {facultyProjects[f.employeeId].lastUpdated && (
                                                  <div className="text-xs text-gray-400 text-center pt-2 border-t border-gray-200">
                                                    Last updated: {new Date(facultyProjects[f.employeeId].lastUpdated).toLocaleString()}
                                                  </div>
                                                )}
                                              </>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="flex items-center justify-center mb-2">
                                              <BookOpen className="w-8 h-8 text-gray-400 mr-2" />
                                              <span>Click "View Details" to load project information</span>
                                            </div>
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
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Modals */}
        {deleteConfirm && (
          <DeleteConfirmModal 
            faculty={deleteConfirm} 
            onConfirm={() => confirmDelete(deleteConfirm)}
            onCancel={cancelDelete} 
          />
        )}
        
        <TeamPopup 
          team={selectedTeam} 
          onClose={() => setSelectedTeam(null)} 
        />
      </div>
    </>
  );
};

export default FacultyListView;
