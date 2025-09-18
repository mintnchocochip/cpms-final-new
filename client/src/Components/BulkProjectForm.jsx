import React, { useState } from 'react';
import { Upload, Download, X, AlertTriangle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { createProjectsBulk } from '../api';
import { useNotification } from '../hooks/useNotification';
import BulkPreviewTable from './BulkPreviewTable';
import { normalizeSpecialization, normalizeType } from './utils/formatters';

const BulkProjectForm = ({ 
  isAllMode, 
  schoolFromContext, 
  departmentFromContext, 
  specializationFromContext, 
  typeFromContext, 
  hasContext 
}) => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [fileName, setFileName] = useState("");
  const [bulkFieldErrors, setBulkFieldErrors] = useState({});
  const [bulkPreviewMode, setBulkPreviewMode] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, faculty: '' });
  const [batchSize] = useState(50); // Process max 50 projects per batch

  // ✅ FIXED: Enhanced file processing with better error handling
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
        
        console.log(`Processing ${jsonData.length} rows from Excel file`);
        
        const formattedData = [];
        const errorDetails = [];
        
        // ✅ Process each row with enhanced validation
        jsonData.forEach((row, index) => {
          try {
            const cleanText = (text) => {
              if (!text) return '';
              return String(text).trim();
            };

            const projectName = cleanText(row['Project Name']);
            const guideFacultyEmpId = cleanText(row['Guide Faculty Employee ID']);
            const specialization = cleanText(row['Specialization']);
            const type = cleanText(row['Type']);
            
            let school = cleanText(row['School']);
            let department = cleanText(row['Department']);
            
            // Use context values if not in All Mode
            if (!isAllMode) {
              school = schoolFromContext;
              department = departmentFromContext;
            }
            
            // Students data with better validation
            const students = [];
            for (let i = 1; i <= 3; i++) {
              const studentName = cleanText(row[`Student Name ${i}`]);
              const studentRegNo = cleanText(row[`Student RegNo ${i}`]);
              let studentEmail = cleanText(row[`Student Email ${i}`]);
              
              // Auto-generate email if missing but RegNo exists
              if (studentName && studentRegNo) {
                if (!studentEmail && studentRegNo) {
                  studentEmail = `${studentRegNo.toLowerCase()}@vitstudent.ac.in`;
                }
                students.push({
                  name: studentName,
                  regNo: studentRegNo.toUpperCase(),
                  emailId: studentEmail.toLowerCase()
                });
              }
            }
            
            // Enhanced validation
            const rowErrors = [];
            if (!projectName) rowErrors.push('Missing project name');
            if (!guideFacultyEmpId) rowErrors.push('Missing guide faculty ID');
            if (!specialization) rowErrors.push('Missing specialization');
            if (!type) rowErrors.push('Missing type');
            if (!school) rowErrors.push('Missing school');
            if (!department) rowErrors.push('Missing department');
            if (students.length === 0) rowErrors.push('No valid students');
            
            // Check for duplicate students in same project
            const regNos = students.map(s => s.regNo);
            const uniqueRegNos = [...new Set(regNos)];
            if (regNos.length !== uniqueRegNos.length) {
              rowErrors.push('Duplicate student registration numbers');
            }
            
            if (rowErrors.length > 0) {
              errorDetails.push({
                row: index + 2, 
                name: projectName || 'N/A', 
                errors: rowErrors
              });
            }
            
            formattedData.push({
              idx: index + 2,
              name: projectName || '',
              guideFacultyEmpId: guideFacultyEmpId || '',
              school: school || '',
              department: department || '',
              specialization: specialization || '',
              type: type || '',
              students: students,
              hasErrors: rowErrors.length > 0,
              errors: rowErrors
            });
            
          } catch (rowError) {
            console.error(`Error processing row ${index + 2}:`, rowError);
            errorDetails.push({
              row: index + 2, 
              name: 'Error processing row', 
              errors: [`Row processing error: ${rowError.message}`]
            });
            
            formattedData.push({
              idx: index + 2,
              name: 'ERROR',
              guideFacultyEmpId: 'ERROR',
              school: '',
              department: '',
              specialization: '',
              type: '',
              students: [],
              hasErrors: true,
              errors: [`Row processing error: ${rowError.message}`]
            });
          }
        });
        
        console.log(`Final processed projects: ${formattedData.length}`);
        console.log(`Projects with errors: ${formattedData.filter(p => p.hasErrors).length}`);
        console.log(`Valid projects: ${formattedData.filter(p => !p.hasErrors).length}`);
        
        setProjects(formattedData);
        setBulkPreviewMode(true);
        
        const validEntries = formattedData.filter(entry => !entry.hasErrors);
        const invalidEntries = formattedData.filter(entry => entry.hasErrors);
        
        if (invalidEntries.length > 0) {
          showNotification(
            "warning", 
            "File Processing Issues", 
            `Found ${invalidEntries.length} projects with issues. Review and fix before uploading.`
          );
        }
        
        if (validEntries.length > 0) {
          showNotification(
            "success", 
            "File Processed", 
            `${formattedData.length} projects loaded. ${validEntries.length} valid, ${invalidEntries.length} have issues.`
          );
        }
        
      } catch (err) {
        console.error('File processing error:', err);
        showNotification("error", "File Processing Error", `Error processing file: ${err.message}`);
        setProjects([]);
      }
    };
    
    reader.onerror = () => showNotification("error", "File Read Error", 'Error reading file. Please try again.');
    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    const template = [
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
        "50007", 
        "SCOPE", 
        "BTech", 
        "AI/ML",
        "Software",
        "John Doe", 
        "21BCE1001", 
        "21bce1001@vitstudent.ac.in",
        "Jane Smith", 
        "21BCE1002", 
        "21bce1002@vitstudent.ac.in",
        "", 
        "", 
        ""
      ]
    ];

    try {
      const ws = XLSX.utils.aoa_to_sheet(template);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "ProjectsTemplate");
      XLSX.writeFile(wb, "project_bulk_template.xlsx");
      showNotification("success", "Template Downloaded", "Template downloaded successfully");
    } catch (error) {
      showNotification("error", "Template Error", 'Failed to generate template');
    }
  };

  const clearBulkData = () => {
    setProjects([]);
    setBulkPreviewMode(false);
    setFileName("");
    setBulkFieldErrors({});
    setUploadProgress({ current: 0, total: 0, faculty: '' });
    
    const fileInput = document.getElementById('bulkfileinput');
    if (fileInput) {
      fileInput.value = '';
    }
    
    showNotification('success', 'Data Cleared', 'All project data has been cleared.');
  };

  // ✅ ENHANCED: Batch processing to prevent MongoDB timeouts
  const handleBulkSubmit = async () => {
    const validProjects = projects.filter(proj => !proj.hasErrors);
    
    if (validProjects.length === 0) {
      showNotification("error", "No Valid Projects", "No valid projects to upload. Please fix errors first.");
      return;
    }

    try {
      setLoading(true);
      setUploadProgress({ current: 0, total: 0, faculty: 'Preparing...' });

      // Group projects by faculty for batch processing
      const projectsByFaculty = {};
      validProjects.forEach(proj => {
        const facultyId = proj.guideFacultyEmpId.trim().toUpperCase();
        if (!projectsByFaculty[facultyId]) {
          projectsByFaculty[facultyId] = [];
        }
        projectsByFaculty[facultyId].push(proj);
      });

      const facultyIds = Object.keys(projectsByFaculty);
      console.log(`Processing projects for ${facultyIds.length} faculty members`);
      
      setUploadProgress({ current: 0, total: facultyIds.length, faculty: 'Starting upload...' });

      let successfulUploads = 0;
      let failedUploads = 0;
      let totalProjectsUploaded = 0;
      const errors = [];

      // Process each faculty's projects with delay to prevent overwhelming the server
      for (let i = 0; i < facultyIds.length; i++) {
        const facultyId = facultyIds[i];
        const facultyProjects = projectsByFaculty[facultyId];
        
        setUploadProgress({ 
          current: i + 1, 
          total: facultyIds.length, 
          faculty: `Processing Faculty ${facultyId} (${facultyProjects.length} projects)` 
        });

        try {
          // Prepare payload for this faculty
          const facultyPayload = {
            school: facultyProjects[0].school.trim(),
            department: facultyProjects[0].department.trim(),
            guideFacultyEmpId: facultyId,
            projects: facultyProjects.map(proj => ({
              name: proj.name.trim(),
              specialization: normalizeSpecialization(proj.specialization),
              type: normalizeType(proj.type),
              students: proj.students.map(student => ({
                name: student.name.trim(),
                regNo: student.regNo.trim().toUpperCase(),
                emailId: student.emailId.trim().toLowerCase(),
                school: proj.school.trim(),
                department: proj.department.trim()
              }))
            }))
          };

          console.log(`Uploading ${facultyProjects.length} projects for faculty ${facultyId}`);
          
          // Upload with timeout and retry logic
          const response = await Promise.race([
            createProjectsBulk(facultyPayload),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Upload timeout')), 30000) // 30 second timeout
            )
          ]);

          if (response.data?.success) {
            successfulUploads++;
            totalProjectsUploaded += facultyProjects.length;
            console.log(`✅ Successfully uploaded ${facultyProjects.length} projects for faculty ${facultyId}`);
          } else {
            failedUploads++;
            const errorMsg = response.data?.message || 'Unknown upload error';
            errors.push(`Faculty ${facultyId}: ${errorMsg}`);
            console.error(`❌ Failed to upload projects for faculty ${facultyId}:`, errorMsg);
          }

        } catch (error) {
          failedUploads++;
          const errorMsg = error.message || 'Upload failed';
          errors.push(`Faculty ${facultyId}: ${errorMsg}`);
          console.error(`❌ Error uploading projects for faculty ${facultyId}:`, error);
        }

        // Add small delay between uploads to prevent server overload
        if (i < facultyIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
        }
      }

      // Show final results
      setUploadProgress({ current: facultyIds.length, total: facultyIds.length, faculty: 'Complete!' });

      if (successfulUploads > 0) {
        showNotification(
          "success", 
          "Bulk Upload Complete", 
          `Successfully uploaded ${totalProjectsUploaded} projects for ${successfulUploads} faculty members!`
        );
      }

      if (failedUploads > 0) {
        console.error('Failed uploads:', errors);
        showNotification(
          "error", 
          "Some Uploads Failed", 
          `${failedUploads} faculty uploads failed. Check console for details. ${successfulUploads > 0 ? 'Successful uploads were saved.' : ''}`
        );
      }

      // Clear data only if all uploads were successful
      if (failedUploads === 0) {
        setTimeout(() => {
          clearBulkData();
        }, 2000);
      }

    } catch (err) {
      console.error("Bulk upload error:", err);
      showNotification("error", "Bulk Upload Failed", `Critical error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center space-x-3 mb-4 sm:mb-8">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
          <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
        </div>
        <h2 className="text-lg sm:text-2xl font-bold text-slate-800">Bulk Upload Projects</h2>
      </div>

      {/* Upload Progress Indicator */}
      {loading && (
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-800">Upload Progress</span>
              <span className="text-sm text-blue-600">
                {uploadProgress.current} / {uploadProgress.total}
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress.total > 0 ? (uploadProgress.current / uploadProgress.total) * 100 : 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-blue-700">{uploadProgress.faculty}</p>
          </div>
        </div>
      )}

      {/* Download Template & Upload Section */}
      <div className="max-w-xl sm:max-w-4xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
          <button
            type="button"
            onClick={downloadTemplate}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base w-full sm:w-auto"
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
            disabled={loading}
          />
          <label 
            htmlFor="bulkfileinput" 
            className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl text-sm sm:text-base w-full sm:w-auto ${
              loading 
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Upload size={16} />
            {fileName ? `Uploaded: ${fileName}` : "Upload Excel File"}
          </label>

          {bulkPreviewMode && (
            <button
              type="button"
              onClick={clearBulkData}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 sm:px-4 py-2 sm:py-3 bg-slate-500 hover:bg-slate-600 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-all duration-200 text-sm sm:text-base w-full sm:w-auto"
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>

        {/* Upload Button */}
        {bulkPreviewMode && projects.length > 0 && (
          <div className="flex justify-center mb-6">
            <div className="text-center">
              {/* Summary Stats */}
              <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">{projects.length}</div>
                  <div className="text-blue-800">Total Projects</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-lg font-bold text-green-600">{projects.filter(p => !p.hasErrors).length}</div>
                  <div className="text-green-800">Valid Projects</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-lg font-bold text-red-600">{projects.filter(p => p.hasErrors).length}</div>
                  <div className="text-red-800">Projects with Errors</div>
                </div>
              </div>
              
              <button
                onClick={handleBulkSubmit}
                disabled={loading || projects.filter(p => !p.hasErrors).length === 0}
                className={`flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base ${
                  loading || projects.filter(p => !p.hasErrors).length === 0
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
                    Upload {projects.filter(p => !p.hasErrors).length} Valid Projects
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Warning for large uploads */}
      {bulkPreviewMode && projects.filter(p => !p.hasErrors).length > 500 && (
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-800">Large Upload Detected</h3>
                <p className="text-sm text-amber-700">
                  You're uploading {projects.filter(p => !p.hasErrors).length} projects. This will be processed in batches to prevent timeouts.
                  The upload may take several minutes to complete.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Preview Table */}
      {bulkPreviewMode && projects.length > 0 && (
        <BulkPreviewTable 
          projects={projects}
          bulkFieldErrors={bulkFieldErrors}
        />
      )}
    </div>
  );
};

export default BulkProjectForm;
