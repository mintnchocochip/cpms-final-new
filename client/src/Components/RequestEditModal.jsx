import React, { useState } from 'react';
import { X } from 'lucide-react';

const RequestEditModal = ({ 
  isOpen, 
  onClose, 
  teamId, 
  reviewType, 
  students, 
  onSubmit 
}) => {
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [reason, setReason] = useState('');

  const handleStudentToggle = (regNo) => {
    setSelectedStudents(prev => 
      prev.includes(regNo) 
        ? prev.filter(id => id !== regNo)
        : [...prev, regNo]
    );
  };

  const handleSubmit = () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student');
      return;
    }
    
    if (!reason.trim()) {
      alert('Please provide a reason for the edit request');
      return;
    }

    const requestData = {
      projectId: teamId,
      reviewType,
      studentRegNos: selectedStudents,
      reason: reason.trim()
    };

    onSubmit(requestData);
  };

  if (!isOpen) return null;

  const getReviewTitle = () => {
    const titles = {
      'review0': 'Review 0',
      'draftReview': 'Draft Review',
      'final': 'Final Review (Review 1, 2, 3)',
      'review1': 'Review 1',
      'review2': 'Review 2',
      'review3': 'Review 3'
    };
    return titles[reviewType] || reviewType;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">
            Request Edit Access - {getReviewTitle()}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Students:
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded p-3">
              {students.map(student => (
                <label key={student.regNo} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.regNo)}
                    onChange={() => handleStudentToggle(student.regNo)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">
                    {student.name} ({student.regNo})
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Edit Request:
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Please explain why you need to edit the marks after the deadline..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestEditModal;
