import React from 'react';

const renderMarks = (reviewObj, components = []) => {
  if (!reviewObj) return <span className="text-gray-400">None</span>;
  
  const marks = reviewObj.marks || reviewObj;
  
  if (!components || components.length === 0) {
    if (typeof marks === 'object' && marks !== null) {
      const values = Object.values(marks).filter(val => 
        typeof val === 'number' || (typeof val === 'string' && !isNaN(val) && val !== '')
      );
      return values.length > 0 ? values.join(' / ') : <span className="text-gray-400">None</span>;
    }
    return <span className="text-gray-400">None</span>;
  }

  // ✅ FIXED: Use component names directly from schema
  const values = components.map(comp => {
    let value = null;
    
    if (marks && typeof marks === 'object') {
      value = marks[comp.name]; // ✅ Use comp.name directly
    }
    
    return (value != null && value !== '') ? value : null;
  }).filter(val => val !== null);
  
  return values.length > 0 ? values.join(' / ') : <span className="text-gray-400">None</span>;
};

const renderAttendance = (attendanceObj) => {
  if (!attendanceObj || attendanceObj.value == null) return <span className="text-gray-400">None</span>;
  return attendanceObj.value
    ? <span className="text-green-600 font-semibold">Present</span>
    : <span className="text-red-600 font-semibold">Absent</span>;
};

const renderComments = (comments) => {
  if (!comments || comments.trim() === '') return <span className="text-gray-400">None</span>;
  return (
    <div className="max-w-full break-words whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-2 rounded">
      {comments}
    </div>
  );
};

