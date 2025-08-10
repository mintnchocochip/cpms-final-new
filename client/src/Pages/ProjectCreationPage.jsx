import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Upload, Save, AlertCircle, Building2, GraduationCap, Download, Plus, Users } from "lucide-react";
import Navbar from "../Components/UniversalNavbar";
import { createProject, createProjectsBulk } from "../api";
import { useAdminContext } from '../hooks/useAdminContext';
import { useNavigate } from "react-router-dom";

const ProjectCreationPage = () => {
  const { school, department, getDisplayString, clearContext, loading: contextLoading, error: contextError } = useAdminContext();
  const navigate = useNavigate();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('single');
  
  // Common states
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Single project states
  const [singleProject, setSingleProject] = useState({
    name: "",
    guideFacultyEmpId: "",
    students: [{ name: "", regNo: "", emailId: "" }]
  });

  // Bulk project states
  const [projects, setProjects] = useState([]);
  const [fileName, setFileName] = useState("");

  // Auto-dismiss messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // useEffect(() => {
  //   if (error) {
  //     const timer = setTimeout(() => setError(''), 5000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [error]);

  useEffect(() => {
    if (!contextLoading && (!school || !department)) {
      console.log("Admin context missing, redirecting to school selection");
      navigate("/admin/school-selection");
    }
  }, [contextLoading, school, department, navigate]);

  // Single project functions
  const handleSingleProjectChange = (e) => {
    const { name, value } = e.target;
    setSingleProject(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Check for duplicate students
  const isDuplicateStudent = (students, currentIndex, field, value) => {
    if (!value.trim()) return false;
    
    return students.some((student, index) => 
      index !== currentIndex && 
      student[field].toLowerCase().trim() === value.toLowerCase().trim()
    );
  };

  const handleStudentChange = (index, field, value) => {
    // Check for duplicates before updating
    if (value.trim() && isDuplicateStudent(singleProject.students, index, field, value)) {
      if (field === 'regNo') {
        setError(`Registration number "${value}" is already used by another student.`);
      } else if (field === 'emailId') {
        setError(`Email "${value}" is already used by another student.`);
      }
      return;
    }

    // Clear error if validation passes
    if (error.includes('already used by another student')) {
      setError("");
    }

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
      return;
    }
    
    setSingleProject(prev => ({
      ...prev,
      students: [...prev.students, { name: "", regNo: "", emailId: "" }]
    }));
  };

  const removeStudent = (index) => {
    if (singleProject.students.length > 1) {
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
      students: [{ name: "", regNo: "", emailId: "" }]
    });
  };

  const handleSingleSubmit = async () => {
    if (!school || !department) {
      setError("Admin context is required. Please select school and department.");
      return;
    }

    // Validation
    if (!singleProject.name.trim()) {
      setError("Project name is required.");
      return;
    }

    if (!singleProject.guideFacultyEmpId.trim()) {
      setError("Guide faculty employee ID is required.");
      return;
    }

    const validStudents = singleProject.students.filter(student => 
      student.name.trim() && student.regNo.trim() && student.emailId.trim()
    );

    if (validStudents.length === 0) {
      setError("At least one complete student record is required.");
      return;
    }

    // Check for duplicates in final validation
    const regNos = validStudents.map(s => s.regNo.toLowerCase().trim());
    const emails = validStudents.map(s => s.emailId.toLowerCase().trim());
    
    if (new Set(regNos).size !== regNos.length) {
      setError("Duplicate registration numbers found. Each student must have a unique registration number.");
      return;
    }
    
    if (new Set(emails).size !== emails.length) {
      setError("Duplicate email addresses found. Each student must have a unique email address.");
      return;
    }

    // Check email validation
    for (const student of validStudents) {
      if (!student.emailId.endsWith('@vit.ac.in')) {
        setError(`Student email ${student.emailId} must end with @vit.ac.in`);
        return;
      }
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
          regNo: student.regNo.trim(),
          emailId: student.emailId.trim().toLowerCase(),
          school,
          department
        })),
        guideFacultyEmpId: singleProject.guideFacultyEmpId.trim()
      };

      const response = await createProject(projectData);

      if (response.data?.success) {
        setSuccess(`Project "${singleProject.name}" created successfully for ${getDisplayString()}!`);
        resetSingleForm();
      } else {
        setError(response.data?.message || "Failed to create project");
      }

    } catch (err) {
      console.error("Single project creation error:", err);
      
      // Parse the error message to identify duplicate key errors
      const errorMessage = err.response?.data?.message || err.message || "";
      
      // Check if it's a MongoDB duplicate key error
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

  // Bulk project functions
  const downloadTemplate = () => {
    const template = [
      {
        "project name": "AI Chatbot System",
        "student name": "John Doe",
        "reg no.": "21BCE1001",
        "email id": "john.doe@vit.ac.in",
        "guide faculty emp id": "FAC101"
      },
      {
        "project name": "AI Chatbot System",
        "student name": "Jane Smith", 
        "reg no.": "21BCE1002",
        "email id": "jane.smith@vit.ac.in",
        "guide faculty emp id": "FAC101"
      },
      {
        "project name": "Web Application",
        "student name": "Bob Wilson",
        "reg no.": "21BCE1003", 
        "email id": "bob.wilson@vit.ac.in",
        "guide faculty emp id": "FAC102"
      },
      {
        "project name": "Mobile App Development",
        "student name": "Alice Johnson",
        "reg no.": "21BCE1004",
        "email id": "alice.johnson@vit.ac.in", 
        "guide faculty emp id": "FAC103"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Projects Template');
    XLSX.writeFile(wb, 'projects_template.xlsx');
  };

  const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  setFileName(file.name);
  setError(""); // Clear previous errors when new file is uploaded
  setSuccess("");

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      // Helper function to safely extract and clean text
      const cleanText = (value) => {
        if (value === null || value === undefined) return '';
        return String(value)
          .trim()
          .replace(/[\r\n\t]/g, ' ')
          .replace(/\s+/g, ' ')
          .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '')
          .trim();
      };

      const formattedProjects = {};
      const errorDetails = [];
      let totalRowsProcessed = 0;

      jsonData.forEach((row, index) => {
        totalRowsProcessed++;
        const rowErrors = [];
        
        try {
          // Clean and extract fields
          const projectName = cleanText(row["project name"]);
          const studentName = cleanText(row["student name"]);
          const regNo = cleanText(row["reg no."]);
          const emailId = cleanText(row["email id"]).toLowerCase();
          const guideFacultyEmpId = cleanText(row["guide faculty emp id"]);

          // Validate required fields
          if (!projectName) rowErrors.push("Missing project name");
          if (!studentName) rowErrors.push("Missing student name");
          if (!regNo) rowErrors.push("Missing registration number");
          if (!emailId) rowErrors.push("Missing email ID");
          if (!guideFacultyEmpId) rowErrors.push("Missing guide faculty emp ID");

          // Validate email format and domain
          if (emailId) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailId)) {
              rowErrors.push("Invalid email format");
            } else if (!emailId.endsWith('@vit.ac.in')) {
              rowErrors.push("Email must end with @vit.ac.in");
            }
          }

          // Record errors but continue processing
          if (rowErrors.length > 0) {
            errorDetails.push({
              row: index + 2,
              projectName: projectName || 'N/A',
              studentName: studentName || 'N/A',
              errors: rowErrors
            });
          }

          // Process valid data (even if some fields have issues)
          if (projectName && studentName && regNo && emailId && guideFacultyEmpId) {
            const projectKey = projectName;
            
            if (!formattedProjects[projectKey]) {
              formattedProjects[projectKey] = {
                name: projectName,
                guideFacultyEmpId: guideFacultyEmpId,
                students: [],
                hasErrors: false
              };
            } else {
              // Check guide consistency
              if (formattedProjects[projectKey].guideFacultyEmpId !== guideFacultyEmpId) {
                rowErrors.push(`Guide faculty mismatch. Expected: ${formattedProjects[projectKey].guideFacultyEmpId}, Got: ${guideFacultyEmpId}`);
                formattedProjects[projectKey].hasErrors = true;
                errorDetails.push({
                  row: index + 2,
                  projectName: projectName,
                  studentName: studentName,
                  errors: [`Guide faculty mismatch in project "${projectName}"`]
                });
              }
            }

            formattedProjects[projectKey].students.push({
              name: studentName,
              regNo: regNo,
              emailId: emailId,
              originalRow: index + 2,
              hasErrors: rowErrors.length > 0
            });

            if (rowErrors.length > 0) {
              formattedProjects[projectKey].hasErrors = true;
            }
          }

        } catch (rowError) {
          errorDetails.push({
            row: index + 2,
            projectName: 'Error processing row',
            studentName: 'N/A',
            errors: [`Error processing row: ${rowError.message}`]
          });
        }
      });

      // Convert to array and set projects
      const projectsArray = Object.values(formattedProjects);
      setProjects(projectsArray);

      // Report results
      const validProjects = projectsArray.filter(p => !p.hasErrors);
      const invalidCount = errorDetails.length;

      if (invalidCount > 0) {
        const errorSummary = errorDetails
          .slice(0, 10)
          .map(detail => `Row ${detail.row} (${detail.projectName} - ${detail.studentName}): ${detail.errors.join(', ')}`)
          .join('\n');
        
        setError(`Found ${invalidCount} issues in uploaded data:\n\n${errorSummary}${invalidCount > 10 ? `\n... and ${invalidCount - 10} more errors` : ''}\n\nProblematic entries are included but marked. Fix issues before submitting.`);
      }

      if (projectsArray.length > 0) {
        setSuccess(`${projectsArray.length} projects loaded with ${totalRowsProcessed} student records. ${validProjects.length} projects are valid, ${projectsArray.filter(p => p.hasErrors).length} have issues.`);
      } else {
        setError("No valid project data found in the uploaded file.");
      }

    } catch (err) {
      setError(`Error processing file: ${err.message}. Please ensure the file format is correct and try again.`);
      setProjects([]);
    }
  };

  reader.onerror = () => {
    setError('Error reading file. Please try again.');
  };

  reader.readAsArrayBuffer(file);
};


  const handleBulkSubmit = async () => {
    if (!school || !department) {
      setError("Admin context is required. Please select school and department.");
      return;
    }

    if (projects.length === 0) {
      setError("No projects to submit. Please upload a valid Excel file.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      console.log("Submitting projects with individual guides:", projects);

      // Submit each project separately with its own guide
      const results = {
        created: 0,
        errors: 0,
        details: []
      };

      for (const project of projects) {
        try {
          console.log(`Creating project: ${project.name} with guide: ${project.guideFacultyEmpId}`);
          
          const response = await createProjectsBulk({
            school,
            department,
            projects: [project], // Submit one project at a time
            guideFacultyEmpId: project.guideFacultyEmpId // Use the project's specific guide
          });

          if (response.data?.data?.created > 0) {
            results.created += response.data.data.created;
          }
          if (response.data?.data?.errors > 0) {
            results.errors += response.data.data.errors;
            if (response.data.data.details) {
              results.details.push(...response.data.data.details);
            }
          }

        } catch (projectError) {
          console.error(`Error creating project ${project.name}:`, projectError);
          results.errors++;
          
          // Better error message parsing for duplicates
          const errorMessage = projectError.response?.data?.message || projectError.message || "";
          let userFriendlyError;
          
          if (errorMessage.includes("E11000") || errorMessage.includes("duplicate key") || errorMessage.includes("dup key")) {
            userFriendlyError = `❌ Duplicate project name: "${project.name}" already exists`;
          } else {
            userFriendlyError = projectError.response?.data?.message || projectError.message;
          }
          
          results.details.push({
            project: project.name,
            error: userFriendlyError
          });
        }
      }

      // Display comprehensive results
      if (results.created > 0) {
        setSuccess(
          `Successfully created ${results.created} projects for ${getDisplayString()}!` +
          (results.errors > 0 ? ` ${results.errors} errors occurred.` : '')
        );
      } else {
        setError("No projects were created successfully. Please check the details below.");
      }

      if (results.errors > 0) {
        console.log("Project creation errors:", results.details);
        const errorSummary = results.details
          .map(detail => `${detail.project}: ${detail.error}`)
          .join('\n');
        setError(prev => prev + `\n\nDetailed errors:\n${errorSummary}`);
      }
      
      // Reset form on success
      if (results.created > 0) {
        setProjects([]);
        setFileName("");
      }
      
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create projects. Please try again.");
      console.error("Project creation error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Context loading and error handling
  if (contextLoading) {
    return (
      <>
        <Navbar userType="admin" />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-xl">Loading admin context...</div>
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
              {contextError || "Please select your school and department to create projects"}
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-x-hidden">
        <div className="p-8 lg:p-20 lg:pl-28">
          <div className="shadow-xl rounded-2xl bg-white p-8 lg:p-10">
            
            {/* Header */}
            <div className=" mb-4 ">
            <div className="flex justify-stretch items-center gap-96 " >
            <h1 className="text-3xl font-bold text-gray-900">Project Creation</h1>
            
            {/* Admin Context Display */}
            <div className="pl-40" >

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 ">
              <div className="flex items-center justify-between gap-5  ">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900 ">
                    {getDisplayString()}
                  </span>
                </div>
                <button
                  onClick={clearContext}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                  Change School/Department
                </button>
              </div>
              </div>
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
                  Single Project
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
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium whitespace-pre-line">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content */}
            {activeTab === 'single' ? (
              // Single Project Form
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-8">
                  <div className="text-center mb-8">
                    <Plus size={48} className="mx-auto text-blue-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Single Project</h3>
                    <p className="text-gray-600">Add one project with its team members</p>
                  </div>

                  <div className="space-y-6">
                    {/* Project Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Project Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={singleProject.name}
                        onChange={handleSingleProjectChange}
                        placeholder="AI Chatbot System"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>

                    {/* Guide Faculty Employee ID */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Guide Faculty Employee ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="guideFacultyEmpId"
                        value={singleProject.guideFacultyEmpId}
                        onChange={handleSingleProjectChange}
                        placeholder="FAC101"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
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
                          <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
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
                                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
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
                                    student.regNo && isDuplicateStudent(singleProject.students, index, 'regNo', student.regNo)
                                      ? 'border-red-500 bg-red-50'
                                      : 'border-gray-300'
                                  }`}
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Email ID <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="email"
                                  value={student.emailId}
                                  onChange={(e) => handleStudentChange(index, 'emailId', e.target.value)}
                                  placeholder="john.doe@vit.ac.in"
                                  className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                                    student.emailId && isDuplicateStudent(singleProject.students, index, 'emailId', student.emailId)
                                      ? 'border-red-500 bg-red-50'
                                      : 'border-gray-300'
                                  }`}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="mt-8">
                    <button
                      onClick={handleSingleSubmit}
                      disabled={loading}
                      className="w-full flex justify-center items-center bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 disabled:opacity-75 disabled:cursor-not-allowed font-medium shadow-lg"
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
              // Bulk Upload Form (existing bulk implementation)
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-8">
                  <div className="text-center mb-8">
                    <Upload size={48} className="mx-auto text-blue-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Bulk Project Upload</h3>
                    <p className="text-gray-600">Upload an Excel file to create multiple projects at once</p>
                  </div>

                  {/* Template Download */}
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-blue-900">Download Excel Template</h4>
                        <p className="text-sm text-blue-700">Get the required Excel format with individual guide faculty assignments per project</p>
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
                            Required columns: project name, student name, reg no., email id, guide faculty emp id
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

{/* Projects Preview Table */}
{projects.length > 0 && (
  <div className="mb-8">
    {/* Submit Button at Top */}
    <div className="flex justify-between items-center mb-4">
      <h3 className="font-semibold text-lg text-gray-800">
        Project Details ({projects.length} projects)
        {projects.filter(p => p.hasErrors).length > 0 && (
          <span className="text-red-600 text-sm ml-2">
            ({projects.filter(p => p.hasErrors).length} with issues)
          </span>
        )}
      </h3>
      <button
        onClick={handleBulkSubmit}
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
        disabled={loading || projects.filter(p => !p.hasErrors).length === 0}
      >
        <Save className="h-5 w-5" />
        {loading ? 'Creating...' : `Create ${projects.filter(p => !p.hasErrors).length} Valid Projects`}
      </button>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-200 p-4 text-left text-sm font-semibold text-gray-700">Status</th>
            <th className="border border-gray-200 p-4 text-left text-sm font-semibold text-gray-700">Project Name</th>
            <th className="border border-gray-200 p-4 text-left text-sm font-semibold text-gray-700">Guide Faculty</th>
            <th className="border border-gray-200 p-4 text-left text-sm font-semibold text-gray-700">Students</th>
            <th className="border border-gray-200 p-4 text-left text-sm font-semibold text-gray-700">Issues</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project, index) => (
            <tr key={index} className={`hover:bg-gray-50 ${project.hasErrors ? 'bg-red-50' : ''}`}>
              <td className="border border-gray-200 p-4 text-center">
                {project.hasErrors ? (
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                    ❌ Error
                  </span>
                ) : (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    ✅ Valid
                  </span>
                )}
              </td>
              <td className="border border-gray-200 p-4 text-gray-700 font-medium">{project.name}</td>
              <td className="border border-gray-200 p-4">
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  project.hasErrors ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {project.guideFacultyEmpId}
                </span>
              </td>
              <td className="border border-gray-200 p-4">
                <div className="space-y-1">
                  {project.students.map((student, idx) => (
                    <div key={idx} className={`border rounded px-2 py-1 text-sm ${
                      student.hasErrors ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-200 text-blue-800'
                    }`}>
                      {student.name} ({student.regNo})
                      {student.hasErrors && <span className="ml-1">⚠️</span>}
                    </div>
                  ))}
                </div>
              </td>
              <td className="border border-gray-200 p-4">
                {project.hasErrors ? (
                  <div className="text-xs text-red-600">
                    <div className="font-medium">Issues found:</div>
                    <div className="mt-1">Check error details above</div>
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
                  {projects.length === 0 && (
                    <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                      <Upload className="h-20 w-20 mx-auto mb-4 text-gray-300" />
                      <div className="text-2xl font-semibold text-gray-600 mb-2">
                        No projects uploaded
                      </div>
                      <div className="text-gray-500">
                        Upload an Excel sheet to view project details
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

export default ProjectCreationPage;
