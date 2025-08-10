import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Hash, Shield, Upload, Building2, Plus, Save, AlertCircle, Download } from 'lucide-react';
import Navbar from '../Components/UniversalNavbar';
import { createFaculty, createAdmin, createFacultyBulk } from '../api';
import { useAdminContext } from '../hooks/useAdminContext';
import * as XLSX from 'xlsx';

const FacultyManagement = () => {
  const navigate = useNavigate();
  const { school, department, getDisplayString, clearContext, loading: contextLoading, error: contextError } = useAdminContext();
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('single');
  
  const [formData, setFormData] = useState({
    imageUrl: '',
    employeeId: '',
    name: '',
    emailId: '',
    password: '',
    role: 'faculty'
  });

  const [bulkData, setBulkData] = useState([]);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const resetForm = () => {
    setFormData({
      imageUrl: '',
      employeeId: '',
      name: '',
      emailId: '',
      password: '',
      role: 'faculty'
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

  // ✅ FIX: Add the change context handler like in Panel Management
  const handleChangeSchoolDepartment = () => {
    sessionStorage.removeItem("adminContext");
    navigate("/admin/school-selection");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
  };

  const handleSingleSubmit = async () => {
    if (!school || !department) {
      setError('Admin context is required. Please select school and department.');
      return;
    }

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      validateForm();

      const apiData = {
        name: String(formData.name.trim()),
        emailId: String(formData.emailId.trim().toLowerCase()),
        password: String(formData.password),
        employeeId: String(formData.employeeId.trim().toUpperCase()),
        imageUrl: String(formData.imageUrl.trim()),
        school: school,
        department: department
      };

      let response;
      if (formData.role === 'faculty') {
        response = await createFaculty(apiData);
      } else if (formData.role === 'admin') {
        response = await createAdmin(apiData);
      } else {
        throw new Error('Invalid role selected');
      }

      setSuccess(response.message || `${formData.role === 'faculty' ? 'Faculty' : 'Admin'} created successfully for ${getDisplayString()}!`);
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
        
        jsonData.forEach((row, index) => {
          try {
            const name = cleanText(row.name);
            const employeeId = cleanText(row.employeeId);
            const emailId = cleanText(row.emailId).toLowerCase();
            const password = row.password ? String(row.password).trim() : '';
            const role = cleanText(row.role);
            const imageUrl = cleanText(row.imageUrl) || '';

            const rowErrors = [];

            if (!name) rowErrors.push('Missing or empty name field');
            if (!employeeId) rowErrors.push('Missing or empty employeeId field');
            if (!emailId) rowErrors.push('Missing or empty emailId field');
            if (!password || password === '0') rowErrors.push('Missing or empty password field');

            const cleanEmployeeId = employeeId.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
            if (employeeId && !cleanEmployeeId) {
              rowErrors.push('Employee ID contains no valid characters');
            }

            if (emailId) {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(emailId)) {
                rowErrors.push('Invalid email format');
              } else if (!emailId.endsWith('@vit.ac.in')) {
                rowErrors.push('Email must end with @vit.ac.in');
              }
            }

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
              errors: [`Error processing row - ${rowError.message}`]
            });
            
            formattedData.push({
              name: 'ERROR',
              employeeId: 'ERROR',
              emailId: 'ERROR',
              password: '',
              role: 'faculty',
              imageUrl: '',
              school: school,
              department: department,
              originalRow: index + 2,
              hasErrors: true,
              errors: [`Error processing row - ${rowError.message}`]
            });
          }
        });

        setBulkData(formattedData);

        const validEntries = formattedData.filter(entry => !entry.hasErrors);
        const invalidEntries = formattedData.filter(entry => entry.hasErrors);

        if (invalidEntries.length > 0) {
          const errorSummary = errorDetails
            .slice(0, 10)
            .map(detail => 
              `Row ${detail.row} (${detail.name}): ${detail.errors.join(', ')}`
            ).join('\n');
          
          setError(`Found ${invalidEntries.length} problematic entries:\n\n${errorSummary}${invalidEntries.length > 10 ? `\n... and ${invalidEntries.length - 10} more errors` : ''}\n\nProblematic entries are included but marked. Fix issues before submitting.`);
        }

        if (validEntries.length > 0) {
          setSuccess(`${formattedData.length} faculty records loaded from Excel file. ${validEntries.length} are valid, ${invalidEntries.length} have issues.`);
        } else {
          setSuccess(`${formattedData.length} faculty records loaded, but all have issues that need to be fixed.`);
        }

      } catch (err) {
        console.error('File processing error:', err);
        setError(`Error processing file: ${err.message}. Please ensure the file format is correct and try again.`);
        setBulkData([]);
      }
    };

    reader.onerror = () => {
      setError('Error reading file. Please try again.');
    };

    reader.readAsArrayBuffer(file);
  };

  const handleBulkSubmit = async () => {
    if (!school || !department) {
      setError('Admin context is required. Please select school and department.');
      return;
    }

    if (bulkData.length === 0) {
      setError('No faculty data to upload. Please select a valid Excel file.');
      return;
    }

    const validEntries = bulkData.filter(entry => !entry.hasErrors);
    const invalidEntries = bulkData.filter(entry => entry.hasErrors);

    if (validEntries.length === 0) {
      setError('No valid faculty entries to submit. Please fix the errors in your data first.');
      return;
    }

    if (invalidEntries.length > 0) {
      const confirmSubmit = window.confirm(
        `You have ${invalidEntries.length} invalid entries that will be skipped. Do you want to proceed with creating ${validEntries.length} valid faculty accounts?`
      );
      if (!confirmSubmit) {
        return;
      }
    }

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const validatedData = validEntries.map(faculty => ({
        name: String(faculty.name).trim(),
        emailId: String(faculty.emailId).trim().toLowerCase(),
        password: String(faculty.password),
        employeeId: String(faculty.employeeId).trim().toUpperCase(),
        role: faculty.role,
        imageUrl: String(faculty.imageUrl || '').trim(),
        school: school,
        department: department
      }));

      const response = await createFacultyBulk({
        facultyList: validatedData,
        school: school,
        department: department
      });

      const successCount = response.data?.created || 0;
      const errorCount = response.data?.errors || 0;
      
      if (successCount > 0) {
        setSuccess(`Successfully created ${successCount} faculty members for ${getDisplayString()}!${errorCount > 0 ? ` ${errorCount} errors occurred during creation.` : ''}${invalidEntries.length > 0 ? ` ${invalidEntries.length} entries were skipped due to validation errors.` : ''}`);
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
    const template = [
      {
        name: 'Dr. John Smith',
        employeeId: 'FAC001',
        emailId: 'john.smith@vit.ac.in',
        password: 'TempPass@123',
        role: 'faculty',
        imageUrl: ''
      },
      {
        name: 'Dr. Jane Admin',
        employeeId: 'ADM001', 
        emailId: 'jane.admin@vit.ac.in',
        password: 'AdminPass@456',
        role: 'admin',
        imageUrl: 'https://example.com/profile.jpg'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Faculty Template');
    XLSX.writeFile(wb, 'faculty_template.xlsx');
  };

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

  if (contextError || !school || !department) {
    return (
      <>
        <Navbar userType="admin" />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xl text-red-600 mb-4">Admin Context Required</div>
            <p className="text-gray-600 mb-4">
              {contextError || "Please select your school and department to manage faculty"}
            </p>
            <button
              onClick={() => navigate("/admin/school-selection")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Select School & Department
            </button>
          </div>
        </div>
      </>
    );
  }

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-x-hidden">
        <div className="p-8 lg:p-20 lg:pl-28">
          <div className="shadow-xl rounded-2xl bg-white p-8 lg:p-10">
            {/* Header */}
            <div className="mb-4">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Faculty Management</h1>
                
                {/* ✅ FIX: Admin Context Display - Same as Panel Management */}
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    <h3 className="font-semibold text-gray-800 mb-2">Current Context:</h3>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <span className="text-gray-700">School: <strong>{school}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-purple-600" />
                        <span className="text-gray-700">Department: <strong>{department}</strong></span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleChangeSchoolDepartment}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                  >
                    Change School/Department
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="mb-8">
              <div className="inline-flex bg-white rounded-xl p-1.5 shadow-md border border-gray-100">
                <button
                  onClick={() => setActiveTab('single')}
                  className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                    activeTab === 'single'
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md transform scale-105"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  <Plus size={16} />
                  Single Faculty
                </button>
                <button
                  onClick={() => setActiveTab('bulk')}
                  className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                    activeTab === 'bulk'
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md transform scale-105"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  <Upload size={16} />
                  Bulk Upload
                </button>
              </div>
            </div>

            {/* Success/Error Messages */}
            {success && (
              <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 text-sm border border-green-200 shadow-sm">
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <div className="font-medium">{success}</div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-sm border border-red-200 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium whitespace-pre-line">{error}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setError('')}
                    className="ml-4 text-red-400 hover:text-red-600 transition-colors"
                    title="Dismiss error"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* ✅ FIX: Complete Tab Content */}
            {activeTab === 'single' ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-8">
                  <div className="text-center mb-8">
                    <Plus size={48} className="mx-auto text-blue-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Single Faculty</h3>
                    <p className="text-gray-600">Add one faculty or admin account</p>
                  </div>

                  <div className="space-y-6">
                    {/* Role Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Type <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, role: 'faculty' }))}
                          className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-center space-x-2 ${
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
                          className={`p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-center space-x-2 ${
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
                          placeholder="Dr. Bruce Wayne"
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
                          placeholder="VITF1234"
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          value={formData.employeeId}
                          onChange={handleInputChange}
                          required
                        />
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
                          placeholder="bruce.wayne@vit.ac.in"
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
                          placeholder="Wayne@2025"
                          className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-700 mb-1">Password Requirements:</p>
                        <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                          <span>• 8+ characters</span>
                          <span>• One uppercase (A-Z)</span>
                          <span>• One lowercase (a-z)</span>
                          <span>• One number (0-9)</span>
                          <span className="col-span-2">• One special character (!@#$%^&*)</span>
                        </div>
                      </div>
                    </div>

                    {/* Profile Image URL */}
                    <div>
                      <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                        Profile Image URL <span className="text-gray-400 font-normal">(Optional)</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Upload size={18} className="text-gray-400" />
                        </div>
                        <input
                          id="imageUrl"
                          name="imageUrl"
                          type="url"
                          placeholder="https://example.com/profile-image.jpg"
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          value={formData.imageUrl}
                          onChange={handleInputChange}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        URL to profile image (optional)
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="mt-8">
                    <button
                      onClick={handleSingleSubmit}
                      disabled={isLoading}
                      className="w-full flex justify-center items-center bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 disabled:opacity-75 disabled:cursor-not-allowed font-medium shadow-lg"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating {formData.role === 'faculty' ? 'Faculty' : 'Admin'}...
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
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-8">
                  <div className="text-center mb-8">
                    <Upload size={48} className="mx-auto text-blue-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Bulk Faculty Upload</h3>
                    <p className="text-gray-600">Upload an Excel file to create multiple faculty accounts at once</p>
                  </div>

                  {/* Template Download */}
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-blue-900">Download Excel Template</h4>
                        <p className="text-sm text-blue-700">Get the required Excel format for faculty upload (imageUrl is optional)</p>
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

                  {/* File Upload Section */}
                  <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Excel File <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-4 text-gray-500" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">Excel files only (.xlsx, .xls)</p>
                          <p className="text-xs text-blue-600 font-medium mt-1">
                            Required: name, employeeId, emailId, password, role | Optional: imageUrl
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
                      <p className="mt-2 text-sm text-green-600">✅ Selected file: {fileName}</p>
                    )}
                  </div>

                  {/* Preview Table */}
                  {bulkData.length > 0 && (
                    <div className="mb-8">
                      {/* Submit Buttons at Top */}
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-lg text-gray-800">
                          Faculty Details ({bulkData.length} records)
                          {bulkData.filter(f => f.hasErrors).length > 0 && (
                            <span className="text-red-600 text-sm ml-2">
                              ({bulkData.filter(f => f.hasErrors).length} with errors)
                            </span>
                          )}
                        </h3>
                        <div className="flex gap-4">
                          <button
                            onClick={handleBulkSubmit}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                            disabled={isLoading || bulkData.filter(f => !f.hasErrors).length === 0}
                          >
                            <Save className="h-5 w-5" />
                            {isLoading ? 'Creating...' : `Create ${bulkData.filter(f => !f.hasErrors).length} Valid Faculty Accounts`}
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

                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-200 p-4 text-left text-sm font-semibold text-gray-700">Status</th>
                              <th className="border border-gray-200 p-4 text-left text-sm font-semibold text-gray-700">Name</th>
                              <th className="border border-gray-200 p-4 text-left text-sm font-semibold text-gray-700">Employee ID</th>
                              <th className="border border-gray-200 p-4 text-left text-sm font-semibold text-gray-700">Email</th>
                              <th className="border border-gray-200 p-4 text-left text-sm font-semibold text-gray-700">Role</th>
                              <th className="border border-gray-200 p-4 text-left text-sm font-semibold text-gray-700">Image URL</th>
                              <th className="border border-gray-200 p-4 text-left text-sm font-semibold text-gray-700">Issues</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bulkData.map((faculty, index) => (
                              <tr key={index} className={`hover:bg-gray-50 ${faculty.hasErrors ? 'bg-red-50' : ''}`}>
                                <td className="border border-gray-200 p-4 text-center">
                                  {faculty.hasErrors ? (
                                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                                      ❌ Error
                                    </span>
                                  ) : (
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                      ✅ Valid
                                    </span>
                                  )}
                                </td>
                                <td className="border border-gray-200 p-4 text-gray-700 font-medium">
                                  {faculty.name || <span className="text-red-500">Missing</span>}
                                </td>
                                <td className="border border-gray-200 p-4">
                                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                                    faculty.hasErrors ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800'
                                  }`}>
                                    {faculty.employeeId || <span className="text-red-500">Missing</span>}
                                  </span>
                                </td>
                                <td className="border border-gray-200 p-4 text-gray-700">
                                  {faculty.emailId || <span className="text-red-500">Missing</span>}
                                </td>
                                <td className="border border-gray-200 p-4 text-center">
                                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                                    faculty.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                                  }`}>
                                    {faculty.role}
                                  </span>
                                </td>
                                <td className="border border-gray-200 p-4 text-gray-700 text-xs">
                                  {faculty.imageUrl ? (
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                      {faculty.imageUrl.substring(0, 30)}{faculty.imageUrl.length > 30 ? '...' : ''}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="border border-gray-200 p-4">
                                  {faculty.hasErrors ? (
                                    <div className="text-xs text-red-600">
                                      <div className="font-medium">Row {faculty.originalRow}:</div>
                                      <ul className="list-disc list-inside mt-1">
                                        {faculty.errors.map((error, idx) => (
                                          <li key={idx}>{error}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  ) : (
                                    <span className="text-green-600 text-xs">✅ No issues</span>
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
                    <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                      <Upload className="h-20 w-20 mx-auto mb-4 text-gray-300" />
                      <div className="text-2xl font-semibold text-gray-600 mb-2">
                        No faculty uploaded
                      </div>
                      <div className="text-gray-500">
                        Upload an Excel sheet to view faculty details
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default FacultyManagement;