const ReviewTable = ({
  team,
  deadlines = {},
  requestStatuses = {},
  isDeadlinePassed,
  isReviewLocked,
  markingSchema = null,
  panelMode = false,
}) => {
  console.log('=== [ReviewTable] REVIEW TABLE RENDER ===');
  console.log('📋 [ReviewTable] Team:', team?.title);
  console.log('📋 [ReviewTable] Team Marking Schema:', team?.markingSchema);

  const teamMarkingSchema = team?.markingSchema || markingSchema;

  const getColumns = () => {
    if (teamMarkingSchema?.reviews) {
      console.log('📋 [ReviewTable] Using team-specific schema for columns');
      
      const filteredReviews = teamMarkingSchema.reviews.filter(review => {
        if (panelMode) {
          return review.facultyType === 'panel';
        } else {
          return review.facultyType === 'guide';
        }
      });
      
      console.log(`📋 [ReviewTable] ${panelMode ? 'Panel' : 'Guide'} filtered reviews:`, filteredReviews);
      
      return filteredReviews.map(review => ({
        key: review.reviewName,
        label: review.displayName || review.reviewName,
        components: review.components || [],
        requiresPPT: review.requiresPPT || false
      }));
    }

    console.log('❌ [ReviewTable] No schema found, returning empty columns');
    return [];
  };

  const checkDeadlinePassed = isDeadlinePassed || ((reviewType) => {
    if (!deadlines || !deadlines[reviewType]) {
      return false;
    }
    
    const now = new Date();
    const deadline = deadlines[reviewType];
    
    try {
      if (deadline.from && deadline.to) {
        const toDate = new Date(deadline.to);
        return now > toDate;
      } else if (typeof deadline === 'string' || deadline instanceof Date) {
        const deadlineDate = new Date(deadline);
        return now > deadlineDate;
      }
    } catch (dateError) {
      console.error(`❌ [ReviewTable] Error parsing deadline for ${reviewType}:`, dateError);
      return false;
    }
    
    return false;
  });

  const checkReviewLocked = isReviewLocked || ((student, reviewType) => {
    let studentReview = null;
    
    // ✅ FIXED: Handle both Map and plain object
    if (student.reviews && typeof student.reviews.get === 'function') {
      studentReview = student.reviews.get(reviewType);
    } else if (student.reviews && student.reviews[reviewType]) {
      studentReview = student.reviews[reviewType];
    }
    
    if (studentReview?.locked) {
      return true;
    }
    
    if (checkDeadlinePassed(reviewType)) {
      const requestKey = `${student.regNo}_${reviewType}`;
      const requestStatus = requestStatuses[requestKey];
      const isLocked = requestStatus?.status !== 'approved';
      return isLocked;
    }
    
    return false;
  });

  const columns = getColumns();
  console.log('📋 [ReviewTable] Final columns for table:', columns.map(c => ({ key: c.key, label: c.label, components: c.components.length })));

  if (columns.length === 0) {
    return (
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-yellow-800">No review columns found in marking schema.</p>
      </div>
    );
  }

  const forceRenderKey = React.useMemo(() => {
    return `${team.id}_${Date.now()}`;
  }, [team.id, team.students, columns]);

  return (
    <div className="overflow-x-auto mt-4" key={forceRenderKey}>
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border font-semibold text-left sticky left-0 bg-gray-100 z-10 min-w-[150px]">
              Student Name
            </th>
            {columns.map(col => (
              <th key={col.key} className="px-4 py-2 border text-center min-w-[120px]">
                <div className="flex flex-col items-center space-y-1">
                  <span className="font-semibold break-words">{col.label}</span>
                  <div className="text-xs text-gray-600 leading-tight">
                    {col.components.length > 0 ? (
                      <div className="space-y-1">
                        <div className="font-medium">Components:</div>
                        <div className="break-words">
                          {col.components.map((comp, idx) => (
                            <div key={idx} className="truncate" title={comp.name}>
                              {comp.name} ({comp.weight || 10})
                            </div>
                          ))}
                        </div>
                        <div className="text-blue-600">+ Attendance</div>
                      </div>
                    ) : (
                      'Marks | Attendance'
                    )}
                  </div>
                  {col.requiresPPT && (
                    <div className="text-xs text-yellow-600 bg-yellow-100 px-1 rounded">PPT Required</div>
                  )}
                </div>
                {team.students.some(student => checkReviewLocked(student, col.key)) && (
                  <div className="mt-1">
                    <span className="px-2 py-0.5 text-xs bg-red-200 text-red-700 rounded">
                      🔒 Locked
                    </span>
                  </div>
                )}
              </th>
            ))}
            <th className="px-4 py-2 border text-center min-w-[120px]">Comments</th>
          </tr>
        </thead>
        <tbody>
          {team.students.map((student, studentIndex) => (
            <tr key={`${student._id}_${forceRenderKey}`} className={studentIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-4 py-2 border font-semibold sticky left-0 bg-white z-10 min-w-[150px]">
                <div className="break-words">
                  <div>{student.name}</div>
                  <div className="text-sm text-gray-600">{student.regNo}</div>
                </div>
              </td>
              
              {columns.map(col => {
                // ✅ FIXED: Get review data with proper Map handling
                let reviewData = null;
                
                if (student.reviews && typeof student.reviews.get === 'function') {
                  reviewData = student.reviews.get(col.key);
                } else if (student.reviews && student.reviews[col.key]) {
                  reviewData = student.reviews[col.key];
                }
                
                const isLocked = checkReviewLocked(student, col.key);
                
                return (
                  <td key={`${student._id}_${col.key}`} className="px-4 py-2 border text-center align-top">
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Marks:</div>
                        <div className="font-semibold">
                          {renderMarks(reviewData, col.components)}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Attendance:</div>
                        <div>
                          {renderAttendance(reviewData?.attendance)}
                        </div>
                      </div>
                      
                      {isLocked && (
                        <div className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                          🔒 Locked
                        </div>
                      )}
                    </div>
                  </td>
                );
              })}
              
              <td className="px-4 py-2 border align-top max-w-md">
                <div className="space-y-2">
                  {columns.map(col => {
                    let reviewData = null;
                    
                    if (student.reviews && typeof student.reviews.get === 'function') {
                      reviewData = student.reviews.get(col.key);
                    } else if (student.reviews && student.reviews[col.key]) {
                      reviewData = student.reviews[col.key];
                    }
                    
                    const comments = reviewData?.comments;
                    
                    if (comments && comments.trim()) {
                      return (
                        <div key={`${student._id}_${col.key}_comment`} className="mb-3">
                          <div className="text-sm font-medium text-gray-700 mb-1">
                            {col.label}:
                          </div>
                          {renderComments(comments)}
                        </div>
                      );
                    }
                    return null;
                  })}
                  
                  {!columns.some(col => {
                    let reviewData = null;
                    if (student.reviews && typeof student.reviews.get === 'function') {
                      reviewData = student.reviews.get(col.key);
                    } else if (student.reviews && student.reviews[col.key]) {
                      reviewData = student.reviews[col.key];
                    }
                    return reviewData?.comments && reviewData.comments.trim();
                  }) && (
                    <span className="text-gray-400 text-sm">No comments</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-lg mb-3">Team Summary</h3>
        
        <div className="mb-3">
          <span className="font-medium">Overall PPT Approved: </span>
          <span className={team.students.every(s => s.pptApproved?.approved) ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
            {team.students.every(s => s.pptApproved?.approved) ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div className="mb-3">
          <div className="font-medium mb-2">Individual PPT Status:</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {team.students.map((student) => (
              <div key={student.regNo} className="text-sm">
                <span>{student.name}: </span>
                <span className={student.pptApproved?.approved ? 'text-green-600' : 'text-red-600'}>
                  {student.pptApproved?.approved ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {Object.keys(deadlines).length > 0 && (
          <div>
            <div className="font-medium mb-2">Review Deadlines:</div>
            <div className="text-sm text-gray-600 space-y-1">
              {columns.map((col) => {
                const deadline = deadlines[col.key];
                if (!deadline) return null;
                
                const isPassed = checkDeadlinePassed(col.key);
                let deadlineText = '';
                
                if (deadline.from && deadline.to) {
                  const fromDate = new Date(deadline.from);
                  const toDate = new Date(deadline.to);
                  deadlineText = `${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}`;
                } else if (typeof deadline === 'string') {
                  deadlineText = new Date(deadline).toLocaleDateString();
                }
                
                return (
                  <div key={col.key}>
                    <span className="font-medium">{col.label}:</span> 
                    <span className={isPassed ? 'text-red-600 font-medium' : 'text-green-600'}>
                      {deadlineText} {isPassed ? '(Passed)' : '(Active)'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewTable;
