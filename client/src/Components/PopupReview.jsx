import React, { useState, useEffect } from 'react';
import { X, Award, Star } from 'lucide-react'; // ✅ Added Star icon

const PopupReview = ({
  title,
  teamMembers,
  reviewType = 'review0',
  isOpen,
  locked = false,
  onClose,
  onSubmit,
  onRequestEdit,
  requestEditVisible = false,
  requestPending = false,
  requiresPPT = false,
  markingSchema = null,
  requestStatus = 'none',
  panelMode = false, // ✅ NEW: Add panel mode prop
  currentBestProject = false, // ✅ NEW: Current best project status
}) => {
  const [marks, setMarks] = useState({});
  const [comments, setComments] = useState({});
  const [attendance, setAttendance] = useState({});
  const [teamPptApproved, setTeamPptApproved] = useState(false);
  const [bestProject, setBestProject] = useState(false); // ✅ NEW: Best project state
  const [componentLabels, setComponentLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasAttendance, setHasAttendance] = useState(true);
  const [sub, setSub] = useState('Locked');

  // ✅ FIXED: Calculate if form should be locked considering extension status
  const isFormLocked = locked && requestStatus !== 'approved';

  // ✅ Load schema and initialize components
  useEffect(() => {
    if (!isOpen) return;
    
    setLoading(true);
    try {
      console.log('=== [PopupReview] LOADING MARKING SCHEMA ===');
      console.log('📋 [PopupReview] Review type:', reviewType);
      console.log('📋 [PopupReview] Request status:', requestStatus);
      console.log('📋 [PopupReview] Form locked:', isFormLocked);
      console.log('🏆 [PopupReview] Panel mode:', panelMode);
      
      let components = [];
      let hasValidSchema = false;
      
      if (markingSchema?.reviews) {
        const reviewConfig = markingSchema.reviews.find(review => 
          review.reviewName === reviewType
        );
        
        if (reviewConfig?.components?.length > 0) {
          hasValidSchema = true;
          components = reviewConfig.components.map((comp, index) => ({
            key: `component${index + 1}`,
            label: comp.name,
            name: comp.name,
            points: comp.weight || 10
          }));
          console.log('✅ [PopupReview] Schema components loaded:', components);
        }
      }
      
      if (!hasValidSchema) {
        console.log('❌ [PopupReview] No valid schema or components found');
        setError('No marking components found for this review type');
        components = [];
      }
      
      setComponentLabels(components);
      setHasAttendance(components.length > 0);
      
    } catch (err) {
      console.error('❌ [PopupReview] Error loading schema:', err);
      setComponentLabels([]);
      setHasAttendance(false);
      setError('Schema loading error');
    } finally {
      setLoading(false);
    }
  }, [isOpen, reviewType, markingSchema, requestStatus, isFormLocked, panelMode]);

  // ✅ Initialize form data from existing student data
  useEffect(() => {
    if (!isOpen || loading || componentLabels.length === 0) return;
    
    console.log('=== [PopupReview] INITIALIZING FORM DATA ===');
    
    const initialMarks = {};
    const initialComments = {};
    const initialAttendance = {};

    teamMembers.forEach(member => {
      console.log(`🔍 [PopupReview] Processing ${member.name}:`, member);
      
      let reviewData = null;
      if (member.reviews?.get) {
        reviewData = member.reviews.get(reviewType);
      } else if (member.reviews?.[reviewType]) {
        reviewData = member.reviews[reviewType];
      }

      console.log(`📋 [PopupReview] Review data for ${member.name}:`, reviewData);

      const componentMarks = {};
      componentLabels.forEach(comp => {
        let markValue = '';
        if (reviewData?.marks) {
          markValue = reviewData.marks[comp.name] || '';
        }
        componentMarks[comp.key] = markValue || '';
        console.log(`📊 [PopupReview] Component ${comp.name} (${comp.key}): ${markValue} for ${member.name}`);
      });

      initialMarks[member._id] = componentMarks;
      initialComments[member._id] = reviewData?.comments || '';
      
      if (hasAttendance) {
        initialAttendance[member._id] = reviewData?.attendance?.value ?? false;
      }
    });

    setMarks(initialMarks);
    setComments(initialComments);
    if (hasAttendance) {
      setAttendance(initialAttendance);
    }

    // ✅ Initialize best project status
    setBestProject(currentBestProject || false);

    // ✅ Update sub state based on comments
    const allCommentsFilled = teamMembers.every(member => 
      initialComments[member._id]?.trim() !== ''
    );
    setSub(allCommentsFilled ? 'Unlocked' : 'Locked');

    if (requiresPPT) {
      setTeamPptApproved(
        teamMembers.length > 0 && 
        teamMembers.every(member => member.pptApproved?.approved === true)
      );
    }
    
    console.log('✅ [PopupReview] Form data initialized');
    console.log('🏆 [PopupReview] Best project initialized:', currentBestProject);
  }, [isOpen, teamMembers, reviewType, loading, componentLabels, hasAttendance, requiresPPT, currentBestProject]);

  const handleMarksChange = (memberId, value, componentKey) => {
    if (isFormLocked) return;
    if (hasAttendance && attendance[memberId] === false) return;

    const componentInfo = componentLabels.find(comp => comp.key === componentKey);
    const maxPoints = componentInfo?.points || 10;
    const numValue = Number(value);

    if (numValue > maxPoints) {
      alert(`Enter value less than ${maxPoints}, resetting to ${maxPoints}`);
      setMarks(prev => ({
        ...prev,
        [memberId]: { ...prev[memberId], [componentKey]: maxPoints }
      }));
    } else if (numValue < 0) {
      setMarks(prev => ({
        ...prev,
        [memberId]: { ...prev[memberId], [componentKey]: 0 }
      }));
    } else {
      setMarks(prev => ({
        ...prev,
        [memberId]: { ...prev[memberId], [componentKey]: numValue }
      }));
    }
  };

  const handleAttendanceChange = (memberId, isPresent) => {
    if (isFormLocked) return;
    
    setAttendance(prev => ({ ...prev, [memberId]: isPresent }));
    
    if (!isPresent) {
      const zeroedMarks = {};
      componentLabels.forEach(comp => {
        zeroedMarks[comp.key] = 0;
      });
      setMarks(prev => ({ ...prev, [memberId]: zeroedMarks }));
      setComments(prev => ({ ...prev, [memberId]: '' }));
      
      const allCommentsFilled = teamMembers.every(member => 
        member._id === memberId ? true : (comments[member._id]?.trim() !== '')
      );
      setSub(allCommentsFilled ? 'Unlocked' : 'Locked');
    }
  };

  const handleCommentsChange = (memberId, value) => {
    if (isFormLocked) return;
    
    setComments(prev => ({ ...prev, [memberId]: value }));
    
    const allCommentsFilled = teamMembers.every(member => 
      member._id === memberId ? value.trim() !== '' : (comments[member._id]?.trim() !== '')
    );
    setSub(allCommentsFilled ? 'Unlocked' : 'Locked');
  };

  const handleSubmit = () => {
    if (isFormLocked || sub === 'Locked') return;
    
    console.log('=== [PopupReview] SUBMITTING REVIEW DATA ===');
    console.log('🏆 [PopupReview] Best project status:', bestProject);
    
    const submission = {};
    
    teamMembers.forEach(member => {
      const memberMarks = marks[member._id] || {};
      const submissionData = {
        comments: comments[member._id] || ''
      };

      componentLabels.forEach(comp => {
        submissionData[comp.name] = Number(memberMarks[comp.key]) || 0;
        console.log(`📤 [PopupReview] Setting ${comp.name} = ${submissionData[comp.name]} for ${member.name}`);
      });

      if (hasAttendance) {
        submissionData.attendance = {
          value: attendance[member._id] || false,
          locked: false
        };
      }

      submission[member.regNo] = submissionData;
    });

    console.log('📤 [PopupReview] Final submission object:', submission);

    // ✅ Handle different submission scenarios
    if (requiresPPT && panelMode) {
      // Panel with PPT - include both PPT and best project
      const teamPptObj = {
        pptApproved: {
          approved: teamPptApproved,
          locked: false
        }
      };
      onSubmit(submission, teamPptObj, { bestProject }); // ✅ Pass best project as third param
    } else if (panelMode) {
      // Panel without PPT - include best project
      onSubmit(submission, null, { bestProject }); // ✅ Pass best project as third param
    } else if (requiresPPT) {
      // Guide with PPT - original behavior
      const teamPptObj = {
        pptApproved: {
          approved: teamPptApproved,
          locked: false
        }
      };
      onSubmit(submission, teamPptObj);
    } else {
      // Guide without PPT - original behavior
      onSubmit(submission);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 shadow-2xl">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="text-lg text-gray-700">Loading marking schema...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] flex flex-col border-2 border-blue-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Award className="w-7 h-7" />
                <h2 className="text-2xl font-bold">{title}</h2>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-sm text-white/90">
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  {componentLabels.length} components
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  {teamMembers.length} students
                </span>
                {requiresPPT && (
                  <span className="bg-yellow-400/30 px-3 py-1 rounded-full">
                    PPT Required
                  </span>
                )}
                {/* ✅ Show panel mode */}
                {panelMode && (
                  <span className="bg-purple-400/30 px-3 py-1 rounded-full">
                    👥 Panel Review
                  </span>
                )}
                {/* ✅ Show best project status */}
                {panelMode && bestProject && (
                  <span className="bg-yellow-500/30 px-3 py-1 rounded-full">
                    ⭐ Best Project
                  </span>
                )}
                {requestStatus === 'approved' && (
                  <span className="bg-green-400/30 px-3 py-1 rounded-full">
                    🔓 Extension Approved
                  </span>
                )}
                {isFormLocked && (
                  <span className="bg-red-400/30 px-3 py-1 rounded-full">
                    🔒 Locked
                  </span>
                )}
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={28} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 mb-6 rounded">
              <p className="font-medium">Error: {error}</p>
            </div>
          )}

          {/* ✅ PANEL ONLY: Best Project Selection */}
          {panelMode && (
            <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bestProject}
                  onChange={(e) => setBestProject(e.target.checked)}
                  disabled={isFormLocked}
                  className="w-5 h-5 text-yellow-600 bg-yellow-50 border-yellow-300 rounded focus:ring-2 focus:ring-yellow-500"
                />
                <Star className="w-5 h-5 text-yellow-600" />
                <div>
                  <span className="font-bold text-yellow-800 text-lg">
                    Mark as Best Project
                  </span>
                  <p className="text-sm text-yellow-700 mt-1">
                    Select this if you consider this project to be among the best in the evaluation
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Team PPT Approval */}
          {requiresPPT && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={teamPptApproved}
                  onChange={(e) => setTeamPptApproved(e.target.checked)}
                  disabled={isFormLocked}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="font-semibold text-blue-800">
                  Team PPT Approved
                </span>
              </label>
            </div>
          )}

          {/* Students Grid - Rest of the component remains the same */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {teamMembers.map(member => (
              <div 
                key={member._id}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Student Header */}
                <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-800 mb-1">
                      {member.name}
                    </h3>
                    <p className="text-sm text-gray-500">{member.regNo}</p>
                  </div>
                  
                  {/* Attendance */}
                  {hasAttendance && (
                    <div className="ml-3">
                      <select
                        value={attendance[member._id] ? 'present' : 'absent'}
                        onChange={(e) => handleAttendanceChange(member._id, e.target.value === 'present')}
                        disabled={isFormLocked}
                        className={`px-3 py-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 ${
                          attendance[member._id] 
                            ? 'bg-green-50 border-green-300 text-green-800' 
                            : 'bg-red-50 border-red-300 text-red-800'
                        }`}
                      >
                        <option value="present">✓ Present</option>
                        <option value="absent">✗ Absent</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Components */}
                <div className="space-y-3 mb-4">
                  {componentLabels.map(comp => (
                    <div key={comp.key} className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 flex-1 mr-3">
                        {comp.label}
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max={comp.points}
                          value={marks[member._id]?.[comp.key] || ''}
                          onChange={(e) => handleMarksChange(member._id, e.target.value, comp.key)}
                          disabled={isFormLocked || (hasAttendance && attendance[member._id] === false)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          placeholder="0"
                        />
                        <span className="text-xs text-gray-500 min-w-fit">
                          /{comp.points}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Comments */}
                <textarea
                  value={comments[member._id] || ''}
                  onChange={(e) => handleCommentsChange(member._id, e.target.value)}
                  disabled={isFormLocked || (hasAttendance && attendance[member._id] === false)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  rows="3"
                  placeholder="Add comments..."
                />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center rounded-b-2xl">
          <div className="flex space-x-3">
            {requestEditVisible && !requestPending && (
              <button
                onClick={onRequestEdit}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
              >
                Request Edit
              </button>
            )}
            {requestPending && (
              <span className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm">
                Request Pending...
              </span>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isFormLocked || sub === 'Locked'}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isFormLocked || sub === 'Locked'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : panelMode && bestProject
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {/* ✅ Updated button text */}
              {requestStatus === 'approved' && !isFormLocked 
                ? `Submit ${panelMode ? 'Panel ' : ''}Review (Extended)` 
                : isFormLocked 
                  ? 'Locked' 
                  : sub === 'Locked' 
                    ? 'Comments Required' 
                    : panelMode && bestProject
                      ? '⭐ Submit Best Project Review'
                      : `Submit ${panelMode ? 'Panel ' : ''}Review`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopupReview;
