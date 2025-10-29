import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getFilteredStudents, updateStudent, deleteStudent, getMarkingSchema } from "../api";
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
  Edit3,
  Trash2,
} from "lucide-react";

const AdminStudentManagement = () => {
  const navigate = useNavigate();
  
  // Core state
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [adminContext, setAdminContext] = useState(null);
const [studentSchemas, setStudentSchemas] = useState({}); // Store schemas by student regNo
const [loadingSchemas, setLoadingSchemas] = useState(new Set()); // Track which schemas are loading

  
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
  
  // Edit/Delete states
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

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
// Fetch students data
const fetchStudents = useCallback(async () => {
  if (!adminContext) return;
  
  try {
    setLoading(true);
    
    const params = new URLSearchParams();
    
    // Add filters based on context only (no auto-filtering on selections)
    if (!adminContext.skipped) {
      if (adminContext.school) params.append('school', adminContext.school);
      if (adminContext.department) params.append('department', adminContext.department);
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
}, [adminContext, showNotification]); // Removed selectedSchool, selectedDepartment dependencies


  useEffect(() => {
    if (adminContext) {
      fetchStudents();
    }
  }, [adminContext, fetchStudents]);
  // Apply filters manually
const applyFilters = useCallback(async () => {
  if (!adminContext) return;
  
  try {
    setLoading(true);
    
    const params = new URLSearchParams();
    
    // Add filters based on context
    if (!adminContext.skipped) {
      if (adminContext.school) params.append('school', adminContext.school);
      if (adminContext.department) params.append('department', adminContext.department);
    }
    
    // Add manual filter selections only when applying
    if (selectedSchool && selectedSchool !== adminContext.school) {
      params.set('school', selectedSchool);
    }
    if (selectedDepartment && selectedDepartment !== adminContext.department) {
      params.set('department', selectedDepartment);
    }
    
    const response = await getFilteredStudents(params);
    
    if (response?.data?.students) {
      setStudents(response.data.students);
      showNotification("success", "Filters Applied", `Successfully loaded ${response.data.students.length} students with filters`);
    } else {
      setStudents([]);
      showNotification("error", "No Data", "No students found matching the criteria");
    }
    
  } catch (error) {
    console.error("Error applying filters:", error);
    setStudents([]);
    showNotification("error", "Filter Failed", "Failed to apply filters. Please try again.");
  } finally {
    setLoading(false);
  }
}, [adminContext, selectedSchool, selectedDepartment, showNotification]);


  // Handle context change - redirect to school selection
  const handleChangeSchoolDepartment = useCallback(() => {
    sessionStorage.removeItem("adminContext");
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
const fetchSchemaForStudent = useCallback(async (student) => {
  const key = `${student.school}_${student.department}`;
  
  // Don't fetch if already loading or already have schema for this school/dept combination
  if (loadingSchemas.has(key) || studentSchemas[key]) {
    return;
  }

  try {
    setLoadingSchemas(prev => new Set(prev).add(key));
    
    const response = await getMarkingSchema(student.school, student.department);
    
    setStudentSchemas(prev => ({
      ...prev,
      [key]: response.schema
    }));
  } catch (error) {
    console.error('Error fetching schema for student:', error);
    // Set empty schema to avoid repeated requests
    setStudentSchemas(prev => ({
      ...prev,
      [key]: null
    }));
  } finally {
    setLoadingSchemas(prev => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
  }
}, [studentSchemas, loadingSchemas]);

const toggleStudentExpanded = useCallback(async (regNo) => {
  const student = students.find(s => s.regNo === regNo);
  
  setExpandedStudents(prev => {
    const newSet = new Set(prev);
    if (newSet.has(regNo)) {
      newSet.delete(regNo);
    } else {
      newSet.add(regNo);
      // Fetch schema when expanding
      if (student) {
        fetchSchemaForStudent(student);
      }
    }
    return newSet;
  });
}, [students, fetchSchemaForStudent]);


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
  // Add this function after your existing functions


  // Handle edit student (only basic fields)
  const handleEdit = useCallback((student) => {
    const basicData = {
      regNo: student.regNo,
      name: student.name,
      emailId: student.emailId,
      school: student.school,
      department: student.department,
      // Keep read-only data for display
      reviews: student.reviews,
      pptApproved: student.pptApproved,
      deadline: student.deadline
    };
    setFormData(basicData);
    setEditingStudent(student.regNo);
  }, []);

  // Handle form changes for basic fields only
  const handleBasicChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle save (only basic fields)
  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      await updateStudent(formData.regNo, formData);
      showNotification("success", "Updated", "Student details updated successfully");
      setEditingStudent(null);
      fetchStudents();
    } catch (error) {
      console.error("Error updating student:", error);
      showNotification("error", "Update Failed", "Failed to update student details. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [formData, showNotification, fetchStudents]);

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback((student) => {
    setDeleteConfirm(student);
  }, []);

  // Handle delete execution
  const handleDelete = useCallback(async () => {
    if (!deleteConfirm) return;
    
    try {
      await deleteStudent(deleteConfirm.regNo);
      showNotification("success", "Deleted", "Student deleted successfully");
      setDeleteConfirm(null);
      fetchStudents();
    } catch (error) {
      console.error("Error deleting student:", error);
      showNotification("error", "Delete Failed", "Failed to delete student. Please try again.");
    }
  }, [deleteConfirm, showNotification, fetchStudents]);
  const getReviewFilterOptions = useCallback(() => {
  // All mode (skip, or multiple departments): Only show "All Reviews"
  if (!adminContext || adminContext.skipped || !adminContext.school || !adminContext.department) {
    return [{ value: "all", label: "All Reviews" }];
  }
  // Get schema for current school-dept
  const key = `${adminContext.school}_${adminContext.department}`;
  const schema = studentSchemas[key];
  if (!schema || !schema.reviews || schema.reviews.length === 0) {
    return [{ value: "all", label: "All Reviews" }];
  }
  // Use schema reviews and display name
  const opts = schema.reviews.map(rv => ({
    value: rv.reviewName,
    label: rv.displayName || rv.reviewName
  }));
  return [{ value: "all", label: "All Reviews" }, ...opts];
}, [adminContext, studentSchemas]);


// Enhanced Download Excel function - Multi-sheet for all mode, single sheet for filtered mode
// Enhanced Download Excel function - Only downloads selected review type
const downloadExcelWithoutSplit = useCallback(async () => {
  try {
    // Show loading notification
    showNotification("info", "Preparing Excel", "Fetching schemas and organizing data...");
    
    // Group students by school and department
    const studentGroups = {};
    filteredStudents.forEach(student => {
      const key = `${student.school}_${student.department}`;
      if (!studentGroups[key]) {
        studentGroups[key] = [];
      }
      studentGroups[key].push(student);
    });

    // Collect all unique school/department combinations
    const uniqueCombinations = Object.keys(studentGroups);
    
    // Fetch schemas for all combinations that we don't already have
    const schemasToFetch = uniqueCombinations.filter(combo => !studentSchemas[combo]);
    
    // Create a temporary schemas object that includes both existing and new schemas
    let allSchemas = { ...studentSchemas };
    
    // Fetch missing schemas and store them temporarily
    for (const combo of schemasToFetch) {
      const [school, department] = combo.split('_');
      try {
        const response = await getMarkingSchema(school, department);
        allSchemas[combo] = response.schema;
        // Also update the state for future use
        setStudentSchemas(prev => ({ ...prev, [combo]: response.schema }));
      } catch (error) {
        console.error('Error fetching schema for ' + combo, error);
        allSchemas[combo] = null;
        setStudentSchemas(prev => ({ ...prev, [combo]: null }));
      }
    }

    // Update progress notification
    showNotification("info", "Processing Data", "Creating Excel with filtered review data...");

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Process each school/department group
    Object.entries(studentGroups).forEach(([groupKey, groupStudents]) => {
      const [school, department] = groupKey.split('_');
      const schema = allSchemas[groupKey]; // Use the local schemas object

// Prepare data for this group
const excelData = groupStudents.map(student => {
  const row = {
    "Semester (CH2024-25)": "05",
    "Class Number (CH2024-2505)": "02680",
    "Mark Mode Code": "PE005",
    "Register No": student.regNo,
    "Name": student.name,
    "School": student.school,
    "Department": student.department,
    "Email": student.emailId,

    "PAT_Detected": student.PAT ? "Yes" : "No"
  };

  // Only add the selected review type data (total marks, not component-wise)
  if (student.reviews && selectedReviewFilter !== "all") {
    const reviewData = student.reviews[selectedReviewFilter];
    if (reviewData) {
      // Get the review schema for display names
      const reviewSchema = schema?.reviews?.find(r => r.reviewName === selectedReviewFilter);
      const reviewDisplayName = reviewSchema?.displayName || selectedReviewFilter;

      // Calculate total marks for this review
      let totalMarks = 0;
      let patAdjustedMarks = 0; // ✅ NEW: Track PAT-adjusted marks
      
      if (reviewData.marks && typeof reviewData.marks === 'object') {
        Object.values(reviewData.marks).forEach(mark => {
          const numericMark = parseFloat(mark) || 0;
          totalMarks += numericMark;
          
          // ✅ NEW: Handle PAT special values (-1 or "PAT")
          if (mark === -1 || mark === "PAT") {
            patAdjustedMarks += 0; // PAT marks count as 0 for totals
          } else {
            patAdjustedMarks += numericMark;
          }
        });
      }

      // ✅ UPDATED: Add both total and PAT-adjusted marks
      row[`${reviewDisplayName}_Total_Marks`] = totalMarks;
      row[`${reviewDisplayName}_PAT_Adjusted_Marks`] = patAdjustedMarks;
      
      // ✅ NEW: Add PAT flag for this review
      const hasPATMarks = reviewData.marks && Object.values(reviewData.marks).some(mark => 
        mark === -1 || mark === "PAT"
      );
      row[`${reviewDisplayName}_Contains_PAT`] = hasPATMarks ? "Yes" : "No";

      // Add review status info using displayName
      row[`${reviewDisplayName}_Status`] = reviewData.locked ? "Locked" : "Unlocked";
      row[`${reviewDisplayName}_Attendance`] = reviewData.attendance?.value ? "Present" : "Absent";
      
      if (reviewData.comments) {
        row[`${reviewDisplayName}_Comments`] = reviewData.comments;
      }
    }
  } else if (selectedReviewFilter === "all") {
    // If "All Reviews" is selected, include total marks for all reviews
    if (student.reviews) {
      Object.entries(student.reviews).forEach(([reviewType, reviewData]) => {
        const reviewSchema = schema?.reviews?.find(r => r.reviewName === reviewType);
        const reviewDisplayName = reviewSchema?.displayName || reviewType;

        // Calculate total marks for this review
        let totalMarks = 0;
        let patAdjustedMarks = 0; // ✅ NEW: Track PAT-adjusted marks
        
        if (reviewData.marks && typeof reviewData.marks === 'object') {
          Object.values(reviewData.marks).forEach(mark => {
            const numericMark = parseFloat(mark) || 0;
            totalMarks += numericMark;
            
            // ✅ NEW: Handle PAT special values (-1 or "PAT")
            if (mark === -1 || mark === "PAT") {
              patAdjustedMarks += 0; // PAT marks count as 0 for totals
            } else {
              patAdjustedMarks += numericMark;
            }
          });
        }

        // ✅ UPDATED: Add both total and PAT-adjusted marks
        row[`${reviewDisplayName}_Total_Marks`] = totalMarks;
        row[`${reviewDisplayName}_PAT_Adjusted_Marks`] = patAdjustedMarks;
        
        // ✅ NEW: Add PAT flag for this review
        const hasPATMarks = reviewData.marks && Object.values(reviewData.marks).some(mark => 
          mark === -1 || mark === "PAT"
        );
        row[`${reviewDisplayName}_Contains_PAT`] = hasPATMarks ? "Yes" : "No";

        row[`${reviewDisplayName}_Status`] = reviewData.locked ? "Locked" : "Unlocked";
        row[`${reviewDisplayName}_Attendance`] = reviewData.attendance?.value ? "Present" : "Absent";
        
        if (reviewData.comments) {
          row[`${reviewDisplayName}_Comments`] = reviewData.comments;
        }
      });
    }
  }

  // Add PPT approval status
  row["PPT_Approved"] = student.pptApproved?.approved ? "Yes" : "No";
  row["PPT_Locked"] = student.pptApproved?.locked ? "Yes" : "No";

  // Add deadlines
  if (student.deadline) {
    Object.entries(student.deadline).forEach(([type, deadlineData]) => {
      row[`Deadline_${type}_From`] = deadlineData.from ? new Date(deadlineData.from).toLocaleDateString() : "";
      row[`Deadline_${type}_To`] = deadlineData.to ? new Date(deadlineData.to).toLocaleDateString() : "";
    });
  }

  return row;
});


      // Create worksheet for this group
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Auto-size columns
      const colWidths = [];
      const headers = Object.keys(excelData[0] || {});
      headers.forEach((header, index) => {
        const maxLength = Math.max(
          header.length,
          ...excelData.map(row => String(row[header] || "").length)
        );
        colWidths[index] = { width: Math.min(maxLength + 2, 50) };
      });
      ws['!cols'] = colWidths;

      // Create sheet name - truncate if too long (Excel limit is 31 chars)
      let sheetName = `${school}_${department}`.replace(/[?]/g, ''); // Remove invalid characters
      if (sheetName.length > 31) {
        sheetName = sheetName.substring(0, 28) + "...";
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    // Generate filename with timestamp and context
    const timestamp = new Date().toISOString().split('T')[0];
    let filename;
    
    if (adminContext.skipped || Object.keys(studentGroups).length > 1) {
      // All mode or multiple groups - multi-sheet file
      const reviewFilter = selectedReviewFilter === "all" ? "AllReviews" : selectedReviewFilter;
      filename = `StudentManagement_${reviewFilter}_${timestamp}.xlsx`;
      showNotification("success", "Download Complete", `Excel file downloaded: ${filename} (${Object.keys(studentGroups).length} sheets, ${filteredStudents.length} students)`);
    } else {
      // Single program mode
      const contextStr = `${adminContext.school}_${adminContext.department}`.replace(/[^a-zA-Z0-9]/g, '');
      const reviewFilter = selectedReviewFilter === "all" ? "AllReviews" : selectedReviewFilter;
      filename = `StudentManagement_${contextStr}_${reviewFilter}_${timestamp}.xlsx`;
      showNotification("success", "Download Complete", `Excel file downloaded: ${filename} (${filteredStudents.length} students)`);
    }

    // Save file
    XLSX.writeFile(wb, filename);

  } catch (error) {
    console.error("Excel download error:", error);
    showNotification("error", "Download Failed", "Failed to download Excel file. Please try again.");
  }
}, [filteredStudents, adminContext, showNotification, studentSchemas, getMarkingSchema, setStudentSchemas, selectedReviewFilter]);
// Add two separate download functions after your existing downloadExcel function


// Download WITH split - separate sheets for each department + review type combination
const downloadExcelWithSplit = useCallback(async () => {
  try {
    showNotification("info", "Preparing Excel", "Fetching schemas and organizing data with splits...");
    
    // Group students by school_department_reviewType
    const studentGroups = {};
    
    filteredStudents.forEach(student => {
      if (selectedReviewFilter === "all") {
        // For "All Reviews", create separate groups for each review type
        if (student.reviews) {
          Object.keys(student.reviews).forEach(reviewType => {
            const key = `${student.school}_${student.department}_${reviewType}`;
            if (!studentGroups[key]) {
              studentGroups[key] = [];
            }
            studentGroups[key].push({ ...student, _selectedReview: reviewType });
          });
        }
      } else {
        // For specific review, only include students with that review
        if (student.reviews && student.reviews[selectedReviewFilter]) {
          const key = `${student.school}_${student.department}_${selectedReviewFilter}`;
          if (!studentGroups[key]) {
            studentGroups[key] = [];
          }
          studentGroups[key].push({ ...student, _selectedReview: selectedReviewFilter });
        }
      }
    });

    const uniqueCombinations = Object.keys(studentGroups).map(key => {
      const parts = key.split('_');
      const reviewType = parts.pop();
      return parts.join('_');
    });
    
    const schemasToFetch = [...new Set(uniqueCombinations)].filter(combo => !studentSchemas[combo]);
    
    let allSchemas = { ...studentSchemas };
    
    for (const combo of schemasToFetch) {
      const [school, department] = combo.split('_');
      try {
        const response = await getMarkingSchema(school, department);
        allSchemas[combo] = response.schema;
        setStudentSchemas(prev => ({ ...prev, [combo]: response.schema }));
      } catch (error) {
        console.error('Error fetching schema for ' + combo, error);
        allSchemas[combo] = null;
        setStudentSchemas(prev => ({ ...prev, [combo]: null }));
      }
    }

    showNotification("info", "Processing Data", "Creating Excel with split review data...");

    const wb = XLSX.utils.book_new();

    Object.entries(studentGroups).forEach(([groupKey, groupStudents]) => {
      const parts = groupKey.split('_');
      const reviewType = parts.pop();
      const school = parts[0];
      const department = parts.slice(1).join('_');
      const schemaKey = `${school}_${department}`;
      const schema = allSchemas[schemaKey];

      const excelData = groupStudents.map(student => {
        const row = {
          "Semester (CH2024-25)": "05",
          "Class Number (CH2024-2505)": "02680",
          "Mark Mode Code": "PE005",
          "Register No": student.regNo,
          "Name": student.name,
          "School": student.school,
          "Department": student.department,
          "Email": student.emailId,
          "PAT_Detected": student.PAT ? "Yes" : "No"
        };

        // Only add data for the specific review type for this sheet
        const selectedReview = student._selectedReview;
        if (student.reviews && student.reviews[selectedReview]) {
          const reviewData = student.reviews[selectedReview];
          const reviewSchema = schema?.reviews?.find(r => r.reviewName === selectedReview);
          const reviewDisplayName = reviewSchema?.displayName || selectedReview;

          // ✅ ADD COMPONENT-WISE MARKS
          if (reviewData.marks && reviewSchema?.components) {
            reviewSchema.components.forEach(component => {
              const componentDisplayName = component.displayName || component.name;
              const markValue = reviewData.marks[component.name];
              
              // Handle PAT marks (-1 or "PAT")
              if (markValue === -1 || markValue === "PAT") {
                row[`${reviewDisplayName}_${componentDisplayName}`] = "PAT";
              } else {
                row[`${reviewDisplayName}_${componentDisplayName}`] = markValue ?? "N/A";
              }
            });
          } else if (reviewData.marks) {
            // Fallback: if no schema components, add raw marks
            Object.entries(reviewData.marks).forEach(([markKey, markValue]) => {
              if (markValue === -1 || markValue === "PAT") {
                row[`${reviewDisplayName}_${markKey}`] = "PAT";
              } else {
                row[`${reviewDisplayName}_${markKey}`] = markValue ?? "N/A";
              }
            });
          }

          // Calculate totals
          let totalMarks = 0;
          let patAdjustedMarks = 0;
          
          if (reviewData.marks && typeof reviewData.marks === 'object') {
            Object.values(reviewData.marks).forEach(mark => {
              const numericMark = parseFloat(mark) || 0;
              totalMarks += numericMark;
              
              if (mark === -1 || mark === "PAT") {
                patAdjustedMarks += 0;
              } else {
                patAdjustedMarks += numericMark;
              }
            });
          }

          row[`${reviewDisplayName}_Total_Marks`] = totalMarks;
          row[`${reviewDisplayName}_PAT_Adjusted_Marks`] = patAdjustedMarks;
          
          const hasPATMarks = reviewData.marks && Object.values(reviewData.marks).some(mark => 
            mark === -1 || mark === "PAT"
          );
          row[`${reviewDisplayName}_Contains_PAT`] = hasPATMarks ? "Yes" : "No";
          row[`${reviewDisplayName}_Status`] = reviewData.locked ? "Locked" : "Unlocked";
          row[`${reviewDisplayName}_Attendance`] = reviewData.attendance?.value ? "Present" : "Absent";
          
          if (reviewData.comments) {
            row[`${reviewDisplayName}_Comments`] = reviewData.comments;
          }
        }

        row["PPT_Approved"] = student.pptApproved?.approved ? "Yes" : "No";
        row["PPT_Locked"] = student.pptApproved?.locked ? "Yes" : "No";

        if (student.deadline) {
          Object.entries(student.deadline).forEach(([type, deadlineData]) => {
            row[`Deadline_${type}_From`] = deadlineData.from ? new Date(deadlineData.from).toLocaleDateString() : "";
            row[`Deadline_${type}_To`] = deadlineData.to ? new Date(deadlineData.to).toLocaleDateString() : "";
          });
        }

        return row;
      });

      const ws = XLSX.utils.json_to_sheet(excelData);

      const colWidths = [];
      const headers = Object.keys(excelData[0] || {});
      headers.forEach((header, index) => {
        const maxLength = Math.max(
          header.length,
          ...excelData.map(row => String(row[header] || "").length)
        );
        colWidths[index] = { width: Math.min(maxLength + 2, 50) };
      });
      ws['!cols'] = colWidths;

      // Get review display name for sheet name
      const reviewSchema = schema?.reviews?.find(r => r.reviewName === reviewType);
      const reviewDisplayName = reviewSchema?.displayName || reviewType;
      
      let sheetName = `${school}_${department}_${reviewDisplayName}`.replace(/[?]/g, '');
      if (sheetName.length > 31) {
        sheetName = sheetName.substring(0, 28) + "...";
      }

      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    const timestamp = new Date().toISOString().split('T')[0];
    let filename;
    
    if (adminContext.skipped || Object.keys(studentGroups).length > 1) {
      const reviewFilter = selectedReviewFilter === "all" ? "AllReviews" : selectedReviewFilter;
      filename = `StudentManagement_Split_${reviewFilter}_${timestamp}.xlsx`;
      showNotification("success", "Download Complete", `Excel file downloaded: ${filename} (${Object.keys(studentGroups).length} sheets with splits)`);
    } else {
      const contextStr = `${adminContext.school}_${adminContext.department}`.replace(/[^a-zA-Z0-9]/g, '');
      const reviewFilter = selectedReviewFilter === "all" ? "AllReviews" : selectedReviewFilter;
      filename = `StudentManagement_Split_${contextStr}_${reviewFilter}_${timestamp}.xlsx`;
      showNotification("success", "Download Complete", `Excel file downloaded: ${filename}`);
    }

    XLSX.writeFile(wb, filename);

  } catch (error) {
    console.error("Excel download error:", error);
    showNotification("error", "Download Failed", "Failed to download Excel file. Please try again.");
  }
}, [filteredStudents, adminContext, showNotification, studentSchemas, getMarkingSchema, setStudentSchemas, selectedReviewFilter]);




  if (loading) {
    return (
      <>
        <Navbar />
        <div className="pt-16 sm:pt-20 pl-4 sm:pl-24 min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-12 max-w-sm sm:max-w-md mx-auto text-center">
            <div className="relative mb-6 sm:mb-8">
              <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-4 border-slate-200 border-t-blue-600 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Database className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 animate-pulse" />
              </div>
            </div>
            <h3 className="text-lg sm:text-2xl font-bold text-slate-800 mb-3">Loading Student Database</h3>
            <p className="text-sm sm:text-base text-slate-600">Retrieving student records and academic data...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="pt-16 sm:pt-20 pl-4 sm:pl-24 min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
        
        {/* Page Header with Context */}
        <div className="mb-6 sm:mb-8 mx-4 sm:mx-8 bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-4 sm:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="bg-white/20 p-2 sm:p-3 rounded-xl">
                  <Database className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold text-white">Student Database Management</h1>
                  <p className="text-indigo-100 mt-1 text-sm sm:text-base">Comprehensive student records and academic tracking</p>
                </div>
              </div>
              
              {adminContext && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 w-full sm:w-auto">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <div className="text-left sm:text-right">
                      <div className="text-white/90 text-xs sm:text-sm">Current Programme</div>
                      <div className="text-white font-semibold text-sm sm:text-base">
                        {adminContext.skipped ? 'All Schools & Departments' : `${adminContext.school} - ${adminContext.department}`}
                      </div>
                    </div>
                    <button
                      onClick={handleChangeSchoolDepartment}
                      className="bg-white/20 hover:bg-white/30 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base w-full sm:w-auto"
                    >
                      Change Programme
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="mx-4 sm:mx-8 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs sm:text-sm font-medium">Total Students</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1">{students.length.toLocaleString()}</p>
                </div>
                <div className="bg-white/20 p-2 sm:p-3 rounded-xl">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-xs sm:text-sm font-medium">Filtered Results</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1">{filteredStudents.length.toLocaleString()}</p>
                </div>
                <div className="bg-white/20 p-2 sm:p-3 rounded-xl">
                  <Filter className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-xs sm:text-sm font-medium">Schools</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1">{availableSchools.length}</p>
                </div>
                <div className="bg-white/20 p-2 sm:p-3 rounded-xl">
                  <Building2 className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-xs sm:text-sm font-medium">Departments</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1">{availableDepartments.length}</p>
                </div>
                <div className="bg-white/20 p-2 sm:p-3 rounded-xl">
                  <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters Panel */}
        <div className="mx-4 sm:mx-8 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-8 gap-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-slate-800">Search & Filter Controls</h2>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 space-x-0 sm:space-x-4 w-full sm:w-auto">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium text-sm sm:text-base w-full sm:w-auto"
                >
                  <Grid3X3 className="h-4 w-4" />
                  <span>Advanced Filters</span>
                  {showFilters ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                 <button
    onClick={downloadExcelWithoutSplit}
    disabled={filteredStudents.length === 0}
    className="flex items-center space-x-2 px-4 sm:px-6 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg font-medium disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg text-sm sm:text-base w-full sm:w-auto"
  >
    <Download className="h-4 w-4" />
    <span>Export ({filteredStudents.length})</span>
  </button>
    <button
    onClick={downloadExcelWithSplit}
    disabled={filteredStudents.length === 0}
    className="flex items-center space-x-2 px-4 sm:px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg text-sm sm:text-base w-full sm:w-auto"
  >
    <FileSpreadsheet className="h-4 w-4" />
    <span>Export Split ({filteredStudents.length})</span>
  </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4 sm:mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search by student name, registration number, email, school, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2 sm:py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base text-slate-700 placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 hover:text-slate-600 transition-colors" />
                </button>
              )}
            </div>

 {/* Advanced Filters */}
{showFilters && (
  <div className="border-t border-slate-200 pt-4 sm:pt-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
      
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">Review Type</label>
        <select
          value={selectedReviewFilter}
          onChange={e => setSelectedReviewFilter(e.target.value)}
          className="w-full p-2 sm:p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
          disabled={
            !adminContext || adminContext.skipped ||
            !adminContext.school || !adminContext.department ||
            !(studentSchemas[`${adminContext.school}_${adminContext.department}`]?.reviews?.length > 0)
          }
        >
          {getReviewFilterOptions().map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">Review Status</label>
        <select
          value={reviewStatusFilter}
          onChange={(e) => setReviewStatusFilter(e.target.value)}
          disabled={selectedReviewFilter === "all"}
          className="w-full p-2 sm:p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed text-sm sm:text-base"
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

    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 space-x-0 sm:space-x-4">
      <button
        onClick={() => {
          setSearchQuery("");
          setSelectedSchool("");
          setSelectedDepartment("");
          setSelectedReviewFilter("all");
          setReviewStatusFilter("all");
        }}
        className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-lg font-medium transition-all duration-200 text-sm sm:text-base w-full sm:w-auto"
      >
        <RefreshCw className="h-4 w-4" />
        <span>Clear All Filters</span>
      </button>
      
      <button
        onClick={applyFilters}
        className="flex items-center space-x-2 px-4 sm:px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg text-sm sm:text-base w-full sm:w-auto"
      >
        <Filter className="h-4 w-4" />
        <span>Apply Filters</span>
      </button>
    </div>
  </div>
)}

          </div>
        </div>

        {/* Students Data Display */}
        <div className="mx-4 sm:mx-8 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl shadow-lg">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12 sm:py-20 px-4">
                <div className="mx-auto w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-6 sm:mb-8">
                  <Users className="h-12 w-12 sm:h-16 sm:w-16 text-slate-400" />
                </div>
                <h3 className="text-lg sm:text-2xl font-bold text-slate-600 mb-3">No Students Found</h3>
                <p className="text-sm sm:text-base text-slate-500 max-w-sm sm:max-w-md mx-auto">
                  No students match your current search and filter criteria. Try adjusting your filters to find the records you're looking for.
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
                      Student Records ({filteredStudents.length.toLocaleString()})
                    </h2>
                  </div>
                  <div className="flex space-x-3 w-full sm:w-auto">
                    <button
                      onClick={() => setExpandedStudents(new Set(filteredStudents.map(s => s.regNo)))}
                      className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all w-full sm:w-auto"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Expand All</span>
                    </button>
                    <button
                      onClick={() => setExpandedStudents(new Set())}
                      className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-all w-full sm:w-auto"
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
                          className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={() => toggleStudentExpanded(student.regNo)}
                        >
                   <div className="flex items-center space-x-3 sm:space-x-4">
  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl">
    {isExpanded ? (
      <ChevronDown className="text-blue-600 h-5 w-5 sm:h-6 sm:w-6" />
    ) : (
      <ChevronRight className="text-blue-600 h-5 w-5 sm:h-6 sm:w-6" />
    )}
  </div>
  <div>
    <div className="flex items-center space-x-2 mb-1">
      <h4 className="font-bold text-base sm:text-xl text-slate-800">
        {student.name}
      </h4>
      {/* ✅ NEW: PAT Status Stamp */}
      {student.PAT && (
        <div className="bg-red-100 border border-red-300 px-2 py-1 rounded-lg">
          <span className="text-red-800 text-xs font-bold">🚫 PAT</span>
        </div>
      )}
    </div>
    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-slate-600">
      <span className="flex items-center space-x-1">
        <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
        <span>{student.regNo}</span>
      </span>
      <span>{student.emailId}</span>
      {student.school && <span>{student.school}</span>}
      {student.department && <span>{student.department}</span>}
    </div>
  </div>
</div>

                          
                     <div className="flex items-center space-x-3 mt-3 sm:mt-0">
  {/* ✅ NEW: PAT Status Badge */}
  {student.PAT && (
    <span className="bg-red-100 text-red-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold flex items-center space-x-1">
      <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
      <span>PAT Flagged</span>
    </span>
  )}
  
  {student.reviews && Object.keys(student.reviews).length > 0 && (
    <span className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold flex items-center space-x-1">
      <FileSpreadsheet className="h-3 w-3 sm:h-4 sm:w-4" />
      <span>{Object.keys(student.reviews).length} reviews</span>
    </span>
  )}
  {student.pptApproved?.approved && (
    <span className="bg-emerald-100 text-emerald-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold flex items-center space-x-1">
      <Award className="h-3 w-3 sm:h-4 sm:w-4" />
      <span>PPT Approved</span>
    </span>
  )}
  
  {/* Action buttons */}
  <button
    onClick={(e) => {
      e.stopPropagation();
      handleEdit(student);
    }}
    className="text-slate-600 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-blue-50"
    title="Edit Student"
  >
    <Edit3 className="h-4 w-4" />
  </button>
  
  <button
    onClick={(e) => {
      e.stopPropagation();
      handleDeleteConfirm(student);
    }}
    className="text-slate-600 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50"
    title="Delete Student"
  >
    <Trash2 className="h-4 w-4" />
  </button>
</div>

                        </div>

                        {isExpanded && (
                          <div className="border-t border-slate-200 p-4 sm:p-6 bg-slate-50">
                            {/* Reviews Section */}
 {/* Reviews Section - WITH DYNAMIC SCHEMA LOADING */}
{student.reviews && Object.keys(student.reviews).length > 0 ? (
  <div className="mb-6 sm:mb-8">
    <h5 className="font-bold text-base sm:text-xl mb-4 sm:mb-6 text-slate-800 flex items-center space-x-2">
      <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
      <span>Academic Review History</span>
    </h5>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
      {Object.entries(student.reviews).map(([reviewType, review]) => {
        const status = getReviewStatus(student, reviewType);
        
        // Get schema for this student's school/department
        const schemaKey = `${student.school}_${student.department}`;
        const schema = studentSchemas[schemaKey];
        const isLoadingSchema = loadingSchemas.has(schemaKey);
        
        // Get display name from schema
        const reviewSchema = schema?.reviews?.find(r => r.reviewName === reviewType);
        const reviewDisplayName = reviewSchema?.displayName || reviewType;
        
        return (
          <div key={reviewType} className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <h6 className="font-bold text-base sm:text-lg text-slate-800">
                {isLoadingSchema ? (
                  <span className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                    <span>{reviewType}</span>
                  </span>
                ) : (
                  reviewDisplayName
                )}
              </h6>
              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold ${
                status.color === 'green' ? 'bg-emerald-100 text-emerald-800' :
                status.color === 'yellow' ? 'bg-amber-100 text-amber-800' :
                status.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                status.color === 'red' ? 'bg-red-100 text-red-800' :
                'bg-slate-100 text-slate-800'
              }`}>
                {status.status}
              </span>
            </div>
            
            {/* Display marks with component display names */}
            {review.marks && reviewSchema?.components && !isLoadingSchema && (
              <div className="mb-3">
                <span className="font-semibold text-slate-700 block mb-2 text-xs sm:text-sm">Marks:</span>
                <div className="grid grid-cols-2 gap-2">
                  {reviewSchema.components.map((component) => (
                    <div key={component.name} className="p-2 bg-slate-50 rounded text-xs">
                      <span className="font-medium">{component.displayName || component.name}:</span>
                      <span className="ml-1">{review.marks[component.name] ?? 'N/A'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Loading state for marks */}
            {review.marks && isLoadingSchema && (
              <div className="mb-3">
                <span className="font-semibold text-slate-700 block mb-2 text-xs sm:text-sm">Marks:</span>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(review.marks).map(([markKey, markValue]) => (
                    <div key={markKey} className="p-2 bg-slate-50 rounded text-xs">
                      <span className="font-medium">{markKey}:</span>
                      <span className="ml-1">{markValue ?? 'N/A'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-2 sm:p-3 bg-slate-50 rounded-lg">
                <span className="font-semibold text-slate-700 text-xs sm:text-sm">Status:</span>
                {review.locked ? (
                  <span className="flex items-center space-x-2 text-red-600 text-xs sm:text-sm">
                    <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Locked</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-2 text-emerald-600 text-xs sm:text-sm">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Unlocked</span>
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-3 p-2 sm:p-3 bg-slate-50 rounded-lg">
                <span className="font-semibold text-slate-700 text-xs sm:text-sm">Grading:</span>
                <span className="text-slate-600 text-xs sm:text-sm">
                  {review.marks && Object.keys(review.marks).length > 0 ? 
                    `${Object.keys(review.marks).length} components graded` : 
                    'Not yet graded'
                  }
                </span>
              </div>
              
              <div className="flex items-center space-x-3 p-2 sm:p-3 bg-slate-50 rounded-lg">
                <span className="font-semibold text-slate-700 text-xs sm:text-sm">Attendance:</span>
                {review.attendance?.value ? (
                  <span className="flex items-center space-x-2 text-emerald-600 text-xs sm:text-sm">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Present</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-2 text-red-600 text-xs sm:text-sm">
                    <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Absent</span>
                  </span>
                )}
              </div>
              
              {review.comments && (
                <div className="p-2 sm:p-3 bg-blue-50 rounded-lg">
                  <span className="font-semibold text-slate-700 block mb-2 text-xs sm:text-sm">Faculty Comments:</span>
                  <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">
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
  <div className="mb-6 sm:mb-8">
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-6">
      <div className="flex items-center space-x-3 text-amber-800">
        <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
        <div>
          <span className="font-bold block text-sm sm:text-base">No Academic Reviews</span>
          <span className="text-xs sm:text-sm text-amber-700">This student has not undergone any academic reviews yet.</span>
        </div>
      </div>
    </div>
  </div>
)}
{/* ✅ NEW: PAT Status Section */}
<div className="mb-6 sm:mb-8">
  <h5 className="font-bold text-base sm:text-xl mb-3 sm:mb-4 text-slate-800 flex items-center space-x-2">
    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
    <span>PAT Status</span>
  </h5>
  <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 shadow-sm">
    <div className="flex items-center space-x-3 sm:space-x-4">
      <span className="font-semibold text-slate-700 text-xs sm:text-sm">PAT Status:</span>
      {student.PAT ? (
        <span className="flex items-center space-x-2 text-red-600 text-xs sm:text-sm">
          <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="font-bold">PAT Flagged </span>
        </span>
      ) : (
        <span className="flex items-center space-x-2 text-emerald-600 text-xs sm:text-sm">
          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
          <span>False(Not PAT)</span>
        </span>
      )}
    </div>
    
    {student.PAT && (
      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs sm:text-sm text-red-800">
            <p className="font-semibold mb-1">Action Required:</p>
            <p>This student has been flagged  (-1 or "PAT") indicating  assessment status.</p>
          </div>
        </div>
      </div>
    )}
  </div>
</div>



                            {/* PPT Approval Section */}
                            <div className="mb-6 sm:mb-8">
                              <h5 className="font-bold text-base sm:text-xl mb-3 sm:mb-4 text-slate-800 flex items-center space-x-2">
                                <Award className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                                <span>Presentation Status</span>
                              </h5>
                              <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 shadow-sm">
                                <div className="flex items-center space-x-3 sm:space-x-4">
                                  <span className="font-semibold text-slate-700 text-xs sm:text-sm">Approval Status:</span>
                                  {student.pptApproved?.approved ? (
                                    <span className="flex items-center space-x-2 text-emerald-600 text-xs sm:text-sm">
                                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                      <span>Approved</span>
                                    </span>
                                  ) : (
                                    <span className="flex items-center space-x-2 text-red-600 text-xs sm:text-sm">
                                      <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                      <span>Pending Approval</span>
                                    </span>
                                  )}
                                  {student.pptApproved?.locked && (
                                    <span className="bg-slate-100 text-slate-700 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold">
                                      Status Locked
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Deadlines Section */}
                            {student.deadline && Object.keys(student.deadline).length > 0 && (
                              <div>
                                <h5 className="font-bold text-base sm:text-xl mb-3 sm:mb-4 text-slate-800 flex items-center space-x-2">
                                  <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                                  <span>Academic Deadlines</span>
                                </h5>
                                <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 shadow-sm">
                                  <div className="space-y-3">
                                    {Object.entries(student.deadline).map(([type, deadline]) => (
                                      <div key={type} className="flex items-center space-x-3 p-2 sm:p-3 bg-slate-50 rounded-lg">
                                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-slate-500" />
                                        <span className="font-semibold text-slate-700 text-xs sm:text-sm">{type}:</span>
                                        <span className="text-slate-600 text-xs sm:text-sm">
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

        {/* Edit Modal - Updated to only show basic fields */}
        {editingStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Edit Student: {formData.name}</h2>
                <button onClick={() => setEditingStudent(null)} className="text-slate-500 hover:text-slate-700">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info - Editable */}
                <div>
                  <h3 className="text-lg font-bold mb-4 text-slate-700">Basic Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">Name</label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => handleBasicChange('name', e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">Registration No</label>
                      <input
                        type="text"
                        value={formData.regNo || ''}
                        readOnly
                        className="w-full p-3 border border-slate-300 rounded-lg bg-slate-100 cursor-not-allowed text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">Email</label>
                      <input
                        type="email"
                        value={formData.emailId || ''}
                        onChange={(e) => handleBasicChange('emailId', e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">School</label>
                      <input
                        type="text"
                        value={formData.school || ''}
                        onChange={(e) => handleBasicChange('school', e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-slate-600 mb-2">Department</label>
                      <input
                        type="text"
                        value={formData.department || ''}
                        onChange={(e) => handleBasicChange('department', e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Read-only sections */}
                {formData.reviews && Object.keys(formData.reviews).length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold mb-4 text-slate-700 flex items-center space-x-2">
                      <span>Reviews</span>
                      <span className="text-sm font-normal text-slate-500">(Read Only)</span>
                    </h3>
                    <div className="bg-slate-50 rounded-lg p-4 border">
                      <p className="text-slate-600 text-sm">
                        This student has {Object.keys(formData.reviews).length} review(s). 
                        Reviews cannot be edited from this interface.
                      </p>
                    </div>
                  </div>
                )}

                {formData.pptApproved && (
                  <div>
                    <h3 className="text-lg font-bold mb-4 text-slate-700 flex items-center space-x-2">
                      <span>PPT Status</span>
                      <span className="text-sm font-normal text-slate-500">(Read Only)</span>
                    </h3>
                    <div className="bg-slate-50 rounded-lg p-4 border">
                      <p className="text-slate-600 text-sm">
                        PPT Approval Status: {formData.pptApproved.approved ? 'Approved' : 'Pending'}
                        {formData.pptApproved.locked && ' (Locked)'}
                      </p>
                    </div>
                  </div>
                )}

                {formData.deadline && Object.keys(formData.deadline).length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold mb-4 text-slate-700 flex items-center space-x-2">
                      <span>Deadlines</span>
                      <span className="text-sm font-normal text-slate-500">(Read Only)</span>
                    </h3>
                    <div className="bg-slate-50 rounded-lg p-4 border">
                      <p className="text-slate-600 text-sm">
                        This student has {Object.keys(formData.deadline).length} deadline(s) assigned. 
                        Deadlines cannot be edited from this interface.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4 mt-8">
                <button
                  onClick={() => setEditingStudent(null)}
                  className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  {isSaving && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full">
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Delete Student</h3>
                  <p className="text-slate-600 text-sm">This action cannot be undone.</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-slate-700">
                  Are you sure you want to delete <strong>{deleteConfirm.name}</strong> ({deleteConfirm.regNo})?
                </p>
                <p className="text-red-600 text-sm mt-2">
                  This will permanently remove the student and all associated data.
                </p>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Delete Student
                </button>
              </div>
            </div>
          </div>
        )}

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
        
      </div>
    </>
  );
};

export default AdminStudentManagement;
