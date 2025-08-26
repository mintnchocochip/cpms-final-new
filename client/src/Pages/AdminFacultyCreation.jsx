import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Hash, Shield, Upload, Building2, Plus, Save, AlertCircle, Download } from 'lucide-react';
import Navbar from '../Components/UniversalNavbar';
import { createFaculty, createAdmin, createFacultyBulk } from '../api';
import * as XLSX from 'xlsx';

const FacultyManagement = () => {
  const navigate = useNavigate();
  
  const getAdminContext = () => {
    try {
      const context = sessionStorage.getItem('adminContext');
      return context ? JSON.parse(context) : null;
    } catch {
      return null;
    }
  };

  const [adminContext, setAdminContext] = useState(getAdminContext());
  const schoolFromContext = adminContext?.school || '';
  const departmentFromContext = adminContext?.department || '';
  const hasContext = Boolean(schoolFromContext && departmentFromContext);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('single');
  
  // ✅ IMPROVED: Simple form structure with single school/department selection
  const [formData, setFormData] = useState({
    imageUrl: '',
    employeeId: '',
    name: '',
    emailId: '',
    password: '',
    role: 'faculty',
    school: schoolFromContext || '',
    department: departmentFromContext || '',
    specializations: []
  });

  const [bulkData, setBulkData] = useState([]);
  const [fileName, setFileName] = useState('');

  // Available options for dropdowns
  const schoolOptions = ['SCOPE', 'SENSE'];
  const departmentOptions = ['BTech','MTech(integrated)','MCA'];
  const specializationOptions = ['AI/ML', 'Data Science', 'Cyber Security', 'IoT', 'Blockchain', 'Cloud Computing', 'General'];

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // ✅ FIXED: Update form when context changes
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
      password: '',
      role: 'faculty',
      school: schoolFromContext || '',
      department: departmentFromContext || '',
      specializations: []
    });
    setError('');
    setShowPassword(false);
  };

  const resetBulkData = () => {
    setBulkData([]);
    setFileName('');
    setError('');
    setSuccess('');
  };


