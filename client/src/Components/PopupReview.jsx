import React, { useState, useEffect } from 'react';
import { X, Award, Star, Clock, Calendar } from 'lucide-react'; // ✅ Added Clock and Calendar icons

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
  panelMode = false,
  currentBestProject = false,
  teamId = null, // ✅ NEW: Team ID for deadline checking
}) => {
  const [marks, setMarks] = useState({});
  const [comments, setComments] = useState({});
  const [attendance, setAttendance] = useState({});
  const [teamPptApproved, setTeamPptApproved] = useState(false);
  const [bestProject, setBestProject] = useState(false);
  const [componentLabels, setComponentLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasAttendance, setHasAttendance] = useState(true);
  const [sub, setSub] = useState('Locked');

const [patStates, setPatStates] = useState({});

  
  // ✅ NEW: Deadline states
  const [deadlineInfo, setDeadlineInfo] = useState({
    hasDeadline: false,
    fromDate: null,
    toDate: null,
    isBeforeStart: false,
    isAfterEnd: false,
    timeUntilStart: '',
    timeUntilEnd: '',
  });

  // ✅ FIXED: Calculate if form should be locked considering ALL conditions
  const isFormLocked = locked && requestStatus !== 'approved';
  const isDeadlineLocked = (deadlineInfo.isBeforeStart || deadlineInfo.isAfterEnd) && requestStatus !== 'approved';
  const finalFormLocked = isFormLocked || isDeadlineLocked;

  // ✅ NEW: Function to calculate deadline status
  const calculateDeadlineStatus = (reviewConfig) => {
    if (!reviewConfig?.deadline) {
      return {
        hasDeadline: false,
        fromDate: null,
        toDate: null,
        isBeforeStart: false,
        isAfterEnd: false,
        timeUntilStart: '',
        timeUntilEnd: '',
      };
    }

    const now = new Date();
    const currentIST = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const deadline = reviewConfig.deadline;
    
    let fromDate = null;
    let toDate = null;
    
    try {
      if (deadline.from && deadline.to) {
        fromDate = new Date(deadline.from);
        toDate = new Date(deadline.to);
      } else if (typeof deadline === 'string' || deadline instanceof Date) {
        // If only single deadline provided, assume it's the end date and review opens immediately
        toDate = new Date(deadline);
        fromDate = new Date(0); // Beginning of time - always open from start
      }

      const fromIST = fromDate ? new Date(fromDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })) : null;
      const toIST = toDate ? new Date(toDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })) : null;

      const isBeforeStart = fromIST && currentIST < fromIST;
      const isAfterEnd = toIST && currentIST > toIST;

      // Calculate time until events
      const timeUntilStart = isBeforeStart ? getTimeDifference(currentIST, fromIST) : '';
      const timeUntilEnd = (!isAfterEnd && toIST) ? getTimeDifference(currentIST, toIST) : '';

      return {
        hasDeadline: !!(fromDate || toDate),
        fromDate: fromIST,
        toDate: toIST,
        isBeforeStart,
        isAfterEnd,
        timeUntilStart,
        timeUntilEnd,
      };
    } catch (error) {
      console.error('Error calculating deadline status:', error);
      return {
        hasDeadline: false,
        fromDate: null,
        toDate: null,
        isBeforeStart: false,
        isAfterEnd: false,
        timeUntilStart: '',
        timeUntilEnd: '',
      };
    }
  };

  // ✅ NEW: Function to get human-readable time difference
  const getTimeDifference = (from, to) => {
    const diffMs = to - from;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    } else {
      return `${Math.max(0, diffMinutes)} minute${diffMinutes > 1 ? 's' : ''}`;
    }
  };

  // ✅ ENHANCED: Load schema and initialize components with deadline checking
  useEffect(() => {
    if (!isOpen) return;
    
    setLoading(true);
    try {
      console.log('=== [PopupReview] LOADING MARKING SCHEMA WITH DEADLINE CHECK ===');
      console.log('📋 [PopupReview] Review type:', reviewType);
      console.log('📋 [PopupReview] Request status:', requestStatus);
      
      let components = [];
      let hasValidSchema = false;
      let reviewConfig = null;
      
      if (markingSchema?.reviews) {
        reviewConfig = markingSchema.reviews.find(review => 
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
      
      // ✅ NEW: Calculate deadline status
      const deadlineStatus = calculateDeadlineStatus(reviewConfig);
      setDeadlineInfo(deadlineStatus);
      
      console.log('📅 [PopupReview] Deadline status:', deadlineStatus);
      console.log('🔒 [PopupReview] Final form locked status:', finalFormLocked);
      
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
  }, [isOpen, reviewType, markingSchema, requestStatus, finalFormLocked, panelMode]);

  // ✅ Initialize form data from existing student data

// ✅ Initialize form data from existing student data
useEffect(() => {
  if (!isOpen || loading || componentLabels.length === 0) return;
  
  console.log('=== [PopupReview] INITIALIZING FORM DATA ===');
  
  const initialMarks = {};
  const initialComments = {};
  const initialAttendance = {};
  const initialPatStates = {}; // ✅ NEW: Initialize PAT states

  teamMembers.forEach(member => {
    console.log(`🔍 [PopupReview] Processing ${member.name}:`, member);
    console.log(`🔍 [PopupReview] PAT Status for ${member.name}:`, member.PAT); // Debug PAT
    
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
    
    // ✅ FIXED: Better PAT initialization with fallback and debugging
    const patStatus = member.PAT === true || member.PAT === 'true' || member.PAT === 1;
    initialPatStates[member._id] = patStatus;
    console.log(`🚫 [PopupReview] PAT initialized for ${member.name}: ${patStatus} (original: ${member.PAT})`);
  });

  setMarks(initialMarks);
  setComments(initialComments);
  if (hasAttendance) {
    setAttendance(initialAttendance);
  }
  setPatStates(initialPatStates); // ✅ NEW: Set PAT states
  
  console.log('🚫 [PopupReview] All PAT states initialized:', initialPatStates);

  // ✅ Initialize best project status
  setBestProject(currentBestProject || false);

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
  if (finalFormLocked) return;
  if (hasAttendance && attendance[memberId] === false) return;
  if (patStates[memberId]) return; // ✅ NEW: Prevent marks entry if PAT is enabled

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
  if (finalFormLocked) return;
  
  setAttendance(prev => ({ ...prev, [memberId]: isPresent }));
  
  if (!isPresent) {
    // Zero out marks for absent students
    const zeroedMarks = {};
    componentLabels.forEach(comp => {
      zeroedMarks[comp.key] = 0;
    });
    setMarks(prev => ({ ...prev, [memberId]: zeroedMarks }));
    
    // ✅ Keep existing comments - don't clear them
    // Comments are still required even for absent students
  }
  
  // ✅ FIXED: Check that ALL students have comments (regardless of attendance)
  const allCommentsFilled = teamMembers.every(member => 
    comments[member._id]?.trim() !== ''
  );
  setSub(allCommentsFilled ? 'Unlocked' : 'Locked');
};



const handleCommentsChange = (memberId, value) => {
  if (finalFormLocked) return;
  
  setComments(prev => ({ ...prev, [memberId]: value }));
  
  // ✅ FIXED: ALL students (present AND absent) must have comments
  const allCommentsFilled = teamMembers.every(member => 
    member._id === memberId ? value.trim() !== '' : (comments[member._id]?.trim() !== '')
  );
  setSub(allCommentsFilled ? 'Unlocked' : 'Locked');
};


const handleSubmit = () => {
  if (finalFormLocked || sub === 'Locked') return;
  
  console.log('=== [PopupReview] SUBMITTING REVIEW DATA ===');
  console.log('🏆 [PopupReview] Best project status:', bestProject);
  
  const submission = {};
  const patUpdates = {}; // ✅ NEW: Track PAT updates
  
  teamMembers.forEach(member => {
    const memberMarks = marks[member._id] || {};
    const submissionData = {
      comments: comments[member._id] || ''
    };

    componentLabels.forEach(comp => {
      const markValue = memberMarks[comp.key];
      // ✅ Store special value for PAT or convert to number
      submissionData[comp.name] = patStates[member._id] ? -1 : (Number(markValue) || 0);
      console.log(`📤 [PopupReview] Setting ${comp.name} = ${submissionData[comp.name]} for ${member.name}`);
    });

    if (hasAttendance) {
      submissionData.attendance = {
        value: attendance[member._id] || false,
        locked: false
      };
    }

    submission[member.regNo] = submissionData;
    
    // ✅ NEW: Track PAT status for database update (Guide only)
    if (!panelMode) {
      patUpdates[member.regNo] = patStates[member._id] || false;
      console.log(`🚫 [PopupReview] PAT status for ${member.name} (${member.regNo}): ${patStates[member._id]}`);
    }
  });

  console.log('📤 [PopupReview] Final submission object:', submission);
  console.log('📤 [PopupReview] PAT updates object:', patUpdates);

  // ✅ FIXED: Handle different submission scenarios with PAT data
  if (requiresPPT && panelMode) {
    const teamPptObj = {
      pptApproved: {
        approved: teamPptApproved,
        locked: false
      }
    };
    onSubmit(submission, teamPptObj, { bestProject });
  } else if (panelMode) {
    onSubmit(submission, null, { bestProject });
  } else if (requiresPPT) {
    const teamPptObj = {
      pptApproved: {
        approved: teamPptApproved,
        locked: false
      }
    };
    onSubmit(submission, teamPptObj, patUpdates); // ✅ Pass PAT data for guide
  } else {
    // ✅ FIXED: Guide without PPT - pass PAT data as second parameter
    onSubmit(submission, patUpdates); // ✅ Pass PAT data for guide
  }
};


  // ✅ NEW: Handle PAT toggle (Guide only)
const handlePatToggle = (memberId, isPat) => {
  if (finalFormLocked || panelMode) return; // Don't allow in panel mode
  
  setPatStates(prev => ({ ...prev, [memberId]: isPat }));
  
  if (isPat) {
    // When PAT is enabled, set all marks to "PAT" special value
    const patMarks = {};
    componentLabels.forEach(comp => {
      patMarks[comp.key] = 'PAT'; // Special value for database
    });
    setMarks(prev => ({ ...prev, [memberId]: patMarks }));
  } else {
    // When PAT is disabled, reset marks to 0
    const resetMarks = {};
    componentLabels.forEach(comp => {
      resetMarks[comp.key] = 0;
    });
    setMarks(prev => ({ ...prev, [memberId]: resetMarks }));
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
                {/* ✅ NEW: Deadline status indicators */}
                {deadlineInfo.isBeforeStart && (
                  <span className="bg-orange-400/30 px-3 py-1 rounded-full">
                    🕒 Not Yet Open
                  </span>
                )}
                {deadlineInfo.isAfterEnd && (
                  <span className="bg-red-400/30 px-3 py-1 rounded-full">
                    ⏰ Deadline Passed
                  </span>
                )}
                {finalFormLocked && (
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

          {/* ✅ NEW: Deadline Information Banner */}
          {deadlineInfo.hasDeadline && (
            <div className={`mb-6 p-4 rounded-xl border-2 ${
              deadlineInfo.isBeforeStart 
                ? 'bg-orange-50 border-orange-200' 
                : deadlineInfo.isAfterEnd
                  ? 'bg-red-50 border-red-200'
                  : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {deadlineInfo.isBeforeStart ? (
                    <Clock className="w-6 h-6 text-orange-600" />
                  ) : deadlineInfo.isAfterEnd ? (
                    <Calendar className="w-6 h-6 text-red-600" />
                  ) : (
                    <Calendar className="w-6 h-6 text-green-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`font-bold text-lg ${
                    deadlineInfo.isBeforeStart 
                      ? 'text-orange-800' 
                      : deadlineInfo.isAfterEnd
                        ? 'text-red-800'
                        : 'text-green-800'
                  }`}>
                    {deadlineInfo.isBeforeStart 
                      ? '⏳ Review Not Yet Open' 
                      : deadlineInfo.isAfterEnd
                        ? '⌛ Review Deadline Has Passed'
                        : '✅ Review Is Currently Open'
                    }
                  </h3>
                  
                  <div className="mt-2 space-y-1 text-sm">
                    {deadlineInfo.fromDate && (
                      <p className={
                        deadlineInfo.isBeforeStart 
                          ? 'text-orange-700' 
                          : deadlineInfo.isAfterEnd
                            ? 'text-red-700'
                            : 'text-green-700'
                      }>
                        <strong>Opens:</strong> {deadlineInfo.fromDate.toLocaleString('en-IN', { 
                          timeZone: 'Asia/Kolkata',
                          dateStyle: 'full',
                          timeStyle: 'short'
                        })}
                      </p>
                    )}
                    {deadlineInfo.toDate && (
                      <p className={
                        deadlineInfo.isBeforeStart 
                          ? 'text-orange-700' 
                          : deadlineInfo.isAfterEnd
                            ? 'text-red-700'
                            : 'text-green-700'
                      }>
                        <strong>Closes:</strong> {deadlineInfo.toDate.toLocaleString('en-IN', { 
                          timeZone: 'Asia/Kolkata',
                          dateStyle: 'full',
                          timeStyle: 'short'
                        })}
                      </p>
                    )}
                    
                    {deadlineInfo.timeUntilStart && (
                      <p className="text-orange-600 font-medium">
                        ⏰ Opens in: {deadlineInfo.timeUntilStart}
                      </p>
                    )}
                    {deadlineInfo.timeUntilEnd && !deadlineInfo.isAfterEnd && (
                      <p className="text-green-600 font-medium">
                        ⏰ Closes in: {deadlineInfo.timeUntilEnd}
                      </p>
                    )}
                  </div>
                  
                  {requestStatus === 'approved' && (deadlineInfo.isBeforeStart || deadlineInfo.isAfterEnd) && (
                    <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded">
                      <p className="text-green-800 font-medium text-sm">
                        🔓 Extension Approved - You can still submit this review
                      </p>
                    </div>
                  )}
                </div>
              </div>
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
                  disabled={finalFormLocked}
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
                  disabled={finalFormLocked}
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
    <div className="flex items-center justify-between mb-1">
      <h3 className="font-bold text-lg text-gray-800">
        {member.name}
      </h3>
      {/* ✅ FIXED: PAT indicator stamp - shows in BOTH guide and panel when PAT is true */}
      {patStates[member._id] && (
        <div className="bg-red-100 border border-red-300 px-2 py-1 rounded-lg">
          <span className="text-red-800 text-xs font-bold">🚫 PAT</span>
        </div>
      )}
    </div>
    <p className="text-sm text-gray-500">{member.regNo}</p>
    
    {/* ✅ FIXED: PAT Toggle - ONLY shows in Guide mode, hidden in Panel mode */}
    {!panelMode && (
      <div className="mt-2">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={patStates[member._id] || false}
            onChange={(e) => handlePatToggle(member._id, e.target.checked)}
            disabled={finalFormLocked}
            className="w-4 h-4 text-red-600 bg-red-50 border-red-300 rounded focus:ring-2 focus:ring-red-500"
          />
          <span className="text-sm font-medium text-red-700">
            PAT Detected
          </span>
        </label>
      </div>
    )}
  </div>
  
  {/* Attendance */}
  {hasAttendance && (
    <div className="ml-3">
      <select
        value={attendance[member._id] ? 'present' : 'absent'}
        onChange={(e) => handleAttendanceChange(member._id, e.target.value === 'present')}
        disabled={finalFormLocked}
        className={`px-3 py-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 ${
          attendance[member._id] 
            ? 'bg-green-50 border-green-300 text-green-800' 
            : 'bg-red-50 border-red-300 text-red-800'
        } ${finalFormLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
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
  type={patStates[member._id] ? 'text' : 'number'}
  min="0"
  max={comp.points}
  value={patStates[member._id] ? 'PAT' : marks[member._id]?.[comp.key] ?? ''}
  onChange={(e) => !patStates[member._id] &&
    handleMarksChange(member._id, e.target.value, comp.key)}
  onWheel={(e) => e.target.blur()}
  disabled={
    finalFormLocked || 
    (hasAttendance && attendance[member._id] === false) ||
    patStates[member._id]
  }
  readOnly={patStates[member._id]}
  placeholder={patStates[member._id] ? 'PAT' : '0'}
  className={`w-16 px-2 py-1 border rounded text-center text-sm focus:ring-2 focus:ring-blue-500 ${
    (finalFormLocked || (hasAttendance && attendance[member._id] === false))
      ? 'bg-gray-100 cursor-not-allowed'
      : ''
  } ${patStates[member._id] ? 'text-red-600 font-bold' : ''}`}
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
  disabled={finalFormLocked} // ✅ FIXED: Remove attendance check from comments
  required
  className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${
    finalFormLocked // ✅ FIXED: Remove attendance check from comments styling
      ? 'bg-gray-100 cursor-not-allowed' 
      : ''
  }`}
  rows="3"
  placeholder={finalFormLocked ? "Comments locked" : "Add comments..."}
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
              disabled={finalFormLocked || sub === 'Locked'}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                finalFormLocked || sub === 'Locked'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : panelMode && bestProject
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {/* ✅ Updated button text with deadline context */}
              {deadlineInfo.isBeforeStart && requestStatus !== 'approved'
                ? '⏳ Not Yet Open'
                : deadlineInfo.isAfterEnd && requestStatus !== 'approved'
                  ? '⌛ Deadline Passed'
                  : requestStatus === 'approved' && (deadlineInfo.isBeforeStart || deadlineInfo.isAfterEnd)
                    ? `Submit ${panelMode ? 'Panel ' : ''}Review (Extended)`
                    : requestStatus === 'approved' && !finalFormLocked
                      ? `Submit ${panelMode ? 'Panel ' : ''}Review (Extended)` 
                      : finalFormLocked 
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
