import React from 'react';
import { Send } from 'lucide-react';

const RequestPopup = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
      <div className="bg-white p-6 rounded shadow-md text-center animate-fade-in">
        <Send className="text-blue-500 w-10 h-10 mx-auto mb-2" />
        <p className="text-md font-medium">Review request sent to Admin for approval!</p>
        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default RequestPopup;
