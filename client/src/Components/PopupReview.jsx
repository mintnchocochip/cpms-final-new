import React, { useState, useEffect } from 'react'; 
import { X } from 'lucide-react';
import { getFacultyMarkingSchema } from '../api';

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
}) => {
  // State management
  const [marks, setMarks] = useState({});
  const [comments, setComments] = useState({});
  const [attendance, setAttendance] = useState({});
  const [teamPptApproved, setTeamPptApproved] = useState(false);
  const [componentLabels, setComponentLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasAttendance, setHasAttendance] = useState(true);

  // ✅ Load marking schema and initialize
  useEffect(() => {
    const loadMarkingSchema = async () => {
      if (!isOpen) return;
      
      try {
        setLoading(true);
        console.log('=== LOADING MARKING SCHEMA FOR RETRIEVAL ===');
        console.log('Review type:', reviewType);
        console.log('Requires PPT:', requiresPPT);
        
        let schemaData = markingSchema;
        
        if (!schemaData) {
          const response = await getFacultyMarkingSchema();
          schemaData = response.data?.success ? response.data.data : null;
        }
        
        if (schemaData && schemaData.reviews) {
          const reviewConfig = schemaData.reviews.find(review => 
            review.reviewName === reviewType
          );

          if (reviewConfig) {
            setHasAttendance(true); // All reviews have attendance
            
            if (reviewConfig.components && reviewConfig.components.length > 0) {
              const dynamicLabels = reviewConfig.components.map((comp, index) => ({
                key: `component${index + 1}`,
                label: comp.name,
                name: comp.name,
                points: comp.weight || 10
              }));
              
              console.log('✅ Components for retrieval:', dynamicLabels);
              setComponentLabels(dynamicLabels);
            } else {
              setComponentLabels([
                { key: 'component1', label: 'Component 1', name: 'Component 1', points: 10 }
              ]);
            }
          } else {
            setComponentLabels([
              { key: 'component1', label: 'Component 1', name: 'Component 1', points: 10 }
            ]);
          }
        }
        
        setError('');
      } catch (err) {
        console.error('❌ Error loading schema:', err);
        setComponentLabels([
          { key: 'component1', label: 'Component 1', name: 'Component 1', points: 10 }
        ]);
        setHasAttendance(true);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadMarkingSchema();
    }
  }, [isOpen, reviewType, markingSchema, requiresPPT]);

  // ✅ FIXED: Proper data retrieval from MongoDB Map structure
  useEffect(() => {
    if (isOpen && teamMembers && !loading && componentLabels.length > 0) {
      console.log('=== POPUP INITIALIZATION WITH MAP RETRIEVAL ===');
      console.log('Team members data:', teamMembers);
      
      const initialMarks = {};
      const initialComments = {};
      const initialAttendance = {};
      
      teamMembers.forEach(member => {
        console.log(`🔍 Processing ${member.name} for retrieval:`, member);
        
        // ✅ FIXED: Handle both Map and Object access patterns
        let reviewData = null;
        
        // Try Map access first (student.reviews.get(reviewType))
        if (member.reviews && typeof member.reviews.get === 'function') {
          reviewData = member.reviews.get(reviewType);
          console.log(`Map access for ${member.name} ${reviewType}:`, reviewData);
        } 
        // Try object access (student.reviews[reviewType])
        else if (member.reviews && member.reviews[reviewType]) {
          reviewData = member.reviews[reviewType];
          console.log(`Object access for ${member.name} ${reviewType}:`, reviewData);
        }
        // Fallback to direct property access (student[reviewType])
        else if (member[reviewType]) {
          reviewData = member[reviewType];
          console.log(`Direct access for ${member.name} ${reviewType}:`, reviewData);
        }
        
        console.log(`Final review data for ${member.name}:`, reviewData);
        
        // Initialize marks for each component
        const componentMarks = {};
        componentLabels.forEach(comp => {
          let markValue = '';
          
          // ✅ FIXED: Handle marks from MongoDB Map structure
          if (reviewData?.marks) {
            // Try to get mark by component name from schema
            markValue = reviewData.marks[comp.name];
            if (markValue === undefined) {
              // Fallback to component key
              markValue = reviewData.marks[comp.key];
            }
            if (markValue === undefined) {
              markValue = '';
            }
            console.log(`Retrieved mark for ${comp.name}: ${markValue}`);
          }
          
          componentMarks[comp.key] = markValue || '';
        });
        
        initialMarks[member._id] = componentMarks;
        console.log(`Marks initialized for ${member.name}:`, componentMarks);
        
        // Initialize comments
        const commentValue = reviewData?.comments || '';
        initialComments[member._id] = commentValue;
        console.log(`Comments for ${member.name}: "${commentValue}"`);
        
        // ✅ FIXED: Initialize attendance from proper structure
        if (hasAttendance) {
          let attendanceValue = false;
          if (reviewData?.attendance) {
            attendanceValue = reviewData.attendance.value ?? false;
          }
          initialAttendance[member._id] = attendanceValue;
          console.log(`Attendance for ${member.name}: ${attendanceValue}`);
        }
      });
      
      console.log('=== FINAL INITIALIZATION RESULTS ===');
      console.log('Marks:', initialMarks);
      console.log('Comments:', initialComments);
      console.log('Attendance:', initialAttendance);
      
      setMarks(initialMarks);
      setComments(initialComments);
      
      if (hasAttendance) {
        setAttendance(initialAttendance);
      }
      
      if (requiresPPT) {
        const teamPptStatus = teamMembers.length > 0 && 
          teamMembers.every(member => member.pptApproved?.approved === true);
        setTeamPptApproved(teamPptStatus);
        console.log(`Team PPT status: ${teamPptStatus}`);
      }
    }
  }, [isOpen, teamMembers, reviewType, loading, componentLabels, hasAttendance, requiresPPT]);

  const handleMarksChange = (memberId, value, component = null) => {
    if (locked) return;
    
    if (hasAttendance && attendance[memberId] === false) {
      console.log('❌ Blocked marks change - student is absent');
      return;
    }
    
    const componentInfo = componentLabels.find(comp => comp.key === component);
    const maxPoints = componentInfo?.points || 10;
    
    const numValue = Number(value);
    if (numValue > maxPoints) {
      alert(`Enter value less than ${maxPoints}, resetting to 0`);
      setMarks(prev => ({
        ...prev,
        [memberId]: {
          ...prev[memberId],
          [component]: 0
        }
      }));
    } else {
      console.log(`✅ Setting marks for ${component} = ${numValue}`);
      setMarks(prev => ({
        ...prev,
        [memberId]: {
          ...prev[memberId],
          [component]: numValue
        }
      }));
    }
  };

  const handleAttendanceChange = (memberId, isPresent) => {
    if (locked) return;
    
    console.log(`✅ Setting attendance for ${memberId} = ${isPresent}`);
    setAttendance(prev => ({ ...prev, [memberId]: isPresent }));
    
    if (!isPresent) {
      const zeroedMarks = {};
      componentLabels.forEach(comp => {
        zeroedMarks[comp.key] = 0;
      });
      
      setMarks(prev => ({
        ...prev,
        [memberId]: zeroedMarks
      }));
      setComments(prev => ({ ...prev, [memberId]: '' }));
    }
  };

  // ✅ Submit function (unchanged - working correctly)
  const handleSubmit = () => {
    if (locked) return;
    
    console.log('=== SUBMIT FOR BACKEND PROCESSING ===');
    console.log('Review type:', reviewType);
    console.log('Component labels:', componentLabels);
    
    const submission = {};
    
    teamMembers.forEach(member => {
      const memberMarks = marks[member._id] || {};
      console.log(`Processing ${member.name} for backend submission:`, memberMarks);
      
      const submissionData = {
        comments: comments[member._id] || ''
      };
      
      // Map component data to backend format using schema component names
      componentLabels.forEach(comp => {
        submissionData[comp.name] = memberMarks[comp.key] || 0;
        console.log(`Backend mapping: ${comp.name} = ${submissionData[comp.name]}`);
      });
      
      // Add attendance
      if (hasAttendance) {
        submissionData.attendance = { 
          value: attendance[member._id] || false,
          locked: false 
        };
      }
      
      submission[member.regNo] = submissionData;
    });
    
    console.log('✅ Complete submission data for backend:', submission);
    
    // Submit with PPT object if required
    if (requiresPPT) {
      const teamPptObj = {
        pptApproved: {
          approved: teamPptApproved,
          locked: false
        }
      };
      console.log('✅ Submitting with PPT object:', teamPptObj);
      onSubmit(submission, teamPptObj);
    } else {
      console.log('✅ Submitting without PPT object');
      onSubmit(submission);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span>Loading review configuration...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
          <h3 className="text-lg font-semibold text-red-600 mb-4">Error Loading Configuration</h3>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            <X size={24} />
          </button>
        </div>

        {locked && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 flex justify-between items-center">
            <span>This review is locked. Deadline has passed and no edit permission granted.</span>
            {requestEditVisible && !requestPending && (
              <button
                onClick={onRequestEdit}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm ml-4"
              >
                Request Edit
              </button>
            )}
            {requestPending && (
              <button
                disabled
                className="px-3 py-1 bg-yellow-400 text-white rounded cursor-not-allowed text-sm ml-4"
              >
                Request Pending
              </button>
            )}
          </div>
        )}

        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {/* PPT Approval Section */}
          {requiresPPT && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border">
              <h3 className="text-lg font-semibold mb-3">Team PPT Approval</h3>
              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="teamPpt"
                    checked={teamPptApproved === true}
                    onChange={() => {
                      if (!locked) {
                        setTeamPptApproved(true);
                      }
                    }}
                    disabled={locked}
                    className="mr-2"
                  />
                  <span className="text-green-600 font-semibold">Approved</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="teamPpt"
                    checked={teamPptApproved === false}
                    onChange={() => {
                      if (!locked) {
                        setTeamPptApproved(false);
                      }
                    }}
                    disabled={locked}
                    className="mr-2"
                  />
                  <span className="text-red-600 font-semibold">Not Approved</span>
                </label>
              </div>
            </div>
          )}

          {/* Student Marking Section */}
          {teamMembers.map((member) => {
            const isAbsent = hasAttendance && attendance[member._id] === false;
            
            return (
              <div key={member._id} className="py-4 border-b last:border-b-0">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="font-medium text-gray-700">{member.name}</span>
                    <span className="text-sm text-gray-500 ml-2">({member.regNo})</span>
                    {isAbsent && (
                      <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                        ABSENT - Fields Disabled
                      </span>
                    )}
                  </div>
                  
                  {/* ✅ Dynamic Component Inputs with proper value display */}
                  <div className="flex gap-2">
                    {componentLabels.map(comp => (
                      <div key={comp.key} className="flex items-center gap-1">
                        <label className="text-xs font-medium">{comp.label}:</label>
                        <input
                          type="number"
                          min="0"
                          max={comp.points}
                          className={`w-16 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isAbsent || locked ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                          value={marks[member._id]?.[comp.key] || ''}
                          onChange={(e) => {
                            console.log(`Input onChange: value=${e.target.value}, component=${comp.key}`);
                            handleMarksChange(member._id, e.target.value, comp.key);
                          }}
                          placeholder={`0-${comp.points}`}
                          disabled={locked || isAbsent}
                        />
                        <span className="text-xs text-gray-500">/{comp.points}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`grid gap-4 ${hasAttendance ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">Comments</label>
                    <textarea
                      className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isAbsent || locked ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                      placeholder="Enter Comments"
                      rows="2"
                      value={comments[member._id] || ''}
                      onChange={(e) => {
                        if (!locked && !isAbsent) {
                          setComments(prev => ({ ...prev, [member._id]: e.target.value }));
                        }
                      }}
                      disabled={locked || isAbsent}
                    />
                  </div>

                  {hasAttendance && (
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">Attendance</label>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`attendance_${member._id}`}
                            checked={attendance[member._id] === true}
                            onChange={() => handleAttendanceChange(member._id, true)}
                            disabled={locked}
                            className="mr-2"
                          />
                          Present
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`attendance_${member._id}`}
                            checked={attendance[member._id] === false}
                            onChange={() => handleAttendanceChange(member._id, false)}
                            disabled={locked}
                            className="mr-2"
                          />
                          Absent
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => {
                console.log('🚀 SUBMIT BUTTON CLICKED');
                handleSubmit();
              }}
              disabled={locked || loading}
              className={`px-6 py-2 rounded transition-colors ${
                locked || loading
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
            >
              {loading ? 'Loading...' : 'Submit Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopupReview;
