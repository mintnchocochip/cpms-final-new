import React, { useState, useEffect } from 'react';
import PopupReview from '../Components/PopupReview';
import ReviewTable from '../Components/ReviewTable';
import Navbar from '../Components/UniversalNavbar';
import { ChevronRight, RefreshCw } from 'lucide-react'; // ✅ Added RefreshCw import
import { 
  getGuideProjects, 
  updateProject,
  createReviewRequest,
  checkRequestStatus,
  batchCheckRequestStatuses,
  getFacultyMarkingSchema
} from '../api';

const Guide = () => {
  const [teams, setTeams] = useState([]);
  const [deadlines, setDeadlines] = useState({});
  const [markingSchema, setMarkingSchema] = useState(null);
  const [activePopup, setActivePopup] = useState(null);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // ✅ Added refresh state
  const [requestStatuses, setRequestStatuses] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('=== GUIDE FETCH DATA STARTED ===');
      
      const [projectsRes, markingSchemaRes] = await Promise.all([
        getGuideProjects().catch(error => {
          console.error('❌ getGuideProjects failed:', error);
          return { data: { success: false, error: error.message } };
        }),
        getFacultyMarkingSchema().catch(error => {
          console.error('❌ getFacultyMarkingSchema failed:', error);
          return { data: { success: false, error: error.message } };
        })
      ]);

      console.log('📊 Projects API Response:', projectsRes.data);
      console.log('📊 Marking Schema API Response:', markingSchemaRes.data);

      let mappedTeams = [];

      if (projectsRes.data?.success) {
        const projects = projectsRes.data.data;
        console.log('✅ Processing projects:', projects.length);
        
        mappedTeams = projects.map(project => ({
          id: project._id,
          title: project.name,
          description: `Guide: ${project.guideFaculty?.name || 'N/A'}`,
          students: project.students || [],
          pptApproved: project.pptApproved || { approved: false, locked: false },
          guideFaculty: project.guideFaculty
        }));
        
        setTeams(mappedTeams);
        console.log('✅ Teams set successfully:', mappedTeams.length);
      }

      if (markingSchemaRes.data?.success && markingSchemaRes.data.data) {
        const markingSchemaData = markingSchemaRes.data.data;
        console.log('✅ Processing marking schema:', markingSchemaData);
        
        if (markingSchemaData.reviews) {
          const guideReviewTypes = ['draftReview', 'review0', 'review1'];
          const filteredReviews = markingSchemaData.reviews.filter(review => 
            guideReviewTypes.includes(review.reviewName)
          );

          console.log('✅ Guide-specific reviews:', filteredReviews);

          const deadlineData = {};
          filteredReviews.forEach(review => {
            if (review.deadline) {
              deadlineData[review.reviewName] = review.deadline;
              console.log(`📅 Deadline for ${review.reviewName}:`, review.deadline);
            }
          });
          
          setDeadlines(deadlineData);
          
          const filteredSchema = {
            ...markingSchemaData,
            reviews: filteredReviews
          };
          setMarkingSchema(filteredSchema);

          if (mappedTeams.length > 0) {
            const reviewTypes = filteredReviews.map(r => r.reviewName);
            const batchRequests = [];
            mappedTeams.forEach(team => {
              team.students.forEach(student => {
                reviewTypes.forEach(reviewType => {
                  batchRequests.push({
                    regNo: student.regNo,
                    reviewType,
                    facultyType: 'guide'
                  });
                });
              });
            });
            
            console.log('🔍 Fetching request statuses for', batchRequests.length, 'requests');
            const statuses = await batchCheckRequestStatuses(batchRequests);
            console.log('✅ Request statuses received:', statuses);
            setRequestStatuses(statuses);
          }
        }
      } else {
        console.log('⚠️ No marking schema found, using defaults');
        setDeadlines({});
        setMarkingSchema(null);
      }
      
      console.log('✅ GUIDE FETCH DATA COMPLETED');
    } catch (error) {
      console.error('❌ Error fetching guide data:', error);
      setError('Failed to load guide data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Refresh function for status updates
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      console.log('=== GUIDE REFRESH STARTED ===');
      
      if (teams.length > 0 && markingSchema) {
        const reviewTypes = markingSchema.reviews?.map(r => r.reviewName) || ['draftReview', 'review0', 'review1'];
        const batchRequests = [];
        
        teams.forEach(team => {
          team.students.forEach(student => {
            reviewTypes.forEach(reviewType => {
              batchRequests.push({
                regNo: student.regNo,
                reviewType,
                facultyType: 'guide'
              });
            });
          });
        });
        
        console.log('🔄 Refreshing request statuses for', batchRequests.length, 'requests');
        const statuses = await batchCheckRequestStatuses(batchRequests);
        console.log('✅ Updated request statuses:', statuses);
        setRequestStatuses(statuses);
        
        // Also refresh project data to get latest deadlines
        await fetchData();
        
        console.log('✅ GUIDE REFRESH COMPLETED');
      }
    } catch (error) {
      console.error('❌ Error refreshing guide data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // ✅ FIXED: Only use individual overrides for reviews that have approved requests
  const isTeamDeadlinePassed = (reviewType, teamId) => {
    console.log(`=== DEADLINE CHECK FOR ${reviewType} (Request-Based Override) ===`);
    
    const team = teams.find(t => t.id === teamId);
    if (!team) {
      console.log('❌ Team not found');
      return false;
    }
    
    const now = new Date();
    const currentIST = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    console.log(`⏰ Current IST time: ${currentIST.toISOString()} (${currentIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })})`);
    
    // ✅ FIXED: Only check individual overrides for reviews with APPROVED requests
    const teamRequestStatus = getTeamRequestStatus(team, reviewType);
    console.log(`📝 Team request status for ${reviewType}: ${teamRequestStatus}`);
    
    if (teamRequestStatus === 'approved') {
      console.log(`🔑 REQUEST APPROVED - Checking individual overrides for ${reviewType}`);
      
      const studentsWithSpecificOverride = team.students.filter(student => 
        student.deadline && student.deadline[reviewType]
      );
      
      if (studentsWithSpecificOverride.length > 0) {
        console.log(`👥 Found ${studentsWithSpecificOverride.length} students with APPROVED ${reviewType} individual overrides`);
        
        const specificReviewDeadlines = studentsWithSpecificOverride.map(student => {
          try {
            const deadline = new Date(student.deadline[reviewType].to);
            const deadlineIST = new Date(deadline.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
            console.log(`👤 Student ${student.name} ${reviewType} APPROVED INDIVIDUAL deadline: ${deadlineIST.toISOString()} (${deadlineIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })})`);
            return deadlineIST;
          } catch (e) {
            console.error(`Error parsing ${reviewType} deadline for ${student.name}:`, e);
            return null;
          }
        }).filter(date => date !== null);
        
        if (specificReviewDeadlines.length > 0) {
          const latestSpecificDeadline = new Date(Math.max(...specificReviewDeadlines));
          console.log(`📅 LATEST APPROVED INDIVIDUAL ${reviewType} deadline: ${latestSpecificDeadline.toISOString()} (${latestSpecificDeadline.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })})`);
          
          const isPassed = currentIST > latestSpecificDeadline;
          console.log(`✅ ${reviewType} APPROVED INDIVIDUAL deadline passed: ${isPassed}`);
          console.log(`🎯 USING APPROVED INDIVIDUAL OVERRIDE - IGNORING SYSTEM DEADLINE`);
          return isPassed;
        }
      }
    } else {
      console.log(`❌ No approved request for ${reviewType} - Using system deadline only`);
    }
    
    // ✅ Use system deadline (default behavior)
    if (!deadlines || !deadlines[reviewType]) {
      console.log(`❌ No system deadline found for ${reviewType}`);
      console.log('Available system deadlines:', Object.keys(deadlines));
      return false;
    }
    
    const deadline = deadlines[reviewType];
    console.log(`📅 System deadline for ${reviewType}:`, deadline);
    
    try {
      if (deadline.from && deadline.to) {
        const fromDate = new Date(deadline.from);
        const toDate = new Date(deadline.to);
        
        const fromIST = new Date(fromDate.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
        const toIST = new Date(toDate.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
        
        console.log(`📅 ${reviewType} System From IST: ${fromIST.toISOString()} (${fromIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })})`);
        console.log(`📅 ${reviewType} System To IST: ${toIST.toISOString()} (${toIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })})`);
        
        const isAfterEnd = currentIST > toIST;
        
        console.log(`🔍 ${reviewType} SYSTEM deadline analysis:`);
        console.log(`   - Current time: ${currentIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
        console.log(`   - System end time: ${toIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
        console.log(`   - Is system deadline passed: ${isAfterEnd}`);
        console.log(`🎯 USING SYSTEM DEADLINE`);
        
        return isAfterEnd;
      } else if (typeof deadline === 'string' || deadline instanceof Date) {
        const deadlineDate = new Date(deadline);
        const deadlineIST = new Date(deadlineDate.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
        
        console.log(`📅 ${reviewType} single system deadline IST: ${deadlineIST.toISOString()} (${deadlineIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })})`);
        
        const isPassed = currentIST > deadlineIST;
        console.log(`✅ ${reviewType} single system deadline passed: ${isPassed}`);
        console.log(`🎯 USING SYSTEM DEADLINE`);
        return isPassed;
      }
    } catch (dateError) {
      console.error(`❌ Error parsing ${reviewType} deadline dates:`, dateError);
      console.error('Deadline object:', deadline);
      return false;
    }
    
    console.log(`❌ Invalid deadline format for ${reviewType}`);
    return false;
  };

  const isReviewLocked = (student, reviewType, teamId) => {
    console.log(`=== REVIEW LOCK CHECK FOR ${student.name} ${reviewType} ===`);
    
    // Check manual lock first
    const reviewData = student.reviews?.get ? student.reviews.get(reviewType) : student[reviewType];
    if (reviewData?.locked) {
      console.log(`🔒 Student ${student.name} ${reviewType} is manually locked`);
      return true;
    }
    
    // Check deadline-based lock (now uses request-based individual override logic)
    const teamDeadlinePassed = isTeamDeadlinePassed(reviewType, teamId);
    console.log(`⏰ Team ${reviewType} deadline passed (request-based): ${teamDeadlinePassed}`);
    
    return teamDeadlinePassed;
  };

  const getTeamRequestStatus = (team, reviewType) => {
    if (!team) return 'none';
    
    const statuses = team.students.map(student => {
      const requestKey = `${student.regNo}_${reviewType}`;
      return requestStatuses[requestKey]?.status || 'none';
    });
    
    if (statuses.includes('pending')) return 'pending';
    if (statuses.includes('approved')) return 'approved';
    return 'none';
  };

  const handleReviewSubmit = async (teamId, reviewType, reviewData, pptObj) => {
    try {
      const team = teams.find(t => t.id === teamId);
      if (!team) return;

      console.log('=== GUIDE REVIEW SUBMIT TO BACKEND ===');
      const reviewConfig = markingSchema?.reviews?.find(r => r.reviewName === reviewType);

      const studentUpdates = team.students.map(student => {
        const studentReviewData = reviewData[student.regNo] || {};
        
        const marks = {};
        if (reviewConfig && reviewConfig.components) {
          reviewConfig.components.forEach(comp => {
            marks[comp.name] = studentReviewData[comp.name] || 0;
          });
        } else {
          Object.keys(studentReviewData).forEach(key => {
            if (key !== 'comments' && key !== 'attendance' && key !== 'locked') {
              marks[key] = studentReviewData[key] || 0;
            }
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

      const response = await updateProject(updatePayload);
      
      if (response.data?.success || response.data?.updates) {
        setActivePopup(null);
        setTimeout(async () => {
          await fetchData();
          alert('Guide review submitted and saved successfully!');
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Error submitting guide review to backend:', error);
      alert('Error submitting guide review. Please try again.');
    }
  };

  const handleRequestEdit = async (teamId, reviewType) => {
    try {
      console.log(`=== HANDLING REQUEST EDIT FOR ${reviewType} ===`);
      
      const team = teams.find(t => t.id === teamId);
      if (!team) return;
      
      const reason = prompt('Please enter the reason for requesting edit access:', 'Need to correct marks after deadline');
      if (!reason?.trim()) return;
      
      const requestData = {
        regNo: team.students[0].regNo,
        reviewType: reviewType,
        reason: reason.trim()
      };
      
      console.log('🚀 Sending request:', requestData);
      
      const response = await createReviewRequest('guide', requestData);
      
      if (response.success) {
        alert('Edit request submitted successfully!');
        
        const reviewTypes = markingSchema?.reviews?.map(r => r.reviewName) || ['draftReview', 'review0', 'review1'];
        const batchRequests = [];
        
        teams.forEach(team => {
          team.students.forEach(student => {
            reviewTypes.forEach(reviewType => {
              batchRequests.push({
                regNo: student.regNo,
                reviewType,
                facultyType: 'guide'
              });
            });
          });
        });
        
        const statuses = await batchCheckRequestStatuses(batchRequests);
        setRequestStatuses(statuses);
      } else {
        alert(response.message || 'Error submitting request');
      }
    } catch (error) {
      console.error('❌ Error submitting guide request:', error);
      alert('Error submitting guide request. Please try again.');
    }
  };

  const getReviewTypes = () => {
    if (markingSchema && markingSchema.reviews) {
      return markingSchema.reviews.map(review => ({
        key: review.reviewName,
        name: getReviewDisplayName(review.reviewName),
        components: review.components,
        requiresPPT: review.requiresPPT || false
      }));
    }
    return [
      { key: 'draftReview', name: 'Draft Review', components: [], requiresPPT: false },
      { key: 'review0', name: 'Review 0', components: [], requiresPPT: false },
      { key: 'review1', name: 'Review 1', components: [], requiresPPT: false }
    ];
  };

  const getReviewDisplayName = (reviewName) => {
    const nameMap = {
      'draftReview': 'Draft Review',
      'review0': 'Review 0',
      'review1': 'Review 1'
    };
    return nameMap[reviewName] || reviewName;
  };

  const getButtonColor = (reviewType) => {
    const colorMap = {
      'draftReview': 'bg-orange-500 hover:bg-orange-600',
      'review0': 'bg-green-500 hover:bg-green-600',
      'review1': 'bg-red-500 hover:bg-red-600',
    };
    return colorMap[reviewType] || 'bg-gray-500 hover:bg-gray-600';
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

  const reviewTypes = getReviewTypes();

  return (
    <>
      <Navbar userType="faculty" />
      <div className='min-h-screen bg-gray-50 overflow-x-hidden'>
        <div className='p-24 items-center'>
          <div className='flex justify-between items-center mb-4'>
            <div>
              <h1 className="text-3xl font-bold text-gray-800  ">Guide Dashboard</h1>
              {/* {markingSchema && (
                <p className="text-sm text-blue-600 mt-1">
                  Marking Schema: {markingSchema.reviews?.length || 0} guide review types configured
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Current IST: {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
              </p> */}
            </div>
            
            {/* ✅ NEW: Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors ${
                refreshing 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              title="Refresh request statuses and data"
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
              teams.map(team => (
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
                        {/* ✅ FIXED: Show proper request-based override status */}
                        <div className="text-xs text-gray-500 ml-6">
                          {reviewTypes.map(reviewType => {
                            const isPassed = isTeamDeadlinePassed(reviewType.key, team.id);
                            const requestStatus = getTeamRequestStatus(team, reviewType.key);
                            
                            return (
                              <span key={reviewType.key} className="mr-4">
                                {reviewType.name}: 
                                <span className={isPassed ? 'text-red-600 font-bold' : 'text-green-600'}>
                                  {isPassed ? 'DEADLINE PASSED' : 'Active'}
                                </span>
                                {requestStatus === 'approved' && (
                                  <span className="text-purple-600 text-xs"> (extended)</span>
                                )}
                                {requestStatus !== 'none' && requestStatus !== 'approved' && (
                                  <span className="text-blue-600"> ({requestStatus})</span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 flex-wrap">
                        {reviewTypes.map(reviewType => {
                          const isPassed = isTeamDeadlinePassed(reviewType.key, team.id);
                          const requestStatus = getTeamRequestStatus(team, reviewType.key);
                          
                          return (
                            <button
                              key={reviewType.key}
                              onClick={() => setActivePopup({ type: reviewType.key, teamId: team.id })}
                              className={`px-4 py-2 text-white text-sm rounded transition-colors ${getButtonColor(reviewType.key)} ${
                                isPassed ? 'opacity-75' : ''
                              }`}
                              title={`${reviewType.components?.length || 0} components${
                                requestStatus === 'approved' ? ' | Extended by Admin' : ''
                              }${isPassed ? ' | DEADLINE PASSED' : ''}`}
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
                        markingSchema={markingSchema}
                        panelMode={false}
                      />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ✅ FIXED: Popup with request-based override logic */}
          {activePopup && (() => {
            const team = teams.find(t => t.id === activePopup.teamId);
            const isLocked = isTeamDeadlinePassed(activePopup.type, activePopup.teamId);
            const requestStatus = getTeamRequestStatus(team, activePopup.type);
            
            console.log(`=== POPUP RENDER DEBUG (Request-Based Override) ===`);
            console.log(`Review type: ${activePopup.type}`);
            console.log(`Is locked: ${isLocked}`);
            console.log(`Request status: ${requestStatus}`);
            console.log(`Request edit visible: ${isLocked && requestStatus === 'none'}`);
            
            return (
              <PopupReview
                title={`${reviewTypes.find(r => r.key === activePopup.type)?.name || activePopup.type} Review`}
                teamMembers={team.students}
                reviewType={activePopup.type}
                isOpen={true}
                locked={isLocked}
                onClose={() => setActivePopup(null)}
                onSubmit={(data, pptObj) => {
                  handleReviewSubmit(activePopup.teamId, activePopup.type, data, pptObj);
                }}
                onRequestEdit={() => handleRequestEdit(activePopup.teamId, activePopup.type)}
                requestEditVisible={isLocked && requestStatus === 'none'}
                requestPending={requestStatus === 'pending'}
                markingSchema={markingSchema}
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
