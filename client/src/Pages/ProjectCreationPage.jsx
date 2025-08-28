import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Upload, Save, AlertCircle, Building2, GraduationCap, Download, Plus, Users, X } from "lucide-react";
import Navbar from "../Components/UniversalNavbar";
import { createProject, createProjectsBulk } from "../api";
import { useAdminContext } from '../hooks/useAdminContext';
import { useNavigate } from "react-router-dom";

const ProjectCreationPage = () => {
  const navigate = useNavigate();

  // Handle useAdminContext safely without crashing
  let hookResult;
  try {
    hookResult = useAdminContext();
  } catch (error) {
    console.error('useAdminContext error:', error);
    hookResult = {
      school: '',
      department: '',
      specialization: [],
      getDisplayString: () => '',
      clearContext: () => {},
      loading: false,
      error: null
    };
  }

  const { school, department, specialization, getDisplayString, clearContext, loading: contextLoading, error: contextError } = hookResult;

  // Check authentication first
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const role = sessionStorage.getItem('role');
    
    if (!token || role !== 'admin') {
      console.log('Not authenticated as admin, redirecting to login');
      navigate('/admin/login');
      return;
    }
  }, [navigate]);

  // Get admin context helper
  const getAdminContext = () => {
    try {
      const context = sessionStorage.getItem('adminContext');
      return context ? JSON.parse(context) : null;
    } catch {
      return null;
    }
  };

  const [adminContext] = useState(getAdminContext());
  const schoolFromContext = adminContext?.school || school || '';
  const departmentFromContext = adminContext?.department || department || '';
  const specializationFromContext = adminContext?.specialization || specialization || [];
  const hasContext = Boolean(schoolFromContext && departmentFromContext);
  const isAllMode = Boolean(adminContext?.skipped); // Super Admin mode

  // Tab state
  const [activeTab, setActiveTab] = useState('single');
  
  // Common states
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Individual field validation errors
  const [fieldErrors, setFieldErrors] = useState({});

  // ✅ FIXED: Updated options with correct formats
  const schoolOptions = ['SCOPE', 'SENSE', 'SELECT', 'SMEC', 'SCE', 'VITSOL'];
  const departmentOptions = [
    'BTech', 
    'MTech (Integrated)', 
    'MCA', 
    'MSc', 
    'BBA', 
    'MBA', 
    'BDes',
    'MDes'
  ];

  // ✅ FIXED: Backend storage format (lowercase)
  const specializationOptionsBackend = [
    'ai/ml',
    'data science',
    'cyber security',
    'iot',
    'blockchain',
    'cloud computing',
    'vlsi',
    'software engineering',
    'general',
    'web development',
    'mobile development',
    'devops',
    'database management'
  ];

  // ✅ FIXED: Frontend display format (proper case)
  const specializationOptionsDisplay = [
    'AI/ML',
    'Data Science',
    'Cyber Security',
    'IoT',
    'Blockchain',
    'Cloud Computing',
    'VLSI',
    'Software Engineering',
    'General',
    'Web Development',
    'Mobile Development',
    'DevOps',
    'Database Management'
  ];

  // ✅ Helper function to normalize specialization for backend
  const normalizeSpecialization = (spec) => {
    if (!spec) return '';
    
    const displayMap = {
      'AI/ML': 'ai/ml',
      'Data Science': 'data science',
      'Cyber Security': 'cyber security',
      'IoT': 'iot',
      'Blockchain': 'blockchain',
      'Cloud Computing': 'cloud computing',
      'VLSI': 'vlsi',
      'Software Engineering': 'software engineering',
      'General': 'general',
      'Web Development': 'web development',
      'Mobile Development': 'mobile development',
      'DevOps': 'devops',
      'Database Management': 'database management'
    };
    
    return displayMap[spec] || spec.toLowerCase().trim();
  };

  // ✅ Helper function to display specialization for frontend
  const displaySpecialization = (spec) => {
    if (!spec) return '';
    
    const backendMap = {
      'ai/ml': 'AI/ML',
      'data science': 'Data Science',
      'cyber security': 'Cyber Security',
      'iot': 'IoT',
      'blockchain': 'Blockchain',
      'cloud computing': 'Cloud Computing',
      'vlsi': 'VLSI',
      'software engineering': 'Software Engineering',
      'general': 'General',
      'web development': 'Web Development',
      'mobile development': 'Mobile Development',
      'devops': 'DevOps',
      'database management': 'Database Management'
    };
    
    return backendMap[spec.toLowerCase()] || spec;
  };

  // Single project states
  const [singleProject, setSingleProject] = useState({
    name: "",
    guideFacultyEmpId: "",
    school: isAllMode ? "" : schoolFromContext,
    department: isAllMode ? "" : departmentFromContext,
    specialization: specializationFromContext && specializationFromContext.length > 0 ? specializationFromContext[0] : "",
    students: [{ name: "", regNo: "", emailId: "" }]
  });

  // Bulk project states
  const [projects, setProjects] = useState([]);
  const [fileName, setFileName] = useState("");
  const [bulkFieldErrors, setBulkFieldErrors] = useState({});
  const [bulkPreviewMode, setBulkPreviewMode] = useState(false);

  // Auto-dismiss messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Update form when context changes
  useEffect(() => {
    if (hasContext && specializationFromContext && specializationFromContext.length > 0) {
      setSingleProject(prev => ({
        ...prev,
        specialization: specializationFromContext[0]
      }));
    }
  }, [schoolFromContext, departmentFromContext, specializationFromContext, hasContext]);

  // Handle context selection with proper navigation
  const handleSelectContext = () => {
    console.log('🔵 SELECT CONTEXT CLICKED');
    
    const hasUnsavedChanges = singleProject.name || singleProject.guideFacultyEmpId || singleProject.students.some(s => s.name || s.regNo || s.emailId);
    
    if (hasUnsavedChanges) {
      const userConfirmed = window.confirm('You have unsaved changes. Are you sure you want to leave this page?');
      if (!userConfirmed) {
        console.log('❌ Navigation cancelled by user');
        return;
      }
    }
    
    console.log('✅ Proceeding with navigation');
    
    try {
      sessionStorage.removeItem('adminContext');
      sessionStorage.setItem('adminReturnPath', window.location.pathname);
      
      console.log('🚀 Attempting navigate() call to /admin/school-selection');
      navigate('/admin/school-selection');
      console.log('✅ Navigate function called successfully');
    } catch (error) {
      console.error('❌ Error during navigation:', error);
      window.location.href = '/admin/school-selection';
    }
  };

  // Helper function to set field-specific errors
  const setFieldError = (field, errorMessage) => {
    setFieldErrors(prev => ({
      ...prev,
      [field]: errorMessage
    }));
  };

  // Helper function to clear field-specific errors
  const clearFieldError = (field) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  // Single project functions
  const handleSingleProjectChange = (e) => {
    const { name, value } = e.target;
    setSingleProject(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    clearFieldError(name);
  };

  // ✅ FIXED: Enhanced duplicate validation with stricter checks
  const isDuplicateStudent = (students, currentIndex, field, value) => {
    if (!value.trim()) return false;
    
    const normalizedValue = value.toLowerCase().trim();
    return students.some((student, index) => 
      index !== currentIndex && 
      student[field] && 
      student[field].toLowerCase().trim() === normalizedValue
    );
  };

  const handleStudentChange = (index, field, value) => {
    const fieldKey = `student_${index}_${field}`;
    
    // ✅ FIXED: Enhanced validation for student fields
    if (field === 'regNo' && value.trim()) {
      // Registration number format validation (assuming format like 21BCE1001)
      const regNoPattern = /^[0-9]{2}[A-Z]{3}[0-9]{4}$/;
      if (!regNoPattern.test(value.trim().toUpperCase())) {
        setFieldError(fieldKey, 'Registration number format should be like 21BCE1001');
        return;
      }
      
      // Check for duplicates
      if (isDuplicateStudent(singleProject.students, index, field, value)) {
        setFieldError(fieldKey, `Registration number "${value}" is already used by another student.`);
        return;
      }
    }

    if (field === 'emailId' && value.trim()) {
      // Email format validation
      const emailPattern = /^[a-zA-Z0-9._%+-]+@vitstudent\.ac\.in$/;
      if (!emailPattern.test(value.trim())) {
        setFieldError(fieldKey, 'Email must be in format: username@vitstudent.ac.in');
        return;
      }
      
      // Check for duplicates
      if (isDuplicateStudent(singleProject.students, index, field, value)) {
        setFieldError(fieldKey, `Email "${value}" is already used by another student.`);
        return;
      }
    }

    if (field === 'name' && value.trim()) {
      // Name validation - only alphabets and spaces
      const namePattern = /^[a-zA-Z\s]+$/;
      if (!namePattern.test(value.trim())) {
        setFieldError(fieldKey, 'Name should contain only alphabets and spaces');
        return;
      }
    }

    // Clear error if validation passes
    clearFieldError(fieldKey);

    const updatedStudents = [...singleProject.students];
    updatedStudents[index] = {
      ...updatedStudents[index],
      [field]: value
    };
    setSingleProject(prev => ({
      ...prev,
      students: updatedStudents
    }));
  };

  const addStudent = () => {
    if (singleProject.students.length >= 3) {
      setError("Maximum 3 students allowed per project.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    setSingleProject(prev => ({
      ...prev,
      students: [...prev.students, { name: "", regNo: "", emailId: "" }]
    }));
  };

  const removeStudent = (index) => {
    if (singleProject.students.length > 1) {
      // Clear errors for this student
      const fieldsToClean = ['name', 'regNo', 'emailId'];
      fieldsToClean.forEach(field => {
        clearFieldError(`student_${index}_${field}`);
      });

      const updatedStudents = singleProject.students.filter((_, i) => i !== index);
      setSingleProject(prev => ({
        ...prev,
        students: updatedStudents
      }));
    }
  };

  const resetSingleForm = () => {
    setSingleProject({
      name: "",
      guideFacultyEmpId: "",
      school: isAllMode ? "" : schoolFromContext,
      department: isAllMode ? "" : departmentFromContext,
      specialization: specializationFromContext && specializationFromContext.length > 0 ? specializationFromContext[0] : "",
      students: [{ name: "", regNo: "", emailId: "" }]
    });
    setError('');
    setFieldErrors({});
  };

  const handleSingleSubmit = async () => {
    // Clear all previous field errors
    setFieldErrors({});
    
    // Get school and department from form (All Mode) or context (Context Mode)
    const projectSchool = isAllMode ? singleProject.school : schoolFromContext;
    const projectDepartment = isAllMode ? singleProject.department : departmentFromContext;

    let hasValidationErrors = false;

    if (!projectSchool || !projectDepartment) {
      setError(isAllMode ? 
        "Please select school and department for the project." : 
        "Admin context is missing. Please select school and department using the button above.");
      return;
    }

    // ✅ FIXED: Enhanced validation with proper error handling
    if (!singleProject.name.trim()) {
      setFieldError('name', 'Project name is required.');
      hasValidationErrors = true;
    } else if (singleProject.name.trim().length < 5) {
      setFieldError('name', 'Project name must be at least 5 characters long.');
      hasValidationErrors = true;
    }

    if (!singleProject.guideFacultyEmpId.trim()) {
      setFieldError('guideFacultyEmpId', 'Guide faculty employee ID is required.');
      hasValidationErrors = true;
    } else if (!/^[A-Z0-9]{5,10}$/i.test(singleProject.guideFacultyEmpId.trim())) {
      setFieldError('guideFacultyEmpId', 'Faculty ID should be 5-10 alphanumeric characters.');
      hasValidationErrors = true;
    }

    // Specialization validation
    const projectSpecialization = specializationFromContext && specializationFromContext.length > 0 
      ? specializationFromContext[0] 
      : singleProject.specialization;
      
    if (!projectSpecialization) {
      setFieldError('specialization', 'Specialization is required.');
      hasValidationErrors = true;
    }

    // ✅ FIXED: Enhanced student validation
    const validStudents = singleProject.students.filter(student => 
      student.name.trim() && student.regNo.trim() && student.emailId.trim()
    );

    if (validStudents.length === 0) {
      setError("At least one complete student record is required.");
      return;
    }

    // Enhanced duplicate checks
    const regNos = validStudents.map(s => s.regNo.toLowerCase().trim());
    const emails = validStudents.map(s => s.emailId.toLowerCase().trim());
    const names = validStudents.map(s => s.name.toLowerCase().trim());
    
    if (new Set(regNos).size !== regNos.length) {
      setError("Duplicate registration numbers found. Each student must have a unique registration number.");
      return;
    }
    
    if (new Set(emails).size !== emails.length) {
      setError("Duplicate email addresses found. Each student must have a unique email address.");
      return;
    }

    if (new Set(names).size !== names.length) {
      setError("Duplicate student names found. Please ensure all student names are unique.");
      return;
    }

    // Final validation for each student
    for (const [index, student] of validStudents.entries()) {
      const regNoPattern = /^[0-9]{2}[A-Z]{3}[0-9]{4}$/;
      if (!regNoPattern.test(student.regNo.trim().toUpperCase())) {
        setFieldError(`student_${index}_regNo`, 'Invalid registration number format (e.g., 21BCE1001)');
        hasValidationErrors = true;
      }

      const emailPattern = /^[a-zA-Z0-9._%+-]+@vitstudent\.ac\.in$/;
      if (!emailPattern.test(student.emailId.trim())) {
        setFieldError(`student_${index}_emailId`, 'Email must end with @vitstudent.ac.in');
        hasValidationErrors = true;
      }

      const namePattern = /^[a-zA-Z\s]+$/;
      if (!namePattern.test(student.name.trim())) {
        setFieldError(`student_${index}_name`, 'Name should contain only alphabets and spaces');
        hasValidationErrors = true;
      }
    }

    if (hasValidationErrors) {
      setError("Please fix all validation errors before submitting.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      console.log("Creating single project:", singleProject);

      const projectData = {
        name: singleProject.name.trim(),
        students: validStudents.map(student => ({
          name: student.name.trim(),
          regNo: student.regNo.trim().toUpperCase(),
          emailId: student.emailId.trim().toLowerCase(),
          school: projectSchool,
          department: projectDepartment
        })),
        guideFacultyEmpId: singleProject.guideFacultyEmpId.trim().toUpperCase(),
        specialization: normalizeSpecialization(projectSpecialization), // ✅ Normalize for backend
        school: projectSchool,
        department: projectDepartment
      };

      const response = await createProject(projectData);

      if (response.data?.success) {
        setSuccess(`✅ Project "${singleProject.name}" created successfully for ${projectSchool} - ${projectDepartment}! (${validStudents.length} students enrolled)`);
        resetSingleForm();
      } else {
        setError(response.data?.message || "Failed to create project");
      }
    } catch (err) {
      console.error("Single project creation error:", err);
      
      const errorMessage = err.response?.data?.message || err.message || "";
      
      if (errorMessage.includes("E11000") || errorMessage.includes("duplicate key")) {
        const projectName = singleProject.name.trim();
        setError(`❌ Duplicate Project: A project named "${projectName}" already exists. Please choose a different project name.`);
      } else if (errorMessage.includes("dup key") && errorMessage.includes("name")) {
        setError(`❌ Project Name Already Exists: "${singleProject.name}" is already taken. Please choose a unique project name.`);
      } else if (err.response?.status === 409) {
        setError(`❌ Duplicate Project: This project name already exists. Please choose a different name.`);
      } else {
        setError(err.response?.data?.message || "❌ Failed to create project. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Dynamic template generation based on mode
  const downloadTemplate = () => {
    console.log('🔽 Template download requested');
    console.log('Mode:', isAllMode ? 'All Mode' : 'Context Mode');
    console.log('Context:', { schoolFromContext, departmentFromContext, specializationFromContext });

    let template;
    let filename;

    if (isAllMode) {
      // ✅ ALL MODE: Include all columns
      console.log('📊 Generating ALL MODE template with full columns');
      
      template = [
        [
          "Project Name", 
          "Guide Faculty Employee ID", 
          "School", 
          "Department", 
          "Specialization", 
          "Student Name 1", 
          "Student RegNo 1", 
          "Student Email 1",
          "Student Name 2", 
          "Student RegNo 2", 
          "Student Email 2",
          "Student Name 3", 
          "Student RegNo 3", 
          "Student Email 3"
        ],
        [
          "AI Based Healthcare System", 
          "FAC12345", 
          "SCOPE", 
          "BTech", 
          "AI/ML",
          "John Doe", 
          "21BCE1001", 
          "john.doe@vitstudent.ac.in",
          "Jane Smith", 
          "21BCE1002", 
          "jane.smith@vitstudent.ac.in",
          "Mike Johnson", 
          "21BCE1003", 
          "mike.johnson@vitstudent.ac.in"
        ],
        [
          "E-Commerce Web Platform", 
          "FAC67890", 
          "SENSE", 
          "MCA", 
          "Web Development",
          "Alice Brown", 
          "21MCA2001", 
          "alice.brown@vitstudent.ac.in",
          "Bob Wilson", 
          "21MCA2002", 
          "bob.wilson@vitstudent.ac.in",
          "", 
          "", 
          ""
        ]
      ];
      
      filename = "project_bulk_template_ALL_MODES.xlsx";

    } else if (hasContext) {
      // ✅ CONTEXT MODE: Limited columns (school/dept pre-filled)
      console.log('📊 Generating CONTEXT MODE template for:', schoolFromContext, departmentFromContext);
      
      template = [
        [
          "Project Name", 
          "Guide Faculty Employee ID", 
          "Specialization", 
          "Student Name 1", 
          "Student RegNo 1", 
          "Student Email 1",
          "Student Name 2", 
          "Student RegNo 2", 
          "Student Email 2",
          "Student Name 3", 
          "Student RegNo 3", 
          "Student Email 3"
        ]
      ];

      // Add example rows based on context
      const contextSpecialization = specializationFromContext && specializationFromContext.length > 0 
        ? displaySpecialization(specializationFromContext[0]) // ✅ Display format for template
        : "AI/ML";

      template.push([
        "Smart Campus Management System", 
        "FAC11111", 
        contextSpecialization,
        "Raj Patel", 
        "21BCE3001", 
        "raj.patel@vitstudent.ac.in",
        "Priya Sharma", 
        "21BCE3002", 
        "priya.sharma@vitstudent.ac.in",
        "Arjun Kumar", 
        "21BCE3003", 
        "arjun.kumar@vitstudent.ac.in"
      ]);

      template.push([
        "IoT Weather Monitoring", 
        "FAC22222", 
        contextSpecialization,
        "Neha Singh", 
        "21BCE4001", 
        "neha.singh@vitstudent.ac.in",
        "Rohit Verma", 
        "21BCE4002", 
        "rohit.verma@vitstudent.ac.in",
        "", 
        "", 
        ""
      ]);

      filename = `project_bulk_template_${schoolFromContext}_${departmentFromContext}.xlsx`;

    } else {
      // ✅ FALLBACK: Generic template
      console.log('📊 Generating FALLBACK template');
      
      template = [
        [
          "Project Name", 
          "Guide Faculty Employee ID", 
          "School", 
          "Department", 
          "Specialization", 
          "Student Name 1", 
          "Student RegNo 1", 
          "Student Email 1",
          "Student Name 2", 
          "Student RegNo 2", 
          "Student Email 2",
          "Student Name 3", 
          "Student RegNo 3", 
          "Student Email 3"
        ],
        [
          "Sample Project 1", 
          "FAC123", 
          "SCOPE", 
          "BTech", 
          "AI/ML",
          "Student One", 
          "21BCE0001", 
          "student.one@vitstudent.ac.in",
          "", 
          "", 
          "",
          "", 
          "", 
          ""
        ]
      ];
      
      filename = "project_bulk_template_generic.xlsx";
    }

    // ✅ Generate and download Excel file
    try {
      const ws = XLSX.utils.aoa_to_sheet(template);
      
      // Set column widths for better readability
      const colWidths = [
        { wch: 25 }, // Project Name
        { wch: 20 }, // Guide Faculty ID
      ];

      if (isAllMode || !hasContext) {
        colWidths.push(
          { wch: 15 }, // School
          { wch: 15 }  // Department
        );
      }

      colWidths.push(
        { wch: 18 }, // Specialization
        { wch: 20 }, // Student Name 1
        { wch: 15 }, // RegNo 1
        { wch: 25 }, // Email 1
        { wch: 20 }, // Student Name 2
        { wch: 15 }, // RegNo 2
        { wch: 25 }, // Email 2
        { wch: 20 }, // Student Name 3
        { wch: 15 }, // RegNo 3
        { wch: 25 }  // Email 3
      );

      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "ProjectsTemplate");
      XLSX.writeFile(wb, filename);

      console.log('✅ Template generated and downloaded:', filename);
      setSuccess(`Template downloaded: ${filename}`);
      setTimeout(() => setSuccess(''), 3000);

    } catch (error) {
      console.error('❌ Template generation failed:', error);
      setError('Failed to generate template. Please try again.');
    }
  };

  // ✅ FIXED: Enhanced file upload with strict validation
  const handleFileUpload = (e) => {
    setError("");
    setSuccess("");
    setProjects([]);
    setBulkFieldErrors({});
    setBulkPreviewMode(false);
    
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    // ✅ File type validation
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setError("❌ Invalid file type. Please upload an Excel file (.xlsx, .xls) or CSV file (.csv).");
      e.target.value = '';
      return;
    }

    // ✅ File size validation (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError("❌ File size too large. Please upload a file smaller than 5MB.");
      e.target.value = '';
      return;
    }

    setFileName(file.name);
    console.log('📁 Processing file:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error("No sheets found in the Excel file");
        }

        const sheetName = workbook.SheetNames[0];
        const ws = workbook.Sheets[sheetName];
        
        if (!ws) {
          throw new Error("Unable to read the first sheet");
        }

        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        
        console.log('📊 Raw rows from Excel:', rows.length);
        console.log('📊 First few rows:', rows.slice(0, 3));
        
        if (rows.length < 2) {
          setError("❌ File is empty or missing data rows. Please ensure you have at least one project row after the header.");
          return;
        }

        // ✅ FIXED: Enhanced parsing with proper column detection
        const headerRow = rows[0];
        console.log('📋 Header row:', headerRow);

        let expectedColumns;
        let columnMapping;

        if (isAllMode) {
          // All Mode: Expect all columns
          expectedColumns = [
            "Project Name", "Guide Faculty Employee ID", "School", "Department", "Specialization",
            "Student Name 1", "Student RegNo 1", "Student Email 1",
            "Student Name 2", "Student RegNo 2", "Student Email 2",
            "Student Name 3", "Student RegNo 3", "Student Email 3"
          ];
          columnMapping = {
            projectName: 0, guideFacultyId: 1, school: 2, department: 3, specialization: 4,
            student1Name: 5, student1RegNo: 6, student1Email: 7,
            student2Name: 8, student2RegNo: 9, student2Email: 10,
            student3Name: 11, student3RegNo: 12, student3Email: 13
          };
        } else {
          // Context Mode: Expect fewer columns
          expectedColumns = [
            "Project Name", "Guide Faculty Employee ID", "Specialization",
            "Student Name 1", "Student RegNo 1", "Student Email 1",
            "Student Name 2", "Student RegNo 2", "Student Email 2",
            "Student Name 3", "Student RegNo 3", "Student Email 3"
          ];
          columnMapping = {
            projectName: 0, guideFacultyId: 1, specialization: 2,
            student1Name: 3, student1RegNo: 4, student1Email: 5,
            student2Name: 6, student2RegNo: 7, student2Email: 8,
            student3Name: 9, student3RegNo: 10, student3Email: 11
          };
        }

        // Validate header columns
        const missingColumns = expectedColumns.filter(col => 
          !headerRow.some(header => header && header.toString().trim().toLowerCase() === col.toLowerCase())
        );

        if (missingColumns.length > 0) {
          setError(`❌ Invalid file format. Missing columns: ${missingColumns.join(', ')}. Please download and use the correct template.`);
          return;
        }

        // Parse data rows
        const dataRows = rows.slice(1).filter(row => 
          row && row.length > 0 && row.some(cell => cell && cell.toString().trim())
        );

        console.log('📊 Data rows found:', dataRows.length);

        if (dataRows.length === 0) {
          setError("❌ No data rows found. Please add project data to your file.");
          return;
        }

        const parsedProjects = dataRows.map((row, idx) => {
          const rowNum = idx + 2; // Excel row number (header + 1-based)
          
          // Helper function to safely get cell value
          const getCellValue = (colIndex) => {
            const value = row[colIndex];
            return value ? value.toString().trim() : "";
          };

          // Parse students
          let students = [];
          for (let s = 0; s < 3; s++) {
            const nameCol = isAllMode ? 5 + s * 3 : 3 + s * 3;
            const regNoCol = isAllMode ? 6 + s * 3 : 4 + s * 3;
            const emailCol = isAllMode ? 7 + s * 3 : 5 + s * 3;

            const name = getCellValue(nameCol);
            const regNo = getCellValue(regNoCol);
            const emailId = getCellValue(emailCol);
            
            if (name && regNo && emailId) {
              students.push({ name, regNo, emailId });
            }
          }

          const projectData = {
            idx: rowNum,
            name: getCellValue(columnMapping.projectName),
            guideFacultyEmpId: getCellValue(columnMapping.guideFacultyId),
            specialization: getCellValue(columnMapping.specialization),
            students
          };

          if (isAllMode) {
            projectData.school = getCellValue(columnMapping.school);
            projectData.department = getCellValue(columnMapping.department);
          } else {
            projectData.school = schoolFromContext;
            projectData.department = departmentFromContext;
          }

          return projectData;
        }).filter(proj => proj.name); // Filter out rows without project names

        console.log('✅ Parsed projects:', parsedProjects.length);
        setBulkPreviewMode(true);
        setProjects(parsedProjects);
        setBulkFieldErrors({});
        
        if (parsedProjects.length === 0) {
          setError("❌ No valid projects found in the file. Please check the data format.");
        } else {
          setSuccess(`✅ Successfully loaded ${parsedProjects.length} projects for preview. Review the data below before uploading.`);
        }

      } catch (err) {
        console.error("❌ File parsing error:", err);
        setError(`❌ Failed to parse the Excel file: ${err.message}. Please check the file format and try again.`);
      }
    };
    
    reader.onerror = () => {
      setError("❌ Error reading file. Please try again.");
    };

    reader.readAsArrayBuffer(file);
  };

  // ✅ FIXED: Enhanced validation for bulk projects
  const validateBulkProjects = (projectsToValidate) => {
    let errorMap = {};
    let anyError = false;

    // Global validation arrays for cross-project checks
    const allProjectNames = [];
    const allRegNos = [];
    const allEmails = [];

    projectsToValidate.forEach((proj, idx) => {
      const errors = [];

      // Required field validation
      if (!proj.name || proj.name.length < 5) {
        errors.push("Project name missing or too short (min 5 chars)");
      } else {
        allProjectNames.push({ name: proj.name.toLowerCase().trim(), idx });
      }

      if (!proj.guideFacultyEmpId) {
        errors.push("Missing guide faculty ID");
      } else if (!/^[A-Z0-9]{5,10}$/i.test(proj.guideFacultyEmpId.trim())) {
        errors.push("Faculty ID should be 5-10 alphanumeric characters");
      }

      if (!proj.specialization) {
        errors.push("Missing specialization");
      } else if (!specializationOptionsDisplay.includes(proj.specialization)) {
        errors.push(`Invalid specialization: ${proj.specialization}`);
      }

      if (isAllMode) {
        if (!proj.school) errors.push("Missing school");
        if (!proj.department) errors.push("Missing department");
        
        if (proj.school && !schoolOptions.includes(proj.school)) {
          errors.push(`Invalid school: ${proj.school}`);
        }
        if (proj.department && !departmentOptions.includes(proj.department)) {
          errors.push(`Invalid department: ${proj.department}`);
        }
      }

      // Student validation
      if (!proj.students || proj.students.length === 0) {
        errors.push("At least one student required");
      } else {
        // Validate each student
        proj.students.forEach((student, studentIdx) => {
          // Name validation
          if (!student.name || !/^[a-zA-Z\s]+$/.test(student.name.trim())) {
            errors.push(`Student ${studentIdx + 1}: Invalid name format`);
          }

          // Registration number validation
          if (!student.regNo) {
            errors.push(`Student ${studentIdx + 1}: Missing registration number`);
          } else if (!/^[0-9]{2}[A-Z]{3}[0-9]{4}$/i.test(student.regNo.trim())) {
            errors.push(`Student ${studentIdx + 1}: Invalid registration number format (e.g., 21BCE1001)`);
          } else {
            allRegNos.push({ regNo: student.regNo.toLowerCase().trim(), idx, studentIdx });
          }

          // Email validation
          if (!student.emailId) {
            errors.push(`Student ${studentIdx + 1}: Missing email`);
          } else if (!/^[a-zA-Z0-9._%+-]+@vitstudent\.ac\.in$/.test(student.emailId.trim())) {
            errors.push(`Student ${studentIdx + 1}: Invalid email format (must end with @vitstudent.ac.in)`);
          } else {
            allEmails.push({ email: student.emailId.toLowerCase().trim(), idx, studentIdx });
          }
        });

        // Check for duplicate students within the same project
        const projectRegNos = proj.students.map(s => s.regNo.toLowerCase().trim());
        const projectEmails = proj.students.map(s => s.emailId.toLowerCase().trim());
        
        if (new Set(projectRegNos).size !== projectRegNos.length) {
          errors.push("Duplicate registration numbers within project");
        }
        
        if (new Set(projectEmails).size !== projectEmails.length) {
          errors.push("Duplicate emails within project");
        }
      }

      if (errors.length > 0) {
        errorMap[idx] = errors.join("; ");
        anyError = true;
      }
    });

    // ✅ Cross-project validation
    // Check for duplicate project names
    const projectNameGroups = {};
    allProjectNames.forEach(({ name, idx }) => {
      if (!projectNameGroups[name]) projectNameGroups[name] = [];
      projectNameGroups[name].push(idx);
    });

    Object.entries(projectNameGroups).forEach(([name, indices]) => {
      if (indices.length > 1) {
        indices.forEach(idx => {
          const existingError = errorMap[idx] || "";
          errorMap[idx] = existingError ? `${existingError}; Duplicate project name across file` : "Duplicate project name across file";
          anyError = true;
        });
      }
    });

    // Check for duplicate registration numbers across projects
    const regNoGroups = {};
    allRegNos.forEach(({ regNo, idx, studentIdx }) => {
      if (!regNoGroups[regNo]) regNoGroups[regNo] = [];
      regNoGroups[regNo].push({ idx, studentIdx });
    });

    Object.entries(regNoGroups).forEach(([regNo, occurrences]) => {
      if (occurrences.length > 1) {
        occurrences.forEach(({ idx, studentIdx }) => {
          const existingError = errorMap[idx] || "";
          errorMap[idx] = existingError ? `${existingError}; Student ${studentIdx + 1} regNo duplicated across projects` : `Student ${studentIdx + 1} regNo duplicated across projects`;
          anyError = true;
        });
      }
    });

    // Check for duplicate emails across projects
    const emailGroups = {};
    allEmails.forEach(({ email, idx, studentIdx }) => {
      if (!emailGroups[email]) emailGroups[email] = [];
      emailGroups[email].push({ idx, studentIdx });
    });

    Object.entries(emailGroups).forEach(([email, occurrences]) => {
      if (occurrences.length > 1) {
        occurrences.forEach(({ idx, studentIdx }) => {
          const existingError = errorMap[idx] || "";
          errorMap[idx] = existingError ? `${existingError}; Student ${studentIdx + 1} email duplicated across projects` : `Student ${studentIdx + 1} email duplicated across projects`;
          anyError = true;
        });
      }
    });

    setBulkFieldErrors(errorMap);
    return !anyError;
  };

  const handleBulkSubmit = async () => {
  setError("");
  setSuccess("");
  setBulkFieldErrors({});

  if (projects.length === 0) {
    setError("❌ No projects to upload. Please upload a file first.");
    return;
  }

  console.log('🚀 Starting bulk validation for', projects.length, 'projects');
  const valid = validateBulkProjects(projects);
  
  if (!valid) {
    setError("❌ Please fix all validation errors before uploading.");
    return;
  }

  try {
    setLoading(true);

    // Assuming school, department, and guideFacultyEmpId are consistent across all projects,
    // extract from first project or from context if available
    const school = projects[0].school.trim();
    const department = projects[0].department.trim();

    // Here you may want to decide how to handle guideFacultyEmpId if projects have different values.
    // Assuming you want to use guideFacultyEmpId from the first project for backend validation
    const guideFacultyEmpId = projects[0].guideFacultyEmpId.trim().toUpperCase();

    // Prepare projects array without school, department, guideFacultyEmpId fields since they are root-level now
    // But keep specialization and students as is, trimming strings
    const cleanedProjects = projects.map(proj => ({
      name: proj.name.trim(),
      specialization: normalizeSpecialization(proj.specialization), // normalized for backend
      students: proj.students.map(student => ({
        name: student.name.trim(),
        regNo: student.regNo.trim().toUpperCase(),
        emailId: student.emailId.trim().toLowerCase(),
        school,         // student school same as root school
        department      // student department same as root department
      }))
    }));

    const payload = {
      school,
      department,
      guideFacultyEmpId,
      projects: cleanedProjects
    };

    console.log("📤 Submitting bulk projects payload:", payload);

    const response = await createProjectsBulk(payload);

    if (response.data?.success) {
      setSuccess(`✅ Successfully uploaded ${projects.length} projects! All projects have been created and students enrolled.`);
      setProjects([]);
      setBulkPreviewMode(false);
      setFileName("");
      // Reset file input
      const fileInput = document.getElementById('bulkfileinput');
      if (fileInput) fileInput.value = '';
    } else {
      setError(response.data?.message || "❌ Failed to upload bulk projects.");
    }

  } catch (err) {
    console.error("❌ Bulk upload error:", err);
    const errMsg = err.response?.data?.message || err.message || "Unknown error occurred during bulk upload.";
    setError("❌ Bulk upload failed: " + errMsg);
  } finally {
    setLoading(false);
  }
};


  const clearBulkData = () => {
    setProjects([]);
    setBulkPreviewMode(false);
    setFileName("");
    setBulkFieldErrors({});
    setError("");
    setSuccess("");
    // Reset file input
    const fileInput = document.getElementById('bulkfileinput');
    if (fileInput) fileInput.value = '';
  };

  // Context loading and error handling
  if (contextLoading) {
    return (
      <>
        <Navbar userType="admin" />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            <div className="text-xl text-gray-600">Loading admin context...</div>
          </div>
        </div>
      </>
    );
  }

  // Show prompt for context selection (only if not in All Mode and no context)
  if (!isAllMode && (!schoolFromContext || !departmentFromContext)) {
    return (
      <>
        <Navbar userType="admin" />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center p-8 bg-white rounded-xl shadow-lg">
            <div className="mb-6">
              <Building2 className="h-16 w-16 mx-auto text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Admin Context Required
              </h2>
              <p className="text-gray-600 mb-6">
                {contextError || "Please select your school and department to access project creation"}
              </p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={handleSelectContext}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Building2 className="h-5 w-5" />
                Select School & Department
              </button>
              
              <button
                onClick={() => navigate("/admin")}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Back to Admin Dashboard
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Navbar userType="admin" />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            <div className="text-xl text-gray-600">
              {activeTab === 'single' ? 'Creating project...' : 'Creating projects...'}
            </div>
            <div className="text-sm text-gray-500">
              {activeTab === 'single' ? 'Processing 1 project...' : `Processing ${projects.length} projects...`}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar userType="admin" />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 pt-24 pb-8 max-w-6xl">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Project Creation</h1>
                <p className="text-gray-600">Create and manage student projects</p>
              </div>
              
              {/* Admin Context Display */}
              <div className="mt-4 md:mt-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {/* Display which context is currently active */}
                {isAllMode ? (
                  <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-900">All Schools & Departments</span>
                    </div>
                    <div className="text-sm text-amber-700">Managing all schools & departments</div>
                  </div>
                ) : (
                  <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Current Context</span>
                    </div>
                    <div className="text-sm text-blue-700">
                      <strong>{schoolFromContext}</strong> • <strong>{departmentFromContext}</strong>
                      {specializationFromContext && specializationFromContext.length > 0 && (
                        <> • <strong>{specializationFromContext.map(spec => displaySpecialization(spec)).join(', ')}</strong></>
                      )}
                    </div>
                  </div>
                )}

                {/* Change Context Button: Always visible */}
                <button
                  onClick={handleSelectContext}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  Change Context
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="mb-8">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('single')}
                  className={`flex-1 px-4 py-3 rounded-md font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'single'
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <Plus size={16} />
                  Single Project
                </button>
                <button
                  onClick={() => setActiveTab('bulk')}
                  className={`flex-1 px-4 py-3 rounded-md font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'bulk'
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <Upload size={16} />
                  Bulk Upload
                </button>
              </div>
            </div>

            {/* Success/Error Messages */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">{success}</p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800 whitespace-pre-line">{error}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setError('')}
                    className="ml-4 text-red-400 hover:text-red-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Tab Content */}
            {activeTab === 'single' ? (
              // Single Project Form
              <div className="bg-gray-50 rounded-xl p-8">
                <div className="text-center mb-8">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Plus className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Create Single Project</h3>
                  <p className="text-gray-600">Add one project with its team members</p>
                  {!isAllMode && hasContext && specializationFromContext && specializationFromContext.length > 0 && (
                    <p className="text-sm text-blue-600 mt-2">
                      Using specialization: <strong>{specializationFromContext.map(spec => displaySpecialization(spec)).join(', ')}</strong>
                    </p>
                  )}
                </div>

                {/* ✅ SUBMIT BUTTON MOVED TO TOP */}
                <div className="max-w-2xl mx-auto mb-8">
                  <button
                    onClick={handleSingleSubmit}
                    disabled={loading}
                    className="w-full flex justify-center items-center bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Project...
                      </>
                    ) : (
                      <>
                        <Save size={20} className="mr-2" />
                        Create Project
                      </>
                    )}
                  </button>
                </div>

                <div className="max-w-2xl mx-auto space-y-6">
                  {/* Project Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Project Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="AI Chatbot System"
                      className={`block w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        fieldErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      value={singleProject.name}
                      onChange={handleSingleProjectChange}
                      required
                    />
                    {fieldErrors.name && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {fieldErrors.name}
                      </p>
                    )}
                  </div>

                  {/* School Selection (Only in All Mode) */}
                  {isAllMode && (
                    <div>
                      <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-2">
                        School <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="school"
                        name="school"
                        value={singleProject.school}
                        onChange={handleSingleProjectChange}
                        className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      >
                        <option value="">Select School</option>
                        {schoolOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Department Selection (Only in All Mode) */}
                  {isAllMode && (
                    <div>
                      <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="department"
                        name="department"
                        value={singleProject.department}
                        onChange={handleSingleProjectChange}
                        className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      >
                        <option value="">Select Department</option>
                        {departmentOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Guide Faculty Employee ID */}
                  <div>
                    <label htmlFor="guideFacultyEmpId" className="block text-sm font-medium text-gray-700 mb-2">
                      Guide Faculty Employee ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="guideFacultyEmpId"
                      name="guideFacultyEmpId"
                      type="text"
                      placeholder="FAC101"
                      className={`block w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        fieldErrors.guideFacultyEmpId ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      value={singleProject.guideFacultyEmpId}
                      onChange={handleSingleProjectChange}
                      required
                    />
                    {fieldErrors.guideFacultyEmpId && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {fieldErrors.guideFacultyEmpId}
                      </p>
                    )}
                  </div>

                  {/* ✅ FIXED: Specialization Selection with proper display */}
                  <div>
                    <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-2">
                      Specialization <span className="text-red-500">*</span>
                    </label>
                    {!isAllMode && specializationFromContext && specializationFromContext.length > 0 ? (
                      // Show context value if available (Context Mode)
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <span className="text-blue-800 font-medium">
                          {specializationFromContext.map(spec => displaySpecialization(spec)).join(', ')}
                        </span>
                        <p className="text-xs text-blue-600 mt-1">From admin context</p>
                      </div>
                    ) : (
                      // Show dropdown (All Mode or no context)
                      <>
                        <select
                          id="specialization"
                          name="specialization"
                          value={singleProject.specialization}
                          onChange={handleSingleProjectChange}
                          className={`block w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                            fieldErrors.specialization ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                          required
                        >
                          <option value="">Select Specialization</option>
                          {specializationOptionsDisplay.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                        {fieldErrors.specialization && (
                          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {fieldErrors.specialization}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Students Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Team Members <span className="text-red-500">*</span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({singleProject.students.length}/3 students)
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={addStudent}
                        disabled={singleProject.students.length >= 3}
                        className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${
                          singleProject.students.length >= 3
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        <Plus size={16} className="mr-1" />
                        Add Student
                      </button>
                    </div>

                    <div className="space-y-4">
                      {singleProject.students.map((student, index) => (
                        <div key={index} className="p-4 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-800">Student {index + 1}</h4>
                            {singleProject.students.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeStudent(index)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Student Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={student.name}
                                onChange={(e) => handleStudentChange(index, 'name', e.target.value)}
                                placeholder="John Doe"
                                className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                                  fieldErrors[`student_${index}_name`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                }`}
                              />
                              {fieldErrors[`student_${index}_name`] && (
                                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  {fieldErrors[`student_${index}_name`]}
                                </p>
                              )}
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Registration No. <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={student.regNo}
                                onChange={(e) => handleStudentChange(index, 'regNo', e.target.value)}
                                placeholder="21BCE1001"
                                className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                                  fieldErrors[`student_${index}_regNo`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                }`}
                              />
                              {fieldErrors[`student_${index}_regNo`] && (
                                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  {fieldErrors[`student_${index}_regNo`]}
                                </p>
                              )}
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Email ID <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="email"
                                value={student.emailId}
                                onChange={(e) => handleStudentChange(index, 'emailId', e.target.value)}
                                placeholder="john.doe@vitstudent.ac.in"
                                className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                                  fieldErrors[`student_${index}_emailId`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                }`}
                              />
                              {fieldErrors[`student_${index}_emailId`] && (
                                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  {fieldErrors[`student_${index}_emailId`]}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ✅ DUPLICATE SUBMIT BUTTON AT BOTTOM FOR CONVENIENCE */}
                  <div className="pt-4">
                    <button
                      onClick={handleSingleSubmit}
                      disabled={loading}
                      className="w-full flex justify-center items-center bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating Project...
                        </>
                      ) : (
                        <>
                          <Save size={20} className="mr-2" />
                          Create Project
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Bulk Upload Form
              <div className="bg-gray-50 rounded-xl p-8">
                <div className="text-center mb-8">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Upload className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Bulk Upload Projects</h3>
                  <p className="text-gray-600">
                    Upload multiple projects at once using an Excel file (max 3 students per team)
                  </p>
                </div>

                {/* Download Template & Upload Section - MOVED TO TOP */}
                <div className="max-w-4xl mx-auto mb-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                    <button
                      type="button"
                      onClick={downloadTemplate}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                    >
                      <Download size={18} />
                      Download Template
                    </button>
                    
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      style={{ display: "none" }}
                      id="bulkfileinput"
                      onChange={handleFileUpload}
                    />
                    <label 
                      htmlFor="bulkfileinput" 
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors cursor-pointer shadow-md hover:shadow-lg"
                    >
                      <Upload size={18} />
                      {fileName ? `Uploaded: ${fileName}` : "Upload Excel File"}
                    </label>

                    {bulkPreviewMode && (
                      <button
                        type="button"
                        onClick={clearBulkData}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                      >
                        <X size={18} />
                        Clear
                      </button>
                    )}
                  </div>

                  {/* ✅ MOVED UPLOAD BUTTON TO TOP */}
                  {bulkPreviewMode && projects.length > 0 && (
                    <div className="flex justify-center mb-6">
                      <button
                        onClick={handleBulkSubmit}
                        disabled={loading || Object.keys(bulkFieldErrors).length > 0}
                        className={`flex items-center gap-2 px-8 py-4 rounded-lg font-medium transition-colors ${
                          loading || Object.keys(bulkFieldErrors).length > 0
                            ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
                        }`}
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading Projects...
                          </>
                        ) : (
                          <>
                            <Upload size={20} />
                            Upload {projects.length} Projects
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Bulk Preview Table */}
                {bulkPreviewMode && projects.length > 0 && (
                  <div className="max-w-4xl mx-auto mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Preview ({projects.length} Projects)
                      </h4>
                      <div className="text-sm text-gray-600">
                        {Object.keys(bulkFieldErrors).length > 0 && (
                          <span className="text-red-600 font-medium">
                            {Object.keys(bulkFieldErrors).length} error(s) found
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Row</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty ID</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School/Dept</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialization</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {projects.map((proj, idx) => (
                            <tr key={idx} className={bulkFieldErrors[idx] ? 'bg-red-50' : ''}>
                              <td className="px-4 py-3 text-sm text-gray-900">{proj.idx}</td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{proj.name}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{proj.guideFacultyEmpId}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{proj.school}/{proj.department}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{proj.specialization}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <div className="space-y-1">
                                  {proj.students.map((s, sidx) => (
                                    <div key={sidx} className="text-xs">
                                      <strong>{s.name}</strong> ({s.regNo})
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {bulkFieldErrors[idx] ? (
                                  <div className="text-red-600 text-xs">
                                    <AlertCircle className="inline h-4 w-4 mr-1" />
                                    {bulkFieldErrors[idx]}
                                  </div>
                                ) : (
                                  <span className="text-green-600 text-xs">✓ Valid</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Instructions */}
                {!bulkPreviewMode && (
                  <div className="max-w-4xl mx-auto mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-blue-900 mb-3">📋 Instructions:</h4>
                    <ul className="text-sm text-blue-800 space-y-2">
                      <li>• Download the Excel template and fill in your project data</li>
                      <li>• Each row represents one project (max 3 students per project)</li>
                      <li>• Required fields: Project Name, Guide Faculty ID{isAllMode ? ', School, Department' : ''}, Specialization</li>
                      <li>• At least one student is required per project</li>
                      <li>• Student emails must end with @vitstudent.ac.in</li>
                      <li>• Registration numbers should follow format: 21BCE1001</li>
                      <li>• Save as .xlsx format and upload the file</li>
                      <li>• Preview will show validation errors before uploading</li>
                      {!isAllMode && (
                        <li>• <strong>Context Mode:</strong> School ({schoolFromContext}) and Department ({departmentFromContext}) are auto-filled</li>
                      )}
                      {isAllMode && (
                        <li>• <strong>All Mode:</strong> You must specify School and Department for each project</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectCreationPage;
