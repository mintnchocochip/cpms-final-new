import React, { useState, useEffect } from 'react';
import { Plus, Save } from 'lucide-react';
import { createProject } from '../api';
import ProjectFormFields from './ProjectFormFields';
import StudentSection from './StudentSection';
import { useNotification } from '../hooks/useNotification';
import { normalizeSpecialization, normalizeType } from './utils/formatters';

const SingleProjectForm = ({ 
  isAllMode, 
  schoolFromContext, 
  departmentFromContext, 
  specializationFromContext, 
  typeFromContext, 
  hasContext 
}) => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // ✅ FIX: Initialize with empty strings to avoid undefined values
  const [singleProject, setSingleProject] = useState({
    name: "",
    guideFacultyEmpId: "",
    school: isAllMode ? "" : (schoolFromContext || ""),
    department: isAllMode ? "" : (departmentFromContext || ""),
    specialization: (specializationFromContext && specializationFromContext.length > 0) ? specializationFromContext[0] : "",
    type: (typeFromContext && typeFromContext.length > 0) ? typeFromContext[0] : "",
    students: [{ name: "", regNo: "", emailId: "" }]
  });

  // Update form when context changes
  useEffect(() => {
    if (hasContext && specializationFromContext && specializationFromContext.length > 0) {
      setSingleProject(prev => ({
        ...prev,
        specialization: specializationFromContext[0] || ""
      }));
    }
  }, [specializationFromContext, hasContext]);

  useEffect(() => {
    if (hasContext && typeFromContext && typeFromContext.length > 0) {
      setSingleProject(prev => ({
        ...prev,
        type: typeFromContext[0] || ""
      }));
    }
  }, [typeFromContext, hasContext]);

  // ✅ FIX: Controlled input handler
  const handleProjectChange = (e) => {
    const { name, value } = e.target;
    setSingleProject(prev => ({
      ...prev,
      [name]: value || "" // Ensure never undefined
    }));
    clearFieldError(name);
  };

  const handleStudentChange = (index, field, value) => {
    const fieldKey = `student_${index}_${field}`;
    
    // Update state with proper string handling
    const updatedStudents = [...singleProject.students];
    updatedStudents[index] = {
      ...updatedStudents[index],
      [field]: value || "" // Ensure never undefined
    };
    setSingleProject(prev => ({
      ...prev,
      students: updatedStudents
    }));

    // Validation logic here...
    clearFieldError(fieldKey);
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

  const setFieldError = (field, errorMessage) => {
    setFieldErrors(prev => ({
      ...prev,
      [field]: errorMessage
    }));
  };

  const clearFieldError = (field) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const resetForm = () => {
    setSingleProject({
      name: "",
      guideFacultyEmpId: "",
      school: isAllMode ? "" : (schoolFromContext || ""),
      department: isAllMode ? "" : (departmentFromContext || ""),
      specialization: (specializationFromContext && specializationFromContext.length > 0) ? specializationFromContext[0] : "",
      type: (typeFromContext && typeFromContext.length > 0) ? typeFromContext[0] : "",
      students: [{ name: "", regNo: "", emailId: "" }]
    });
    setFieldErrors({});
  };

  const handleSubmit = async () => {
    setFieldErrors({});
    
    const projectSchool = isAllMode ? singleProject.school : schoolFromContext;
    const projectDepartment = isAllMode ? singleProject.department : departmentFromContext;

    let hasValidationErrors = false;

    if (!projectSchool || !projectDepartment) {
      showNotification("error", "Missing Context", isAllMode ? 
        "Please select school and department for the project." : 
        "Admin context is missing. Please select school and department.");
      return;
    }

    // Validation logic...
    if (!singleProject.name || !singleProject.name.trim()) {
      setFieldError('name', 'Project name is required.');
      hasValidationErrors = true;
    }

    if (!singleProject.guideFacultyEmpId || !singleProject.guideFacultyEmpId.trim()) {
      setFieldError('guideFacultyEmpId', 'Guide faculty employee ID is required.');
      hasValidationErrors = true;
    }

    // Student validation
    const validStudents = singleProject.students.filter(student => 
      student.name && student.name.trim() && 
      student.regNo && student.regNo.trim() && 
      student.emailId && student.emailId.trim()
    );

    if (validStudents.length === 0) {
      showNotification("error", "Missing Students", "At least one complete student record is required.");
      return;
    }

    if (hasValidationErrors) {
      showNotification("error", "Validation Error", "Please fix all validation errors before submitting.");
      return;
    }

    try {
      setLoading(true);

      const projectSpecialization = specializationFromContext && specializationFromContext.length > 0 
        ? specializationFromContext[0] 
        : singleProject.specialization;
        
      const projectType = typeFromContext && typeFromContext.length > 0 
        ? typeFromContext[0] 
        : singleProject.type;

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
        specialization: normalizeSpecialization(projectSpecialization),
        type: normalizeType(projectType),
        school: projectSchool,
        department: projectDepartment
      };

      const response = await createProject(projectData);

      if (response.data?.success) {
        showNotification("success", "Project Created", `Project "${singleProject.name}" created successfully!`);
        resetForm();
      } else {
        showNotification("error", "Creation Failed", response.data?.message || "Failed to create project");
      }
    } catch (err) {
      console.error("Single project creation error:", err);
      showNotification("error", "Creation Failed", err.response?.data?.message || "Failed to create project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center space-x-3 mb-4 sm:mb-8">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
          <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
        </div>
        <h2 className="text-lg sm:text-2xl font-bold text-slate-800">Create Single Project</h2>
      </div>

      <div className="max-w-xl sm:max-w-3xl mx-auto space-y-6">
        <ProjectFormFields
          project={singleProject}
          isAllMode={isAllMode}
          fieldErrors={fieldErrors}
          specializationFromContext={specializationFromContext}
          typeFromContext={typeFromContext}
          onChange={handleProjectChange}
        />

        <StudentSection
          students={singleProject.students}
          fieldErrors={fieldErrors}
          onStudentChange={handleStudentChange}
          onAddStudent={addStudent}
          onRemoveStudent={removeStudent}
        />

        <div className="pt-4 sm:pt-6">
          <button
            onClick={handleSubmit}
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
  );
};

export default SingleProjectForm;
