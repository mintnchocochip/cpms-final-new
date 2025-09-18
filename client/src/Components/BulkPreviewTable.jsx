import React, { useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, ChevronDown, ChevronUp, Users, Building2, Zap } from 'lucide-react';

const BulkPreviewTable = ({ projects, bulkFieldErrors }) => {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate pagination
  const totalPages = Math.ceil(projects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProjects = projects.slice(startIndex, endIndex);

  // Toggle row expansion
  const toggleRowExpansion = (index) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  // Get status icon and color
  const getStatusDisplay = (project, index) => {
    const hasErrors = bulkFieldErrors[index];
    
    if (hasErrors) {
      return {
        icon: <XCircle className="h-4 w-4 text-red-500" />,
        text: "Has Errors",
        bgColor: "bg-red-50",
        textColor: "text-red-700",
        borderColor: "border-red-200"
      };
    }
    
    return {
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      text: "Valid",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      borderColor: "border-green-200"
    };
  };

  // Calculate statistics
  const validProjects = projects.filter((_, index) => !bulkFieldErrors[index]);
  const errorProjects = projects.filter((_, index) => bulkFieldErrors[index]);

  return (
    <div className="max-w-full mx-auto mb-6 overflow-hidden">
      {/* Statistics Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-t-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">
              Preview ({projects.length} Projects)
            </h4>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-green-700 font-medium">{validProjects.length} Valid</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-red-700 font-medium">{errorProjects.length} Errors</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-blue-700 font-medium">
                  {projects.reduce((total, proj) => total + proj.students.length, 0)} Students
                </span>
              </div>
            </div>
          </div>
          
          {errorProjects.length > 0 && (
            <div className="bg-red-100 border border-red-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 text-red-700 text-sm font-medium">
                <AlertCircle className="h-4 w-4" />
                <span>Fix {errorProjects.length} error(s) before upload</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border-x border-slate-200 overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-16">
                #
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Project Details
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Faculty & Context
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Students
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-24">
                Status
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-16">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {currentProjects.map((project, displayIndex) => {
              const actualIndex = startIndex + displayIndex;
              const status = getStatusDisplay(project, actualIndex);
              const isExpanded = expandedRows.has(actualIndex);
              const hasErrors = bulkFieldErrors[actualIndex];

              return (
                <React.Fragment key={actualIndex}>
                  {/* Main Row */}
                  <tr className={`hover:bg-slate-50 transition-colors ${hasErrors ? 'bg-red-25' : ''}`}>
                    {/* Row Number */}
                    <td className="px-4 py-4 text-sm font-mono text-slate-600">
                      {project.idx || actualIndex + 1}
                    </td>

                    {/* Project Details */}
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-900 text-sm leading-tight">
                          {project.name || 'Unnamed Project'}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-600">
                          <div className="flex items-center gap-1">
                            <Zap className="h-3 w-3 text-blue-500" />
                            <span className="font-medium">{project.specialization || 'N/A'}</span>
                          </div>
                          <div className="px-2 py-0.5 bg-slate-100 rounded text-xs">
                            {project.type || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Faculty & Context */}
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="font-mono text-sm text-slate-800">
                          {project.guideFacultyEmpId || 'N/A'}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <Building2 className="h-3 w-3 text-indigo-500" />
                          <span>{project.school || 'N/A'} - {project.department || 'N/A'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Students */}
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium text-slate-800">
                            {project.students?.length || 0} Students
                          </span>
                        </div>
                        {project.students && project.students.length > 0 && (
                          <div className="text-xs text-slate-600 space-y-0.5">
                            {project.students.slice(0, 2).map((student, idx) => (
                              <div key={idx} className="truncate">
                                <span className="font-medium">{student.name}</span>
                                <span className="text-slate-500 ml-2">({student.regNo})</span>
                              </div>
                            ))}
                            {project.students.length > 2 && (
                              <div className="text-slate-500">
                                +{project.students.length - 2} more...
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-full border text-xs font-medium ${status.bgColor} ${status.textColor} ${status.borderColor}`}>
                        {status.icon}
                        <span>{status.text}</span>
                      </div>
                    </td>

                    {/* Expand Button */}
                    <td className="px-4 py-4">
                      <button
                        onClick={() => toggleRowExpansion(actualIndex)}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded"
                        title={isExpanded ? 'Collapse details' : 'Expand details'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Row Details */}
                  {isExpanded && (
                    <tr className="bg-slate-50">
                      <td colSpan="6" className="px-4 py-4">
                        <div className="space-y-4 text-sm">
                          {/* Error Details */}
                          {hasErrors && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <div className="font-medium text-red-800 mb-1">Validation Errors:</div>
                                  <div className="text-red-700 text-xs whitespace-pre-line">
                                    {bulkFieldErrors[actualIndex]}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Complete Student Details */}
                          {project.students && project.students.length > 0 && (
                            <div>
                              <div className="font-medium text-slate-800 mb-2 flex items-center gap-2">
                                <Users className="h-4 w-4 text-blue-500" />
                                Complete Student List:
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {project.students.map((student, idx) => (
                                  <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3">
                                    <div className="font-medium text-slate-800 text-sm">
                                      {student.name || 'N/A'}
                                    </div>
                                    <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                                      <div className="font-mono">{student.regNo || 'N/A'}</div>
                                      <div className="text-blue-600">{student.emailId || 'N/A'}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Project Full Details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                            <div>
                              <div className="font-medium text-slate-700 mb-1">Project Information</div>
                              <div className="space-y-1 text-xs text-slate-600">
                                <div><span className="font-medium">Name:</span> {project.name || 'N/A'}</div>
                                <div><span className="font-medium">Type:</span> {project.type || 'N/A'}</div>
                                <div><span className="font-medium">Specialization:</span> {project.specialization || 'N/A'}</div>
                              </div>
                            </div>
                            <div>
                              <div className="font-medium text-slate-700 mb-1">Context Information</div>
                              <div className="space-y-1 text-xs text-slate-600">
                                <div><span className="font-medium">Faculty ID:</span> {project.guideFacultyEmpId || 'N/A'}</div>
                                <div><span className="font-medium">School:</span> {project.school || 'N/A'}</div>
                                <div><span className="font-medium">Department:</span> {project.department || 'N/A'}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white border-x border-b border-slate-200 rounded-b-xl px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-slate-600">
              Showing {startIndex + 1}-{Math.min(endIndex, projects.length)} of {projects.length} projects
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  // Show first, last, current, and pages around current
                  const shouldShow = 
                    page === 1 || 
                    page === totalPages || 
                    Math.abs(page - currentPage) <= 1;
                  
                  if (!shouldShow) {
                    // Show ellipsis for gaps
                    if (page === 2 && currentPage > 4) {
                      return <span key={page} className="text-slate-400 px-2">...</span>;
                    }
                    if (page === totalPages - 1 && currentPage < totalPages - 3) {
                      return <span key={page} className="text-slate-400 px-2">...</span>;
                    }
                    return null;
                  }
                  
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkPreviewTable;
