import React, { useEffect } from 'react';
import { X, Users, User, Hash, Tag, Calendar } from 'lucide-react';

const TeamPopup = ({ team, onClose }) => {
  useEffect(() => {
    console.log("Team popup data:", team);
  }, [team]);

  if (!team) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out scale-100">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl relative">
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors duration-200 p-2 hover:bg-white hover:bg-opacity-20 rounded-full"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="pr-12">
            <h2 className="text-2xl font-bold mb-2">{team.name}</h2>
            {team.domain && team.domain !== 'N/A' && (
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                <span className="bg-blue-400 text-blue-100 px-3 py-1 rounded-full text-sm font-medium">
                  {team.domain}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          {/* Project Info */}
          {(team._id || team.type || team.status) && (
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3 text-gray-800 flex items-center gap-2">
                <Hash className="h-5 w-5 text-blue-600" />
                Project Information
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                {team._id && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Project ID:</span>
                    <span className="text-sm font-mono bg-white px-2 py-1 rounded border">
                      {team._id}
                    </span>
                  </div>
                )}
                {team.type && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Type:</span>
                    <span className={`text-sm px-2 py-1 rounded-full font-medium ${
                      team.type === 'guide' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {team.type === 'guide' ? 'Guide Project' : 'Panel Project'}
                    </span>
                  </div>
                )}
                {team.status && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Status:</span>
                    <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                      {team.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Students Section */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-4 text-gray-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Team Members
              {team.students && team.students.length > 0 && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium ml-2">
                  {team.students.length} members
                </span>
              )}
            </h3>
            
            {team.students && team.students.length > 0 ? (
              <div className="space-y-3">
                {team.students.map((student, idx) => (
                  <div 
                    key={student._id || idx} 
                    className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500 text-white rounded-full p-2 flex-shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">
                          {student.name || `Student ${idx + 1}`}
                        </h4>
                        {student.regNo && (
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <Hash className="h-3 w-3" />
                            Registration: 
                            <span className="font-mono bg-white px-2 py-0.5 rounded text-xs border">
                              {student.regNo}
                            </span>
                          </p>
                        )}
                        {student.emailId && (
                          <p className="text-sm text-gray-600 mt-1">
                            📧 {student.emailId}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 font-medium">No team members listed</p>
                <p className="text-gray-400 text-sm mt-1">Team member information is not available</p>
              </div>
            )}
          </div>

          {/* Additional Info */}
          {(team.description || team.faculty || team.assignedDate) && (
            <div className="mb-4">
              <h3 className="font-semibold text-lg mb-3 text-gray-800">Additional Information</h3>
              <div className="bg-blue-50 rounded-xl p-4 space-y-2 border border-blue-100">
                {team.description && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Description:</span>
                    <p className="text-sm text-gray-600 mt-1">{team.description}</p>
                  </div>
                )}
                {team.faculty && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Faculty:</span>
                    <p className="text-sm text-gray-600 mt-1">
                      ID: {team.faculty.employeeId} | Role: {team.faculty.role}
                    </p>
                  </div>
                )}
                {team.assignedDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Assigned:</span>
                    <span className="text-sm text-gray-600">
                      {new Date(team.assignedDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-100">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              Team Details • {team.students?.length || 0} members
            </div>
            <button
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamPopup;
