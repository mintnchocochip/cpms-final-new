import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, 
  EyeOff, 
  User, 
  Mail, 
  Hash, 
  Shield, 
  Upload, 
  Building2, 
  Plus, 
  Save, 
  AlertTriangle, 
  Download,
  Database,
  Users,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Settings,
  X,
  RefreshCw
} from 'lucide-react';
import Navbar from '../Components/UniversalNavbar';
import { createFaculty, createAdmin, createFacultyBulk } from '../api';
import * as XLSX from 'xlsx';

// -------------------- Specialization Normalization Logic -----------------------

const specializationOptionsRaw = [
  'AI/ML', 'Data Science', 'Cyber Security', 'IoT', 'Blockchain', 'Cloud Computing', 'VLSI', 'Software Engineering', 'General'
];

const normalizeSpecialization = (spec) => {
  if (!spec) return '';
  return String(spec)
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
};

const specializationMap = {
  aiml: 'AI/ML',
  datascience: 'Data Science',
  cybersecurity: 'Cyber Security',
  iot: 'IoT',
  blockchain: 'Blockchain',
  cloudcomputing: 'Cloud Computing',
  vlsi: 'VLSI',
  softwareengineering: 'Software Engineering',
  general: 'General'
};

const specializationOptions = specializationOptionsRaw.map(normalizeSpecialization);
// ------------------------------------------------------------------------------

