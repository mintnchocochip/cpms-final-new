import React, { useState, useEffect } from 'react';
import PopupReview from '../Components/PopupReview';
import ReviewTable from '../Components/ReviewTable';
import Navbar from '../Components/UniversalNavbar';
import { ChevronRight, RefreshCw } from 'lucide-react';
import { 
  getGuideProjects, 
  updateProject,
  createReviewRequest,
  batchCheckRequestStatuses,
} from '../api';

const Guide = () => {
  const [teams, setTeams] = useState([]);
  const [activePopup, setActivePopup] = useState(null);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requestStatuses, setRequestStatuses] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const getReviewTypes = (markingSchema) => {
    console.log('🔍 [Guide] Getting review types from schema:', markingSchema);
    if (markingSchema?.reviews) {
      const guideReviews = markingSchema.reviews
        .filter(review => review.facultyType === 'guide')
        .map(review => ({
          key: review.reviewName,
          name: review.displayName || review.reviewName,
          components: review.components || [],
          requiresPPT: review.requiresPPT || false,
          facultyType: review.facultyType
        }));
      console.log('✅ [Guide] Guide reviews found:', guideReviews);
      return guideReviews;
    }
    
    console.log('❌ [Guide] No schema found - returning empty reviews');
    return [];
  };

  const getDeadlines = (markingSchema) => {
    console.log('📅 [Guide] Getting deadlines from schema:', markingSchema);
    const deadlineData = {};
    if (markingSchema?.reviews) {
      markingSchema.reviews
        .filter(review => review.facultyType === 'guide')
        .forEach(review => {
          if (review.deadline) {
            deadlineData[review.reviewName] = review.deadline;
          }
        });
    }
    return deadlineData;
  };

  // ✅ FIXED: Proper student data normalization
  const normalizeStudentData = (student) => {
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
  };

  const fetchData = async () => {
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

        if (mappedTeams.length > 0) {
          const batchRequests = [];
          
          mappedTeams.forEach(team => {
            const reviewTypes = getReviewTypes(team.markingSchema);
            team.students.forEach(student => {
              reviewTypes.forEach(reviewType => {
                batchRequests.push({
                  regNo: student.regNo,
                  reviewType: reviewType.key,
                  facultyType: 'guide'
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
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchData();
    } catch (error) {
      console.error('❌ [handleRefresh] Error refreshing guide data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getTeamRequestStatus = (team, reviewType) => {
    if (!team) return 'none';
    
    const statuses = team.students.map(student => {
      const requestKey = `${student.regNo}_${reviewType}`;
      const status = requestStatuses[requestKey]?.status || 'none';
      return status;
    });
    
    if (statuses.includes('pending')) return 'pending';
    if (statuses.includes('approved')) return 'approved';
    return 'none';
  };

  const isTeamDeadlinePassed = (reviewType, teamId) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return false;

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
  };

  const isReviewLocked = (student, reviewType, teamId) => {
    const reviewData = student.reviews?.get ? student.reviews.get(reviewType) : student.reviews?.[reviewType];
    if (reviewData?.locked) {
      return true;
    }
    
    const deadlinePassed = isTeamDeadlinePassed(reviewType, teamId);
    return deadlinePassed;
  };

  const handleReviewSubmit = async (teamId, reviewType, reviewData, pptObj) => {
    try {
      console.log('=== [FRONTEND] GUIDE REVIEW SUBMIT STARTED ===');
      
      const team = teams.find(t => t.id === teamId);
      if (!team) {
        console.error('❌ [FRONTEND] Team not found for ID:', teamId);
        alert('Team not found! Please refresh and try again.');
        return;
      }

      console.log('✅ [FRONTEND] Team found:', team.title);
      console.log('📋 [FRONTEND] Review Type:', reviewType);
      console.log('📋 [FRONTEND] Raw Review Data from popup:', reviewData);
      
      const reviewTypes = getReviewTypes(team.markingSchema);
      const reviewConfig = reviewTypes.find(r => r.key === reviewType);
      
      if (!reviewConfig) {
        console.error('❌ [FRONTEND] Review config not found for type:', reviewType);
        alert('Review configuration not found! Please refresh and try again.');
        return;
      }

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

        const updateData = {
          studentId: student._id,
          reviews: {
            [reviewType]: {
              marks: marks,
              attendance: studentReviewData.attendance || { value: false, locked: false },
              locked: studentReviewData.locked || false,
              comments: studentReviewData.comments || ''
            }
          }
        };

        if (reviewConfig?.requiresPPT && pptObj?.pptApproved) {
          updateData.pptApproved = pptObj.pptApproved;
        }

        return updateData;
      });

      const updatePayload = {
        projectId: teamId,
        studentUpdates
      };

      if (reviewConfig?.requiresPPT && pptObj) {
        updatePayload.pptApproved = pptObj.pptApproved;
      }

      console.log('📤 [FRONTEND] Final update payload:', JSON.stringify(updatePayload, null, 2));
      
      const response = await updateProject(updatePayload);
      console.log('📨 [FRONTEND] Backend response received:', response);
      
      if (response.data?.success || response.data?.updates) {
        setActivePopup(null);
        
        setTimeout(async () => {
          await fetchData();
          alert('Guide review submitted and saved successfully!');
        }, 300);
        
      } else {
        console.error('❌ [FRONTEND] Backend response indicates failure:', response.data);
        alert('Review submission failed. Please try again.');
      }
    } catch (error) {
      console.error('❌ [FRONTEND] Critical error during submission:', error);
      alert(`Error submitting review: ${error.message}`);
    }
  };

  const handleRequestEdit = async (teamId, reviewType) => {
    try {
      const team = teams.find(t => t.id === teamId);
      if (!team) return;

      const currentRequestStatus = getTeamRequestStatus(team, reviewType);
      
      if (currentRequestStatus === 'pending') {
        alert('There is already a pending request for this review. Please wait for approval.');
        return;
      }
      
      const reason = prompt('Please enter the reason for requesting edit access:', 'Need to correct marks after deadline');
      if (!reason?.trim()) return;
      
      const requestData = {
        regNo: team.students[0].regNo,
        reviewType: reviewType,
        reason: reason.trim()
      };
      
      const response = await createReviewRequest('guide', requestData);
      
      if (response.success) {
        alert('Edit request submitted successfully!');
        await handleRefresh();
      } else {
        alert(response.message || 'Error submitting request');
      }
    } catch (error) {
      console.error('❌ Error submitting guide request:', error);
      alert('Error submitting guide request. Please try again.');
    }
  };

  const getButtonColor = (reviewType) => {
    return 'bg-blue-500 hover:bg-blue-600';
  };

  if (loading) {
    return (
      <>
        <Navbar userType="faculty" />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <div className="text-xl text-gray-600">Loading guide projects...</div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar userType="faculty" />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xl text-red-600 mb-4">Error Loading Data</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar userType="faculty" />
      <div className='min-h-screen bg-gray-50 overflow-x-hidden'>
        <div className='p-24 items-center'>
          <div className='flex justify-between items-center mb-4'>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Guide Dashboard</h1>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors ${
                refreshing 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Status'}
            </button>
          </div>
          
          <div className="bg-white shadow-md rounded-md">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-black pl-5 mt-2">My Guided Projects</h2>
            </div>
            
            {teams.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-lg mb-2">No projects assigned as guide</div>
                <p className="text-sm">Projects you guide will appear here</p>
              </div>
            ) : (
              teams.map(team => {
                const reviewTypes = getReviewTypes(team.markingSchema);
                const deadlines = getDeadlines(team.markingSchema);

                if (!reviewTypes.length) {
                  return (
                    <div key={team.id} className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                      <div className="flex items-center">
                        <div className="text-yellow-800">
                          <p className="font-medium">{team.title}</p>
                          <p className="text-sm">No marking schema configured for this project</p>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={team.id} className="bg-white rounded-lg shadow-sm mb-4">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
                              className="flex items-center"
                            >
                              <span className={`inline-block transition-transform duration-200 ${
                                expandedTeam === team.id ? 'rotate-90' : ''
                              }`}>
                                <ChevronRight />
                              </span>
                              <span className="font-medium text-black">{team.title}</span>
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 ml-6">{team.description}</p>
                          <p className="text-xs text-blue-600 ml-6">
                            {team.students.length} student{team.students.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        
                        <div className="flex gap-2 flex-wrap">
                          {reviewTypes.map(reviewType => {
                            const isPassed = isTeamDeadlinePassed(reviewType.key, team.id);
                            const requestStatus = getTeamRequestStatus(team, reviewType.key);
                            
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
                                className={`px-4 py-2 text-white text-sm rounded transition-colors ${getButtonColor(reviewType.key)} ${
                                  isPassed ? 'opacity-75' : ''
                                }`}
                              >
                                {reviewType.name}
                                {reviewType.requiresPPT && (
                                  <span className="ml-1 text-xs bg-white bg-opacity-20 px-1 rounded">PPT</span>
                                )}
                                {requestStatus === 'approved' && (
                                  <span className="ml-1 text-xs bg-purple-500 px-1 rounded">EXT</span>
                                )}
                                {isPassed && (
                                  <span className="ml-1 text-xs bg-red-500 px-1 rounded">🔒</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      
                      {expandedTeam === team.id && (
                        <ReviewTable 
                          team={team} 
                          deadlines={deadlines}
                          requestStatuses={requestStatuses}
                          isDeadlinePassed={(reviewType) => isTeamDeadlinePassed(reviewType, team.id)}
                          isReviewLocked={(student, reviewType) => isReviewLocked(student, reviewType, team.id)}
                          markingSchema={team.markingSchema}
                          panelMode={false}
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {activePopup && (() => {
            const team = teams.find(t => t.id === activePopup.teamId);
            const reviewTypes = getReviewTypes(team.markingSchema);
            const isLocked = isTeamDeadlinePassed(activePopup.type, activePopup.teamId);
            const requestStatus = getTeamRequestStatus(team, activePopup.type);
            
            const showRequestEdit = isLocked && (requestStatus === 'none' || requestStatus === 'rejected');
            
            return (
              <PopupReview
                title={`${reviewTypes.find(r => r.key === activePopup.type)?.name || activePopup.type} - ${activePopup.teamTitle}`}
                teamMembers={activePopup.students}
                reviewType={activePopup.type}
                isOpen={true}
                locked={isLocked}
                markingSchema={activePopup.markingSchema}
                onClose={() => setActivePopup(null)}
                onSubmit={(data, pptObj) => {
                  handleReviewSubmit(activePopup.teamId, activePopup.type, data, pptObj);
                }}
                onRequestEdit={() => handleRequestEdit(activePopup.teamId, activePopup.type)}
                requestEditVisible={showRequestEdit}
                requestPending={requestStatus === 'pending'}
                requiresPPT={reviewTypes.find(r => r.key === activePopup.type)?.requiresPPT || false}
              />
            );
          })()}
        </div>
      </div>
    </>
  );
};

export default Guide;
