import React from 'react';

const ConfirmPopup = ({ isOpen, onClose, onConfirm, type }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-80">
        <h2 className="text-lg font-bold mb-2">Confirm Removal</h2>
        <p>Are you sure you want to remove this {type}?</p>
        <div className="mt-4 flex justify-end gap-3">
          <button onClick={onClose} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
          <button onClick={onConfirm} className="bg-red-600 text-white px-4 py-2 rounded">Remove</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmPopup;
