import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Components/UniversalNavbar";
import { FaCheck, FaTimes, FaUser, FaClock, FaGraduationCap } from "react-icons/fa";
import { ChevronRight, ChevronDown, Users, FileText, Calendar, Building2, CheckSquare, Square } from "lucide-react";
import { fetchRequests, updateRequestStatus } from "../api";
import { useAdminContext } from "../hooks/useAdminContext";

const RequestPage = () => {
  const navigate = useNavigate();
  const { school, department, getDisplayString, clearContext, loading: contextLoading, error: contextError } = useAdminContext();
  const [facultyType, setFacultyType] = useState("panel");
  const [requests, setRequests] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approvingRequestId, setApprovingRequestId] = useState(null);
  const [selectedDeadline, setSelectedDeadline] = useState("");

  // Bulk approval states
  const [selectedRequests, setSelectedRequests] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkApprovalDeadline, setBulkApprovalDeadline] = useState("");
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Helper function to get all request IDs
  const getAllRequestIds = () => {
    const allIds = [];
    requests.forEach(faculty => {
      faculty.students.forEach(student => {
        allIds.push(student.requestId);
      });
    });
    return allIds;
  };

  // Toggle individual request selection
  const toggleRequestSelection = (requestId) => {
    const newSelected = new Set(selectedRequests);
    if (newSelected.has(requestId)) {
      newSelected.delete(requestId);
    } else {
      newSelected.add(requestId);
    }
    setSelectedRequests(newSelected);
  };

  // Select all requests
  const selectAllRequests = () => {
    const allIds = getAllRequestIds();
    setSelectedRequests(new Set(allIds));
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedRequests(new Set());
  };

  // Check if all requests are selected
  const isAllSelected = () => {
    const allIds = getAllRequestIds();
    return allIds.length > 0 && allIds.every(id => selectedRequests.has(id));
  };

  // Bulk approve selected requests
  const handleBulkApprove = async () => {
    if (selectedRequests.size === 0 || !bulkApprovalDeadline) {
      alert("Please select requests and set a deadline for bulk approval.");
      return;
    }

    setIsBulkProcessing(true);
    const errors = [];
    const successes = [];

    try {
      // Process each selected request
      const selectedArray = Array.from(selectedRequests);
      
      for (const requestId of selectedArray) {
        try {
          const payload = {
            requestId: requestId,
            status: "approved",
            newDeadline: new Date(bulkApprovalDeadline).toISOString(),
          };

          const response = await updateRequestStatus(facultyType, payload);
          
          if (response.success) {
            successes.push(requestId);
            removeRequestFromState(requestId);
          } else {
            errors.push(`Request ${requestId}: ${response.message}`);
          }
        } catch (err) {
          errors.push(`Request ${requestId}: ${err.message || 'Unknown error'}`);
        }
      }

      // Show results
      if (successes.length > 0) {
        alert(`Successfully approved ${successes.length} request(s).`);
      }
      
      if (errors.length > 0) {
        alert(`Errors occurred:\n${errors.join('\n')}`);
      }

      // Clear selections and close bulk actions
      clearAllSelections();
      setShowBulkActions(false);
      setBulkApprovalDeadline("");

    } catch (err) {
      console.error("Bulk approval error:", err);
      alert("An error occurred during bulk approval. Please try again.");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Bulk reject selected requests
  const handleBulkReject = async () => {
    if (selectedRequests.size === 0) {
      alert("Please select requests to reject.");
      return;
    }

    const confirmReject = window.confirm(
      `Are you sure you want to reject ${selectedRequests.size} selected request(s)? This action cannot be undone.`
    );

    if (!confirmReject) return;

    setIsBulkProcessing(true);
    const errors = [];
    const successes = [];

    try {
      const selectedArray = Array.from(selectedRequests);
      
      for (const requestId of selectedArray) {
        try {
          const payload = {
            requestId: requestId,
            status: "rejected",
          };

          const response = await updateRequestStatus(facultyType, payload);
          
          if (response.success) {
            successes.push(requestId);
            removeRequestFromState(requestId);
          } else {
            errors.push(`Request ${requestId}: ${response.message}`);
          }
        } catch (err) {
          errors.push(`Request ${requestId}: ${err.message || 'Unknown error'}`);
        }
      }

      // Show results
      if (successes.length > 0) {
        alert(`Successfully rejected ${successes.length} request(s).`);
      }
      
      if (errors.length > 0) {
        alert(`Errors occurred:\n${errors.join('\n')}`);
      }

      // Clear selections and close bulk actions
      clearAllSelections();
      setShowBulkActions(false);

    } catch (err) {
      console.error("Bulk rejection error:", err);
      alert("An error occurred during bulk rejection. Please try again.");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Initialize bulk deadline to 7 days from now when bulk actions are shown
  useEffect(() => {
    if (showBulkActions && !bulkApprovalDeadline) {
      const today = new Date();
      today.setDate(today.getDate() + 7);
      setBulkApprovalDeadline(today.toISOString().split("T")[0]);
    }
  }, [showBulkActions]);

  // Clear selections when faculty type changes
  useEffect(() => {
    clearAllSelections();
    setShowBulkActions(false);
  }, [facultyType]);

  // [Rest of your existing useEffects and functions remain the same...]
  useEffect(() => {
    if (!contextLoading && (!school || !department)) {
      console.log("Admin context missing, redirecting to school selection");
      navigate("/admin/school-selection");
    }
  }, [contextLoading, school, department, navigate]);

  const fetchRequestsByType = async (type) => {
    if (!school || !department) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      console.log(`=== FETCHING ${type.toUpperCase()} REQUESTS ===`);
      console.log(`School: ${school}, Department: ${department}`);
      
      const { data, error: apiError } = await fetchRequests(type, school, department);
      
      console.log('API Response:', { data, apiError });
      
      if (apiError) {
        if (apiError.includes("No requests found") || apiError.includes("not found")) {
          console.log('No requests found - this is normal, not an error');
          setRequests([]);
          setError("");
        } else {
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
      } else {
        setRequests([]);
        setError("");
      }
    } catch (err) {
      console.error("Error in fetchRequestsByType:", err);
      
      if (err.response?.status === 404 || err.message?.includes("404")) {
        console.log('404 error - no requests found, treating as empty state');
        setRequests([]);
        setError("");
      } else {
        setError("Unable to load requests. Please check your connection and try again.");
        setRequests([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (school && department) {
      fetchRequestsByType(facultyType);
    }
  }, [facultyType, school, department]);

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

  const handleChangeSchoolDepartment = () => {
    sessionStorage.removeItem("adminContext");
    window.location.reload(); 
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
        alert(response.message || "Request approved successfully");
        handleCloseApprovalModal();
      } else {
        setError(response.message || "Failed to approve request status");
      }
    } catch (err) {
      console.error("Error approving request:", err);
      setError("Failed to approve request. Please try again.");
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
        alert(response.message || "Request rejected successfully");
      } else {
        setError(response.message || "Failed to reject request status");
      }
    } catch (err) {
      console.error("Error rejecting request:", err);
      setError("Failed to reject request. Please try again.");
    }
  };

  // [Loading and error states remain the same...]
  if (contextLoading) {
    return (
      <>
        <Navbar showLeftMenu={true} />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-x-hidden">
          <div className="pl-40 pt-20 w-[calc(100%-10rem)]">
            <div className="p-6 md:p-10">
              <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 p-8">
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600 text-lg">Loading admin context...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (contextError || !school || !department) {
    return (
      <>
        <Navbar showLeftMenu={true} />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-x-hidden">
          <div className="pl-40 pt-20 w-[calc(100%-10rem)]">
            <div className="p-6 md:p-10">
              <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 p-8">
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaTimes className="w-8 h-8 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Context Required</h2>
                  <p className="text-gray-600 mb-6">
                    {contextError || "Please select your school and department to view requests"}
                  </p>
                  <button
                    onClick={() => navigate("/admin/school-selection")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Select School & Department
                  </button>
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
      <Navbar showLeftMenu={true} />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-x-hidden">
        <div className="pl-40 pt-20 w-[calc(100%-10rem)]">
          <div className="p-6 md:p-10">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="font-bold text-3xl md:text-4xl text-gray-900 tracking-tight">
                      Pending Requests
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Managing {getDisplayString()} requests
                    </p>
                  </div>
                </div>
                
                {/* Admin Context Display & Change Button */}
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">{getDisplayString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleChangeSchoolDepartment}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Change Context
                  </button>
                </div>
              </div>
              
              {/* Faculty Type Toggle */}
              <div className="inline-flex bg-white rounded-xl p-1.5 shadow-md border border-gray-100">
                <button
                  onClick={() => setFacultyType("panel")}
                  className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                    facultyType === "panel"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md transform scale-105"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  <Users size={16} />
                  Panel Members
                </button>
                <button
                  onClick={() => setFacultyType("guide")}
                  className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                    facultyType === "guide"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md transform scale-105"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  <FaGraduationCap size={16} />
                  Guides
                </button>
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {requests.length > 0 && (
              <div className="mb-6">
                <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-xl border border-white/20 p-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={isAllSelected() ? clearAllSelections : selectAllRequests}
                        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                      >
                        {isAllSelected() ? (
                          <CheckSquare size={16} className="text-blue-600" />
                        ) : (
                          <Square size={16} />
                        )}
                        {isAllSelected() ? "Deselect All" : "Select All"}
                      </button>
                      
                      {selectedRequests.size > 0 && (
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          {selectedRequests.size} selected
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {selectedRequests.size > 0 && (
                        <>
                          <button
                            onClick={() => setShowBulkActions(!showBulkActions)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                            disabled={isBulkProcessing}
                          >
                            <FaCheck size={14} />
                            Bulk Approve ({selectedRequests.size})
                          </button>
                          <button
                            onClick={handleBulkReject}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                            disabled={isBulkProcessing}
                          >
                            <FaTimes size={14} />
                            Bulk Reject ({selectedRequests.size})
                          </button>
                        </>
                      )}
                      
                      {selectedRequests.size > 0 && (
                        <button
                          onClick={clearAllSelections}
                          className="text-gray-600 hover:text-gray-800 px-3 py-2 text-sm font-medium transition-colors"
                        >
                          Clear Selection
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bulk Approval Deadline Picker */}
                  {showBulkActions && selectedRequests.size > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-green-600" />
                          <div>
                            <h3 className="font-medium text-gray-800">Set Deadline for Bulk Approval</h3>
                            <p className="text-sm text-gray-600">This deadline will apply to all selected requests</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="date"
                            value={bulkApprovalDeadline}
                            onChange={(e) => setBulkApprovalDeadline(e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            min={new Date().toISOString().split("T")[0]}
                          />
                          <button
                            onClick={handleBulkApprove}
                            disabled={!bulkApprovalDeadline || isBulkProcessing}
                            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-lg font-semibold text-sm hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {isBulkProcessing ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Processing...
                              </>
                            ) : (
                              <>
                                <FaCheck size={14} />
                                Approve All Selected
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600 text-lg">Loading {facultyType} requests...</p>
                </div>
              ) : error ? (
                <div className="p-8">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaTimes className="w-6 h-6 text-red-600" />
                    </div>
                    <p className="text-red-800 font-medium text-lg mb-2">Error Loading Requests</p>
                    <p className="text-red-600">{error}</p>
                    <button
                      onClick={() => fetchRequestsByType(facultyType)}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : requests.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileText className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Pending Requests</h3>
                  <p className="text-gray-500 mb-4">
                    There are no pending {facultyType} requests for {getDisplayString()} at the moment.
                  </p>
                  <button
                    onClick={() => fetchRequestsByType(facultyType)}
                    className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 mx-auto"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {requests.map((faculty, index) => (
                    <div 
                      key={faculty._id} 
                      className="border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 bg-white overflow-hidden"
                    >
                      <div
                        className="cursor-pointer flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-blue-50 hover:from-gray-100 hover:to-blue-100 transition-all duration-200"
                        onClick={() => toggleExpand(faculty._id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg shadow-sm">
                            {expanded[faculty._id] ? (
                              <ChevronDown size={20} className="text-gray-600" />
                            ) : (
                              <ChevronRight size={20} className="text-gray-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <FaUser className="text-blue-600" size={16} />
                              <h2 className="font-bold text-xl text-gray-800">
                                {faculty.name}
                              </h2>
                              {faculty.empId && (
                                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                  ID: {faculty.empId}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm">Click to view pending requests</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-md">
                            {faculty.students.length} pending
                          </div>
                        </div>
                      </div>

                      {expanded[faculty._id] && (
                        <div className="border-t border-gray-100">
                          <div className="overflow-x-auto">
                            <table className="min-w-full">
                              <thead className="bg-gradient-to-r from-gray-100 to-blue-100">
                                <tr>
                                  <th className="p-4 text-left font-semibold text-gray-700 border-b border-gray-200">
                                    <div className="flex items-center gap-2">
                                      <CheckSquare size={14} />
                                      Select
                                    </div>
                                  </th>
                                  <th className="p-4 text-left font-semibold text-gray-700 border-b border-gray-200">
                                    <div className="flex items-center gap-2">
                                      <FaUser size={14} />
                                      Student Details
                                    </div>
                                  </th>
                                  <th className="p-4 text-center font-semibold text-gray-700 border-b border-gray-200">
                                    Registration
                                  </th>
                                  <th className="p-4 text-center font-semibold text-gray-700 border-b border-gray-200">
                                    Review Type
                                  </th>
                                  <th className="p-4 text-left font-semibold text-gray-700 border-b border-gray-200">
                                    Comments
                                  </th>
                                  <th className="p-4 text-center font-semibold text-gray-700 border-b border-gray-200">
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {faculty.students.map((student, studentIndex) => (
                                  <tr
                                    key={student.requestId}
                                    className={`hover:bg-blue-50 transition-colors duration-150 ${
                                      selectedRequests.has(student.requestId) ? 'bg-blue-100' : 
                                      studentIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                    }`}
                                  >
                                    <td className="p-4 border-b border-gray-100">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleRequestSelection(student.requestId);
                                        }}
                                        className="text-blue-600 hover:text-blue-800 transition-colors"
                                      >
                                        {selectedRequests.has(student.requestId) ? (
                                          <CheckSquare size={16} />
                                        ) : (
                                          <Square size={16} />
                                        )}
                                      </button>
                                    </td>
                                    <td className="p-4 border-b border-gray-100">
                                      <div className="font-medium text-gray-900">{student.name}</div>
                                    </td>
                                    <td className="p-4 text-center border-b border-gray-100">
                                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                        {student.regNo}
                                      </span>
                                    </td>
                                    <td className="p-4 text-center border-b border-gray-100">
                                      <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                                        {student.projectType}
                                      </span>
                                    </td>
                                    <td className="p-4 border-b border-gray-100">
                                      <div className="text-gray-700 text-sm max-w-xs truncate" title={student.comments}>
                                        {student.comments}
                                      </div>
                                    </td>
                                    <td className="p-4 border-b border-gray-100">
                                      <div className="flex justify-center items-center">
                                        {approvingRequestId === student.requestId ? (
                                          <div className="bg-white border-2 border-blue-200 rounded-xl p-4 shadow-lg min-w-[200px]">
                                            <div className="text-center mb-3">
                                              <Calendar className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                                              <p className="text-sm font-medium text-gray-800">
                                                Set Review Deadline
                                              </p>
                                            </div>
                                            <input
                                              type="date"
                                              value={selectedDeadline}
                                              onChange={(e) =>
                                                setSelectedDeadline(e.target.value)
                                              }
                                              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                                              min={
                                                new Date()
                                                  .toISOString()
                                                  .split("T")[0]
                                              }
                                            />
                                            <div className="flex gap-2">
                                              <button
                                                onClick={handleSubmitApproval}
                                                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
                                              >
                                                Confirm
                                              </button>
                                              <button
                                                onClick={handleCloseApprovalModal}
                                                className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-all duration-200"
                                              >
                                                Cancel
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex gap-2">
                                            <button
                                              onClick={() =>
                                                handleOpenApprovalModal(
                                                  student.requestId
                                                )
                                              }
                                              className="bg-gradient-to-r from-green-500 to-green-600 text-white p-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                                              title="Approve Request"
                                            >
                                              <FaCheck size={14} />
                                            </button>
                                            <button
                                              onClick={() =>
                                                handleReject(student.requestId)
                                              }
                                              className="bg-gradient-to-r from-red-500 to-red-600 text-white p-3 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
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
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RequestPage;
