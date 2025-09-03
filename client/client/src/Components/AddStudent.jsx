// AddStudent.jsx
import React, { useState } from 'react';

const AddStudent = ({ isOpen, onClose, onSubmit }) => {
  const [students, setStudents] = useState([{ name: "", regNo: "",mailID:"" }]);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  const handleStudentChange = (index, field, value) => {
    const updatedStudents = [...students];
    updatedStudents[index] = { ...updatedStudents[index], [field]: value };
    setStudents(updatedStudents);
  };

  const handleAddStudent = () => {
    if (students.length < 3) {
      setStudents([...students, { name: "", regNo: "",mailID:"" }]);
    }
  };

  const handleRemoveStudent = (index) => {
    if (students.length > 1) {
      const updatedStudents = students.filter((_, i) => i !== index);
      setStudents(updatedStudents);
    }
  };

  const handleSubmit = () => {
    if (projectTitle.trim() === "") {
      alert("Please enter a project title.");
      return;
    }

    // if(){
    //   alert("This project title is already taken. Please choose a different title.")
    //   return;
    // }
    
    const isValid = students.every(student => 
      student.name.trim() !== "" && student.regNo.trim() !== ""
    );
    
    if (!isValid) {
      alert("Please fill in all student names and registration numbers.");
      return;
    }
    
    onSubmit(projectTitle, students);
    
    // Reset form
    setProjectTitle("");
    setProjectDescription("");
    setStudents([{ name: "", regNo: "",mailID:"" }]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Team</h2>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Project Title
          </label>
          <input
            type="text"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter project title"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Project Description
          </label>
          <textarea
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter project description"
            rows="2"
          />
        </div>

        <div className="space-y-4">
          {students.map((student, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={student.name}
                  onChange={(e) => handleStudentChange(index, "name", e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Student name"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={student.regNo}
                  onChange={(e) => handleStudentChange(index, "regNo", e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Registration No."
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={student.mailID}
                  onChange={(e) => handleStudentChange(index, "mailID", e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your Email ID"
                />
              </div>
              {students.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveStudent(index)}
                  className="text-red-500 hover:text-red-700 px-2"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {students.length < 3 && (
          <button
            type="button"
            onClick={handleAddStudent}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Add Student
          </button>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddStudent;