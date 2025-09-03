import React from 'react';
import { CheckCircle } from 'lucide-react';

const SuccessPopup = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
      <div className="bg-white p-6 rounded shadow-md text-center animate-bounce-in">
        <CheckCircle className="text-green-600 w-12 h-12 mx-auto mb-2" />
        <p className="text-lg font-semibold">Review Submitted Successfully!</p>
        <button className="mt-4 px-4 py-2 bg-green-600 text-white rounded" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default SuccessPopup;
