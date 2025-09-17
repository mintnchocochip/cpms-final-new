import React, { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { 
  Upload, 
  Save, 
  AlertCircle, 
  Building2, 
  GraduationCap, 
  Download, 
  Plus, 
  Users, 
  X, 
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Database,
  Settings,
  RefreshCw
} from "lucide-react";
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
      type: [],
      getDisplayString: () => '',
      clearContext: () => {},
      loading: false,
      error: null
    };
  }

  const { school, department, specialization, type, getDisplayString, clearContext, loading: contextLoading, error: contextError } = hookResult;

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
  const typeFromContext = adminContext?.type || type || [];
  const hasContext = Boolean(schoolFromContext && departmentFromContext);
  const isAllMode = Boolean(adminContext?.skipped); // Super Admin mode

  // Tab state
  const [activeTab, setActiveTab] = useState('single');
  
  // Common states
  const [loading, setLoading] = useState(false);
  
  // Individual field validation errors
  const [fieldErrors, setFieldErrors] = useState({});

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

  // Updated options with correct formats
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

  // Backend storage format (lowercase)
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

  // Frontend display format (proper case)
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

  // Type options
  const typeOptionsDisplay = ['Software', 'Hardware'];

  // Helper function to normalize specialization for backend
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

  // Helper function to normalize type for backend
  const normalizeType = (typ) => {
    if (!typ) return '';
    
    const displayMap = {
      'Software': 'software',
      'Hardware': 'hardware'
    };
    
    return displayMap[typ] || typ.toLowerCase().trim();
  };

  // Helper function to display specialization for frontend
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

  // Helper function to display type for frontend
  const displayType = (typ) => {
    if (!typ) return '';
    
    const backendMap = {
      'software': 'Software',
      'hardware': 'Hardware'
    };
    
    return backendMap[typ.toLowerCase()] || typ;
  };

  // Single project states
  const [singleProject, setSingleProject] = useState({
    name: "",
    guideFacultyEmpId: "",
    school: isAllMode ? "" : schoolFromContext,
    department: isAllMode ? "" : departmentFromContext,
    specialization: specializationFromContext && specializationFromContext.length > 0 ? specializationFromContext[0] : "",
    type: typeFromContext && typeFromContext.length > 0 ? typeFromContext[0] : "",
    students: [{ name: "", regNo: "", emailId: "" }]
  });

  // Bulk project states
  const [projects, setProjects] = useState([]);
  const [fileName, setFileName] = useState("");
  const [bulkFieldErrors, setBulkFieldErrors] = useState({});
  const [bulkPreviewMode, setBulkPreviewMode] = useState(false);

  // Update form when context changes
  useEffect(() => {
    if (hasContext && specializationFromContext && specializationFromContext.length > 0) {
      setSingleProject(prev => ({
        ...prev,
        specialization: specializationFromContext[0]
      }));
    }
  }, [schoolFromContext, departmentFromContext, specializationFromContext, hasContext]);

  useEffect(() => {
    if (hasContext && typeFromContext && typeFromContext.length > 0) {
      setSingleProject(prev => ({
        ...prev,
        type: typeFromContext[0]
      }));
    }
  }, [schoolFromContext, departmentFromContext, typeFromContext, hasContext]);

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

  // Enhanced duplicate validation with stricter checks
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
  let error = "";

  // ===== Update the value in state FIRST =====
  const updatedStudents = [...singleProject.students];
  updatedStudents[index] = {
    ...updatedStudents[index],
    [field]: value
  };
  setSingleProject(prev => ({
    ...prev,
    students: updatedStudents
  }));

  // ===== Validation/Errors: Run only to set error, not to block typing =====
  if (field === 'regNo' && value.trim()) {
    // Registration number format validation (e.g., 21BCE1001)
    const regNoPattern = /^[0-9]{2}[A-Z]{3}[0-9]{4}$/;
    if (!regNoPattern.test(value.trim().toUpperCase())) {
      error = 'Registration number format should be like 21BCE1001';
    } else if (isDuplicateStudent(updatedStudents, index, field, value)) {
      error = `Registration number "${value}" is already used by another student.`;
    }
  }

  if (field === 'emailId' && value.trim()) {
    // Email format validation
    const emailPattern = /^[a-zA-Z0-9._%+-]+@vitstudent\.ac\.in$/;
    if (!emailPattern.test(value.trim())) {
      error = 'Email must be in format: username@vitstudent.ac.in';
    } else if (isDuplicateStudent(updatedStudents, index, field, value)) {
      error = `Email "${value}" is already used by another student.`;
    }
  }

  if (field === 'name' && value.trim()) {
    // Name validation
    const namePattern = /^[a-zA-Z\s]+$/;
    if (!namePattern.test(value.trim())) {
      error = 'Name should contain only alphabets and spaces';
    }
  }

  if (error) {
    setFieldError(fieldKey, error);
  } else {
    clearFieldError(fieldKey);
  }
};


  const addStudent = () => {
    if (singleProject.students.length >= 3) {
      showNotification("error", "Maximum Students", "Maximum 3 students allowed per project.");
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
      type: typeFromContext && typeFromContext.length > 0 ? typeFromContext[0] : "",
      students: [{ name: "", regNo: "", emailId: "" }]
    });
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
      showNotification("error", "Missing Context", isAllMode ? 
        "Please select school and department for the project." : 
        "Admin context is missing. Please select school and department using the button above.");
      return;
    }

    // Enhanced validation with proper error handling
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

    // type validation
    const projectType = typeFromContext && typeFromContext.length > 0 
      ? typeFromContext[0] 
      : singleProject.type;
      
    if (!projectType) {
      setFieldError('type', 'type is required.');
      hasValidationErrors = true;
    }

    // Enhanced student validation
    const validStudents = singleProject.students.filter(student => 
      student.name.trim() && student.regNo.trim() && student.emailId.trim()
    );

    if (validStudents.length === 0) {
      showNotification("error", "Missing Students", "At least one complete student record is required.");
      return;
    }

    // Enhanced duplicate checks
    const regNos = validStudents.map(s => s.regNo.toLowerCase().trim());
    const emails = validStudents.map(s => s.emailId.toLowerCase().trim());
    const names = validStudents.map(s => s.name.toLowerCase().trim());
    
    if (new Set(regNos).size !== regNos.length) {
      showNotification("error", "Duplicate Data", "Duplicate registration numbers found. Each student must have a unique registration number.");
      return;
    }
    
    if (new Set(emails).size !== emails.length) {
      showNotification("error", "Duplicate Data", "Duplicate email addresses found. Each student must have a unique email address.");
      return;
    }

    if (new Set(names).size !== names.length) {
      showNotification("error", "Duplicate Data", "Duplicate student names found. Please ensure all student names are unique.");
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
      showNotification("error", "Validation Error", "Please fix all validation errors before submitting.");
      return;
    }

    try {
      setLoading(true);

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
        specialization: normalizeSpecialization(projectSpecialization), // Normalize for backend
        type: normalizeType(projectType),
        school: projectSchool,
        department: projectDepartment
      };

      const response = await createProject(projectData);

      if (response.data?.success) {
        showNotification("success", "Project Created", `Project "${singleProject.name}" created successfully for ${projectSchool} - ${projectDepartment}! (${validStudents.length} students enrolled)`);
        resetSingleForm();
      } else {
        showNotification("error", "Creation Failed", response.data?.message || "Failed to create project");
      }
    } catch (err) {
      console.error("Single project creation error:", err);
      
      const errorMessage = err.response?.data?.message || err.message || "";
      
      if (errorMessage.includes("E11000") || errorMessage.includes("duplicate key")) {
        const projectName = singleProject.name.trim();
        showNotification("error", "Duplicate Project", `A project named "${projectName}" already exists. Please choose a different project name.`);
      } else if (errorMessage.includes("dup key") && errorMessage.includes("name")) {
        showNotification("error", "Project Name Exists", `"${singleProject.name}" is already taken. Please choose a unique project name.`);
      } else if (err.response?.status === 409) {
        showNotification("error", "Duplicate Project", `This project name already exists. Please choose a different name.`);
      } else {
        showNotification("error", "Creation Failed", err.response?.data?.message || "Failed to create project. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Dynamic template generation based on mode
  const downloadTemplate = () => {
    console.log('🔽 Template download requested');
    console.log('Mode:', isAllMode ? 'All Mode' : 'Context Mode');
    console.log('Context:', { schoolFromContext, departmentFromContext, specializationFromContext, typeFromContext });

    let template;
    let filename;

    const hasFixedSpecialization = specializationFromContext && specializationFromContext.length > 0;
    const hasFixedType = typeFromContext && typeFromContext.length > 0;

    const contextSpecialization = hasFixedSpecialization ? displaySpecialization(specializationFromContext[0]) : "AI/ML";
    const contextType = hasFixedType ? displayType(typeFromContext[0]) : "Software";

    if (isAllMode) {
      // ALL MODE: Include all columns
      console.log('📊 Generating ALL MODE template with full columns');
      
      template = [
        [
          "Project Name", 
          "Guide Faculty Employee ID", 
          "School", 
          "Department", 
          "Specialization", 
          "Type",
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
          "Software",
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
          "Software",
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
      // CONTEXT MODE: Limited columns (school/dept pre-filled)
      console.log('📊 Generating CONTEXT MODE template for:', schoolFromContext, departmentFromContext);
      
      let headers = [
        "Project Name", 
        "Guide Faculty Employee ID", 
      ];

      if (!hasFixedSpecialization) headers.push("Specialization");
      if (!hasFixedType) headers.push("Type");

      headers = headers.concat([
        "Student Name 1", 
        "Student RegNo 1", 
        "Student Email 1",
        "Student Name 2", 
        "Student RegNo 2", 
        "Student Email 2",
        "Student Name 3", 
        "Student RegNo 3", 
        "Student Email 3"
      ]);

      template = [headers];

      // Add example rows based on context
      let example1 = [
        "Smart Campus Management System", 
        "FAC11111", 
      ];

      if (!hasFixedSpecialization) example1.push(contextSpecialization);
      if (!hasFixedType) example1.push(contextType);

      example1 = example1.concat([
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

      template.push(example1);

      let example2 = [
        "IoT Weather Monitoring", 
        "FAC22222", 
      ];

      if (!hasFixedSpecialization) example2.push(contextSpecialization);
      if (!hasFixedType) example2.push(contextType);

      example2 = example2.concat([
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

      template.push(example2);

      filename = `project_bulk_template_${schoolFromContext}_${departmentFromContext}.xlsx`;

    } else {
      // FALLBACK: Generic template
      console.log('Generating FALLBACK template');
      
      template = [
        [
          "Project Name", 
          "Guide Faculty Employee ID", 
          "School", 
          "Department", 
          "Specialization", 
          "Type",
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
          "Software",
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

    // Generate and download Excel file
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
        { wch: 18 }, // Type
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
      showNotification("success", "Template Downloaded", `Template downloaded: ${filename}`);

    } catch (error) {
      console.error('❌ Template generation failed:', error);
      showNotification("error", "Template Error", 'Failed to generate template. Please try again.');
    }
  };

  // Enhanced file upload with strict validation
const handleFileUpload = (e) => {
  setProjects([]);
  setBulkFieldErrors({});
  setBulkPreviewMode(false);
  
  if (!e.target.files || e.target.files.length === 0) return;
  
  const file = e.target.files[0];
  
  // File type validation
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    showNotification("error", "Invalid File", "Invalid file type. Please upload an Excel file (.xlsx, .xls) or CSV file (.csv).");
    e.target.value = '';
    return;
  }

  // File size validation (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    showNotification("error", "File Too Large", "File size too large. Please upload a file smaller than 5MB.");
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
        showNotification("error", "Empty File", "File is empty or missing data rows. Please ensure you have at least one project row after the header.");
        return;
      }

      // Parse your specific Excel format
      const headerRow = rows[0];
      console.log('📋 Header row:', headerRow);

      // Find column indices for your format
      const getColumnIndex = (columnName) => {
        return headerRow.findIndex(header => 
          header && header.toString().trim().toLowerCase().includes(columnName.toLowerCase())
        );
      };

      const projectTitleCol = getColumnIndex('project title');
      const studentNameCol = getColumnIndex('student name');
      const regNoCol = getColumnIndex('register no');
      const employeeIdCol = getColumnIndex('employee id');

      if (projectTitleCol === -1 || studentNameCol === -1 || regNoCol === -1 || employeeIdCol === -1) {
        showNotification("error", "Invalid Format", "Required columns not found. Expected: Project Title, Student Name, Student Register No, Employee Id");
        return;
      }

      // Process rows to group projects
      const projects = [];
      let currentProject = null;
      
      const dataRows = rows.slice(1).filter(row => 
        row && row.length > 0 && row.some(cell => cell && cell.toString().trim())
      );

      for (const row of dataRows) {
        const getCellValue = (colIndex) => {
          const value = row[colIndex];
          return value ? value.toString().trim() : "";
        };

        const projectTitle = getCellValue(projectTitleCol);
        const studentName = getCellValue(studentNameCol);
        const regNo = getCellValue(regNoCol);
        const employeeId = getCellValue(employeeIdCol);

        // If this row has a project title, start a new project
        if (projectTitle && projectTitle !== '') {
          // Save previous project
          if (currentProject && currentProject.students.length > 0) {
            projects.push(currentProject);
          }

          // Start new project
          currentProject = {
            idx: projects.length + 1,
            name: projectTitle,
            guideFacultyEmpId: employeeId,
            specialization: specializationFromContext && specializationFromContext.length > 0 ? specializationFromContext[0] : "",
            type: typeFromContext && typeFromContext.length > 0 ? typeFromContext[0] : "",
            school: isAllMode ? "" : schoolFromContext,
            department: isAllMode ? "" : departmentFromContext,
            students: []
          };

          // Add first student if data exists
          if (studentName && regNo) {
            const emailId = `${regNo.replace(/\s+/g, '').toLowerCase()}@vitstudent.ac.in`;
            currentProject.students.push({
              name: studentName,
              regNo: regNo.replace(/\s+/g, '').toUpperCase(),
              emailId: emailId
            });
          }
        }
        // If no project title but student data exists, add to current project
        else if (currentProject && studentName && regNo && employeeId === currentProject.guideFacultyEmpId) {
          const emailId = `${regNo.replace(/\s+/g, '').toLowerCase()}@vitstudent.ac.in`;
          currentProject.students.push({
            name: studentName,
            regNo: regNo.replace(/\s+/g, '').toUpperCase(),
            emailId: emailId
          });
        }
      }

      // Don't forget the last project
      if (currentProject && currentProject.students.length > 0) {
        projects.push(currentProject);
      }

      console.log('✅ Parsed projects:', projects.length);
      setBulkPreviewMode(true);
      setProjects(projects);
      setBulkFieldErrors({});
      
      if (projects.length === 0) {
        showNotification("error", "No Valid Projects", "No valid projects found in the file. Please check the data format.");
      } else {
        showNotification("success", "File Processed", `Successfully loaded ${projects.length} projects for preview. Review the data below before uploading.`);
      }

    } catch (err) {
      console.error("❌ File parsing error:", err);
      showNotification("error", "File Error", `Failed to parse the Excel file: ${err.message}. Please check the file format and try again.`);
    }
  };
  
  reader.onerror = () => {
    showNotification("error", "File Read Error", 'Error reading file. Please try again.');
  };

  reader.readAsArrayBuffer(file);
};



  // Enhanced validation for bulk projects
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

      if (!proj.type) {
        errors.push("Missing type");
      } else if (!typeOptionsDisplay.includes(proj.type)) {
        errors.push(`Invalid type: ${proj.type}`);
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

    // Cross-project validation
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
    if (projects.length === 0) {
      showNotification("error", "No Projects", "No projects to upload. Please upload a file first.");
      return;
    }

    console.log('🚀 Starting bulk validation for', projects.length, 'projects');
    const valid = validateBulkProjects(projects);
    
    if (!valid) {
      showNotification("error", "Validation Error", "Please fix all validation errors before uploading.");
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
        type: normalizeType(proj.type), // normalized for backend
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
        showNotification("success", "Bulk Upload Complete", `Successfully uploaded ${projects.length} projects! All projects have been created and students enrolled.`);
        setProjects([]);
        setBulkPreviewMode(false);
        setFileName("");
        // Reset file input
        const fileInput = document.getElementById('bulkfileinput');
        if (fileInput) fileInput.value = '';
      } else {
        showNotification("error", "Upload Failed", response.data?.message || "Failed to upload bulk projects.");
      }

    } catch (err) {
      console.error("❌ Bulk upload error:", err);
      const errMsg = err.response?.data?.message || err.message || "Unknown error occurred during bulk upload.";
      showNotification("error", "Bulk Upload Failed", "Bulk upload failed: " + errMsg);
    } finally {
      setLoading(false);
    }
  };

  const clearBulkData = () => {
    setProjects([]);
    setBulkPreviewMode(false);
    setFileName("");
    setBulkFieldErrors({});
    // Reset file input
    const fileInput = document.getElementById('bulkfileinput');
    if (fileInput) fileInput.value = '';
  };

  // Context loading and error handling
if (contextLoading) {
    return (
      <>
        <Navbar />
        <div className="pt-16 sm:pt-20 pl-4 sm:pl-24 min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-12 max-w-sm sm:max-w-md mx-auto text-center">
            <div className="relative mb-6 sm:mb-8">
              <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-4 border-slate-200 border-t-blue-600 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 animate-pulse" />
              </div>
            </div>
            <h3 className="text-lg sm:text-2xl font-bold text-slate-800 mb-3">Loading Admin Context</h3>
            <p className="text-sm sm:text-base text-slate-600">Loading admin context...</p>
          </div>
        </div>
      </>
    );
  }

  // Show prompt for context selection (only if not in All Mode and no context)
  if (!isAllMode && (!schoolFromContext || !departmentFromContext)) {
    return (
      <>
        <Navbar />
        <div className="pt-16 sm:pt-20 pl-4 sm:pl-24 min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center px-4">
          <div className="max-w-sm sm:max-w-md mx-auto text-center p-6 sm:p-8 bg-white rounded-2xl shadow-2xl">
            <div className="mb-6">
              <Building2 className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-blue-600 mb-4" />
              <h2 className="text-lg sm:text-2xl font-bold text-slate-900 mb-2">
                Admin Context Required
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mb-6">
                {contextError || "Please select your school and department to access project creation"}
              </p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={handleSelectContext}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                Select School & Department
              </button>
              
              <button
                onClick={() => navigate("/admin")}
                className="w-full bg-slate-500 hover:bg-slate-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all text-sm sm:text-base"
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
        <Navbar />
        <div className="pt-16 sm:pt-20 pl-4 sm:pl-24 min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-12 max-w-sm sm:max-w-md mx-auto text-center">
            <div className="relative mb-6 sm:mb-8">
              <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-4 border-slate-200 border-t-blue-600 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Database className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 animate-pulse" />
              </div>
            </div>
            <h3 className="text-lg sm:text-2xl font-bold text-slate-800 mb-3">
              {activeTab === 'single' ? 'Creating Project' : 'Creating Projects'}
            </h3>
            <p className="text-sm sm:text-base text-slate-600">
              {activeTab === 'single' ? 'Processing 1 project...' : `Processing ${projects.length} projects...`}
            </p>
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
                  <Database className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold text-white">Project Creation</h1>
                  <p className="text-indigo-100 mt-1 text-sm sm:text-base">Create and manage student projects</p>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 w-full sm:w-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <div className="text-left sm:text-right">
                    <div className="text-white/90 text-xs sm:text-sm">Current Context</div>
                    <div className="text-white font-semibold text-sm sm:text-base">
                      {isAllMode ? 'All Schools & Departments' : `${schoolFromContext} - ${departmentFromContext}`}
                      {!isAllMode && specializationFromContext && specializationFromContext.length > 0 && (
                        <div className="text-white/80 text-xs mt-1">
                          {specializationFromContext.map(spec => displaySpecialization(spec)).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleSelectContext}
                    className="bg-white/20 hover:bg-white/30 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base w-full sm:w-auto"
                  >
                    Change Context
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mx-4 sm:mx-8 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8">
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-slate-800">Project Creation Mode</h2>
            </div>
            
            <div className="inline-flex bg-slate-100 rounded-xl p-1.5 shadow-inner w-full sm:w-auto justify-center">
              <button
                onClick={() => setActiveTab('single')}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === 'single'
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105"
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-200"
                }`}
              >
                <Plus size={16} />
                <span>Single Project</span>
              </button>
              <button
                onClick={() => setActiveTab('bulk')}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === 'bulk'
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105"
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-200"
                }`}
              >
                <Upload size={16} />
                <span>Bulk Upload</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mx-4 sm:mx-8 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl shadow-lg">
            {activeTab === 'single' ? (
              // Single Project Form
              <div className="p-4 sm:p-8">
                <div className="flex items-center space-x-3 mb-4 sm:mb-8">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-800">Create Single Project</h2>
                </div>

                <div className="max-w-xl sm:max-w-3xl mx-auto space-y-6">
                  {/* Project Name */}
                  <div>
                    <label htmlFor="name" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                      Project Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="AI Chatbot System"
                      className={`block w-full px-3 sm:px-4 py-2 sm:py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm sm:text-base placeholder-slate-400 ${
                        fieldErrors.name ? 'border-red-500 bg-red-50' : 'border-slate-200'
                      }`}
                      value={singleProject.name}
                      onChange={handleSingleProjectChange}
                      required
                    />
                    {fieldErrors.name && (
                      <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        {fieldErrors.name}
                      </p>
                    )}
                  </div>

                  {/* School Selection (Only in All Mode) */}
                  {isAllMode && (
                    <div>
                      <label htmlFor="school" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                        School <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="school"
                        name="school"
                        value={singleProject.school}
                        onChange={handleSingleProjectChange}
                        className="block w-full px-3 sm:px-4 py-2 sm:py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm sm:text-base"
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
                      <label htmlFor="department" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="department"
                        name="department"
                        value={singleProject.department}
                        onChange={handleSingleProjectChange}
                        className="block w-full px-3 sm:px-4 py-2 sm:py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm sm:text-base"
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
                    <label htmlFor="guideFacultyEmpId" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                      Guide Faculty Employee ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="guideFacultyEmpId"
                      name="guideFacultyEmpId"
                      type="text"
                      placeholder="FAC101"
                      className={`block w-full px-3 sm:px-4 py-2 sm:py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm sm:text-base placeholder-slate-400 ${
                        fieldErrors.guideFacultyEmpId ? 'border-red-500 bg-red-50' : 'border-slate-200'
                      }`}
                      value={singleProject.guideFacultyEmpId}
                      onChange={handleSingleProjectChange}
                      required
                    />
                    {fieldErrors.guideFacultyEmpId && (
                      <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        {fieldErrors.guideFacultyEmpId}
                      </p>
                    )}
                  </div>

                  {/* Specialization Selection */}
                  <div>
                    <label htmlFor="specialization" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                      Specialization <span className="text-red-500">*</span>
                    </label>
                    {!isAllMode && specializationFromContext && specializationFromContext.length > 0 ? (
                      // Show context value if available (Context Mode)
                      <div className="p-3 sm:p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                        <span className="text-blue-800 font-semibold text-sm sm:text-base">
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
                          className={`block w-full px-3 sm:px-4 py-2 sm:py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm sm:text-base ${
                            fieldErrors.specialization ? 'border-red-500 bg-red-50' : 'border-slate-200'
                          }`}
                          required
                        >
                          <option value="">Select Specialization</option>
                          {specializationOptionsDisplay.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                        {fieldErrors.specialization && (
                          <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            {fieldErrors.specialization}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Type Selection */}
                  <div>
                    <label htmlFor="type" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                      Type <span className="text-red-500">*</span>
                    </label>
                    {!isAllMode && typeFromContext && typeFromContext.length > 0 ? (
                      // Show context value if available (Context Mode)
                      <div className="p-3 sm:p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                        <span className="text-blue-800 font-semibold text-sm sm:text-base">
                          {typeFromContext.map(typ => displayType(typ)).join(', ')}
                        </span>
                        <p className="text-xs text-blue-600 mt-1">From admin context</p>
                      </div>
                    ) : (
                      // Show dropdown (All Mode or no context)
                      <>
                        <select
                          id="type"
                          name="type"
                          value={singleProject.type}
                          onChange={handleSingleProjectChange}
                          className={`block w-full px-3 sm:px-4 py-2 sm:py-4 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm sm:text-base ${
                            fieldErrors.type ? 'border-red-500 bg-red-50' : 'border-slate-200'
                          }`}
                          required
                        >
                          <option value="">Select Type</option>
                          {typeOptionsDisplay.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                        {fieldErrors.type && (
                          <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            {fieldErrors.type}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Students Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700">
                        Team Members <span className="text-red-500">*</span>
                        <span className="text-xs text-slate-500 ml-2">
                          ({singleProject.students.length}/3 students)
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={addStudent}
                        disabled={singleProject.students.length >= 3}
                        className={`flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-sm font-medium ${
                          singleProject.students.length >= 3
                            ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                            : "bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                      >
                        <Plus size={16} className="mr-1" />
                        Add Student
                      </button>
                    </div>

                    <div className="space-y-4">
                      {singleProject.students.map((student, index) => (
                        <div key={index} className="p-4 sm:p-6 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-base sm:text-lg text-slate-800">Student {index + 1}</h4>
                            {singleProject.students.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeStudent(index)}
                                className="text-red-600 hover:text-red-800 text-xs sm:text-sm font-medium transition-colors"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-2">
                                Student Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"


                                value={student.name}
                                onChange={(e) => handleStudentChange(index, 'name', e.target.value)}
                                placeholder="John Doe"
                                className={`w-full p-2 sm:p-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all ${
                                  fieldErrors[`student_${index}_name`] ? 'border-red-500 bg-red-50' : 'border-slate-200'
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
                              <label className="block text-xs font-semibold text-slate-600 mb-2">
                                Registration No. <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={student.regNo}
                                onChange={(e) => handleStudentChange(index, 'regNo', e.target.value)}
                                placeholder="21BCE1001"
                                className={`w-full p-2 sm:p-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all ${
                                  fieldErrors[`student_${index}_regNo`] ? 'border-red-500 bg-red-50' : 'border-slate-200'
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
                              <label className="block text-xs font-semibold text-slate-600 mb-2">
                                Email ID <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="email"
                                value={student.emailId}
                                onChange={(e) => handleStudentChange(index, 'emailId', e.target.value)}
                                placeholder="john.doe@vitstudent.ac.in"
                                className={`w-full p-2 sm:p-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all ${
                                  fieldErrors[`student_${index}_emailId`] ? 'border-red-500 bg-red-50' : 'border-slate-200'
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

                  {/* Submit Button at Bottom */}
                  <div className="pt-4 sm:pt-6">
                    <button
                      onClick={handleSingleSubmit}
                      disabled={loading}
                      className="w-full flex justify-center items-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 sm:px-6 py-2 sm:py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-3"></div>
                          Creating Project...
                        </>
                      ) : (
                        <>
                          <Save size={16} className="mr-2" />
                          Create Project
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Bulk Upload Form
              <div className="p-4 sm:p-8">
                <div className="flex items-center space-x-3 mb-4 sm:mb-8">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
                    <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-800">Bulk Upload Projects</h2>
                </div>

                {/* Download Template & Upload Section */}
                <div className="max-w-xl sm:max-w-4xl mx-auto mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
                    <button
                      type="button"
                      onClick={downloadTemplate}
                      className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base w-full sm:w-auto"
                    >
                      <Download size={16} />
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
                      className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl text-sm sm:text-base w-full sm:w-auto"
                    >
                      <Upload size={16} />
                      {fileName ? `Uploaded: ${fileName}` : "Upload Excel File"}
                    </label>

                    {bulkPreviewMode && (
                      <button
                        type="button"
                        onClick={clearBulkData}
                        className="flex items-center justify-center gap-2 px-4 sm:px-4 py-2 sm:py-3 bg-slate-500 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all duration-200 text-sm sm:text-base w-full sm:w-auto"
                      >
                        <X size={16} />
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Upload Button */}
                  {bulkPreviewMode && projects.length > 0 && (
                    <div className="flex justify-center mb-6">
                      <button
                        onClick={handleBulkSubmit}
                        disabled={loading || Object.keys(bulkFieldErrors).length > 0}
                        className={`flex items-center gap-2 px-6 sm:px-8 py-2 sm:py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base ${
                          loading || Object.keys(bulkFieldErrors).length > 0
                            ? "bg-slate-400 text-slate-600 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                        }`}
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                            Uploading Projects...
                          </>
                        ) : (
                          <>
                            <Upload size={16} />
                            Upload {projects.length} Projects
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Bulk Preview Table */}
                {bulkPreviewMode && projects.length > 0 ? (
                  <div className="max-w-full sm:max-w-6xl mx-auto mb-6 overflow-x-auto">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg sm:text-xl font-bold text-slate-800">
                        Preview ({projects.length} Projects)
                      </h4>
                      <div className="text-xs sm:text-sm text-slate-600">
                        {Object.keys(bulkFieldErrors).length > 0 && (
                          <span className="text-red-600 font-semibold">
                            {Object.keys(bulkFieldErrors).length} error(s) found
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px]">
                          <thead className="bg-gradient-to-r from-slate-100 to-blue-100">
                            <tr>
                              <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Row</th>
                              <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Project Name</th>
                              <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Faculty ID</th>
                              <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">School/Dept</th>
                              <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Specialization</th>
                              <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Type</th>
                              <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Students</th>
                              <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {projects.map((proj, idx) => (
                              <tr key={idx} className={`${bulkFieldErrors[idx] ? 'bg-red-50' : ''} hover:bg-slate-50 transition-colors`}>
                                <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-slate-900">{proj.idx}</td>
                                <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-slate-900">{proj.name}</td>
                                <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-slate-900 font-mono">{proj.guideFacultyEmpId}</td>
                                <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-slate-900">{proj.school}/{proj.department}</td>
                                <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-slate-900">{proj.specialization}</td>
                                <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-slate-900">{proj.type}</td>
                                <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-slate-900">
                                  <div className="space-y-1">
                                    {proj.students.map((s, sidx) => (
                                      <div key={sidx} className="text-xs">
                                        <strong>{s.name}</strong> ({s.regNo})
                                      </div>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm">
                                  {bulkFieldErrors[idx] ? (
                                    <div className="text-red-600 text-xs">
                                      <AlertCircle className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                      {bulkFieldErrors[idx]}
                                    </div>
                                  ) : (
                                    <span className="text-emerald-600 text-xs flex items-center">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Valid
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Instructions when no preview
                  <div className="max-w-xl sm:max-w-4xl mx-auto mt-6 sm:mt-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-4 sm:p-6">
                    <h4 className="text-base sm:text-lg font-bold text-blue-900 mb-3 flex items-center">
                      <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Instructions:
                    </h4>
                    <ul className="text-xs sm:text-sm text-blue-800 space-y-2">
                      <li>• Download the Excel template and fill in your project data</li>
                      <li>• Each row represents one project (max 3 students per project)</li>
                      <li>• Required fields: Project Name, Guide Faculty ID{isAllMode ? ', School, Department' : ''}, Specialization, Type</li>
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

export default ProjectCreationPage;