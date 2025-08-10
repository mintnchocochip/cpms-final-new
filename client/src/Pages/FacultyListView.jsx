// FacultyListView.jsx - Updated with real student data parsing
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Users, Mail, Phone, MapPin, Calendar, BookOpen, Eye } from 'lucide-react';
import Navbar from "../Components/UniversalNavbar";
import { getAllFaculty } from '../api'; // Import the API function

// Integrated TeamPopup Component
// Integrated TeamPopup Component
const TeamPopup = ({ team, onClose }) => {
  if (!team) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
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

        {/* Content */}
        <div className="p-6">
          {/* Team Members Section - Now the first section */}
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

          {/* Faculty Information */}
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

          {/* Additional Details */}
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

        {/* Footer */}
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
  const [selectedTeam, setSelectedTeam] = useState(null); // For TeamPopup

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

  // Better user data retrieval function that handles JWT tokens
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

  // Updated fetchFacultyProjects function to handle real data
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
        // Process guide projects with real student data
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
            // Use real student data from API
            students: project.students || []
          }));
        }

        // Process panel projects with real student data
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
            // Use real student data from API
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

  // Handle team click to show popup
  const handleTeamClick = (project) => {
    setSelectedTeam(project);
  };

  // Updated to fetch from backend with JWT support
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
        
        // Fallback to dummy data for development
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

  // Loading state
  if (loading) {
    return (
      <>
        <Navbar />
        <div className='min-h-screen bg-gray-50 overflow-x-hidden'>
          <div className="p-20 pl-28">
            <div className='shadow-md rounded-lg bg-white p-10'>
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
        <div className="p-20 pl-28">
          <div className='shadow-md rounded-lg bg-white p-10'>
            <div className="">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold font-roboto text-4xl text-gray-800 mb-2">
                  Faculty List 
                </h3>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Search by name, ID, or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border px-3 py-2 rounded shadow w-64"
                  />
                  <button
                    onClick={() => downloadCSV(filteredList)}
                    className="bg-blue-600 hover:bg-blue-700 hover:transition hover:ease-in-out hover:delay-150 hover:scale-110 text-white px-4 py-2 rounded"
                    disabled={filteredList.length === 0}
                  >
                    Download CSV
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  <strong>Error:</strong> {error}
                  <div className="text-sm mt-1">Showing dummy data for development purposes.</div>
                </div>
              )}

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
              </div>

              {/* Faculty count and search results */}
              <div className="mb-4 text-sm text-gray-600">
                {search && (
                  <span>Showing {filteredList.length} of {facultyList.length} faculty members</span>
                )}
              </div>

              {filteredList.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {search ? 'No faculty members found matching your search.' : 'No faculty members found.'}
                </div>
              ) : (
                <table className="w-full border text-left mb-6">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 border">Name</th>
                      <th className="p-3 border">Employee ID</th>
                      <th className="p-3 border">Email ID</th>
                      <th className="p-3 border">Role</th>
                      <th className="p-3 border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.map((f, i) => (
                      <React.Fragment key={f._id || i}>
                        <tr className="hover:bg-gray-50">
                          <td className="p-3 border">
                            <div className="flex items-center gap-3">
                              {f.imageUrl && (
                                <img 
                                  src={f.imageUrl} 
                                  alt={f.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              )}
                              <span className="font-medium">{f.name || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="p-3 border">{f.employeeId || 'N/A'}</td>
                          <td className="p-3 border">{f.emailId || 'N/A'}</td>
                          <td className="p-3 border">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              f.role === 'admin' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {f.role || 'faculty'}
                            </span>
                          </td>
                          <td className="p-3 border">
                            <button
                              onClick={() => toggleDetails(i)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded hover:transition hover:ease-in-out hover:delay-150 hover:scale-110"
                              disabled={loadingProjects[f.employeeId]}
                            >
                              {loadingProjects[f.employeeId] 
                                ? 'Loading...' 
                                : expandedIndex === i 
                                  ? 'Hide Details' 
                                  : 'View Details'
                              }
                            </button>
                          </td>
                        </tr>
                        <AnimatePresence>
                          {expandedIndex === i && (
                            <motion.tr
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="bg-gray-50"
                            >
                              <td colSpan="5" className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {/* Faculty Information */}
                                  <div>
                                    <p className="font-semibold text-gray-700 mb-3">Faculty Information:</p>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex">
                                        <span className="font-medium w-24">Name:</span>
                                        <span>{f.name || 'N/A'}</span>
                                      </div>
                                      <div className="flex">
                                        <span className="font-medium w-24">Employee ID:</span>
                                        <span>{f.employeeId || 'N/A'}</span>
                                      </div>
                                      <div className="flex">
                                        <span className="font-medium w-24">Email:</span>
                                        <span>
                                          <a 
                                            href={`mailto:${f.emailId}`} 
                                            className="text-blue-600 hover:underline"
                                          >
                                            {f.emailId || 'N/A'}
                                          </a>
                                        </span>
                                      </div>
                                      <div className="flex">
                                        <span className="font-medium w-24">Role:</span>
                                        <span className="capitalize">{f.role || 'faculty'}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Project Assignments */}
                                  <div>
                                    <p className="font-semibold text-gray-700 mb-3">Project Assignments:</p>
                                    {loadingProjects[f.employeeId] ? (
                                      <div className="text-sm text-gray-500 flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                        Loading project details...
                                      </div>
                                    ) : facultyProjects[f.employeeId] ? (
                                      <div className="space-y-3">
                                        {facultyProjects[f.employeeId].error ? (
                                          <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                                            <div className="flex items-center">
                                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                              </svg>
                                              <strong>Error loading projects:</strong>
                                            </div>
                                            <div className="mt-1">{facultyProjects[f.employeeId].error}</div>
                                          </div>
                                        ) : (
                                          <>
                                            {/* Total Projects Summary */}
                                            <div className="text-sm mb-4">
                                              <span className="font-medium">Total Projects: </span>
                                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                                                {facultyProjects[f.employeeId].total}
                                              </span>
                                            </div>
                                            
                                            {/* Guide Projects */}
                                            {facultyProjects[f.employeeId].guide.length > 0 && (
                                              <div className="bg-green-50 p-3 rounded border border-green-200">
                                                <p className="font-medium text-sm mb-2 text-green-700 flex items-center">
                                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                  </svg>
                                                  Guide Projects ({facultyProjects[f.employeeId].guide.length}):
                                                </p>
                                                <ul className="list-none space-y-2">
                                                  {facultyProjects[f.employeeId].guide.map((project, j) => (
                                                    <li key={project._id || j} className="text-gray-700">
                                                      <div className="flex items-center justify-between p-2 bg-white rounded border">
                                                        <div>
                                                          <span className="font-medium">
                                                            {project.title || project.name || project.projectName || `Project ${j + 1}`}
                                                          </span>
                                                          {project.students && project.students.length > 0 && (
                                                            <span className="text-gray-600 text-sm ml-2">
                                                              ({project.students.length} students)
                                                            </span>
                                                          )}
                                                        </div>
                                                        <button
                                                          onClick={() => handleTeamClick(project)}
                                                          className="text-blue-600 hover:text-blue-800 transition-colors p-1 rounded hover:bg-blue-100"
                                                          title="View project details"
                                                        >
                                                          <Eye className="h-4 w-4" />
                                                        </button>
                                                      </div>
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}
                                            
                                            {/* Panel Projects */}
                                            {facultyProjects[f.employeeId].panel.length > 0 && (
                                              <div className="bg-orange-50 p-3 rounded border border-orange-200">
                                                <p className="font-medium text-sm mb-2 text-orange-700 flex items-center">
                                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                  </svg>
                                                  Panel Projects ({facultyProjects[f.employeeId].panel.length}):
                                                </p>
                                                <ul className="list-none space-y-2">
                                                  {facultyProjects[f.employeeId].panel.map((project, j) => (
                                                    <li key={project._id || j} className="text-gray-700">
                                                      <div className="flex items-center justify-between p-2 bg-white rounded border">
                                                        <div>
                                                          <span className="font-medium">
                                                            {project.title || project.name || project.projectName || `Project ${j + 1}`}
                                                          </span>
                                                          {project.students && project.students.length > 0 && (
                                                            <span className="text-gray-600 text-sm ml-2">
                                                              ({project.students.length} students)
                                                            </span>
                                                          )}
                                                        </div>
                                                        <button
                                                          onClick={() => handleTeamClick(project)}
                                                          className="text-blue-600 hover:text-blue-800 transition-colors p-1 rounded hover:bg-blue-100"
                                                          title="View project details"
                                                        >
                                                          <Eye className="h-4 w-4" />
                                                        </button>
                                                      </div>
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}
                                            
                                            {/* No Projects Message */}
                                            {facultyProjects[f.employeeId].total === 0 && (
                                              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded border border-gray-200">
                                                <div className="flex items-center justify-center">
                                                  <svg className="w-8 h-8 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                  </svg>
                                                  <span>No project assignments found</span>
                                                </div>
                                              </div>
                                            )}

                                            {/* Last Updated */}
                                            {facultyProjects[f.employeeId].lastUpdated && (
                                              <div className="text-xs text-gray-400 mt-2">
                                                Last updated: {new Date(facultyProjects[f.employeeId].lastUpdated).toLocaleString()}
                                              </div>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded border border-gray-200">
                                        <div className="flex items-center">
                                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          Click "View Details" to load project information
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
              )}
            </div>
          </div>
        </div>
        
        {/* Team Popup */}
        <TeamPopup 
          team={selectedTeam} 
          onClose={() => setSelectedTeam(null)} 
        />
      </div>
    </>
  );
};

export default FacultyListView;