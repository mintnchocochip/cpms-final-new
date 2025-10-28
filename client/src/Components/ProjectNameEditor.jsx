import React, { useState } from 'react';
import { Edit2, Save, X, CheckCircle } from 'lucide-react';

const ProjectNameEditor = ({ 
  projectId, 
  currentName, 
  onUpdate, 
  onCancel 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [projectName, setProjectName] = useState(currentName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setProjectName(currentName);
    setError(null);
    if (onCancel) onCancel();
  };

  const handleSave = async () => {
    if (!projectName.trim()) {
      setError('Project name cannot be empty');
      return;
    }

    if (projectName === currentName) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      console.log('📝 [ProjectNameEditor] Updating project name:', {
        projectId,
        oldName: currentName,
        newName: projectName
      });

      await onUpdate(projectId, projectName);

      setIsEditing(false);
      console.log('✅ [ProjectNameEditor] Project name updated successfully');
    } catch (err) {
      console.error('❌ [ProjectNameEditor] Error updating project name:', err);
      setError(err.message || 'Failed to update project name');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isEditing) {
    return (
      <div className="flex items-center gap-3 group">
        <h3 className="font-semibold text-gray-900 text-base sm:text-lg lg:text-xl break-words">
          {currentName}
        </h3>
        <button
          onClick={handleEdit}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-lg hover:bg-blue-100 text-blue-600"
          title="Edit project name"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isSubmitting}
          autoFocus
          className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-lg font-semibold disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="Enter project name"
        />
        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className="p-2 rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
          title="Save changes"
        >
          {isSubmitting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          ) : (
            <Save className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={handleCancel}
          disabled={isSubmitting}
          className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <X className="w-3 h-3" />
          {error}
        </p>
      )}
      <p className="text-xs text-gray-500">
        Press Enter to save, Escape to cancel
      </p>
    </div>
  );
};

export default ProjectNameEditor;