const handleSelectContext = () => {
  console.log('🔵 SELECT CONTEXT CLICKED');
  
  const hasUnsavedChanges = formData.name || formData.employeeId || formData.emailId || formData.password;
  
  if (hasUnsavedChanges) {
    const userConfirmed = window.confirm('You have unsaved changes. Are you sure you want to leave this page?');
    if (!userConfirmed) {
      console.log('❌ Navigation cancelled by user');
      return;
    }
  }
  
  console.log('✅ Proceeding with navigation');
  
  try {
    // ✅ Clear context and store return path before navigating
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





  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ✅ IMPROVED: Handle specialization multi-select
  const handleSpecializationChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({
      ...prev,
      specializations: selectedOptions
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      throw new Error('Name is required');
    }
    
    if (!formData.employeeId.trim()) {
      throw new Error('Employee ID is required');
    }
    
    if (!formData.employeeId.match(/^[A-Za-z0-9]+$/)) {
      throw new Error('Employee ID must contain only letters and numbers');
    }
    
    if (!formData.emailId.trim()) {
      throw new Error('Email is required');
    }
    
    if (!formData.emailId.endsWith('@vit.ac.in')) {
      throw new Error('Only VIT email addresses are allowed (@vit.ac.in)');
    }
    
    if (!formData.password) {
      throw new Error('Password is required');
    }
    
    if (formData.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(formData.password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(formData.password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }
    
    if (!/[0-9]/.test(formData.password)) {
      throw new Error('Password must contain at least one number');
    }
    
    if (!/[^A-Za-z0-9]/.test(formData.password)) {
      throw new Error('Password must contain at least one special character');
    }

    if (!formData.school) {
      throw new Error('School selection is required');
    }
    
    if (!formData.department) {
      throw new Error('Department selection is required');
    }
    
    if (!formData.specializations || formData.specializations.length === 0) {
      throw new Error('At least one specialization must be selected');
    }
  };

  const handleSingleSubmit = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      validateForm();

      // ✅ FIXED: Convert single selections to arrays for backend
      const apiData = {
        name: String(formData.name.trim()),
        emailId: String(formData.emailId.trim().toLowerCase()),
        password: String(formData.password),
        employeeId: String(formData.employeeId.trim().toUpperCase()),
        imageUrl: String(formData.imageUrl.trim()),
        // ✅ FIXED: Send as arrays to match backend schema
        school: [formData.school],
        department: [formData.department],
        specialization: formData.specializations
      };

      let response;
      if (formData.role === 'faculty') {
        response = await createFaculty(apiData);
      } else if (formData.role === 'admin') {
        response = await createAdmin(apiData);
      } else {
        throw new Error('Invalid role selected');
      }

      setSuccess(response.message || `${formData.role === 'faculty' ? 'Faculty' : 'Admin'} created successfully!`);
      resetForm();
      
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message || 'Server validation failed');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to create user. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setError('');
    setSuccess('');

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
          return cleaned.includes(',') 
            ? cleaned.split(',').map(s => s.trim()).filter(s => s.length > 0)
            : [cleaned].filter(s => s.length > 0);
        };
        
        jsonData.forEach((row, index) => {
          try {
            const name = cleanText(row.name);
            const employeeId = cleanText(row.employeeId);
            const emailId = cleanText(row.emailId).toLowerCase();
            const password = row.password ? String(row.password).trim() : '';
            const role = cleanText(row.role);
            const imageUrl = cleanText(row.imageUrl) || '';

            // ✅ FIXED: Handle school/department based on context
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
            if (!password || password === '0') rowErrors.push('Missing password');

            const cleanEmployeeId = employeeId.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
            if (employeeId && !cleanEmployeeId) {
              rowErrors.push('Invalid employee ID');
            }

            if (emailId) {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(emailId)) {
                rowErrors.push('Invalid email format');
              } else if (!emailId.endsWith('@vit.ac.in')) {
                rowErrors.push('Email must end with @vit.ac.in');
              }
            }

            if (!school) rowErrors.push('Missing school');
            if (!department) rowErrors.push('Missing department');
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
              errors: [`Row processing error: ${rowError.message}`]
            });
            
            formattedData.push({
              name: 'ERROR',
              employeeId: 'ERROR',
              emailId: 'ERROR',
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
            .map(detail => 
              `Row ${detail.row}: ${detail.errors.join(', ')}`
            ).join('\n');
          
          setError(`Found ${invalidEntries.length} problematic entries:\n\n${errorSummary}${invalidEntries.length > 5 ? `\n... and ${invalidEntries.length - 5} more errors` : ''}\n\nFix issues before submitting.`);
        }

        if (validEntries.length > 0) {
          setSuccess(`${formattedData.length} faculty records loaded. ${validEntries.length} are valid, ${invalidEntries.length} have issues.`);
        } else {
          setSuccess(`${formattedData.length} faculty records loaded, but all have issues.`);
        }

      } catch (err) {
        console.error('File processing error:', err);
        setError(`Error processing file: ${err.message}. Please ensure the file format is correct.`);
        setBulkData([]);
      }
    };

    reader.onerror = () => {
      setError('Error reading file. Please try again.');
    };

    reader.readAsArrayBuffer(file);
  };

  const handleBulkSubmit = async () => {
    if (bulkData.length === 0) {
      setError('No faculty data to upload. Please select a valid Excel file.');
      return;
    }

    const validEntries = bulkData.filter(entry => !entry.hasErrors);
    const invalidEntries = bulkData.filter(entry => entry.hasErrors);

    if (validEntries.length === 0) {
      setError('No valid faculty entries to submit. Please fix the errors first.');
      return;
    }

    if (invalidEntries.length > 0) {
      const confirmSubmit = window.confirm(
        `You have ${invalidEntries.length} invalid entries that will be skipped. Continue with creating ${validEntries.length} valid accounts?`
      );
      if (!confirmSubmit) {
        return;
      }
    }

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // ✅ FIXED: Map data to match backend bulk controller expectations
      const validatedData = validEntries.map(faculty => ({
        name: String(faculty.name).trim(),
        emailId: String(faculty.emailId).trim().toLowerCase(),
        password: String(faculty.password),
        employeeId: String(faculty.employeeId).trim().toUpperCase(),
        role: faculty.role,
        imageUrl: String(faculty.imageUrl || '').trim(),
        schools: [faculty.school],
        departments: [faculty.department],
        specialization: faculty.specializations
      }));

      const response = await createFacultyBulk({
        facultyList: validatedData
      });

      const successCount = response.data?.created || 0;
      const errorCount = response.data?.errors || 0;
      
      if (successCount > 0) {
        setSuccess(`Successfully created ${successCount} faculty members!${errorCount > 0 ? ` ${errorCount} errors occurred.` : ''}${invalidEntries.length > 0 ? ` ${invalidEntries.length} entries were skipped.` : ''}`);
        if (errorCount === 0 && invalidEntries.length === 0) {
          resetBulkData();
        }
      } else {
        setError('No faculty members were created. Please check the data and try again.');
      }
      
    } catch (err) {
      console.error('Bulk creation error:', err);
      setError(err.response?.data?.message || 'Failed to create faculty in bulk. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    // ✅ FIXED: Different templates based on context
    const template = hasContext ? [
      {
        name: 'Dr. John Smith',
        employeeId: 'FAC001',
        emailId: 'john.smith@vit.ac.in',
        password: 'TempPass@123',
        role: 'faculty',
        specializations: 'AI/ML,Data Science',
        imageUrl: ''
      },
      {
        name: 'Dr. Jane Admin',
        employeeId: 'ADM001', 
        emailId: 'jane.admin@vit.ac.in',
        password: 'AdminPass@456',
        role: 'admin',
        specializations: 'General',
        imageUrl: 'https://example.com/profile.jpg'
      }
    ] : [
      {
        name: 'Dr. John Smith',
        employeeId: 'FAC001',
        emailId: 'john.smith@vit.ac.in',
        password: 'TempPass@123',
        role: 'faculty',
        school: 'SCOPE',
        department: 'CSE',
        specializations: 'AI/ML,Data Science',
        imageUrl: ''
      },
      {
        name: 'Dr. Jane Admin',
        employeeId: 'ADM001', 
        emailId: 'jane.admin@vit.ac.in',
        password: 'AdminPass@456',
        role: 'admin',
        school: 'SCOPE',
        department: 'CSE',
        specializations: 'General',
        imageUrl: 'https://example.com/profile.jpg'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Faculty Template');
    const fileName = hasContext 
      ? `faculty_template_${schoolFromContext}_${departmentFromContext}.xlsx`
      : 'faculty_template_all.xlsx';
    XLSX.writeFile(wb, fileName);
  };

  if (isLoading) {
    return (
      <>
        <Navbar userType="admin" />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            <div className="text-xl text-gray-600">
              {activeTab === 'single' ? 'Creating faculty...' : 'Creating faculty members...'}
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
            {/* ✅ IMPROVED: Better Header Layout */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Faculty Management</h1>
                <p className="text-gray-600">Create and manage faculty accounts</p>
              </div>
              
              <div className="mt-4 md:mt-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {hasContext ? (
                  <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Current Context</span>
                    </div>
                    <div className="text-sm text-blue-700">
                      <strong>{schoolFromContext}</strong> • <strong>{departmentFromContext}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-900">No Context</span>
                    </div>
                    <div className="text-sm text-amber-700">
                      Managing all schools & departments
                    </div>
                  </div>
                )}
                
                <button
                  onClick={handleSelectContext}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  {hasContext ? 'Change Context' : 'Select Context'}
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
                  Single Faculty
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
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Tab Content */}
            {activeTab === 'single' ? (
              <div className="bg-gray-50 rounded-xl p-8">
                <div className="text-center mb-8">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Plus className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Create Faculty Account</h3>
                  <p className="text-gray-600">Fill in the details to create a new faculty or admin account</p>
                </div>

                <div className="max-w-2xl mx-auto space-y-6">
                  {/* Role Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Account Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, role: 'faculty' }))}
                        className={`p-4 rounded-lg border-2 transition-all flex items-center justify-center gap-3 ${
                          formData.role === 'faculty' 
                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                            : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        <User size={20} />
                        <span className="font-medium">Faculty</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, role: 'admin' }))}
                        className={`p-4 rounded-lg border-2 transition-all flex items-center justify-center gap-3 ${
                          formData.role === 'admin' 
                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                            : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        <Shield size={20} />
                        <span className="font-medium">Admin</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User size={18} className="text-gray-400" />
                        </div>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          placeholder="Dr. John Doe"
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    {/* Employee ID */}
                    <div>
                      <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-2">
                        Employee ID <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Hash size={18} className="text-gray-400" />
                        </div>
                        <input
                          id="employeeId"
                          name="employeeId"
                          type="text"
                          placeholder="FAC001"
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          value={formData.employeeId}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="emailId" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail size={18} className="text-gray-400" />
                      </div>
                      <input
                        id="emailId"
                        name="emailId"
                        type="email"
                        placeholder="john.doe@vit.ac.in"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        value={formData.emailId}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Password123!"
                        className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 p-3 bg-white rounded-md border border-gray-200">
                      <p className="text-xs font-medium text-gray-700 mb-2">Password Requirements:</p>
                      <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                        <span>• 8+ characters</span>
                        <span>• Uppercase letter</span>
                        <span>• Lowercase letter</span>
                        <span>• Number</span>
                        <span className="col-span-2">• Special character (!@#$%^&*)</span>
                      </div>
                    </div>
                  </div>

                  {/* ✅ IMPROVED: School & Department Selection */}
                  {!hasContext && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* School Selection */}
                      <div>
                        <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-2">
                          School <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="school"
                          name="school"
                          className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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

                      {/* Department Selection */}
                      <div>
                        <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                          Department <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="department"
                          name="department"
                          className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          value={formData.department}
                          onChange={handleInputChange}
                          required
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
                    <label htmlFor="specializations" className="block text-sm font-medium text-gray-700 mb-2">
                      Specializations <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="specializations"
                      multiple
                      size={4}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={formData.specializations}
                      onChange={handleSpecializationChange}
                      required
                    >
                      {specializationOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">Hold Ctrl (Cmd on Mac) to select multiple specializations</p>
                  </div>

                  {/* Profile Image URL */}
                  <div>
                    <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Image URL <span className="text-gray-400">(Optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Upload size={18} className="text-gray-400" />
                      </div>
                      <input
                        id="imageUrl"
                        name="imageUrl"
                        type="url"
                        placeholder="https://example.com/profile.jpg"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        value={formData.imageUrl}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <button
                      onClick={handleSingleSubmit}
                      disabled={isLoading}
                      className="w-full flex justify-center items-center bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating {formData.role}...
                        </>
                      ) : (
                        <>
                          <Save size={20} className="mr-2" />
                          Create {formData.role === 'faculty' ? 'Faculty' : 'Admin'} Account
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-8">
                <div className="text-center mb-8">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Upload className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Bulk Faculty Upload</h3>
                  <p className="text-gray-600">Upload an Excel file to create multiple faculty accounts at once</p>
                  {hasContext && (
                    <p className="text-sm text-blue-600 mt-2">
                      Using context: <strong>{schoolFromContext} - {departmentFromContext}</strong>
                    </p>
                  )}
                </div>

                {/* Template Download */}
                <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">Download Excel Template</h4>
                      <p className="text-sm text-blue-700">
                        {hasContext 
                          ? `Template for ${schoolFromContext} - ${departmentFromContext} (school & department will be auto-filled)`
                          : 'Template includes all required columns including school and department'
                        }
                      </p>
                    </div>
                    <button
                      onClick={downloadTemplate}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download size={16} className="mr-2" />
                      Download Template
                    </button>
                  </div>
                </div>

                {/* File Upload */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Excel File <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 mb-4 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 mb-2">Excel files only (.xlsx, .xls)</p>
                        <p className="text-xs text-blue-600 text-center max-w-sm">
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
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700 font-medium">✅ File selected: {fileName}</p>
                    </div>
                  )}
                </div>

                {/* Bulk Data Preview */}
                {bulkData.length > 0 && (
                  <div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Faculty Preview ({bulkData.length} records)
                        </h3>
                        {bulkData.filter(f => f.hasErrors).length > 0 && (
                          <p className="text-sm text-red-600">
                            {bulkData.filter(f => f.hasErrors).length} records have errors
                          </p>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleBulkSubmit}
                          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                          disabled={isLoading || bulkData.filter(f => !f.hasErrors).length === 0}
                        >
                          <Save className="h-4 w-4" />
                          {isLoading ? 'Creating...' : `Create ${bulkData.filter(f => !f.hasErrors).length} Accounts`}
                        </button>
                        <button
                          onClick={resetBulkData}
                          disabled={isLoading}
                          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            {!hasContext && (
                              <>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                              </>
                            )}
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specializations</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issues</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {bulkData.map((faculty, index) => (
                            <tr key={index} className={faculty.hasErrors ? 'bg-red-25' : ''}>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {faculty.hasErrors ? (
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                    Error
                                  </span>
                                ) : (
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                    Valid
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {faculty.name || <span className="text-red-500">Missing</span>}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                                {faculty.employeeId || <span className="text-red-500">Missing</span>}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {faculty.emailId || <span className="text-red-500">Missing</span>}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  faculty.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {faculty.role}
                                </span>
                              </td>
                              {!hasContext && (
                                <>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {faculty.school || <span className="text-red-500">Missing</span>}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {faculty.department || <span className="text-red-500">Missing</span>}
                                  </td>
                                </>
                              )}
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {faculty.specializations?.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {faculty.specializations.map((spec, idx) => (
                                      <span key={idx} className="inline-flex px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">
                                        {spec}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-red-500">Missing</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {faculty.hasErrors ? (
                                  <div className="text-red-600">
                                    <div className="font-medium text-xs">Row {faculty.originalRow}:</div>
                                    <ul className="list-disc list-inside text-xs mt-1">
                                      {faculty.errors.map((error, idx) => (
                                        <li key={idx}>{error}</li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : (
                                  <span className="text-green-600 text-xs">✓ No issues</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {bulkData.length === 0 && (
                  <div className="text-center py-12">
                    <Upload className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No data uploaded yet</h3>
                    <p className="text-gray-500">Upload an Excel file to preview faculty data</p>
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

export default FacultyManagement;