const FacultyManagement = () => {
  const navigate = useNavigate();

  const getAdminContext = () => {
    try {
      const context = sessionStorage.getItem('adminContext');
      return context ? JSON.parse(context) : null;
    } catch { return null; }
  };

  const [adminContext] = useState(getAdminContext());
  const schoolFromContext = adminContext?.school || '';
  const departmentFromContext = adminContext?.department || '';
  const hasContext = Boolean(schoolFromContext && departmentFromContext);

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('single');
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

  const [formData, setFormData] = useState({
    imageUrl: '',
    employeeId: '',
    name: '',
    emailId: '',
    phoneNumber:'',
    password: '',
    role: 'faculty',
    school: schoolFromContext || '',
    department: departmentFromContext || '',
    specializations: []
  });

  const [bulkData, setBulkData] = useState([]);
  const [fileName, setFileName] = useState('');

  const schoolOptions = ['SCOPE', 'SENSE'];
  const departmentOptions = ['BTech', 'MTech(integrated)', 'MCA'];

  useEffect(() => {
    if (hasContext) {
      setFormData(prev => ({
        ...prev,
        school: schoolFromContext,
        department: departmentFromContext
      }));
    }
  }, [schoolFromContext, departmentFromContext, hasContext]);

  const resetForm = () => {
    setFormData({
      imageUrl: '',
      employeeId: '',
      name: '',
      emailId: '',
      phoneNumber:'',
      password: '',
      role: 'faculty',
      school: schoolFromContext || '',
      department: departmentFromContext || '',
      specializations: []
    });
    setShowPassword(false);
  };

  const resetBulkData = () => {
    setBulkData([]);
    setFileName('');
  };

  const handleSelectContext = () => {
    const hasUnsavedChanges = formData.name || formData.employeeId || formData.emailId || formData.password || formData.phoneNumber  ;
    if (hasUnsavedChanges) {
      const userConfirmed = window.confirm('You have unsaved changes. Are you sure you want to leave this page?');
      if (!userConfirmed) return;
    }
    sessionStorage.removeItem('adminContext');
    sessionStorage.setItem('adminReturnPath', window.location.pathname);
    navigate('/admin/school-selection');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSpecializationChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => normalizeSpecialization(option.value));
    setFormData(prev => ({
      ...prev,
      specializations: selectedOptions
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) throw new Error('Name is required');
    if (!formData.employeeId.trim()) throw new Error('Employee ID is required');
    if (!formData.employeeId.match(/^[A-Za-z0-9]+$/)) throw new Error('Employee ID must contain only letters and numbers');
    if (!formData.emailId.trim()) throw new Error('Email is required');
    if (!formData.emailId.endsWith('@vit.ac.in')) throw new Error('Only VIT email addresses are allowed (@vit.ac.in)');
    if (!formData.phoneNumber.trim()) throw new Error('Phone Number is required');
    if (!formData.password) throw new Error('Password is required');
    if (formData.password.length < 8) throw new Error('Password must be at least 8 characters long');
    if (!/[A-Z]/.test(formData.password)) throw new Error('Password must contain at least one uppercase letter');
    if (!/[a-z]/.test(formData.password)) throw new Error('Password must contain at least one lowercase letter');
    if (!/[0-9]/.test(formData.password)) throw new Error('Password must contain at least one number');
    if (!/[^A-Za-z0-9]/.test(formData.password)) throw new Error('Password must contain at least one special character');
    if (!formData.school) throw new Error('School selection is required');
    // if (!formData.department) throw new Error('Department selection is required');
    if (!formData.specializations || formData.specializations.length === 0) throw new Error('At least one specialization must be selected');
  };

  const handleSingleSubmit = async () => {
    setIsLoading(true);
    try {
      validateForm();
      const apiData = {
        name: String(formData.name.trim()),
        emailId: String(formData.emailId.trim().toLowerCase()),
        phoneNumber: String(formData.phoneNumber.trim()),
        password: String(formData.password),
        employeeId: String(formData.employeeId.trim().toUpperCase()),
        imageUrl: String(formData.imageUrl.trim()),
        school: [formData.school],
        department: [formData.department],
        specialization: formData.specializations.map(normalizeSpecialization)
      };

      let response;
      if (formData.role === 'faculty') {
        response = await createFaculty(apiData);
      } else if (formData.role === 'admin') {
        response = await createAdmin(apiData);
      } else {
        throw new Error('Invalid role selected');
      }

      showNotification(
        "success", 
        "Account Created", 
        response.message && response.message.trim().length > 0
          ? response.message
          : `${formData.role === "faculty" ? "Faculty" : "Admin"} account for "${formData.name}" (${formData.employeeId}) created successfully!`
      );

      resetForm();
    } catch (err) {
      if (err.response && err.response.data) {
        showNotification("error", "Creation Failed", err.response.data.message || 'Server validation failed');
      } else if (err.message) {
        showNotification("error", "Validation Error", err.message);
      } else {
        showNotification("error", "Creation Failed", 'Failed to create user. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const cleanText = (value) => {
    if (value === null || value === undefined) return '';
    return String(value)
      .trim()
      .replace(/[\r\n\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '')
      .trim();
  };

  const parseArrayField = (field) => {
    if (!field) return [];
    const cleaned = cleanText(field);
    return cleaned.split(',')
      .map(s => normalizeSpecialization(s))
      .filter(s => s.length > 0);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        
        const formattedData = [];
        const errorDetails = [];
        
        jsonData.forEach((row, index) => {
          try {
            const name = cleanText(row.name);
            const employeeId = cleanText(row.employeeId);
            const emailId = cleanText(row.emailId).toLowerCase();
            const phoneNumber = cleanText(row.phoneNumber);
            const password = row.password ? String(row.password).trim() : '';
            const role = cleanText(row.role);
            const imageUrl = cleanText(row.imageUrl) || '';
            
            let school, department, specializations;
            if (hasContext) {
              school = schoolFromContext;
              department = departmentFromContext;
              specializations = parseArrayField(row.specializations || row.specialization);
            } else {
              school = cleanText(row.school);
              department = cleanText(row.department);
              specializations = parseArrayField(row.specializations || row.specialization);
            }
            
            const rowErrors = [];
            if (!name) rowErrors.push('Missing name');
            if (!employeeId) rowErrors.push('Missing employee ID');
            if (!emailId) rowErrors.push('Missing email');
            if (!phoneNumber) rowErrors.push('Missing Phone Number');
            if (!password || password === '0') rowErrors.push('Missing password');
            
            const cleanEmployeeId = employeeId.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
            if (employeeId && !cleanEmployeeId) rowErrors.push('Invalid employee ID');
            
            if (emailId) {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(emailId)) rowErrors.push('Invalid email format');
              else if (!emailId.endsWith('@vit.ac.in')) rowErrors.push('Email must end with @vit.ac.in');
            }
            
            if (!school) rowErrors.push('Missing school');
            // if (!department) rowErrors.push('Missing department');
            if (specializations.length === 0) rowErrors.push('Missing specializations');
            
            const cleanRole = role.toLowerCase();
            const validRole = cleanRole === 'admin' ? 'admin' : 'faculty';
            
            let cleanPassword = password;
            if (password && (password.includes('\n') || password.includes('\r') || password.includes('\t'))) {
              cleanPassword = password.replace(/[\r\n\t]/g, '').trim();
            }
            
            if (rowErrors.length > 0) {
              errorDetails.push({
                row: index + 2, 
                name: name || 'N/A', 
                employeeId: employeeId || 'N/A', 
                emailId: emailId || 'N/A', 
                errors: rowErrors
              });
            }
            
            formattedData.push({
              name: name || '',
              employeeId: cleanEmployeeId || employeeId || '',
              emailId: emailId || '',
              phoneNumber: phoneNumber || '',
              password: cleanPassword || '',
              role: validRole,
              imageUrl: imageUrl,
              school: school,
              department: department,
              specializations: specializations,
              originalRow: index + 2,
              hasErrors: rowErrors.length > 0,
              errors: rowErrors
            });
          } catch (rowError) {
            errorDetails.push({
              row: index + 2, 
              name: 'Error processing row', 
              employeeId: 'N/A', 
              emailId: 'N/A',
              phoneNumber: 'N/A',
              errors: [`Row processing error: ${rowError.message}`]
            });
            
            formattedData.push({
              name: 'ERROR',
              employeeId: 'ERROR',
              emailId: 'ERROR',
              phoneNumber:'ERROR',
              password: '',
              role: 'faculty',
              imageUrl: '',
              school: '',
              department: '',
              specializations: [],
              originalRow: index + 2,
              hasErrors: true,
              errors: [`Row processing error: ${rowError.message}`]
            });
          }
        });
        
        setBulkData(formattedData);
        
        const validEntries = formattedData.filter(entry => !entry.hasErrors);
        const invalidEntries = formattedData.filter(entry => entry.hasErrors);
        
        if (invalidEntries.length > 0) {
          const errorSummary = errorDetails
            .slice(0, 5)
            .map(detail => `Row ${detail.row}: ${detail.errors.join(', ')}`).join('\n');
          showNotification(
            "error", 
            "File Processing Issues", 
            `Found ${invalidEntries.length} problematic entries:\n\n${errorSummary}${invalidEntries.length > 5 ? `\n... and ${invalidEntries.length - 5} more errors` : ''}\n\nFix issues before submitting.`
          );
        }
        
        if (validEntries.length > 0) {
          showNotification(
            "success", 
            "File Processed", 
            `${formattedData.length} faculty records loaded. ${validEntries.length} are valid, ${invalidEntries.length} have issues.`
          );
        } else {
          showNotification(
            "error", 
            "No Valid Records", 
            `${formattedData.length} faculty records loaded, but all have issues.`
          );
        }
      } catch (err) {
        console.error('File processing error:', err);
        showNotification("error", "File Processing Error", `Error processing file: ${err.message}. Please ensure the file format is correct.`);
        setBulkData([]);
      }
    };
    
    reader.onerror = () => showNotification("error", "File Read Error", 'Error reading file. Please try again.');
    reader.readAsArrayBuffer(file);
  };

  const handleBulkSubmit = async () => {
    if (bulkData.length === 0) {
      showNotification("error", "No Data", 'No faculty data to upload. Please select a valid Excel file.');
      return;
    }
    
    const validEntries = bulkData.filter(entry => !entry.hasErrors);
    const invalidEntries = bulkData.filter(entry => entry.hasErrors);
    
    if (validEntries.length === 0) {
      showNotification("error", "No Valid Entries", 'No valid faculty entries to submit. Please fix the errors first.');
      return;
    }
    
    if (invalidEntries.length > 0) {
      const confirmSubmit = window.confirm(
        `You have ${invalidEntries.length} invalid entries that will be skipped. Continue with creating ${validEntries.length} valid accounts?`
      );
      if (!confirmSubmit) return;
    }
    
    setIsLoading(true);
    try {
      const validatedData = validEntries.map(faculty => ({
        name: String(faculty.name).trim(),
        emailId: String(faculty.emailId).trim().toLowerCase(),
        phoneNumber: String(faculty.phoneNumber).trim(),
        password: String(faculty.password),
        employeeId: String(faculty.employeeId).trim().toUpperCase(),
        role: faculty.role,
        imageUrl: String(faculty.imageUrl || '').trim(),
        schools: [faculty.school],
        departments: [faculty.department],
        specialization: faculty.specializations.map(normalizeSpecialization)
      }));
      
      const response = await createFacultyBulk({ facultyList: validatedData });
      const successCount = response.data?.created || 0;
      const errorCount = response.data?.errors || 0;
      
      if (successCount > 0) {
        const createdNames = validEntries.slice(0, 5).map(e => `"${e.name}" (${e.employeeId})`).join(', ');
        showNotification(
          "success",
          "Bulk Creation Complete",
          `Successfully created ${successCount} faculty member${successCount > 1 ? "s" : ""}${
            createdNames ? ": " + createdNames : ""
          }${validEntries.length > 5 ? `, ...and ${validEntries.length - 5} more` : ""}. (Total created: ${successCount})`
          + (errorCount > 0 ? ` (${errorCount} errors occurred)` : "")
          + (invalidEntries.length > 0 ? ` (${invalidEntries.length} entries were skipped)` : "")
        );
        
        if (errorCount === 0 && invalidEntries.length === 0) resetBulkData();
      } else {
        showNotification("error", "Creation Failed", 'No faculty members were created. Please check the data and try again.');
      }
    } catch (err) {
      console.error('Bulk creation error:', err);
      showNotification("error", "Bulk Creation Failed", err.response?.data?.message || 'Failed to create faculty in bulk. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = hasContext ? [
      {
        name: 'Dr. John Smith',
        employeeId: 'FAC001',
        emailId: 'john.smith@vit.ac.in',
        phoneNumber:'+91 9000000001',
        password: 'TempPass@123',
        role: 'faculty',
        specializations: 'aiml,datascience',
        imageUrl: ''
      },
      {
        name: 'Dr. Jane Admin',
        employeeId: 'ADM001',
        emailId: 'jane.admin@vit.ac.in',
        phoneNumber:'+91 9000000002',
        password: 'AdminPass@456',
        role: 'admin',
        specializations: 'general',
        imageUrl: 'https://example.com/profile.jpg'
      }
    ] : [
      {
        name: 'Dr. John Smith',
        employeeId: 'FAC001',
        emailId: 'john.smith@vit.ac.in',
        phoneNumber:'+91 9000000003',
        password: 'TempPass@123',
        role: 'faculty',
        school: 'SCOPE',
        department: 'CSE',
        specializations: 'aiml,datascience',
        imageUrl: ''
      },
      {
        name: 'Dr. Jane Admin',
        employeeId: 'ADM001',
        emailId: 'jane.admin@vit.ac.in',
        phoneNumber:'+91 9000000004',
        password: 'AdminPass@456',
        role: 'admin',
        school: 'SCOPE',
        department: 'CSE',
        specializations: 'general',
        imageUrl: 'https://example.com/profile.jpg'
      }
    ];
    
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Faculty Template');
    XLSX.writeFile(
      wb,
      hasContext
        ? `faculty_template_${schoolFromContext}_${departmentFromContext}.xlsx`
        : 'faculty_template_all.xlsx'
    );
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="pt-16 sm:pt-20 pl-4 sm:pl-24 min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-12 max-w-sm sm:max-w-md mx-auto text-center">
            <div className="relative mb-6 sm:mb-8">
              <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-4 border-slate-200 border-t-blue-600 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 animate-pulse" />
              </div>
            </div>
            <h3 className="text-lg sm:text-2xl font-bold text-slate-800 mb-3">
              {activeTab === 'single' ? 'Creating Faculty Account' : 'Creating Faculty Accounts'}
            </h3>
            <p className="text-sm sm:text-base text-slate-600">Please wait while we process your request...</p>
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
                  <p className="text-indigo-100 mt-1 text-sm sm:text-base">Create and manage faculty accounts</p>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 w-full sm:w-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <div className="text-left sm:text-right">
                    <div className="text-white/90 text-xs sm:text-sm">Current Programme</div>
                    <div className="text-white font-semibold text-sm sm:text-base">
                      {hasContext ? `${schoolFromContext} - ${departmentFromContext}` : 'All Schools & Departments'}
                    </div>
                  </div>
                  <button
                    onClick={handleSelectContext}
                    className="bg-white/20 hover:bg-white/30 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base w-full sm:w-auto"
                  >
                    {hasContext ? 'Change Programme' : 'Select Programme'}
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
              <h2 className="text-lg sm:text-2xl font-bold text-slate-800">Creation Mode</h2>
            </div>
            
            <div className="inline-flex bg-slate-100 rounded-xl p-1.5 shadow-inner w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('single')}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center space-x-2 ${
                  activeTab === 'single'
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105"
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-200"
                }`}
              >
                <Plus size={16} />
                <span>Single Faculty</span>
              </button>
              <button
                onClick={() => setActiveTab('bulk')}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center space-x-2 ${
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

        {/* Main Content */}
        <div className="mx-4 sm:mx-8 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl shadow-lg">
            {activeTab === 'single' ? (
              <div className="p-4 sm:p-8">
                <div className="flex items-center space-x-3 mb-4 sm:mb-8">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-800">Create Faculty Account</h2>
                </div>

                <div className="max-w-2xl sm:max-w-3xl mx-auto space-y-6">
                  {/* Role Selection */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                      Account Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, role: 'faculty' }))}
                        className={`p-3 sm:p-4 rounded-xl border-2 transition-all flex items-center justify-center space-x-2 sm:space-x-3 text-sm sm:text-base ${
                          formData.role === 'faculty' 
                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <User size={16} className="sm:h-5 sm:w-5" />
                        <span className="font-medium">Faculty</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, role: 'admin' }))}
                        className={`p-3 sm:p-4 rounded-xl border-2 transition-all flex items-center justify-center space-x-2 sm:space-x-3 text-sm sm:text-base ${
                          formData.role === 'admin' 
                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <Shield size={16} className="sm:h-5 sm:w-5" />
                        <span className="font-medium">Admin</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {/* Name */}
                    <div>
                      <label htmlFor="name" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                          <User size={16} className="sm:h-5 sm:w-5 text-slate-400" />
                        </div>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          placeholder="Dr. John Doe"
                          className="block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base text-slate-700 placeholder-slate-400"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    {/* Employee ID */}
                    <div>
                      <label htmlFor="employeeId" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                        Employee ID <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                          <Hash size={16} className="sm:h-5 sm:w-5 text-slate-400" />
                        </div>
                        <input
                          id="employeeId"
                          name="employeeId"
                          type="text"
                          placeholder="FAC001"
                          className="block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base text-slate-700 placeholder-slate-400"
                          value={formData.employeeId}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="emailId" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                        <Mail size={16} className="sm:h-5 sm:w-5 text-slate-400" />
                      </div>
                      <input
                        id="emailId"
                        name="emailId"
                        type="email"
                        placeholder="john.doe@vit.ac.in"
                        className="block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base text-slate-700 placeholder-slate-400"
                        value={formData.emailId}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phoneNumber" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                        <Mail size={16} className="sm:h-5 sm:w-5 text-slate-400" />
                      </div>
                      <input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="text"
                        placeholder="+91 9000000001"
                        className="block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base text-slate-700 placeholder-slate-400"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                        <Shield size={16} className="sm:h-5 sm:w-5 text-slate-400" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Password123!"
                        className="block w-full pl-10 sm:pl-12 pr-12 sm:pr-16 py-2 sm:py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base text-slate-700 placeholder-slate-400"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                        >
                          {showPassword ? <EyeOff size={16} className="sm:h-5 sm:w-5" /> : <Eye size={16} className="sm:h-5 sm:w-5" />}
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs sm:text-sm font-semibold text-slate-700 mb-2">Password Requirements:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-600">
                        <span>• 8+ characters</span>
                        <span>• Uppercase letter</span>
                        <span>• Lowercase letter</span>
                        <span>• Number</span>
                        <span className="col-span-1 sm:col-span-2">• Special character (!@#$%^&*)</span>
                      </div>
                    </div>
                  </div>

                  {/* School & Department Selection */}
                  {!hasContext && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label htmlFor="school" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                          School <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="school"
                          name="school"
                          className="block w-full px-3 sm:px-4 py-2 sm:py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base text-slate-700"
                          value={formData.school}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select School</option>
                          {schoolOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="department" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
Department <span className="text-slate-400">(Optional)</span>                        </label>
                        <select
                          id="department"
                          name="department"
                          className="block w-full px-3 sm:px-4 py-2 sm:py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base text-slate-700"
                          value={formData.department}
                          onChange={handleInputChange}
                          
                        >
                          <option value="">Select Department</option>
                          {departmentOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Specialization Selection */}
                  <div>
                    <label htmlFor="specializations" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                      Specializations <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="specializations"
                      multiple
                      size={5}
                      className="block w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base text-slate-700"
                      value={formData.specializations}
                      onChange={handleSpecializationChange}
                      required
                    >
                      {specializationOptions.map(option => (
                        <option key={option} value={option}>{specializationMap[option] || option}</option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs sm:text-sm text-slate-500">Hold Ctrl (Cmd on Mac) to select multiple specializations</p>
                  </div>

                  {/* Profile Image URL */}
                  <div>
                    <label htmlFor="imageUrl" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                      Profile Image URL <span className="text-slate-400">(Optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                        <Upload size={16} className="sm:h-5 sm:w-5 text-slate-400" />
                      </div>
                      <input
                        id="imageUrl"
                        name="imageUrl"
                        type="url"
                        placeholder="https://example.com/profile.jpg"
                        className="block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base text-slate-700 placeholder-slate-400"
                        value={formData.imageUrl}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 sm:pt-6">
                    <button
                      onClick={handleSingleSubmit}
                      disabled={isLoading}
                      className="w-full flex justify-center items-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Creating {formData.role}...
                        </>
                      ) : (
                        <>
                          <Save size={16} className="sm:h-5 sm:w-5 mr-2" />
                          Create {formData.role === 'faculty' ? 'Faculty' : 'Admin'} Account
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 sm:p-8">
                <div className="flex items-center space-x-3 mb-4 sm:mb-8">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
                    <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-800">Bulk Faculty Upload</h2>
                </div>

                {/* Template Download */}
                <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Download Excel Template</h4>
                      <p className="text-xs sm:text-sm text-blue-700">
                        {hasContext 
                          ? `Template for ${schoolFromContext} - ${departmentFromContext} (school & department will be auto-filled)`
                          : 'Template includes all required columns including school and department'
                        }
                      </p>
                    </div>
                    <button
                      onClick={downloadTemplate}
                      className="flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg font-medium text-sm sm:text-base w-full sm:w-auto"
                    >
                      <Download size={16} />
                      <span>Download Template</span>
                    </button>
                  </div>
                </div>

                {/* File Upload */}
                <div className="mb-6 sm:mb-8">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                    Excel File <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-40 sm:h-48 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-4 sm:pt-5 pb-5 sm:pb-6">
                        <Upload className="w-10 h-10 sm:w-12 sm:h-12 mb-3 sm:mb-4 text-slate-400" />
                        <p className="mb-2 text-xs sm:text-sm text-slate-600">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-slate-500 mb-2">Excel files only (.xlsx, .xls)</p>
                        <p className="text-xs text-blue-600 text-center max-w-xs sm:max-w-sm">
                          {hasContext 
                            ? 'Required: name, employeeId, emailId, password, role, specializations'
                            : 'Required: name, employeeId, emailId, password, role, school, department, specializations'
                          }
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                  {fileName && (
                    <div className="mt-4 p-3 sm:p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
                      <p className="text-xs sm:text-sm text-emerald-700 font-semibold flex items-center space-x-2">
                        <CheckCircle size={16} />
                        <span>File selected: {fileName}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Bulk Data Preview */}
                {bulkData.length > 0 ? (
                  <div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
                      <div>
                        <h3 className="text-base sm:text-xl font-bold text-slate-800">
                          Faculty Preview ({bulkData.length} records)
                        </h3>
                        {bulkData.filter(f => f.hasErrors).length > 0 && (
                          <p className="text-xs sm:text-sm text-red-600 mt-1">
                            {bulkData.filter(f => f.hasErrors).length} records have errors
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-3 w-full sm:w-auto">
                        <button
                          onClick={handleBulkSubmit}
                          className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
                          disabled={isLoading || bulkData.filter(f => !f.hasErrors).length === 0}
                        >
                          <Save className="h-4 w-4" />
                          <span>{isLoading ? 'Creating...' : `Create ${bulkData.filter(f => !f.hasErrors).length} Accounts`}</span>
                        </button>
                        <button
                          onClick={resetBulkData}
                          disabled={isLoading}
                          className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-slate-500 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all duration-200 text-sm sm:text-base"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                      <table className="w-full min-w-[800px]">
                        <thead className="bg-gradient-to-r from-slate-100 to-blue-100">
                          <tr>
                            <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                            <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Name</th>
                            <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Employee ID</th>
                            <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Email</th>
                            <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Role</th>
                            {!hasContext && (
                              <>
                                <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">School</th>
                                <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Department</th>
                              </>
                            )}
                            <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Specializations</th>
                            <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Issues</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {bulkData.map((faculty, index) => (
                            <tr key={index} className={`${faculty.hasErrors ? 'bg-red-25' : ''} hover:bg-slate-50 transition-colors duration-150`}>
                              <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                                {faculty.hasErrors ? (
                                  <span className="inline-flex px-2 sm:px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                    Error
                                  </span>
                                ) : (
                                  <span className="inline-flex px-2 sm:px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                                    Valid
                                  </span>
                                )}
                              </td>
                              <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-slate-900">
                                {faculty.name || <span className="text-red-500">Missing</span>}
                              </td>
                              <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-slate-900 font-mono">
                                {faculty.employeeId || <span className="text-red-500">Missing</span>}
                              </td>
                              <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-slate-900">
                                {faculty.emailId || <span className="text-red-500">Missing</span>}
                              </td>
                              <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 sm:px-3 py-1 text-xs font-semibold rounded-full ${
                                  faculty.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {faculty.role}
                                </span>
                              </td>
                              {!hasContext && (
                                <>
                                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-slate-900">
                                    {faculty.school || <span className="text-red-500">Missing</span>}
                                  </td>
                                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-slate-900">
                                    {faculty.department || <span className="text-red-500">Missing</span>}
                                  </td>
                                </>
                              )}
                              <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-slate-900">
                                {faculty.specializations?.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {faculty.specializations.map((spec, idx) => (
                                      <span key={idx} className="inline-flex px-2 py-1 text-xs rounded bg-amber-100 text-amber-800">
                                        {specializationMap[spec] || spec}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-red-500">Missing</span>
                                )}
                              </td>
                              <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm">
                                {faculty.hasErrors ? (
                                  <div className="text-red-600">
                                    <div className="font-semibold text-xs">Row {faculty.originalRow}:</div>
                                    <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                                      {faculty.errors.map((error, idx) => (
                                        <li key={idx}>{error}</li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : (
                                  <span className="text-emerald-600 text-xs flex items-center space-x-1">
                                    <CheckCircle size={12} />
                                    <span>No issues</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 sm:py-20 px-4">
                    <div className="mx-auto w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-6 sm:mb-8">
                      <Upload className="h-12 w-12 sm:h-16 sm:w-16 text-slate-400" />
                    </div>
                    <h3 className="text-lg sm:text-2xl font-bold text-slate-600 mb-3">No Data Uploaded Yet</h3>
                    <p className="text-sm sm:text-base text-slate-500 max-w-sm sm:max-w-md mx-auto">
                      Upload an Excel file to preview faculty data and create multiple accounts at once.
                    </p>
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
                    <p className={`mt-1 text-xs sm:text-sm whitespace-pre-line ${
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

export default FacultyManagement;
