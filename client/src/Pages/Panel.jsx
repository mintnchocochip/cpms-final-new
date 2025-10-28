import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNotification } from '../Components/NotificationProvider';
import PopupReview from '../Components/PopupReview';
import EditRequestModal from '../Components/EditRequestModal'; // ✅ ADDED: Import EditRequestModal
import ReviewTable from '../Components/ReviewTable';
import Navbar from '../Components/UniversalNavbar';
import { ChevronRight, RefreshCw, Users, Calendar, AlertCircle, MapPin, AlertTriangle } from 'lucide-react';
import { 
  getPanelProjects,
  updateProject,
  createReviewRequest, // ✅ ADDED: Import createReviewRequest
  batchCheckRequestStatuses,
  updateProjectDetails
} from '../api';
import FacultyBroadcastFeed from '../Components/FacultyBroadcastFeed';
import ProjectNameEditor from '../Components/ProjectNameEditor';
const handleProjectNameUpdate = useCallback(async (projectId, newName) => {
  try {
    console.log('🔄 [Panel] Updating project name:', { projectId, newName });
    
    // Show loading notification
    const loadingId = showNotification(
      'info', 
      'Updating Project...', 
      'Please wait while we update the project name...', 
      10000
    );

    // Prepare the payload for your backend endpoint
    const updatePayload = {
      projectId: projectId,
      projectUpdates: {
        name: newName
      },
      studentUpdates: [] // Empty student updates
    };

    console.log('📤 [Panel] Sending update payload:', updatePayload);
    
    const response = await updateProjectDetails(updatePayload);
    
    // Hide loading notification
    hideNotification(loadingId);
    
    if (response.success) {
      console.log('✅ [Panel] Project name updated successfully');
      
      // Refresh the data to show updated name
      await handleRefresh();
      
      showNotification(
        'success',
        'Project Updated',
        `Project name updated to "${newName}" successfully!`
      );
    } else {
      throw new Error(response.message || 'Failed to update project name');
    }
  } catch (error) {
    console.error('❌ [Panel] Error updating project name:', error);
    showNotification(
      'error',
      'Update Failed',
      error.message || 'Failed to update project name. Please try again.'
    );
    throw error; // Re-throw to let the component handle it
  }
}, [handleRefresh, showNotification, hideNotification]);
// ✅ FIXED: Normalize student data function moved outside component
function normalizeStudentData(student) {
  console.log('🔧 [normalizeStudentData] Processing student:', student.name);
  
  // --- Normalize reviews ---
  let reviews = {};
  if (student.reviews) {
    if (student.reviews instanceof Map) {
      reviews = Object.fromEntries(student.reviews);
    } else if (typeof student.reviews === 'object') {
      reviews = { ...student.reviews };
    }
  }

  // Process each review to ensure proper structure
  Object.keys(reviews).forEach(reviewKey => {
    const review = reviews[reviewKey];
    if (review && typeof review === 'object') {
      // Handle marks
      if (review.marks) {
        if (review.marks instanceof Map) {
          review.marks = Object.fromEntries(review.marks);
        } else if (typeof review.marks === 'object') {
          review.marks = { ...review.marks };
        }
      }
      
      // Handle PPT approval
      if (review.pptApproved) {
        review.pptApproved = {
          approved: Boolean(review.pptApproved.approved || false),
          locked: Boolean(review.pptApproved.locked || false)
        };
      }

      review.comments = review.comments || '';
      review.attendance = review.attendance || { value: false, locked: false };
      review.locked = Boolean(review.locked || false);
    }
  });
  
  // --- Normalize deadline ---
  let deadline = {};
  if (student.deadline) {
    if (student.deadline instanceof Map) {
      deadline = Object.fromEntries(student.deadline);
    } else if (typeof student.deadline === 'object') {
      deadline = { ...student.deadline };
    }
  }
  
  return {
    ...student,
    reviews,
    deadline,
    pptApproved: student.pptApproved || { approved: false, locked: false }
  };
}

