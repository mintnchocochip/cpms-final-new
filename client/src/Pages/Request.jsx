import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Components/UniversalNavbar";
import { 
  FaCheck, 
  FaTimes, 
  FaUser, 
  FaClock, 
  FaGraduationCap 
} from "react-icons/fa";
import { 
  ChevronRight, 
  ChevronDown, 
  Users, 
  FileText, 
  Calendar,
  Building2,
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  X
} from "lucide-react";
import { fetchRequests, updateRequestStatus } from "../api";

const RequestPage = () => {
  const navigate = useNavigate();
  const [facultyType, setFacultyType] = useState("panel");
  const [requests, setRequests] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [contentLoading, setContentLoading] = useState(true); // Separate loading for content only
  const [initialPageLoad, setInitialPageLoad] = useState(true); // Track initial page load
  const [error, setError] = useState("");
  const [approvingRequestId, setApprovingRequestId] = useState(null);
  const [selectedDeadline, setSelectedDeadline] = useState("");
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

  // Check authentication
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const role = sessionStorage.getItem('role');
    
    if (!token || role !== 'admin') {
      console.log('Not authenticated as admin, redirecting to login');
      navigate('/admin/login');
      return;
    }
  }, [navigate]);

  const fetchRequestsByType = async (type, isRefresh = false) => {
    // Only show content loading for refreshes, full page loading for initial load
    if (isRefresh) {
      setContentLoading(true);
    } else if (initialPageLoad) {
      setContentLoading(true);
    }
    
    setError("");
    
    try {
      console.log(`=== FETCHING ${type.toUpperCase()} REQUESTS (ALL MODE) ===`);
      
      // Pass null for school and department to get all requests
      const { data, error: apiError } = await fetchRequests(type, null, null);
      
      console.log('API Response:', { data, apiError });
      
      // Handle "no requests found" as a normal state, not an error
      if (apiError) {
        // Check if it's specifically a "no requests found" message
        if (apiError.includes("No requests found") || apiError.includes("not found")) {
          console.log('No requests found - this is normal, not an error');
          setRequests([]);
          setError(""); // Don't set this as an error
        } else {
          // This is an actual error (server error, network error, etc.)
          console.error('Actual API error:', apiError);
          setError(apiError);
          setRequests([]);
        }
      } else if (data) {
        const filteredData = data
          .map((faculty) => ({
            ...faculty,
            students: faculty.students
              .filter((student) => student.approved === null)
              .map((student) => ({
                ...student,
                requestId: student._id,
              })),
          }))
          .filter((faculty) => faculty.students.length > 0);

        console.log('Filtered Data:', filteredData);
        setRequests(filteredData);
        setExpanded({});
        if (filteredData.length > 0) {
          showNotification("success", "Requests Loaded", `Successfully loaded ${filteredData.length} faculty with pending requests`);
        }
      } else {
        // No data and no error - empty state
        setRequests([]);
        setError("");
      }
    } catch (err) {
      // Better error handling for different types of errors
      console.error("Error in fetchRequestsByType:", err);
      
      // Check if it's a 404 error (no requests found)
      if (err.response?.status === 404 || err.message?.includes("404")) {
        console.log('404 error - no requests found, treating as empty state');
        setRequests([]);
        setError(""); // Don't show this as an error
      } else {
        // Actual error (network, server, etc.)
        setError("Unable to load requests. Please check your connection and try again.");
        setRequests([]);
        showNotification("error", "Load Failed", "Unable to load requests. Please check your connection and try again.");
      }
    } finally {
      setContentLoading(false);
      if (initialPageLoad) {
        setInitialPageLoad(false);
      }
    }
  };

  useEffect(() => {
    fetchRequestsByType(facultyType);
  }, [facultyType]);

  const toggleExpand = (facultyId) => {
    setExpanded((prev) => ({ ...prev, [facultyId]: !prev[facultyId] }));
  };

  const removeRequestFromState = (processedRequestId) => {
    setRequests(
      (prevRequests) =>
        prevRequests
          .map((faculty) => ({
            ...faculty,
            students: faculty.students.filter(
              (student) => student.requestId !== processedRequestId
            ),
          }))
          .filter((faculty) => faculty.students.length > 0)
    );
  };

  const handleOpenApprovalModal = (requestId) => {
    setApprovingRequestId(requestId);
    const today = new Date();
    today.setDate(today.getDate() + 7);
    setSelectedDeadline(today.toISOString().split("T")[0]);
  };

  const handleCloseApprovalModal = () => {
    setApprovingRequestId(null);
    setSelectedDeadline("");
  };

  const handleSubmitApproval = async () => {
    if (!approvingRequestId || !selectedDeadline) return;

    const payload = {
      requestId: approvingRequestId,
      status: "approved",
      newDeadline: new Date(selectedDeadline).toISOString(),
    };

    console.log('=== SUBMITTING APPROVAL ===');
    console.log('Payload:', payload);
    console.log('Faculty Type:', facultyType);

    try {
      const response = await updateRequestStatus(facultyType, payload);
      console.log('=== APPROVAL RESPONSE ===');
      console.log('Response:', response);
      
      if (response.success) {
        removeRequestFromState(approvingRequestId);
        showNotification("success", "Request Approved", response.message || "Request approved successfully");
        handleCloseApprovalModal();
      } else {
        setError(response.message || "Failed to approve request status");
        showNotification("error", "Approval Failed", response.message || "Failed to approve request status");
      }
    } catch (err) {
      console.error("Error approving request:", err);
      setError("Failed to approve request. Please try again.");
      showNotification("error", "Approval Failed", "Failed to approve request. Please try again.");
    }
  };

  const handleReject = async (requestId) => {
    const payload = {
      requestId: requestId,
      status: "rejected",
    };

    try {
      const response = await updateRequestStatus(facultyType, payload);
      if (response.success) {
        removeRequestFromState(requestId);
        showNotification("success", "Request Rejected", response.message || "Request rejected successfully");
      } else {
        setError(response.message || "Failed to reject request status");
        showNotification("error", "Rejection Failed", response.message || "Failed to reject request status");
      }
    } catch (err) {
      console.error("Error rejecting request:", err);
      setError("Failed to reject request. Please try again.");
      showNotification("error", "Rejection Failed", "Failed to reject request. Please try again.");
    }
  };

  // Handle refresh - only refresh content, not whole page
  const handleRefresh = () => {
    fetchRequestsByType(facultyType, true); // Pass true to indicate this is a refresh
  };

  // Show full page loading only on initial load
  if (initialPageLoad && contentLoading) {
    return (
      <>
        <Navbar />
        <div className="pt-20 pl-24 min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md mx-auto text-center">
            <div className="relative mb-8">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-slate-200 border-t-blue-600 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <FileText className="h-8 w-8 text-blue-600 animate-pulse" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">Loading Requests</h3>
            <p className="text-slate-600">Retrieving {facultyType} requests from all departments...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="pt-20 pl-24 min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
        
        {/* Page Header */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg mx-8 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Request Management</h1>
                  <p className="text-indigo-100 mt-1">Managing requests from all schools & departments</p>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-white/90 text-sm">Current Mode</div>
                    <div className="text-white font-semibold">All Schools & Departments</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Faculty Type Toggle */}
        <div className="mx-8 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Faculty Type Selection</h2>
            </div>
            
            <div className="inline-flex bg-slate-100 rounded-xl p-1.5 shadow-inner">
              <button
                onClick={() => setFacultyType("panel")}
                className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center space-x-2 ${
                  facultyType === "panel"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105"
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-200"
                }`}
              >
                <Users size={16} />
                <span>Panel Members</span>
              </button>
              <button
                onClick={() => setFacultyType("guide")}
                className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center space-x-2 ${
                  facultyType === "guide"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105"
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-200"
                }`}
              >
                <FaGraduationCap size={16} />
                <span>Guides</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content with separate loading state */}
        <div className="mx-8 mb-8">
          <div className="bg-white rounded-2xl shadow-lg">
            {contentLoading ? (
              // Content-only loading state
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative mb-8">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-600 mx-auto"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Loading {facultyType} requests...</h3>
                <p className="text-slate-600">Please wait while we fetch the latest data</p>
              </div>
            ) : error ? (
              <div className="p-8">
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-red-800 mb-2">Error Loading Requests</h3>
                  <p className="text-red-600 mb-4">{error}</p>
                  <button
                    onClick={handleRefresh}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg flex items-center space-x-2 mx-auto"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Retry</span>
                  </button>
                </div>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-20">
                <div className="mx-auto w-32 h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-8">
                  <FileText className="h-16 w-16 text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-600 mb-3">No Pending Requests</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-6">
                  There are no pending {facultyType} requests across all schools & departments at the moment.
                </p>
                <button
                  onClick={handleRefresh}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg flex items-center space-x-2 mx-auto"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </button>
              </div>
            ) : (
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">
                      Pending {facultyType === 'panel' ? 'Panel' : 'Guide'} Requests ({requests.length} faculty)
                    </h2>
                  </div>
                  
                  {/* Refresh button for the content area */}
                  <button
                    onClick={handleRefresh}
                    className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Refresh</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {requests.map((faculty) => (
                    <div 
                      key={faculty._id} 
                      className="border border-slate-200 rounded-xl bg-gradient-to-r from-white to-slate-50 hover:shadow-lg transition-all duration-300"
                    >
                      <div
                        className="flex justify-between items-center p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => toggleExpand(faculty._id)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl">
                            {expanded[faculty._id] ? (
                              <ChevronDown className="text-blue-600 h-6 w-6" />
                            ) : (
                              <ChevronRight className="text-blue-600 h-6 w-6" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-3 mb-1">
                              <FaUser className="text-blue-600" size={16} />
                              <h4 className="font-bold text-xl text-slate-800">{faculty.name}</h4>
                              {faculty.empId && (
                                <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                  ID: {faculty.empId}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-6 text-sm text-slate-600">
                              {faculty.school && (
                                <span className="flex items-center space-x-1">
                                  <Building2 className="h-4 w-4" />
                                  <span>{faculty.school}</span>
                                </span>
                              )}
                              {faculty.department && (
                                <span>{faculty.department}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{faculty.students.length} pending</span>
                          </span>
                        </div>
                      </div>

                      {expanded[faculty._id] && (
                        <div className="border-t border-slate-200 p-6 bg-slate-50">
                          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="min-w-full">
                                <thead className="bg-gradient-to-r from-slate-100 to-blue-100">
                                  <tr>
                                    <th className="p-4 text-left font-semibold text-slate-700 border-b border-slate-200">
                                      <div className="flex items-center space-x-2">
                                        <FaUser size={14} />
                                        <span>Student Details</span>
                                      </div>
                                    </th>
                                    <th className="p-4 text-center font-semibold text-slate-700 border-b border-slate-200">
                                      Registration
                                    </th>
                                    <th className="p-4 text-center font-semibold text-slate-700 border-b border-slate-200">
                                      Review Type
                                    </th>
                                    <th className="p-4 text-left font-semibold text-slate-700 border-b border-slate-200">
                                      Comments
                                    </th>
                                    <th className="p-4 text-center font-semibold text-slate-700 border-b border-slate-200">
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {faculty.students.map((student, studentIndex) => (
                                    <tr
                                      key={student.requestId}
                                      className={`hover:bg-blue-50 transition-colors duration-150 ${
                                        studentIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                                      }`}
                                    >
                                      <td className="p-4 border-b border-slate-100">
                                        <div className="font-medium text-slate-900">{student.name}</div>
                                      </td>
                                      <td className="p-4 text-center border-b border-slate-100">
                                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                          {student.regNo}
                                        </span>
                                      </td>
                                      <td className="p-4 text-center border-b border-slate-100">
                                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                                          {student.projectType}
                                        </span>
                                      </td>
                                      <td className="p-4 border-b border-slate-100">
                                        <div className="text-slate-700 text-sm max-w-xs truncate" title={student.comments}>
                                          {student.comments}
                                        </div>
                                      </td>
                                      <td className="p-4 border-b border-slate-100">
                                        <div className="flex justify-center items-center">
                                          {approvingRequestId === student.requestId ? (
                                            <div className="bg-white border-2 border-blue-200 rounded-xl p-4 shadow-lg min-w-[200px]">
                                              <div className="text-center mb-3">
                                                <Calendar className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                                                <p className="text-sm font-medium text-slate-800">
                                                  Set Review Deadline
                                                </p>
                                              </div>
                                              <input
                                                type="date"
                                                value={selectedDeadline}
                                                onChange={(e) =>
                                                  setSelectedDeadline(e.target.value)
                                                }
                                                className="w-full p-2 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3 transition-all"
                                                min={
                                                  new Date()
                                                    .toISOString()
                                                    .split("T")[0]
                                                }
                                              />
                                              <div className="flex space-x-2">
                                                <button
                                                  onClick={handleSubmitApproval}
                                                  className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg"
                                                >
                                                  Confirm
                                                </button>
                                                <button
                                                  onClick={handleCloseApprovalModal}
                                                  className="flex-1 bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-300 transition-all duration-200"
                                                >
                                                  Cancel
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="flex space-x-2">
                                              <button
                                                onClick={() =>
                                                  handleOpenApprovalModal(
                                                    student.requestId
                                                  )
                                                }
                                                className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-3 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                                                title="Approve Request"
                                              >
                                                <FaCheck size={14} />
                                              </button>
                                              <button
                                                onClick={() =>
                                                  handleReject(student.requestId)
                                                }
                                                className="bg-gradient-to-r from-red-500 to-red-600 text-white p-3 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                                                title="Reject Request"
                                              >
                                                <FaTimes size={14} />
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Notification */}
        {notification.isVisible && (
          <div className="fixed top-24 right-8 z-50 max-w-md w-full">
            <div className={`transform transition-all duration-500 ease-out ${
              notification.isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
            }`}>
              <div className={`rounded-xl shadow-2xl border-l-4 p-6 ${
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
                        <div className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-emerald-400 opacity-75"></div>
                        <CheckCircle className="relative inline-flex h-6 w-6" />
                      </div>
                    ) : (
                      <XCircle className="h-6 w-6" />
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className={`text-sm font-bold ${
                      notification.type === "success" ? "text-emerald-800" : "text-red-800"
                    }`}>
                      {notification.title}
                    </h3>
                    <p className={`mt-1 text-sm ${
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
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
      </div>
    </>
  );
};

export default RequestPage;
