import React, { useState, useEffect } from 'react';
import PopupReview from '../Components/PopupReview';
import ReviewTable from '../Components/ReviewTable';
import Navbar from '../Components/UniversalNavbar';
import { ChevronRight, RefreshCw } from 'lucide-react';
import { 
  getPanelProjects,
  updateProject,
  createReviewRequest,
  batchCheckRequestStatuses,
  getFacultyMarkingSchema,
} from '../api';

// Normalize student.review and .deadline fields from Mongo Map or raw object to plain object
function normalizeStudentData(student) {
  // --- Normalize reviews ---
  let reviews = {};
  if (student.reviews) {
    if (student.reviews instanceof Map) {
      reviews = Object.fromEntries(student.reviews);
    } else if (typeof student.reviews === 'object') {
      reviews = { ...student.reviews };
    }
  }

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
  };
}

const Panel = () => {
  const [teams, setTeams] = useState([]);
  const [deadlines, setDeadlines] = useState({});
  const [markingSchema, setMarkingSchema] = useState(null);
  const [activePopup, setActivePopup] = useState(null);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requestStatuses, setRequestStatuses] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [projectsRes, markingSchemaRes] = await Promise.all([
        getPanelProjects().catch(error => ({ data: { success: false, error: error.message } })),
        getFacultyMarkingSchema().catch(error => ({ data: { success: false, error: error.message } })),
      ]);

      let mappedTeams = [];

      if (projectsRes.data?.success) {
        const projects = projectsRes.data.data;
        mappedTeams = projects.map(project => ({
          id: project._id,
          title: project.name,
          description: `Panel: ${[project.panel?.faculty1?.name, project.panel?.faculty2?.name].filter(Boolean).join(', ') || 'N/A'}`,
          students: (project.students || []).map(normalizeStudentData),
          pptApproved: project.pptApproved || { approved: false, locked: false },
          panel: project.panel,
        }));
        setTeams(mappedTeams);
      } else {
        setTeams([]);
      }

      // Handle marking schema
      if (markingSchemaRes.data?.success && markingSchemaRes.data.data) {
        const ms = markingSchemaRes.data.data;
        // Only take panel reviews (i.e., facultyType === "panel")
        const filteredReviews = (ms.reviews || []).filter(
          review => review.facultyType === 'panel'
        );
        setMarkingSchema({ ...ms, reviews: filteredReviews });

        // Collect deadlines for all panel reviews
        const deadlineData = {};
        filteredReviews.forEach(review => {
          if (review.deadline) {
            deadlineData[review.reviewName] = review.deadline;
          }
        });
        setDeadlines(deadlineData);

        // Batch fetch request statuses
        if (mappedTeams.length > 0) {
          const reviewTypes = filteredReviews.map(r => r.reviewName);
          const batchRequests = [];
          mappedTeams.forEach(team => {
            team.students.forEach(student => {
              reviewTypes.forEach(reviewType => {
                batchRequests.push({
                  regNo: student.regNo,
                  reviewType,
                  facultyType: 'panel',
                });
              });
            });
          });
          const statuses = await batchCheckRequestStatuses(batchRequests);
          setRequestStatuses(statuses || {});
        }
      } else {
        setDeadlines({});
        setMarkingSchema(null);
      }
    } catch (err) {
      setError('Failed to load panel data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      if (teams.length > 0 && markingSchema) {
        const reviewTypes = markingSchema.reviews?.map(r => r.reviewName) || [];
        const batchRequests = [];
        teams.forEach(team => {
          team.students.forEach(student => {
            reviewTypes.forEach(reviewType => {
              batchRequests.push({
                regNo: student.regNo,
                reviewType,
                facultyType: 'panel',
              });
            });
          });
        });
        const statuses = await batchCheckRequestStatuses(batchRequests);
        setRequestStatuses(statuses);
        await fetchData();
      }
    } catch (err) {
      //
    } finally {
      setRefreshing(false);
    }
  };

  // -------- Review type helpers --------------
  const getReviewTypes = () => {
    if (markingSchema && Array.isArray(markingSchema.reviews)) {
      return markingSchema.reviews.map(review => ({
        key: review.reviewName,
        name: review.displayName || getReviewDisplayName(review.reviewName),
        components: review.components,
        requiresPPT: review.requiresPPT || false,
      }));
    }
    // Fallback if schema missing
    return [
      { key: 'review2', name: 'Panel Review 1', components: [], requiresPPT: false },
      { key: 'review3', name: 'Panel Review 2', components: [], requiresPPT: false },
      { key: 'review4', name: 'Final Review', components: [], requiresPPT: false },
    ];
  };

  const getReviewDisplayName = (reviewName) => {
    const nameMap = {
      review2: 'Panel Review 1',
      review3: 'Panel Review 2',
      review4: 'Final Review',
    };
    return nameMap[reviewName] || reviewName;
  };

  const getButtonColor = (reviewType) => {
    const colorMap = {
      review2: 'bg-blue-500 hover:bg-blue-600',
      review3: 'bg-purple-500 hover:bg-purple-600',
      review4: 'bg-green-500 hover:bg-green-600',
    };
    return colorMap[reviewType] || 'bg-gray-500 hover:bg-gray-600';
  };

  // ----------------------------------------------------------
  // --------- Review Status/Deadline Request Logic ------------
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

  const isTeamDeadlinePassed = (reviewType, teamId) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return false;

    const now = new Date();
    const currentIST = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

    const teamRequestStatus = getTeamRequestStatus(team, reviewType);

    // If approved request, check for individual extension per student for this review
    if (teamRequestStatus === 'approved') {
      const studentsWithOverride = team.students.filter(
        s => s.deadline && s.deadline[reviewType]
      );
      if (studentsWithOverride.length > 0) {
        const latest = studentsWithOverride
          .map(s => {
            try {
              const deadline = new Date(s.deadline[reviewType].to);
              return new Date(deadline.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
            } catch (e) {
              return null;
            }
          })
          .filter(Boolean)
          .reduce((max, dt) => (max && dt > max ? dt : max), null);
        if (latest) return currentIST > latest;
      }
    }
    // else, use global system deadline (from marking schema)
    if (!deadlines || !deadlines[reviewType]) return false;
    const d = deadlines[reviewType];
    try {
      if (d.from && d.to) {
        const toIST = new Date(new Date(d.to).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        return currentIST > toIST;
      } else if (typeof d === "string" || d instanceof Date) {
        const deadlineIST = new Date(new Date(d).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        return currentIST > deadlineIST;
      }
    } catch (e) {
      return false;
    }
    return false;
  };

  const isReviewLocked = (student, reviewType, teamId) => {
    // Check manual lock
    const reviewData = student.reviews && typeof student.reviews.get === 'function'
      ? student.reviews.get(reviewType)
      : student.reviews?.[reviewType];
    if (reviewData?.locked) return true;
    return isTeamDeadlinePassed(reviewType, teamId);
  };

  // ----------------------------------------------------------
  // ----------- API Handling for Submit/Request --------------
  const handleReviewSubmit = async (teamId, reviewType, reviewData, pptObj) => {
    try {
      const team = teams.find(t => t.id === teamId);
      if (!team) return;

      const reviewConfig = markingSchema?.reviews?.find(r => r.reviewName === reviewType);

      // Merge student updates
      const studentUpdates = team.students.map(student => {
        const studentReviewData = reviewData[student.regNo] || {};
        // Use schema to pick correct mark keys
        let marks = {};
        if (reviewConfig && reviewConfig.components) {
          reviewConfig.components.forEach(comp => {
            marks[comp.name] = Number(studentReviewData[comp.name]) || 0;
          });
        } else {
          Object.keys(studentReviewData).forEach(key => {
            if (key !== 'comments' && key !== 'attendance' && key !== 'locked') {
              marks[key] = Number(studentReviewData[key]) || 0;
            }
          });
        }

        return {
          studentId: student._id,
          reviews: {
            [reviewType]: {
              marks,
              attendance: studentReviewData.attendance || { value: false, locked: false },
              locked: studentReviewData.locked || false,
              comments: studentReviewData.comments || '',
            },
          },
          ...(reviewConfig?.requiresPPT && pptObj?.pptApproved ? { pptApproved: pptObj.pptApproved } : {}),
        };
      });

      const updatePayload = {
        projectId: teamId,
        studentUpdates,
        ...(reviewConfig?.requiresPPT && pptObj ? { pptApproved: pptObj.pptApproved } : {}),
      };

      const response = await updateProject(updatePayload);
      if (response.data?.success || response.data?.updates) {
        setActivePopup(null);
        setTimeout(fetchData, 500);
        alert('Panel review submitted and saved successfully!');
      } else {
        throw new Error(response.data?.message || 'Panel update failed');
      }
    } catch (error) {
      alert('Error submitting panel review. Please try again.');
    }
  };

  const handleRequestEdit = async (teamId, reviewType) => {
    try {
      const team = teams.find(t => t.id === teamId);
      if (!team) return;
      const reason = prompt('Please enter the reason for requesting edit access:', 'Need to correct marks after deadline');
      if (!reason?.trim()) return;
      const requestData = {
        regNo: team.students?.[0]?.regNo,
        reviewType: reviewType,
        reason: reason.trim()
      };
      const response = await createReviewRequest('panel', requestData);
      if (response.success) {
        alert('Edit request submitted successfully!');
        // Refresh panel request statuses
        if (markingSchema) {
          const reviewTypes = markingSchema.reviews?.map(r => r.reviewName) || [];
          const batchRequests = [];
          teams.forEach(team => {
            team.students.forEach(student => {
              reviewTypes.forEach(rt => {
                batchRequests.push({
                  regNo: student.regNo,
                  reviewType: rt,
                  facultyType: 'panel',
                });
              });
            });
          });
          const statuses = await batchCheckRequestStatuses(batchRequests);
          setRequestStatuses(statuses);
        }
      } else {
        alert(response.message || 'Error submitting request');
      }
    } catch (error) {
      alert('Error submitting panel request. Please try again.');
    }
  };

  // ---------------------------------------------------------

  if (loading) {
    return (
      <>
        <Navbar userType="faculty" />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <div className="text-xl text-gray-600">Loading panel projects...</div>
            <div className="text-sm text-gray-500">Fetching marking schema and deadlines</div>
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
              <h1 className="text-3xl font-bold text-gray-800">Panel Dashboard</h1>
            </div>
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
              <h2 className="text-2xl font-semibold text-black pl-5 mt-2">Panel Review</h2>
            </div>
            {teams.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-lg mb-2">No projects assigned as panel</div>
                <p className="text-sm">Projects you review as panel will appear here</p>
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
                        panelMode={true}
                      />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          {activePopup && (() => {
            const team = teams.find(t => t.id === activePopup.teamId);
            if (!team) return null;
            const isLocked = isTeamDeadlinePassed(activePopup.type, activePopup.teamId);
            const requestStatus = getTeamRequestStatus(team, activePopup.type);
            const reviewTypeCfg = reviewTypes.find(r => r.key === activePopup.type);

            return (
              <PopupReview
                title={`${reviewTypeCfg?.name || activePopup.type} - ${team.title}`}
                teamMembers={team.students}
                reviewType={activePopup.type}
                isOpen={true}
                locked={isLocked}
                onClose={() => setActivePopup(null)}
                onSubmit={(data, pptObj) => {
                  handleReviewSubmit(activePopup.teamId, activePopup.type, data, pptObj);
                }}
                onRequestEdit={() => handleRequestEdit(activePopup.teamId, activePopup.type)}
                requestEditVisible={isLocked && (requestStatus === 'none' || requestStatus === 'rejected')}
                requestPending={requestStatus === 'pending'}
                markingSchema={markingSchema}
                requiresPPT={!!reviewTypeCfg?.requiresPPT}
              />
            );
          })()}
        </div>
      </div>
    </>
  );
};

export default Panel;
