import React from 'react';

const renderMarks = (reviewObj, components = []) => {
  if (!reviewObj) return <span className="text-gray-400">None</span>;
  
  // ✅ FIXED: Handle MongoDB Map structure for marks
  const marks = reviewObj.marks || reviewObj;
  
  if (!components || components.length === 0) {
    // Fallback: try to get any numeric values from marks object
    if (typeof marks === 'object' && marks !== null) {
      const values = Object.values(marks).filter(val => 
        typeof val === 'number' || (typeof val === 'string' && !isNaN(val) && val !== '')
      );
      return values.length > 0 ? values.join(' / ') : <span className="text-gray-400">None</span>;
    }
    return <span className="text-gray-400">None</span>;
  }

  // ✅ Use dynamic components from schema
  const values = components.map(comp => {
    let value = null;
    
    // Try to get value by component name from schema
    if (marks && typeof marks === 'object') {
      value = marks[comp.name];
      
      // Fallback to component key if name doesn't work
      if (value == null) {
        value = marks[`component${components.indexOf(comp) + 1}`];
      }
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

const renderPPTApproval = (pptObj) => {
  if (!pptObj || pptObj.approved == null) return <span className="text-gray-400">None</span>;
  return pptObj.approved
    ? <span className="text-green-600 font-semibold">Yes</span>
    : <span className="text-red-600 font-semibold">No</span>;
};

const renderComments = (comments) => {
  if (!comments || comments.trim() === '') return <span className="text-gray-400">None</span>;
  return (
    <div className="max-w-xs">
      <span className="text-sm text-gray-700 break-words">{comments}</span>
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
  console.log('=== REVIEW TABLE RENDER ===');
  console.log('Team:', team?.title);
  console.log('Marking Schema:', markingSchema);
  console.log('Panel Mode:', panelMode);
  console.log('Deadlines:', deadlines);

  // ✅ FIXED: Force re-render with proper Map structure handling
  const forceRenderKey = React.useMemo(() => {
    const studentPptStatuses = team.students.map(s => s.pptApproved?.approved).join(',');
    const studentAttendance = team.students.map(s => {
      // Handle MongoDB Map structure for attendance
      const reviewKeys = ['draftReview', 'review0', 'review1', 'review2', 'review3', 'review4'];
      return reviewKeys.map(reviewKey => {
        let reviewData = null;
        
        // Try Map access first
        if (s.reviews && typeof s.reviews.get === 'function') {
          reviewData = s.reviews.get(reviewKey);
        } 
        // Try object access
        else if (s.reviews && s.reviews[reviewKey]) {
          reviewData = s.reviews[reviewKey];
        }
        // Fallback to direct access
        else if (s[reviewKey]) {
          reviewData = s[reviewKey];
        }
        
        return reviewData?.attendance?.value || false;
      }).join('_');
    }).join(',');
    return `${team.id}_${studentPptStatuses}_${studentAttendance}_${Date.now()}`;
  }, [team.id, team.students]);

  // ✅ FIXED: Improved deadline checking with proper logging
  const checkDeadlinePassed = isDeadlinePassed || ((reviewType) => {
    console.log(`Checking deadline for ${reviewType}...`);
    
    if (!deadlines || !deadlines[reviewType]) {
      console.log(`No deadline found for ${reviewType}`);
      return false;
    }
    
    const now = new Date();
    const deadline = deadlines[reviewType];
    console.log(`Deadline for ${reviewType}:`, deadline);
    
    if (deadline.from && deadline.to) {
      const fromDate = new Date(deadline.from);
      const toDate = new Date(deadline.to);
      const isPassed = now < fromDate || now > toDate;
      
      console.log(`${reviewType} deadline check:`, {
        now: now.toISOString(),
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        isPassed
      });
      
      return isPassed;
    } else if (typeof deadline === 'string') {
      const deadlineDate = new Date(deadline);
      const isPassed = now > deadlineDate;
      console.log(`${reviewType} string deadline check:`, {
        now: now.toISOString(),
        deadline: deadlineDate.toISOString(),
        isPassed
      });
      return isPassed;
    }
    
    console.log(`Invalid deadline format for ${reviewType}`);
    return false;
  });

  // ✅ FIXED: Improved review lock checking with MongoDB Map support
  const checkReviewLocked = isReviewLocked || ((student, reviewType) => {
    console.log(`Checking if ${student.name} ${reviewType} is locked...`);
    
    // ✅ Handle MongoDB Map structure for review access
    let studentReview = null;
    
    if (student.reviews && typeof student.reviews.get === 'function') {
      studentReview = student.reviews.get(reviewType);
      console.log(`Map access for ${student.name} ${reviewType}:`, studentReview);
    } else if (student.reviews && student.reviews[reviewType]) {
      studentReview = student.reviews[reviewType];
      console.log(`Object access for ${student.name} ${reviewType}:`, studentReview);
    } else if (student[reviewType]) {
      studentReview = student[reviewType];
      console.log(`Direct access for ${student.name} ${reviewType}:`, studentReview);
    }
    
    // Check manual lock first
    if (studentReview?.locked) {
      console.log(`${student.name} ${reviewType} is manually locked`);
      return true;
    }
    
    // Check deadline-based lock
    if (checkDeadlinePassed(reviewType)) {
      const requestKey = `${student.regNo}_${reviewType}`;
      const requestStatus = requestStatuses[requestKey];
      const isLocked = requestStatus?.status !== 'approved';
      
      console.log(`${student.name} ${reviewType} deadline passed, request status:`, requestStatus?.status, 'locked:', isLocked);
      return isLocked;
    }
    
    console.log(`${student.name} ${reviewType} is not locked`);
    return false;
  });

  // Check if all students have PPT approved (for team-level status)
  const isTeamPptApproved = team.students.length > 0 && 
    team.students.every(student => student.pptApproved?.approved === true);

  // ✅ FIXED: Dynamic columns based on schema with proper filtering for guide/panel
  const getColumns = () => {
    if (markingSchema && markingSchema.reviews) {
      console.log('Using dynamic schema for columns');
      
      // ✅ Filter reviews based on mode
      let filteredReviews = markingSchema.reviews;
      
      if (panelMode) {
        // Panel mode: show only review2, review3, review4
        filteredReviews = markingSchema.reviews.filter(review => 
          ['review2', 'review3', 'review4'].includes(review.reviewName)
        );
      } else {
        // Guide mode: show only draftReview, review0, review1
        filteredReviews = markingSchema.reviews.filter(review => 
          ['draftReview', 'review0', 'review1'].includes(review.reviewName)
        );
      }
      
      console.log(`${panelMode ? 'Panel' : 'Guide'} filtered reviews:`, filteredReviews.map(r => r.reviewName));
      
      return filteredReviews.map(review => ({
        key: review.reviewName,
        label: getReviewDisplayName(review.reviewName),
        components: review.components || [],
        requiresPPT: review.requiresPPT || false
      }));
    }

    console.log('Using fallback static columns');
    
    // Fallback to static columns
    if (panelMode) {
      return [
        { key: 'review2', label: 'Panel Review 1', components: [], requiresPPT: false },
        { key: 'review3', label: 'Panel Review 2', components: [], requiresPPT: false },
        { key: 'review4', label: 'Final Review', components: [], requiresPPT: false },
      ];
    } else {
      return [
        { key: 'draftReview', label: 'Draft Review', components: [], requiresPPT: false },
        { key: 'review0', label: 'Review 0', components: [], requiresPPT: false },
        { key: 'review1', label: 'Review 1', components: [], requiresPPT: false },
      ];
    }
  };

  const getReviewDisplayName = (reviewName) => {
    const nameMap = {
      'draftReview': 'Draft Review',
      'review0': 'Review 0',
      'review1': 'Review 1',
      'review2': 'Panel Review 1',
      'review3': 'Panel Review 2',
      'review4': 'Final Review'
    };
    return nameMap[reviewName] || reviewName;
  };

  const columns = getColumns();
  console.log('Final columns for table:', columns.map(c => ({ key: c.key, label: c.label, components: c.components.length })));

  return (
    <div className="overflow-x-auto mt-4" key={forceRenderKey}>
      <table className="min-w-full bg-white border">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 border">Name</th>
            <th className="px-4 py-2 border">Reg No</th>
            {columns.map(col => (
              <th key={col.key} className="px-4 py-2 border">
                <div className="flex flex-col items-center">
                  <span>{col.label}</span>
                  <div className="text-xs text-gray-500 mt-1">
                    {col.components.length > 0 
                      ? `${col.components.map(c => c.name).join(' | ')} | Attendance | Comments`
                      : 'Marks | Attendance | Comments'
                    }
                  </div>
                  {col.requiresPPT && (
                    <div className="text-xs text-blue-600 mt-1">PPT Required</div>
                  )}
                </div>
                {team.students.some(student => checkReviewLocked(student, col.key)) && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-200 text-yellow-700 rounded">
                    Locked
                  </span>
                )}
              </th>
            ))}
            <th className="px-4 py-2 border">PPT Approved</th>
          </tr>
        </thead>
        <tbody>
          {team.students.map(student => (
            <tr key={`${student.regNo}_${forceRenderKey}`}>
              <td className="px-4 py-2 border">{student.name}</td>
              <td className="px-4 py-2 border">{student.regNo}</td>
              
              {columns.map(col => {
                // ✅ FIXED: Handle MongoDB Map structure for getting review data
                let reviewData = null;
                
                if (student.reviews && typeof student.reviews.get === 'function') {
                  reviewData = student.reviews.get(col.key);
                } else if (student.reviews && student.reviews[col.key]) {
                  reviewData = student.reviews[col.key];
                } else if (student[col.key]) {
                  reviewData = student[col.key];
                }
                
                console.log(`Review data for ${student.name} ${col.key}:`, reviewData);
                
                return (
                  <td key={col.key} className="px-4 py-2 border">
                    <div className="flex flex-col space-y-2">
                      {/* ✅ Dynamic Marks based on schema components */}
                      <div className="text-center">
                        <span className="font-medium">
                          {renderMarks(reviewData, col.components)}
                        </span>
                      </div>
                      
                      {/* Attendance */}
                      <div className="text-center">
                        {renderAttendance(reviewData?.attendance)}
                      </div>
                      
                      {/* Comments */}
                      <div className="text-center">
                        {renderComments(reviewData?.comments)}
                      </div>
                      
                      {/* Lock Status Indicator */}
                      {checkReviewLocked(student, col.key) && (
                        <div className="text-center">
                          <span className="text-xs text-yellow-600 bg-yellow-100 px-1 rounded">
                            🔒 Locked
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                );
              })}
              
              {/* Individual PPT Approved - From student level */}
              <td className="px-4 py-2 border text-center">
                {renderPPTApproval(student.pptApproved)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Team-level PPT Approval Status */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-4">
          <span className="font-semibold">Team PPT Approved:</span>
          <span key={`team_ppt_${isTeamPptApproved}_${forceRenderKey}`}>
            {isTeamPptApproved
              ? <span className="text-green-600 font-semibold">Yes</span>
              : <span className="text-red-600 font-semibold">No</span>
            }
          </span>
        </div>
        
        {/* Individual PPT Status Summary */}
        <div className="text-sm text-gray-600">
          <span className="font-medium">Individual PPT Status: </span>
          {team.students.map((student, index) => (
            <span key={student.regNo}>
              {student.name}: {student.pptApproved?.approved ? 
                <span className="text-green-600">✓</span> : 
                <span className="text-red-600">✗</span>
              }
              {index < team.students.length - 1 && ', '}
            </span>
          ))}
        </div>



        {/* ✅ Deadline Information */}
        <div className="text-xs text-gray-600 mt-2">
          <span className="font-medium">Deadlines: </span>
          {columns.map((col, index) => {
            const deadline = deadlines[col.key];
            if (!deadline) return null;
            
            const isPassed = checkDeadlinePassed(col.key);
            const now = new Date();
            
            let deadlineText = '';
            if (deadline.from && deadline.to) {
              const fromDate = new Date(deadline.from);
              const toDate = new Date(deadline.to);
              deadlineText = `${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}`;
            } else if (typeof deadline === 'string') {
              deadlineText = new Date(deadline).toLocaleDateString();
            }
            
            return (
              <span key={col.key}>
                {col.label}: 
                <span className={isPassed ? 'text-red-600' : 'text-green-600'}>
                  {deadlineText} {isPassed ? '(Passed)' : '(Active)'}
                </span>
                {index < columns.filter(c => deadlines[c.key]).length - 1 && ' | '}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReviewTable;
