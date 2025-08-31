import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getFilteredStudents } from "../api";
import Navbar from "../Components/UniversalNavbar";
import * as XLSX from 'xlsx';
import {
  Users,
  Download,
  Filter,
  Search,
  Building2,
  GraduationCap,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  X,
  BookOpen,
  Award,
  CalendarDays,
  Settings,
  ChevronDown,
  ChevronRight,
  Database,
  Grid3X3,
  BarChart3,
} from "lucide-react";

const AdminStudentManagement = () => {
  const navigate = useNavigate();
  
  // Core state
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [adminContext, setAdminContext] = useState(null);
  
  // Filter states
  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedReviewFilter, setSelectedReviewFilter] = useState("all");
  const [reviewStatusFilter, setReviewStatusFilter] = useState("all");
  
  // UI states
  const [expandedStudents, setExpandedStudents] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
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

  // Check for admin context
  useEffect(() => {
    const savedAdminContext = sessionStorage.getItem("adminContext");
    if (!savedAdminContext) {
      navigate("/admin/school-selection");
      return;
    }
    
    try {
      const parsedContext = JSON.parse(savedAdminContext);
      
      if (parsedContext.skipped) {
        setAdminContext({ school: null, department: null, skipped: true });
      } else if (parsedContext.school && parsedContext.department) {
        setAdminContext(parsedContext);
      } else {
        navigate("/admin/school-selection");
      }
    } catch (error) {
      console.error("Failed to parse admin context:", error);
      navigate("/admin/school-selection");
    }
  }, [navigate]);

  // Fetch students data
  const fetchStudents = useCallback(async () => {
    if (!adminContext) return;
    
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      
      // Add filters based on context and current selections
      if (!adminContext.skipped) {
        if (adminContext.school) params.append('school', adminContext.school);
        if (adminContext.department) params.append('department', adminContext.department);
      }
      
      // Add additional filters if different from context
      if (selectedSchool && selectedSchool !== adminContext.school) {
        params.set('school', selectedSchool);
      }
      if (selectedDepartment && selectedDepartment !== adminContext.department) {
        params.set('department', selectedDepartment);
      }
      
      const response = await getFilteredStudents(params);
      
      if (response?.data?.students) {
        setStudents(response.data.students);
        showNotification("success", "Data Loaded", `Successfully loaded ${response.data.students.length} students`);
      } else {
        setStudents([]);
        showNotification("error", "No Data", "No students found matching the criteria");
      }
      
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents([]);
      showNotification("error", "Fetch Failed", "Failed to load student data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [adminContext, selectedSchool, selectedDepartment, showNotification]);

  useEffect(() => {
    if (adminContext) {
      fetchStudents();
    }
  }, [adminContext, fetchStudents]);

  // Handle context change - redirect to school selection
  const handleChangeSchoolDepartment = useCallback(() => {
    sessionStorage.removeItem("adminContext");
    // Store current path to return after context selection
    sessionStorage.setItem('adminReturnPath', '/admin/student-management');
    navigate("/admin/school-selection");
  }, [navigate]);

  // Get unique schools and departments from students
  const availableSchools = useMemo(() => {
    const schools = [...new Set(students.map(s => s.school).filter(Boolean))];
    return schools.sort();
  }, [students]);

  const availableDepartments = useMemo(() => {
    const deps = [...new Set(students.map(s => s.department).filter(Boolean))];
    return deps.sort();
  }, [students]);

  // Get all unique review types from all students
  const availableReviewTypes = useMemo(() => {
    const reviewTypes = new Set();
    students.forEach(student => {
      if (student.reviews) {
        Object.keys(student.reviews).forEach(reviewType => {
          reviewTypes.add(reviewType);
        });
      }
    });
    return Array.from(reviewTypes).sort();
  }, [students]);

  // Filter students based on search and filters
  const filteredStudents = useMemo(() => {
    let filtered = [...students];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(student => 
        student.name?.toLowerCase().includes(query) ||
        student.regNo?.toLowerCase().includes(query) ||
        student.emailId?.toLowerCase().includes(query) ||
        student.school?.toLowerCase().includes(query) ||
        student.department?.toLowerCase().includes(query)
      );
    }

    // School filter
    if (selectedSchool) {
      filtered = filtered.filter(student => student.school === selectedSchool);
    }

    // Department filter
    if (selectedDepartment) {
      filtered = filtered.filter(student => student.department === selectedDepartment);
    }

    // Review filter
    if (selectedReviewFilter !== "all") {
      filtered = filtered.filter(student => {
        const hasReview = student.reviews && student.reviews[selectedReviewFilter];
        return hasReview;
      });
    }

    // Review status filter
    if (reviewStatusFilter !== "all" && selectedReviewFilter !== "all") {
      filtered = filtered.filter(student => {
        const review = student.reviews?.[selectedReviewFilter];
        if (!review) return false;
        
        switch (reviewStatusFilter) {
          case "locked":
            return review.locked === true;
          case "unlocked":
            return review.locked !== true;
          case "hasMarks":
            return review.marks && Object.keys(review.marks).length > 0;
          case "noMarks":
            return !review.marks || Object.keys(review.marks).length === 0;
          case "hasComments":
            return review.comments && review.comments.trim().length > 0;
          case "noComments":
            return !review.comments || review.comments.trim().length === 0;
          case "attended":
            return review.attendance?.value === true;
          case "notAttended":
            return review.attendance?.value !== true;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [students, searchQuery, selectedSchool, selectedDepartment, selectedReviewFilter, reviewStatusFilter]);

  // Toggle student expansion
  const toggleStudentExpanded = useCallback((regNo) => {
    setExpandedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(regNo)) {
        newSet.delete(regNo);
      } else {
        newSet.add(regNo);
      }
      return newSet;
    });
  }, []);

  // Calculate review status for a student
  const getReviewStatus = useCallback((student, reviewType) => {
    const review = student.reviews?.[reviewType];
    if (!review) return { status: "none", color: "gray" };
    
    const hasMarks = review.marks && Object.keys(review.marks).length > 0;
    const hasComments = review.comments && review.comments.trim().length > 0;
    const isLocked = review.locked === true;
    const attended = review.attendance?.value === true;
    
    if (isLocked && hasMarks && attended) {
      return { status: "completed", color: "green" };
    } else if (hasMarks || hasComments) {
      return { status: "partial", color: "yellow" };
    } else if (!isLocked) {
      return { status: "available", color: "blue" };
    } else {
      return { status: "locked", color: "red" };
    }
  }, []);

  // Enhanced Download Excel function with complete student data
  const downloadExcel = useCallback(() => {
    try {
      // Prepare detailed data for Excel including marks from reviews
      const excelData = filteredStudents.map(student => {
        const row = {
          'Semester': 'CH20242505',
          'Class Number': 'CH2024250502680', 
          'Mark Mode Code': 'PE005',
          'Register No': student.regNo || '',
          'Name': student.name || '',
          'School': student.school || '',
          'Department': student.department || '',
          'Email': student.emailId || '',
        };

        // Add review marks if available
        if (student.reviews) {
          Object.entries(student.reviews).forEach(([reviewType, reviewData]) => {
            if (reviewData.marks) {
              // Add individual mark components
              Object.entries(reviewData.marks).forEach(([component, mark]) => {
                row[`${reviewType}_${component}`] = mark;
              });
            }
            
            // Add review status info
            row[`${reviewType}_Status`] = reviewData.locked ? 'Locked' : 'Unlocked';
            row[`${reviewType}_Attendance`] = reviewData.attendance?.value ? 'Present' : 'Absent';
            
            if (reviewData.comments) {
              row[`${reviewType}_Comments`] = reviewData.comments;
            }
          });
        }

        // Add PPT approval status
        row['PPT_Approved'] = student.pptApproved?.approved ? 'Yes' : 'No';
        row['PPT_Locked'] = student.pptApproved?.locked ? 'Yes' : 'No';

        // Add deadlines
        if (student.deadline) {
          Object.entries(student.deadline).forEach(([type, deadlineData]) => {
            row[`Deadline_${type}_From`] = deadlineData.from ? new Date(deadlineData.from).toLocaleDateString() : '';
            row[`Deadline_${type}_To`] = deadlineData.to ? new Date(deadlineData.to).toLocaleDateString() : '';
          });
        }

        return row;
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Auto-size columns
      const colWidths = [];
      const headers = Object.keys(excelData[0] || {});
      headers.forEach((header, index) => {
        const maxLength = Math.max(
          header.length,
          ...excelData.map(row => String(row[header] || '').length)
        );
        colWidths[index] = { width: Math.min(maxLength + 2, 50) };
      });
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Student_Management_Export");

      // Generate filename with timestamp and context
      const timestamp = new Date().toISOString().split('T')[0];
      const contextStr = adminContext.skipped 
        ? 'All_Schools_Departments' 
        : `${adminContext.school}_${adminContext.department}`.replace(/\s+/g, '_');
      const filename = `Student_Management_${contextStr}_${timestamp}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);
      
      showNotification("success", "Download Complete", `Excel file downloaded: ${filename} (${filteredStudents.length} students)`);
    } catch (error) {
      console.error("Excel download error:", error);
      showNotification("error", "Download Failed", "Failed to download Excel file. Please try again.");
    }
  }, [filteredStudents, adminContext, showNotification]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="pt-20 pl-24 min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md mx-auto text-center">
            <div className="relative mb-8">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-slate-200 border-t-blue-600 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Database className="h-8 w-8 text-blue-600 animate-pulse" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">Loading Student Database</h3>
            <p className="text-slate-600">Retrieving student records and academic data...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="pt-20 pl-24 min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
        
        {/* Page Header with Context */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg mx-8 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Database className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Student Database Management</h1>
                  <p className="text-indigo-100 mt-1">Comprehensive student records and academic tracking</p>
                </div>
              </div>
              
              {adminContext && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-white/90 text-sm">Current Context</div>
                      <div className="text-white font-semibold">
                        {adminContext.skipped ? 'All Schools & Departments' : `${adminContext.school} - ${adminContext.department}`}
                      </div>
                    </div>
                    <button
                      onClick={handleChangeSchoolDepartment}
                      className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium"
                    >
                      Change Context
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="mx-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Students</p>
                  <p className="text-3xl font-bold mt-1">{students.length.toLocaleString()}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Users className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Filtered Results</p>
                  <p className="text-3xl font-bold mt-1">{filteredStudents.length.toLocaleString()}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Filter className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Schools</p>
                  <p className="text-3xl font-bold mt-1">{availableSchools.length}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Building2 className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Departments</p>
                  <p className="text-3xl font-bold mt-1">{availableDepartments.length}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <GraduationCap className="h-8 w-8" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters Panel */}
        <div className="mx-8 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                  <Search className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Search & Filter Controls</h2>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium"
                >
                  <Grid3X3 className="h-4 w-4" />
                  <span>Advanced Filters</span>
                  {showFilters ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <button
                  onClick={downloadExcel}
                  disabled={filteredStudents.length === 0}
                  className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg font-medium disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Excel ({filteredStudents.length})</span>
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search by student name, registration number, email, school, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-slate-700 placeholder-slate-400 text-lg"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  <X className="h-5 w-5 text-slate-400 hover:text-slate-600 transition-colors" />
                </button>
              )}
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="border-t border-slate-200 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">School Filter</label>
                    <select
                      value={selectedSchool}
                      onChange={(e) => setSelectedSchool(e.target.value)}
                      className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="">All Schools</option>
                      {availableSchools.map(school => (
                        <option key={school} value={school}>{school}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Department Filter</label>
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="">All Departments</option>
                      {availableDepartments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Review Type</label>
                    <select
                      value={selectedReviewFilter}
                      onChange={(e) => setSelectedReviewFilter(e.target.value)}
                      className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="all">All Reviews</option>
                      {availableReviewTypes.map(reviewType => (
                        <option key={reviewType} value={reviewType}>{reviewType}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Review Status</label>
                    <select
                      value={reviewStatusFilter}
                      onChange={(e) => setReviewStatusFilter(e.target.value)}
                      disabled={selectedReviewFilter === "all"}
                      className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                    >
                      <option value="all">All Statuses</option>
                      <option value="locked">Locked</option>
                      <option value="unlocked">Unlocked</option>
                      <option value="hasMarks">Has Marks</option>
                      <option value="noMarks">No Marks</option>
                      <option value="hasComments">Has Comments</option>
                      <option value="noComments">No Comments</option>
                      <option value="attended">Attended</option>
                      <option value="notAttended">Not Attended</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-start">
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedSchool("");
                      setSelectedDepartment("");
                      setSelectedReviewFilter("all");
                      setReviewStatusFilter("all");
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-lg font-medium transition-all duration-200"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Clear All Filters</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Students Data Display */}
        <div className="mx-8 mb-8">
          <div className="bg-white rounded-2xl shadow-lg">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-20">
                <div className="mx-auto w-32 h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-8">
                  <Users className="h-16 w-16 text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-600 mb-3">No Students Found</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  No students match your current search and filter criteria. Try adjusting your filters to find the records you're looking for.
                </p>
              </div>
            ) : (
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">
                      Student Records ({filteredStudents.length.toLocaleString()})
                    </h2>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setExpandedStudents(new Set(filteredStudents.map(s => s.regNo)))}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Expand All</span>
                    </button>
                    <button
                      onClick={() => setExpandedStudents(new Set())}
                      className="flex items-center space-x-2 px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-all"
                    >
                      <EyeOff className="h-4 w-4" />
                      <span>Collapse All</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredStudents.map((student) => {
                    const isExpanded = expandedStudents.has(student.regNo);
                    
                    return (
                      <div
                        key={student.regNo}
                        className="border border-slate-200 rounded-xl bg-gradient-to-r from-white to-slate-50 hover:shadow-lg transition-all duration-300"
                      >
                        <div
                          className="flex justify-between items-center p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={() => toggleStudentExpanded(student.regNo)}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl">
                              {isExpanded ? (
                                <ChevronDown className="text-blue-600 h-6 w-6" />
                              ) : (
                                <ChevronRight className="text-blue-600 h-6 w-6" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-bold text-xl text-slate-800 mb-1">
                                {student.name}
                              </h4>
                              <div className="flex items-center space-x-6 text-sm text-slate-600">
                                <span className="flex items-center space-x-1">
                                  <BookOpen className="h-4 w-4" />
                                  <span>{student.regNo}</span>
                                </span>
                                <span>{student.emailId}</span>
                                {student.school && <span>{student.school}</span>}
                                {student.department && <span>{student.department}</span>}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            {student.reviews && Object.keys(student.reviews).length > 0 && (
                              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
                                <FileSpreadsheet className="h-4 w-4" />
                                <span>{Object.keys(student.reviews).length} reviews</span>
                              </span>
                            )}
                            {student.pptApproved?.approved && (
                              <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
                                <Award className="h-4 w-4" />
                                <span>PPT Approved</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-slate-200 p-6 bg-slate-50">
                            {/* Reviews Section */}
                            {student.reviews && Object.keys(student.reviews).length > 0 ? (
                              <div className="mb-8">
                                <h5 className="font-bold text-xl mb-6 text-slate-800 flex items-center space-x-2">
                                  <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                                  <span>Academic Review History</span>
                                </h5>
                                <div className="grid gap-6 md:grid-cols-2">
                                  {Object.entries(student.reviews).map(([reviewType, review]) => {
                                    const status = getReviewStatus(student, reviewType);
                                    
                                    return (
                                      <div key={reviewType} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                          <h6 className="font-bold text-lg text-slate-800">{reviewType}</h6>
                                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                            status.color === 'green' ? 'bg-emerald-100 text-emerald-800' :
                                            status.color === 'yellow' ? 'bg-amber-100 text-amber-800' :
                                            status.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                                            status.color === 'red' ? 'bg-red-100 text-red-800' :
                                            'bg-slate-100 text-slate-800'
                                          }`}>
                                            {status.status}
                                          </span>
                                        </div>
                                        
                                        <div className="space-y-3">
                                          <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                                            <span className="font-semibold text-slate-700">Status:</span>
                                            {review.locked ? (
                                              <span className="flex items-center space-x-2 text-red-600">
                                                <XCircle className="h-4 w-4" />
                                                <span>Locked</span>
                                              </span>
                                            ) : (
                                              <span className="flex items-center space-x-2 text-emerald-600">
                                                <CheckCircle className="h-4 w-4" />
                                                <span>Unlocked</span>
                                              </span>
                                            )}
                                          </div>
                                          
                                          <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                                            <span className="font-semibold text-slate-700">Grading:</span>
                                            <span className="text-slate-600">
                                              {review.marks && Object.keys(review.marks).length > 0 
                                                ? `${Object.keys(review.marks).length} components graded` 
                                                : 'Not yet graded'}
                                            </span>
                                          </div>
                                          
                                          <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                                            <span className="font-semibold text-slate-700">Attendance:</span>
                                            {review.attendance?.value ? (
                                              <span className="flex items-center space-x-2 text-emerald-600">
                                                <CheckCircle className="h-4 w-4" />
                                                <span>Present</span>
                                              </span>
                                            ) : (
                                              <span className="flex items-center space-x-2 text-red-600">
                                                <XCircle className="h-4 w-4" />
                                                <span>Absent</span>
                                              </span>
                                            )}
                                          </div>
                                          
                                          {review.comments && (
                                            <div className="p-3 bg-blue-50 rounded-lg">
                                              <span className="font-semibold text-slate-700 block mb-2">Faculty Comments:</span>
                                              <p className="text-slate-700 text-sm leading-relaxed">
                                                {review.comments}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div className="mb-8">
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                                  <div className="flex items-center space-x-3 text-amber-800">
                                    <AlertTriangle className="h-6 w-6" />
                                    <div>
                                      <span className="font-bold block">No Academic Reviews</span>
                                      <span className="text-sm text-amber-700">This student has not undergone any academic reviews yet.</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* PPT Approval Section */}
                            <div className="mb-8">
                              <h5 className="font-bold text-xl mb-4 text-slate-800 flex items-center space-x-2">
                                <Award className="h-5 w-5 text-purple-600" />
                                <span>Presentation Status</span>
                              </h5>
                              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                                <div className="flex items-center space-x-4">
                                  <span className="font-semibold text-slate-700">Approval Status:</span>
                                  {student.pptApproved?.approved ? (
                                    <span className="flex items-center space-x-2 text-emerald-600">
                                      <CheckCircle className="h-5 w-5" />
                                      <span>Approved</span>
                                    </span>
                                  ) : (
                                    <span className="flex items-center space-x-2 text-red-600">
                                      <XCircle className="h-5 w-5" />
                                      <span>Pending Approval</span>
                                    </span>
                                  )}
                                  {student.pptApproved?.locked && (
                                    <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-sm font-semibold">
                                      Status Locked
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Deadlines Section */}
                            {student.deadline && Object.keys(student.deadline).length > 0 && (
                              <div>
                                <h5 className="font-bold text-xl mb-4 text-slate-800 flex items-center space-x-2">
                                  <CalendarDays className="h-5 w-5 text-orange-600" />
                                  <span>Academic Deadlines</span>
                                </h5>
                                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                                  <div className="space-y-3">
                                    {Object.entries(student.deadline).map(([type, deadline]) => (
                                      <div key={type} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                                        <Clock className="h-4 w-4 text-slate-500" />
                                        <span className="font-semibold text-slate-700">{type}:</span>
                                        <span className="text-slate-600">
                                          {deadline.from && new Date(deadline.from).toLocaleDateString()} 
                                          {deadline.from && deadline.to && ' - '}
                                          {deadline.to && new Date(deadline.to).toLocaleDateString()}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
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

export default AdminStudentManagement;