// ✅ FIXED: Memoized PanelContent component with proper dependencies
const PanelContent = React.memo(({ 
  teams, 
  expandedTeam, 
  setExpandedTeam, 
  requestStatuses, 
  setActivePopup,
  getTeamRequestStatus,
  isTeamDeadlinePassed,
  isReviewLocked,
  refreshKey,
  handleProjectNameUpdate
}) => {
  console.log('🔄 [PanelContent] Rendering inner content with refreshKey:', refreshKey);

  // ✅ FIXED: Pre-calculate review types and deadlines with useMemo
  const teamsWithReviewData = useMemo(() => {
    return teams.map(team => {
      // Calculate review types once per team - only panel reviews
      let reviewTypes = [];
      if (team.markingSchema?.reviews && Array.isArray(team.markingSchema.reviews)) {
        reviewTypes = team.markingSchema.reviews
          .filter(review => review.facultyType === 'panel')
          .map(review => ({
            key: review.reviewName,
            name: review.displayName || review.reviewName,
            components: review.components || [],
            requiresPPT: !!(review.pptApproved && review.pptApproved.approved !== undefined),
            facultyType: review.facultyType,
            isPanelReview: true
          }));
      }
      
      // Calculate deadlines once per team
      let deadlines = {};
      if (team.markingSchema?.reviews) {
        team.markingSchema.reviews.forEach(review => {
          if (review.deadline) {
            deadlines[review.reviewName] = review.deadline;
          }
        });
      }

      // Calculate guide PPT status for each review
      const guidePPTStatuses = {};
      reviewTypes.forEach(reviewType => {
        if (reviewType.requiresPPT) {
          const studentApprovals = team.students.map(student => {
            // Check review-specific PPT approval first
            const reviewData = student.reviews?.[reviewType.key];
            if (reviewData?.pptApproved) {
              return Boolean(reviewData.pptApproved.approved);
            }
            
            // Fallback to student-level PPT approval
            if (student.pptApproved) {
              return Boolean(student.pptApproved.approved);
            }
            
            return false;
          });
          
          const allApproved = studentApprovals.every(approved => approved === true);
          const someApproved = studentApprovals.some(approved => approved === true);
          
          guidePPTStatuses[reviewType.key] = allApproved ? 'approved' : someApproved ? 'partial' : 'not-approved';
        }
      });
      
      return {
        ...team,
        reviewTypes,
        deadlines,
        guidePPTStatuses
      };
    });
  }, [teams]);

  if (teamsWithReviewData.length === 0) {
    return (
      <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Panel Projects</h2>
          <p className="text-purple-100 mt-1">Projects assigned to your panel</p>
        </div>
        
        <div className="p-8 sm:p-12 text-center">
          <div className="bg-gray-50 rounded-2xl p-8 max-w-md mx-auto">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <div className="text-lg sm:text-xl text-gray-600 mb-2 font-semibold">No Panel Projects</div>
            <p className="text-sm sm:text-base text-gray-500">Projects assigned to your panel will appear here</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Panel Projects</h2>
        <p className="text-purple-100 mt-1">Projects assigned to your panel for evaluation</p>
      </div>
      
      <div className="divide-y divide-gray-100">
        {teamsWithReviewData.map(team => {
          const { reviewTypes, deadlines, guidePPTStatuses } = team;
          
          if (!reviewTypes.length) {
            return (
              <div key={team.id} className="bg-yellow-50 border-l-4 border-yellow-400 p-6 m-4 sm:m-6 rounded-r-xl">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                  <div>
 <ProjectNameEditor
    projectId={team.id}
    currentName={team.title}
    onUpdate={handleProjectNameUpdate}
  />                    <p className="text-xs sm:text-sm text-yellow-700 mt-1">No panel reviews configured for this project</p>
                  </div>
                </div>
              </div>
            );
          }
          
          return (
            <div key={team.id} className="bg-white hover:bg-gray-50 transition-colors duration-200">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
                        className="flex items-center flex-shrink-0 mt-1 p-1 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        <ChevronRight className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                          expandedTeam === team.id ? 'rotate-90' : ''
                        }`} />
                      </button>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 text-base sm:text-lg lg:text-xl break-words mb-2">
                          {team.title}
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600 mb-3">
                          Guide: {team.guideFaculty?.name || 'N/A'}
                        </p>
                        
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-2 text-purple-600">
                            <Users className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {team.students.length} Student{team.students.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          {team.panel?.venue && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span className="text-sm">{team.panel.venue}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Panel Review Status */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                          {reviewTypes.map(reviewType => {
                            const isPassed = isTeamDeadlinePassed(reviewType.key, team.id);
                            const requestStatus = getTeamRequestStatus(team, reviewType.key);
                            const guidePPTStatus = guidePPTStatuses[reviewType.key];
                            
                            return (
                              <div key={reviewType.key} className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                                <span className="font-medium truncate text-purple-700">
                                  {reviewType.name}:
                                </span>
                                <div className="flex items-center gap-1">
                                  {reviewType.requiresPPT && (
                                    <span className={`px-1 py-0.5 rounded text-xs font-bold ${
                                      guidePPTStatus === 'approved' 
                                        ? 'bg-green-100 text-green-700'
                                        : guidePPTStatus === 'partial'
                                          ? 'bg-yellow-100 text-yellow-700'
                                          : 'bg-red-100 text-red-700'
                                    }`}>
                                      📽️
                                    </span>
                                  )}
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    isPassed 
                                      ? 'bg-red-100 text-red-700' 
                                      : 'bg-green-100 text-green-700'
                                  }`}>
                                    {isPassed ? 'Deadline Passed' : 'Active'}
                                  </span>
                                  {requestStatus === 'approved' && (
                                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">Extended</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Panel Review Buttons */}
                  <div className="flex flex-wrap gap-3 justify-start lg:justify-end">
                    {reviewTypes.map(reviewType => {
                      const isPassed = isTeamDeadlinePassed(reviewType.key, team.id);
                      const requestStatus = getTeamRequestStatus(team, reviewType.key);
                      const guidePPTStatus = guidePPTStatuses[reviewType.key];
                      const isBlocked = reviewType.requiresPPT && guidePPTStatus !== 'approved';
                      
                      return (
                        <button
                          key={reviewType.key}
                          onClick={() => setActivePopup({ 
                            type: reviewType.key, 
                            teamId: team.id,
                            teamTitle: team.title,
                            students: team.students,
                            markingSchema: team.markingSchema
                          })}
                          className={`px-4 py-3 text-white text-sm font-medium rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                            isBlocked
                              ? 'bg-red-500 hover:bg-red-600'
                              : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
                          } ${
                            isPassed && !isBlocked ? 'opacity-75' : ''
                          } flex items-center gap-2 whitespace-nowrap min-w-0`}
                        >
                          <span className="truncate max-w-24 sm:max-w-none">{reviewType.name}</span>
                          {reviewType.requiresPPT && (
                            <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 font-bold ${
                              isBlocked ? 'bg-red-600' : 'bg-white bg-opacity-30'
                            }`}>
                              {isBlocked ? '🚫PPT' : '📽️PPT'}
                            </span>
                          )}
                          <span className="text-xs bg-white bg-opacity-30 px-2 py-1 rounded-full flex-shrink-0 font-bold">👥</span>
                          {requestStatus === 'approved' && (
                            <span className="text-xs bg-green-500 px-2 py-1 rounded-full flex-shrink-0 font-bold">EXT</span>
                          )}
                          {isPassed && !isBlocked && (
                            <span className="text-xs bg-red-500 px-2 py-1 rounded-full flex-shrink-0">🔒</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedTeam === team.id && (
                  <div className="mt-6 -mx-4 sm:-mx-6 bg-gray-50 rounded-xl overflow-hidden">
                    <div className="p-4 sm:p-6">
                      <ReviewTable 
                        team={team} 
                        deadlines={deadlines}
                        requestStatuses={requestStatuses}
                        isDeadlinePassed={(reviewType) => isTeamDeadlinePassed(reviewType, team.id)}
                        isReviewLocked={(student, reviewType) => isReviewLocked(student, reviewType, team.id)}
                        markingSchema={team.markingSchema}
                        panelMode={true}
                        showPanelReviews={true}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

const Panel = () => {
  const [teams, setTeams] = useState([]);
  const [activePopup, setActivePopup] = useState(null);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requestStatuses, setRequestStatuses] = useState({});
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // ✅ ADDED: Edit request modal state
  const [editRequestModal, setEditRequestModal] = useState({ 
    isOpen: false, 
    teamId: null, 
    reviewType: null 
  });

  const { showNotification, hideNotification } = useNotification();

  // ✅ FIXED: Static functions that don't cause re-renders
  const getReviewTypesForTeam = useCallback((markingSchema) => {
    if (!markingSchema?.reviews || !Array.isArray(markingSchema.reviews)) {
      return [];
    }
    
    return markingSchema.reviews
      .filter(review => review.facultyType === 'panel')
      .map(review => ({
        key: review.reviewName,
        name: review.displayName || review.reviewName,
        components: review.components || [],
        requiresPPT: !!(review.pptApproved && review.pptApproved.approved !== undefined),
        facultyType: review.facultyType,
        isPanelReview: true
      }));
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('=== [Panel] FETCH DATA STARTED ===');
      
      const projectsRes = await getPanelProjects();
      console.log('📊 [Panel] API Response:', projectsRes.data);

      let mappedTeams = [];
      if (projectsRes.data?.success) {
        const projects = projectsRes.data.data;
        console.log('✅ [Panel] Processing projects:', projects.length);
        
        mappedTeams = projects.map(project => {
          console.log(`📋 [Panel] Processing project: ${project.name}`);
          
          const normalizedStudents = project.students.map(student => normalizeStudentData(student));
          
          return {
            id: project._id,
            title: project.name,
            description: `Guide: ${project.guideFaculty?.name || 'N/A'}`,
            students: normalizedStudents,
            markingSchema: project.markingSchema,
            school: project.school,
            department: project.department,
            guideFaculty: project.guideFaculty,
            panel: project.panel,
            bestProject: project.bestProject || false // ✅ ADDED: Include bestProject
          };
        });

        setTeams(mappedTeams);
        console.log('✅ [Panel] Teams set successfully:', mappedTeams.length);

        // Batch request handling for panel reviews
        if (mappedTeams.length > 0) {
          const batchRequests = [];
          
          mappedTeams.forEach(team => {
            const reviewTypes = getReviewTypesForTeam(team.markingSchema);
            team.students.forEach(student => {
              reviewTypes.forEach(reviewType => {
                batchRequests.push({
                  regNo: student.regNo,
                  reviewType: reviewType.key,
                  facultyType: 'panel'
                });
              });
            });
          });

          console.log('🔍 [Panel] Fetching request statuses for', batchRequests.length, 'requests');
          if (batchRequests.length > 0) {
            const statuses = await batchCheckRequestStatuses(batchRequests);
            setRequestStatuses(statuses);
          }
        }
      }
      
      console.log('✅ [Panel] FETCH DATA COMPLETED');
    } catch (error) {
      console.error('❌ [Panel] Error fetching data:', error);
      setError('Failed to load panel data. Please try again.');
      showNotification('error', 'Data Load Error', 'Failed to load panel data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getReviewTypesForTeam, showNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      console.log('🔄 [Panel] Starting refresh...');
      
      await fetchData();
      setRefreshKey(prev => prev + 1);
      
      console.log('✅ [Panel] Refresh completed');
    } catch (error) {
      console.error('❌ [Panel] Error refreshing:', error);
      showNotification('error', 'Refresh Error', 'Error refreshing data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [fetchData, showNotification]);

  const getTeamRequestStatus = useCallback((team, reviewType) => {
    if (!team) return 'none';
    
    const statuses = team.students.map(student => {
      const requestKey = `${student.regNo}_${reviewType}`;
      return requestStatuses[requestKey]?.status || 'none';
    });
    
    if (statuses.includes('pending')) return 'pending';
    if (statuses.includes('approved')) return 'approved';
    return 'none';
  }, [requestStatuses]);

  const isTeamDeadlinePassed = useCallback((reviewType, teamId) => {
    const team = teams.find(t => t.id === teamId);
    if (!team?.markingSchema?.reviews) return false;

    const review = team.markingSchema.reviews.find(r => r.reviewName === reviewType);
    if (!review?.deadline) return false;

    const deadline = review.deadline;
    const now = new Date();
    
    try {
      if (deadline.from && deadline.to) {
        const toDate = new Date(deadline.to);
        return now > toDate;
      }
    } catch (dateError) {
      console.error('❌ Error parsing deadline:', dateError);
      return false;
    }
    
    return false;
  }, [teams]);

  const isReviewLocked = useCallback((student, reviewType, teamId) => {
    const reviewData = student.reviews?.[reviewType];
    if (reviewData?.locked) {
      return true;
    }
    
    const team = teams.find(t => t.id === teamId);
    if (team) {
      const requestStatus = getTeamRequestStatus(team, reviewType);
      if (requestStatus === 'approved') {
        return false; // Extension approved = unlocked
      }
    }
    
    return isTeamDeadlinePassed(reviewType, teamId);
  }, [isTeamDeadlinePassed, teams, getTeamRequestStatus]);

  // ✅ ADDED: Handle panel request edit
  const handleRequestEdit = useCallback(async (teamId, reviewType) => {
    try {
      const team = teams.find(t => t.id === teamId);
      if (!team) {
        showNotification('error', 'Team Not Found', 'Team not found. Please refresh and try again.');
        return;
      }

      const currentRequestStatus = getTeamRequestStatus(team, reviewType);
      
      if (currentRequestStatus === 'pending') {
        showNotification(
          'warning', 
          'Request Already Pending', 
          'There is already a pending request for this review. Please wait for approval.'
        );
        return;
      }
      
      // Open the modal for panel request
      setEditRequestModal({ 
        isOpen: true, 
        teamId, 
        reviewType 
      });
      
    } catch (error) {
      console.error('❌ Error preparing panel request:', error);
      showNotification(
        'error', 
        'Request Error', 
        'Error preparing request. Please try again.'
      );
    }
  }, [teams, getTeamRequestStatus, showNotification]);

  // ✅ ADDED: Handle edit request submission from modal
  const handleEditRequestSubmit = useCallback(async (reason) => {
    try {
      const { teamId, reviewType } = editRequestModal;
      const team = teams.find(t => t.id === teamId);
      
      if (!team) {
        throw new Error('Team not found');
      }

      const requestData = {
        regNo: team.students[0].regNo, // Use first student's regNo for panel requests
        reviewType: reviewType,
        reason: reason
      };
      
      // Show loading notification
      const loadingId = showNotification('info', 'Submitting Request...', 'Please wait while we process your request...', 10000);
      
      const response = await createReviewRequest('panel', requestData); // ✅ Use 'panel' as faculty type
      
      // Hide loading notification
      hideNotification(loadingId);
      
      if (response.success) {
        showNotification(
          'success', 
          'Request Submitted', 
          'Panel edit request submitted successfully!'
        );
        await handleRefresh();
        setEditRequestModal(prev => ({ ...prev, isOpen: false }));
      } else {
        throw new Error(response.message || 'Error submitting request');
      }
    } catch (error) {
      console.error('❌ Error submitting panel request:', error);
      showNotification(
        'error', 
        'Request Failed', 
        error.message || 'Error submitting panel request. Please try again.'
      );
    }
  }, [teams, editRequestModal, handleRefresh, showNotification, hideNotification]);

  // ✅ ADDED: Close modal handler
  const closeEditRequestModal = useCallback(() => {
    setEditRequestModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleReviewSubmit = useCallback(async (teamId, reviewType, reviewData, pptObj, patUpdates) => {
    try {
      const team = teams.find(t => t.id === teamId);
      if (!team) {
        showNotification('error', 'Team Not Found', 'Team not found! Please refresh and try again.');
        return;
      }

      const reviewTypes = getReviewTypesForTeam(team.markingSchema);
      const reviewConfig = reviewTypes.find(r => r.key === reviewType);
      
      if (!reviewConfig) {
        showNotification('error', 'Configuration Error', 'Review configuration not found! Please refresh and try again.');
        return;
      }

      const studentUpdates = team.students.map(student => {
        const studentReviewData = reviewData[student.regNo] || {};
        
        const marks = {};
        if (reviewConfig.components && reviewConfig.components.length > 0) {
          reviewConfig.components.forEach(comp => {
            const markValue = Number(studentReviewData[comp.name]) || 0;
            marks[comp.name] = markValue;
          });
        }

        const reviewObject = {
          marks: marks,
          attendance: studentReviewData.attendance || { value: false, locked: false },
          locked: studentReviewData.locked || false,
          comments: studentReviewData.comments || ''
        };

        if (reviewConfig.requiresPPT && pptObj?.pptApproved) {
          reviewObject.pptApproved = {
            approved: Boolean(pptObj.pptApproved.approved),
            locked: Boolean(pptObj.pptApproved.locked || false)
          };
        }

        return {
          studentId: student._id,
          reviews: {
            [reviewType]: reviewObject
          }
        };
      });

      const updatePayload = {
        projectId: teamId,
        projectUpdates: patUpdates?.bestProject ? { bestProject: patUpdates.bestProject } : {},
        studentUpdates
      };

      const loadingId = showNotification('info', 'Submitting...', 'Please wait while we save your panel review...', 10000);
      
      const response = await updateProject(updatePayload);
      hideNotification(loadingId);
      
      if (response.data?.success || response.data?.updates) {
        setActivePopup(null);
        
        setTimeout(async () => {
          await handleRefresh();
          showNotification('success', 'Review Saved', 'Panel review submitted successfully!');
        }, 300);
      } else {
        showNotification('error', 'Submission Failed', 'Panel review submission failed. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error submitting panel review:', error);
      showNotification('error', 'Submission Error', `Error submitting panel review: ${error.message}`);
    }
  }, [teams, getReviewTypesForTeam, handleRefresh, showNotification, hideNotification]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="pt-16 sm:pt-20 pl-4 sm:pl-24 min-h-screen bg-gradient-to-br from-slate-100 to-purple-200 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-12 max-w-sm sm:max-w-md mx-auto text-center">
            <div className="relative mb-6 sm:mb-8">
              <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-4 border-slate-200 border-t-purple-600 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 animate-pulse" />
              </div>
            </div>
            <h3 className="text-lg sm:text-2xl font-bold text-slate-800 mb-3">Loading Panel Data</h3>
            <p className="text-sm sm:text-base text-slate-600">Retrieving panel projects and review assignments...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar userType="faculty" />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 pt-14">
          <div className="lg:ml-64 xl:ml-16 transition-all duration-300">
            <div className="flex items-center justify-center min-h-[80vh] px-4">
              <div className="text-center max-w-md w-full bg-white p-8 rounded-2xl shadow-lg">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <div className="text-xl sm:text-2xl text-red-600 mb-4 font-semibold">Error Loading Data</div>
                <p className="text-sm sm:text-base text-gray-600 mb-6">{error}</p>
                <button
                  onClick={fetchData}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-3 rounded-lg text-sm sm:text-base font-medium transition-all duration-300 transform hover:scale-105"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar userType="faculty" />
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 pt-14'>
        <div className="lg:ml-64 xl:ml-16 transition-all duration-300">
          <div className='p-4 sm:p-6 lg:p-8 xl:p-12 max-w-7xl mx-auto'>
            <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4'>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-3 rounded-xl">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">Panel Dashboard</h1>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">Evaluate assigned panel review projects</p>
                </div>
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`flex items-center justify-center gap-3 px-6 py-3 rounded-xl text-white transition-all duration-300 text-sm sm:text-base font-medium transform hover:scale-105 ${
                  refreshing 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl'
                }`}
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh Status'}</span>
                <span className="sm:hidden">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
            
            <FacultyBroadcastFeed />

            <PanelContent
              key={refreshKey}
              teams={teams}
              expandedTeam={expandedTeam}
              setExpandedTeam={setExpandedTeam}
              requestStatuses={requestStatuses}
              setActivePopup={setActivePopup}
              getTeamRequestStatus={getTeamRequestStatus}
              isTeamDeadlinePassed={isTeamDeadlinePassed}
              isReviewLocked={isReviewLocked}
              refreshKey={refreshKey}
              handleProjectNameUpdate={handleProjectNameUpdate}
            />

            {/* ✅ ADDED: Edit Request Modal */}
            <EditRequestModal
              isOpen={editRequestModal.isOpen}
              onClose={closeEditRequestModal}
              onSubmit={handleEditRequestSubmit}
              defaultReason="Need to correct panel review after deadline"
            />

            {activePopup && (() => {
              const team = teams.find(t => t.id === activePopup.teamId);
              const reviewTypes = getReviewTypesForTeam(team.markingSchema);
              const reviewConfig = reviewTypes.find(r => r.key === activePopup.type);
              const isLocked = isTeamDeadlinePassed(activePopup.type, activePopup.teamId);
              const requestStatus = getTeamRequestStatus(team, activePopup.type);
              
              // ✅ ADDED: Calculate if request edit should be visible
              const showRequestEdit = isLocked && (requestStatus === 'none' || requestStatus === 'rejected');
              
              const schemaReview = team.markingSchema?.reviews?.find(r => r.reviewName === activePopup.type);
              const requiresPPT = !!schemaReview?.pptApproved;
              
              return (
                <PopupReview
                  title={`${reviewTypes.find(r => r.key === activePopup.type)?.name || activePopup.type} - ${activePopup.teamTitle}`}
                  teamMembers={activePopup.students}
                  reviewType={activePopup.type}
                  isOpen={true}
                  locked={isLocked}
                  markingSchema={activePopup.markingSchema}
                  requestStatus={requestStatus}
                  onClose={() => setActivePopup(null)}
                  onSubmit={(data, pptObj, patUpdates) => {
                    handleReviewSubmit(activePopup.teamId, activePopup.type, data, pptObj, patUpdates);
                  }}
                  // ✅ ADDED: Request edit props for panel
                  onRequestEdit={() => handleRequestEdit(activePopup.teamId, activePopup.type)}
                  requestEditVisible={showRequestEdit}
                  requestPending={requestStatus === 'pending'}
                  requiresPPT={requiresPPT}
                  panelMode={true}
                  currentBestProject={team.bestProject || false}
                  teamId={activePopup.teamId}
                />
              );
            })()}

          </div>
        </div>
      </div>
    </>
  );
};

export default Panel;
