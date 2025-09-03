
import React, { useState } from 'react';
import { createProject } from '../api';
import { getGuideProjects, getPanelProjects } from '../api';
import { XCircle, CheckCircle } from 'lucide-react';

const CreateProject = ({ isOpen, onClose, onSuccess }) => {
  const [projectName, setProjectName] = useState('');
  const [students, setStudents] = useState([{ regNo: '', name: '', emailId: '' }]);
  const [loading, setLoading] = useState(false);

  const addStudent = () => {
  if(students.length <3){
    setStudents([...students, { regNo: '', name: '', emailId: '' }]);
  }
  else{
    alert("Only 3 Students Per project")
  }
  };

  const removeStudent = (index) => {
    setStudents(students.filter((_, i) => i !== index));
  };

  const updateStudent = (index, field, value) => {
    const updatedStudents = [...students];
    updatedStudents[index][field] = value;
    setStudents(updatedStudents);
  };

  // Helper to check for duplicate regNo in the form
  const hasDuplicateRegNo = () => {
    const regNos = students.map(s => s.regNo.trim());
    return regNos.length !== new Set(regNos).size;
  };

  // Helper to check for invalid email
  const hasInvalidEmail = () => {
    return students.some(s => s.emailId && !s.emailId.trim().endsWith('@vitstudent.ac.in'));
  };

  // Live error state
  const duplicateRegNoError = hasDuplicateRegNo();
  const invalidEmailError = hasInvalidEmail();

  const getRegNoError = (regNo, idx) => {
    if (!regNo) return '';
    const trimmed = regNo.trim();
    return students.filter((s, i) => s.regNo.trim() === trimmed && trimmed !== '').length > 1
      ? 'Duplicate registration number'
      : '';
  };

  const getEmailError = (email) => {
    if (!email) return '';
    return !email.endsWith('@vitstudent.ac.in') ? 'Email must end with @vitstudent.ac.in' : '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (duplicateRegNoError || invalidEmailError) return;

    // Check for regNo already assigned to another project (frontend validation)
    setLoading(true);
    try {
      // Fetch all projects (guide and panel)
      const [guideRes, panelRes] = await Promise.all([
        getGuideProjects(),
        getPanelProjects()
      ]);
      const allProjects = [
        ...(guideRes.data?.data || []),
        ...(panelRes.data?.data || [])
      ];
      const allExistingRegNos = new Set();
      allProjects.forEach(project => {
        (project.students || []).forEach(student => {
          if (student && student.regNo) {
            allExistingRegNos.add(student.regNo.trim());
          }
        });
      });
      const duplicateAcrossProjects = students.some(s => allExistingRegNos.has(s.regNo.trim()));
      if (duplicateAcrossProjects) {
        alert('Each student can only be added once to this project. Duplicate registration numbers found.');
        setLoading(false);
        return;
      }
    } catch (err) {
      // If fetching fails, allow backend to catch
      console.error('Error checking existing projects:', err);
    }

    setLoading(true);

    try {
      const currentUser = JSON.parse(sessionStorage.getItem('faculty') || '{}');
      
      const payload = {
        name: projectName,
        students: students,
        guideFacultyEmpId: currentUser.employeeId
      };

      const response = await createProject(payload);
      
      if (response.success) {
        alert('Project created successfully!');
        onSuccess();
        onClose();
       
        setProjectName('');
        setStudents([{ regNo: '', name: '', emailId: '' }]);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert(error.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Create New Project</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter project name"
              required
            />
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-700">Students</h3>

              <button
                type="button"
                onClick={addStudent}
                disabled={students.length >= 3 || duplicateRegNoError}
                className={`px-4 py-2 text-white rounded transition-colors duration-200 ${
                  students.length >= 3 || duplicateRegNoError
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                Add Student {students.length >= 3 && '(Max 3)'}
              </button>
            </div>

            {students.map((student, index) => {
              const regNoError = getRegNoError(student.regNo, index);
              const emailError = getEmailError(student.emailId);
              return (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 border rounded relative">
                  <div className="flex flex-col">
                    <input
                      type="text"
                      placeholder="Registration Number"
                      value={student.regNo}
                      onChange={(e) => updateStudent(index, 'regNo', e.target.value)}
                      className={`p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${regNoError ? 'border-red-500' : student.regNo ? 'border-green-500' : ''}`}
                      required
                    />
                    {regNoError && (
                      <span className="flex items-center text-xs text-red-600 mt-1">
                        <XCircle size={16} className="mr-1" /> {regNoError}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <input
                      type="text"
                      placeholder="Student Name"
                      value={student.name}
                      onChange={(e) => updateStudent(index, 'name', e.target.value)}
                      className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="flex flex-col">
                    <input
                      type="email"
                      placeholder="Email ID (@vitstudent.ac.in)"
                      value={student.emailId}
                      onChange={(e) => updateStudent(index, 'emailId', e.target.value)}
                      className={`p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${emailError ? 'border-red-500' : student.emailId ? 'border-green-500' : ''}`}
                      required
                    />
                    {emailError && (
                      <span className="flex items-center text-xs text-red-600 mt-1">
                        <XCircle size={16} className="mr-1" /> {emailError}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeStudent(index)}
                    className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Remove
                  </button>
                  {/* Success icon for valid row */}
                  {!regNoError && !emailError && student.regNo && student.emailId && (
                    <span className="absolute right-2 top-2 text-green-500"><CheckCircle size={18} /></span>
                  )}
                </div>
              );
            })}
            {duplicateRegNoError && (
              <div className="flex items-center text-red-600 text-sm mt-2">
                <XCircle size={18} className="mr-1" /> Duplicate registration numbers are not allowed.
              </div>
            )}
            {invalidEmailError && (
              <div className="flex items-center text-red-600 text-sm mt-2">
                <XCircle size={18} className="mr-1" /> All emails must end with @vitstudent.ac.in.
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || duplicateRegNoError || invalidEmailError}
              className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProject;
