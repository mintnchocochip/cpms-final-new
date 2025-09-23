import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../Components/NotificationProvider';
import PopupReview from '../Components/PopupReview';
import EditRequestModal from '../Components/EditRequestModal';
import ReviewTable from '../Components/ReviewTable';
import Navbar from '../Components/UniversalNavbar';
import { Database, ChevronRight, RefreshCw, BookOpen, Users, AlertCircle, Calendar } from 'lucide-react';
import { 
  getGuideProjects, 
  updateProject,
  createReviewRequest,
  batchCheckRequestStatuses,
} from '../api';

// Memoized inner content component to prevent unnecessary re-renders
const GuideContent = React.memo(({ 
  teams, 
  expandedTeam, 
  setExpandedTeam, 
  requestStatuses, 
  getReviewTypes, 
  getDeadlines,
  getTeamRequestStatus, 
  isTeamDeadlinePassed,
  isReviewLocked,
  getButtonColor,
  setActivePopup,
  refreshKey // This will force re-render when changed
}) => {
  console.log('🔄 [GuideContent] Rendering inner content with refreshKey:', refreshKey);
  
  return (
    <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white">My Guided Projects</h2>
        <p className="text-blue-100 mt-1">Projects under your guidance and mentorship</p>
      </div>
      
      {teams.length === 0 ? (
        <div className="p-8 sm:p-12 text-center">
          <div className="bg-gray-50 rounded-2xl p-8 max-w-md mx-auto">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <div className="text-lg sm:text-xl text-gray-600 mb-2 font-semibold">No Guided Projects</div>
            <p className="text-sm sm:text-base text-gray-500">Projects assigned to you as guide will appear here</p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {teams.map(team => {
            const reviewTypes = getReviewTypes(team.markingSchema);
            const deadlines = getDeadlines(team.markingSchema);
            
            if (!reviewTypes.length) {
              return (
                <div key={team.id} className="bg-yellow-50 border-l-4 border-yellow-400 p-6 m-4 sm:m-6 rounded-r-xl">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-yellow-800 text-sm sm:text-base">{team.title}</p>
                      <p className="text-xs sm:text-sm text-yellow-700 mt-1">No marking schema configured for this project</p>
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
                          className="flex items-center flex-shrink-0 mt-1 p-1 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <ChevronRight className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                            expandedTeam === team.id ? 'rotate-90' : ''
                          }`} />
                        </button>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 text-base sm:text-lg lg:text-xl break-words mb-2">
                            {team.title}
                          </h3>
                          <p className="text-sm sm:text-base text-gray-600 mb-3">{team.description}</p>
                          
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center gap-2 text-blue-600">
                              <Users className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                {team.students.length} Student{team.students.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                          
                          {/* ✅ UPDATED: Status Information with Panel Reviews */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                            {reviewTypes.map(reviewType => {
                              const isPassed = isTeamDeadlinePassed(reviewType.key, team.id);
                              const requestStatus = getTeamRequestStatus(team, reviewType.key);
                              const isPanelReview = reviewType.isPanelReview || false; // ✅ NEW
                              
                              return (
                                <div key={reviewType.key} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                  <span className={`font-medium truncate ${isPanelReview ? 'text-purple-700' : 'text-gray-700'}`}>
                                    {reviewType.name}:
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      isPanelReview 
                                        ? 'bg-purple-100 text-purple-700' // ✅ NEW: Purple for panel reviews
                                        : isPassed 
                                          ? 'bg-red-100 text-red-700' 
                                          : 'bg-green-100 text-green-700'
                                    }`}>
                                      {isPanelReview 
                                        ? 'Panel Review' // ✅ NEW: Show "Panel Review" instead of deadline status
                                        : isPassed 
                                          ? 'Deadline Passed' 
                                          : 'Active'
                                      }
                                    </span>
                                    {requestStatus === 'approved' && !isPanelReview && (
                                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">Extended</span>
                                    )}
                                    {requestStatus === 'pending' && !isPanelReview && (
                                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">Pending</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* ✅ UPDATED: Review Buttons with Panel Support and PPT Indicator */}
                    <div className="flex flex-wrap gap-3 justify-start lg:justify-end">
                      {reviewTypes.map(reviewType => {
                        const isPassed = isTeamDeadlinePassed(reviewType.key, team.id);
                        const requestStatus = getTeamRequestStatus(team, reviewType.key);
                        const isPanelReview = reviewType.isPanelReview || false; // ✅ NEW
                        
                        // ✅ CHANGED: Get PPT requirement from schema
                        const schemaReview = team.markingSchema?.reviews?.find(r => r.reviewName === reviewType.key);
                        const requiresPPT = !!schemaReview?.pptApproved;
                        
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
                              isPanelReview 
                                ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700' // ✅ NEW: Purple for panel reviews
                                : getButtonColor(reviewType.key)
                            } ${
                              isPassed ? 'opacity-75' : ''
                            } flex items-center gap-2 whitespace-nowrap min-w-0`}
                          >
                            <span className="truncate max-w-24 sm:max-w-none">{reviewType.name}</span>
                            {requiresPPT && ( // ✅ CHANGED: Use schema-based PPT requirement
                              <span className="text-xs bg-white bg-opacity-30 px-2 py-1 rounded-full flex-shrink-0 font-bold">PPT</span>
                            )}
                            {isPanelReview && ( // ✅ NEW: Panel indicator
                              <span className="text-xs bg-white bg-opacity-30 px-2 py-1 rounded-full flex-shrink-0 font-bold">👥</span>
                            )}
                            {requestStatus === 'approved' && !isPanelReview && (
                              <span className="text-xs bg-purple-500 px-2 py-1 rounded-full flex-shrink-0 font-bold">EXT</span>
                            )}
                            {isPassed && !isPanelReview && (
                              <span className="text-xs bg-red-500 px-2 py-1 rounded-full flex-shrink-0">🔒</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ✅ UPDATED: Expanded Content with Panel Reviews Support */}
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
                          panelMode={false}
                          showPanelReviews={true} // ✅ NEW: Show panel reviews in table
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

const Guide = () => {
  const [teams, setTeams] = useState([]);
  const [activePopup, setActivePopup] = useState(null);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requestStatuses, setRequestStatuses] = useState({});
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // Key to force GuideContent re-render
  
  // ✅ NEW: Edit request modal state
  const [editRequestModal, setEditRequestModal] = useState({ 
    isOpen: false, 
    teamId: null, 
    reviewType: null 
  });

  // ✅ NEW: Use your existing notification hook
  const { showNotification, hideNotification } = useNotification();

  // ✅ UPDATED: getReviewTypes to use pptApproved instead of requiresPPT
  const getReviewTypes = useCallback((markingSchema) => {
    console.log('🔍 [Guide] Getting review types from schema:', markingSchema);
    if (markingSchema?.reviews) {
      // Get guide reviews (existing functionality)
      const guideReviews = markingSchema.reviews
        .filter(review => review.facultyType === 'guide')
        .map(review => ({
          key: review.reviewName,
          name: review.displayName || review.reviewName,
          components: review.components || [],
          requiresPPT: !!review.pptApproved, // ✅ CHANGED: Use pptApproved field
          facultyType: review.facultyType
        }));
      
      // ✅ NEW: Get panel reviews (only PPT approved part)
      const panelReviews = markingSchema.reviews
        .filter(review => review.facultyType === 'panel')
        .map(review => ({
          key: review.reviewName,
          name: `${review.displayName || review.reviewName} (Panel)`,
          components: review.components || [],
          requiresPPT: !!review.pptApproved, // ✅ CHANGED: Use pptApproved field
          facultyType: review.facultyType,
          isPanelReview: true // ✅ NEW: Flag to identify panel reviews
        }));
      
      // ✅ NEW: Combine guide and panel reviews
      const allReviews = [...guideReviews, ...panelReviews];
      console.log('✅ [Guide] All reviews found:', allReviews);
      return allReviews;
    }
    
    console.log('❌ [Guide] No schema found - returning empty reviews');
    return [];
  }, []);

  // ✅ UPDATED: getDeadlines to handle both guide and panel deadlines
  const getDeadlines = useCallback((markingSchema) => {
    console.log('📅 [Guide] Getting deadlines from schema:', markingSchema);
    const deadlineData = {};
    if (markingSchema?.reviews) {
      // ✅ UPDATED: Include both guide and panel reviews
      markingSchema.reviews.forEach(review => {
        if (review.deadline) {
          deadlineData[review.reviewName] = review.deadline;
        }
      });
    }
    return deadlineData;
  }, []);

  // ✅ FIXED: Proper student data normalization
  const normalizeStudentData = useCallback((student) => {
    console.log('🔧 [normalizeStudentData] Processing student:', student.name);
    console.log('🔧 [normalizeStudentData] Raw student reviews:', student.reviews);
    
    const normalizedStudent = {
      ...student,
      reviews: new Map()
    };

    // Handle different review data formats
    if (student.reviews) {
      if (typeof student.reviews === 'object') {
        // Convert plain object to Map
        Object.entries(student.reviews).forEach(([reviewKey, reviewData]) => {
          console.log(`🔧 [normalizeStudentData] Processing review ${reviewKey}:`, reviewData);
          
          // Normalize marks - handle both Map and plain object
          let normalizedMarks = {};
          if (reviewData.marks) {
            if (typeof reviewData.marks === 'object') {
              // Already a plain object or converted from Map
              normalizedMarks = { ...reviewData.marks };
            }
          }
          
          const normalizedReview = {
            marks: normalizedMarks,
            comments: reviewData.comments || '',
            attendance: reviewData.attendance || { value: false, locked: false },
            locked: reviewData.locked || false
          };
          
          normalizedStudent.reviews.set(reviewKey, normalizedReview);
          console.log(`✅ [normalizeStudentData] Normalized review ${reviewKey}:`, normalizedReview);
        });
      }
    }

    console.log('✅ [normalizeStudentData] Final normalized student:', normalizedStudent.name, normalizedStudent.reviews);
    return normalizedStudent;
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('=== [fetchData] GUIDE FETCH DATA STARTED ===');
      
      const projectsRes = await getGuideProjects();
      console.log('📊 [fetchData] Projects API Response:', projectsRes.data);

      let mappedTeams = [];
      if (projectsRes.data?.success) {
        const projects = projectsRes.data.data;
        console.log('✅ [fetchData] Processing projects:', projects.length);
        
        const guideProjects = projects.filter(project => project.guideFaculty != null);
        console.log('✅ [fetchData] Guide projects filtered:', guideProjects.length);
        
        mappedTeams = guideProjects.map(project => {
          console.log(`📋 [fetchData] Processing project: ${project.name}`);
          
          // ✅ FIXED: Normalize all student data
          const normalizedStudents = project.students.map(student => normalizeStudentData(student));
          
          return {
            id: project._id,
            title: project.name,
            description: `Guide: ${project.guideFaculty?.name || 'N/A'}`,
            students: normalizedStudents, // ✅ Use normalized students
            markingSchema: project.markingSchema,
            school: project.school,
            department: project.department,
            pptApproved: project.pptApproved || { approved: false, locked: false },
            guideFaculty: project.guideFaculty
          };
        });

        setTeams(mappedTeams);
        console.log('✅ [fetchData] Teams set successfully:', mappedTeams.length);

        // ✅ UPDATED: Batch request handling to include panel reviews
        if (mappedTeams.length > 0) {
          const batchRequests = [];
          
          mappedTeams.forEach(team => {
            const reviewTypes = getReviewTypes(team.markingSchema);
            team.students.forEach(student => {
              reviewTypes.forEach(reviewType => {
                batchRequests.push({
                  regNo: student.regNo,
                  reviewType: reviewType.key,
                  facultyType: reviewType.facultyType // ✅ NEW: Use actual faculty type (guide/panel)
                });
              });
            });
          });

          console.log('🔍 [fetchData] Fetching request statuses for', batchRequests.length, 'requests');
          const statuses = await batchCheckRequestStatuses(batchRequests);
          setRequestStatuses(statuses);
        }
      }
      
      console.log('✅ [fetchData] GUIDE FETCH DATA COMPLETED');
    } catch (error) {
      console.error('❌ [fetchData] Error fetching guide data:', error);
      setError('Failed to load guide data. Please try again.');
      showNotification('error', 'Data Load Error', 'Failed to load guide data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getReviewTypes, normalizeStudentData, showNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ FIXED: Only refresh inner content, not entire page
  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      console.log('🔄 [Guide] Starting partial refresh...');
      
      await fetchData();
      setRefreshKey(prev => prev + 1); // This forces GuideContent to re-render
      
      console.log('✅ [Guide] Partial refresh completed');
    } catch (error) {
      console.error('❌ [handleRefresh] Error refreshing guide data:', error);
      showNotification('error', 'Refresh Error', 'Error refreshing data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [fetchData, showNotification]);

  const getTeamRequestStatus = useCallback((team, reviewType) => {
    if (!team) return 'none';
    
    const statuses = team.students.map(student => {
      const requestKey = `${student.regNo}_${reviewType}`;
      const status = requestStatuses[requestKey]?.status || 'none';
      return status;
    });
    
    if (statuses.includes('pending')) return 'pending';
    if (statuses.includes('approved')) return 'approved';
    return 'none';
  }, [requestStatuses]);

  // ✅ UPDATED: isTeamDeadlinePassed to handle panel reviews (no deadline locking)
  const isTeamDeadlinePassed = useCallback((reviewType, teamId) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return false;

    // ✅ NEW: Check if this is a panel review
    const reviewTypes = getReviewTypes(team.markingSchema);
    const reviewConfig = reviewTypes.find(r => r.key === reviewType);
    
    // ✅ NEW: Panel reviews are never deadline locked for guides
    if (reviewConfig?.isPanelReview) {
      return false;
    }

    const teamDeadlines = getDeadlines(team.markingSchema);
    if (!teamDeadlines || !teamDeadlines[reviewType]) {
      return false;
    }

    const deadline = teamDeadlines[reviewType];
    const now = new Date();
    
    try {
      if (deadline.from && deadline.to) {
        const toDate = new Date(deadline.to);
        return now > toDate;
      } else if (typeof deadline === 'string' || deadline instanceof Date) {
        const deadlineDate = new Date(deadline);
        return now > deadlineDate;
      }
    } catch (dateError) {
      console.error('❌ Error parsing deadline:', dateError);
      return false;
    }
    
    return false;
  }, [teams, getReviewTypes, getDeadlines]);

  const isReviewLocked = useCallback((student, reviewType, teamId) => {
    // ✅ FIXED: Check if review is explicitly locked first
    const reviewData = student.reviews?.get ? student.reviews.get(reviewType) : student.reviews?.[reviewType];
    if (reviewData?.locked) {
      return true;
    }
    
    // ✅ FIXED: Check if deadline extension is approved
    const team = teams.find(t => t.id === teamId);
    if (team) {
      const requestStatus = getTeamRequestStatus(team, reviewType);
      if (requestStatus === 'approved') {
        console.log(`🔓 [isReviewLocked] Extension approved for ${reviewType} - UNLOCKING`);
        return false; // Extension approved = unlocked
      }
    }
    
    // Only check deadline if no extension is approved
    const deadlinePassed = isTeamDeadlinePassed(reviewType, teamId);
    console.log(`🔒 [isReviewLocked] Deadline passed: ${deadlinePassed}, Review type: ${reviewType}`);
    return deadlinePassed;
  }, [isTeamDeadlinePassed, teams, getTeamRequestStatus]);

  // ✅ UPDATED: Handle review submission with proper PPT handling
// ✅ CORRECTED: Handle review submission with proper payload structure
const handleReviewSubmit = useCallback(async (teamId, reviewType, reviewData, pptObj, patUpdates) => {
  try {
    console.log('=== [FRONTEND] GUIDE REVIEW SUBMIT STARTED ===');
    
    const team = teams.find(t => t.id === teamId);
    if (!team) {
      console.error('❌ [FRONTEND] Team not found for ID:', teamId);
      showNotification('error', 'Team Not Found', 'Team not found! Please refresh and try again.');
      return;
    }

    console.log('✅ [FRONTEND] Team found:', team.title);
    console.log('📋 [FRONTEND] Review Type:', reviewType);
    console.log('📋 [FRONTEND] Raw Review Data from popup:', reviewData);
    console.log('🚫 [FRONTEND] PAT Updates:', patUpdates);
    console.log('📽️ [FRONTEND] PPT Object:', pptObj);
    
    const reviewTypes = getReviewTypes(team.markingSchema);
    const reviewConfig = reviewTypes.find(r => r.key === reviewType);
    
    if (!reviewConfig) {
      console.error('❌ [FRONTEND] Review config not found for type:', reviewType);
      showNotification('error', 'Configuration Error', 'Review configuration not found! Please refresh and try again.');
      return;
    }

    // ✅ CHANGED: Check schema for PPT requirement
    const schemaReview = team.markingSchema?.reviews?.find(r => r.reviewName === reviewType);
    const requiresPPT = !!schemaReview?.pptApproved;
    const isPanelReview = reviewConfig?.isPanelReview || false;
    
    console.log('📽️ [FRONTEND] PPT Required:', requiresPPT);
    console.log('📽️ [FRONTEND] Is Panel Review:', isPanelReview);
    console.log('📽️ [FRONTEND] Schema Review:', schemaReview);

    // ✅ FIXED: Build student updates with correct structure
    const studentUpdates = team.students.map(student => {
      console.log(`🎓 [FRONTEND] Processing student: ${student.name} (${student.regNo})`);
      
      const studentReviewData = reviewData[student.regNo] || {};
      console.log(`📊 [FRONTEND] Student review data for ${student.name}:`, studentReviewData);
      
      // Build marks object using component names from schema
      const marks = {};
      if (reviewConfig.components && reviewConfig.components.length > 0) {
        reviewConfig.components.forEach(comp => {
          const markValue = Number(studentReviewData[comp.name]) || 0;
          marks[comp.name] = markValue;
          console.log(`📊 [FRONTEND] Component ${comp.name}: ${markValue} for ${student.name}`);
        });
      }

      // ✅ FIXED: Correct review structure without nested pptApproved
      const updateData = {
        studentId: student._id,
        reviews: {
          [reviewType]: {
            marks: marks,
            attendance: studentReviewData.attendance || { value: false, locked: false },
            locked: studentReviewData.locked || false,
            comments: studentReviewData.comments || ''
            // ✅ REMOVED: pptApproved should NOT be here - it goes at project level
          }
        }
      };

      // ✅ PAT status update (only for guide reviews, not panel)
      if (patUpdates && patUpdates[student.regNo] !== undefined && !isPanelReview) {
        updateData.PAT = patUpdates[student.regNo];
        console.log(`🚫 [FRONTEND] Setting PAT for ${student.name}: ${patUpdates[student.regNo]}`);
      }

      return updateData;
    });

    // ✅ FIXED: Correct payload structure
    const updatePayload = {
      projectId: teamId,
      studentUpdates: studentUpdates
    };

    // ✅ CORRECTED: PPT approval goes at PROJECT level, not in student reviews
    if (requiresPPT && pptObj?.pptApproved) {
      updatePayload.pptApproved = pptObj.pptApproved;
      console.log('📽️ [FRONTEND] Adding team PPT approval to project level:', pptObj.pptApproved);
    }

    // ✅ NEW: Handle panel reviews with best project data
    if (isPanelReview && patUpdates?.bestProject !== undefined) {
      updatePayload.bestProject = patUpdates.bestProject;
      console.log('🏆 [FRONTEND] Adding best project status:', patUpdates.bestProject);
    }

    console.log('📤 [FRONTEND] Final corrected update payload:');
    console.log(JSON.stringify(updatePayload, null, 2));
    
    // Show loading notification
    const loadingId = showNotification('info', 'Submitting...', 'Please wait while we save your review data...', 10000);
    
    const response = await updateProject(updatePayload);
    console.log('📨 [FRONTEND] Backend response received:', response);
    
    // Hide loading notification
    hideNotification(loadingId);
    
    if (response.data?.success || response.data?.updates) {
      setActivePopup(null);
      
      setTimeout(async () => {
        await handleRefresh();
        showNotification(
          'success', 
          'Review Saved', 
          requiresPPT ? 'Guide review and PPT approval submitted successfully!' : 'Guide review submitted successfully!'
        );
      }, 300);
      
    } else {
      console.error('❌ [FRONTEND] Backend response indicates failure:', response.data);
      showNotification(
        'error', 
        'Submission Failed', 
        'Review submission failed. Please try again.'
      );
    }
  } catch (error) {
    console.error('❌ [FRONTEND] Critical error during submission:', error);
    showNotification(
      'error', 
      'Submission Error', 
      `Error submitting review: ${error.message}`
    );
  }
}, [teams, getReviewTypes, handleRefresh, showNotification, hideNotification]);


  // ✅ UPDATED: Use notification system instead of alert
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
      
      // Open the modal instead of using prompt
      setEditRequestModal({ 
        isOpen: true, 
        teamId, 
        reviewType 
      });
      
    } catch (error) {
      console.error('❌ Error preparing guide request:', error);
      showNotification(
        'error', 
        'Request Error', 
        'Error preparing request. Please try again.'
      );
    }
  }, [teams, getTeamRequestStatus, showNotification]);

  // ✅ NEW: Handle edit request submission from modal
  const handleEditRequestSubmit = useCallback(async (reason) => {
    try {
      const { teamId, reviewType } = editRequestModal;
      const team = teams.find(t => t.id === teamId);
      
      if (!team) {
        throw new Error('Team not found');
      }

      const requestData = {
        regNo: team.students[0].regNo,
        reviewType: reviewType,
        reason: reason
      };
      
      // Show loading notification
      const loadingId = showNotification('info', 'Submitting Request...', 'Please wait while we process your request...', 10000);
      
      const response = await createReviewRequest('guide', requestData);
      
      // Hide loading notification
      hideNotification(loadingId);
      
      if (response.success) {
        showNotification(
          'success', 
          'Request Submitted', 
          'Edit request submitted successfully!'
        );
        await handleRefresh();
        setEditRequestModal(prev => ({ ...prev, isOpen: false }));
      } else {
        throw new Error(response.message || 'Error submitting request');
      }
    } catch (error) {
      console.error('❌ Error submitting guide request:', error);
      showNotification(
        'error', 
        'Request Failed', 
        error.message || 'Error submitting guide request. Please try again.'
      );
    }
  }, [teams, editRequestModal, handleRefresh, showNotification, hideNotification]);

  // ✅ NEW: Close modal handler
  const closeEditRequestModal = useCallback(() => {
    setEditRequestModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  const getButtonColor = useCallback((reviewType) => {
    return 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700';
  }, []);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="pt-16 sm:pt-20 pl-4 sm:pl-24 min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-12 max-w-sm sm:max-w-md mx-auto text-center">
            <div className="relative mb-6 sm:mb-8">
              <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-4 border-slate-200 border-t-blue-600 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 animate-pulse" />
              </div>
            </div>
            <h3 className="text-lg sm:text-2xl font-bold text-slate-800 mb-3">Loading Guide Data</h3>
            <p className="text-sm sm:text-base text-slate-600">Retrieving student records and academic data...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar userType="faculty" />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-14">
          <div className="lg:ml-64 xl:ml-16 transition-all duration-300">
            <div className="flex items-center justify-center min-h-[80vh] px-4">
              <div className="text-center max-w-md w-full bg-white p-8 rounded-2xl shadow-lg">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <div className="text-xl sm:text-2xl text-red-600 mb-4 font-semibold">Error Loading Data</div>
                <p className="text-sm sm:text-base text-gray-600 mb-6">{error}</p>
                <button
                  onClick={fetchData}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-lg text-sm sm:text-base font-medium transition-all duration-300 transform hover:scale-105"
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
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-14'>
        {/* Content with proper spacing for menu */}
        <div className="lg:ml-64 xl:ml-16 transition-all duration-300">
          <div className='p-4 sm:p-6 lg:p-8 xl:p-12 max-w-7xl mx-auto'>
            {/* Header Section - This stays static and doesn't re-render */}
            <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4'>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-xl">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">Guide Dashboard</h1>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">Monitor and evaluate your guided projects</p>
                </div>
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`flex items-center justify-center gap-3 px-6 py-3 rounded-xl text-white transition-all duration-300 text-sm sm:text-base font-medium transform hover:scale-105 ${
                  refreshing 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl'
                }`}
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh Status'}</span>
                <span className="sm:hidden">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
            
            {/* Inner content that gets refreshed - Key changes to force re-render */}
            <GuideContent
              key={refreshKey} // This key changes on refresh, forcing re-render
              teams={teams}
              expandedTeam={expandedTeam}
              setExpandedTeam={setExpandedTeam}
              requestStatuses={requestStatuses}
              getReviewTypes={getReviewTypes}
              getDeadlines={getDeadlines}
              getTeamRequestStatus={getTeamRequestStatus}
              isTeamDeadlinePassed={isTeamDeadlinePassed}
              isReviewLocked={isReviewLocked}
              getButtonColor={getButtonColor}
              setActivePopup={setActivePopup}
              refreshKey={refreshKey}
            />

            {/* ✅ NEW: Edit Request Modal */}
            <EditRequestModal
              isOpen={editRequestModal.isOpen}
              onClose={closeEditRequestModal}
              onSubmit={handleEditRequestSubmit}
              defaultReason="Need to correct marks after deadline"
            />

            {/* ✅ UPDATED: Popup Review Modal with Panel Support and Schema Fix */}
            {activePopup && (() => {
              const team = teams.find(t => t.id === activePopup.teamId);
              const reviewTypes = getReviewTypes(team.markingSchema);
              const reviewConfig = reviewTypes.find(r => r.key === activePopup.type);
              const isLocked = isTeamDeadlinePassed(activePopup.type, activePopup.teamId);
              const requestStatus = getTeamRequestStatus(team, activePopup.type);
              
              const showRequestEdit = isLocked && (requestStatus === 'none' || requestStatus === 'rejected');
              
              // ✅ NEW: Check if this is a panel review
              const isPanelReview = reviewConfig?.isPanelReview || false;
              
              // ✅ CHANGED: Get PPT requirement from schema's pptApproved field
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
                    // ✅ UPDATED: Handle both guide and panel reviews
                    if (isPanelReview) {
                      // For panel reviews, only handle PPT approval
                      handleReviewSubmit(activePopup.teamId, activePopup.type, {}, pptObj, {});
                    } else {
                      // Normal guide review handling
                      handleReviewSubmit(activePopup.teamId, activePopup.type, data, pptObj, patUpdates);
                    }
                  }}
                  onRequestEdit={() => handleRequestEdit(activePopup.teamId, activePopup.type)}
                  requestEditVisible={showRequestEdit && !isPanelReview} // ✅ NEW: No edit requests for panel reviews
                  requestPending={requestStatus === 'pending'}
                  requiresPPT={requiresPPT} // ✅ CHANGED: Use schema-based PPT requirement
                  // ✅ NEW: Panel review props
                  panelMode={false} // Always false for guide side
                  isPanelReview={isPanelReview}
                  isGuideReview={!isPanelReview}
                />
              );
            })()}

          </div>
        </div>
      </div>
    </>
  );
};

export default Guide;
