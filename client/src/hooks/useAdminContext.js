import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAdminContext = () => {
  const navigate = useNavigate();
  const [context, setContextState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const SESSION_STORAGE_KEY = 'adminContext';

  const schoolsData = {
    'SCOPE': {
      fullName: 'School of Computer Science and Engineering',
      code: 'SCOPE'
    },
    'SELECT': {
      fullName: 'School of Electrical Engineering',
      code: 'SELECT'
    },
    'SENSE': {
      fullName: 'School of Electronics Engineering',
      code: 'SENSE'
    },
    'SSL': {
      fullName: 'School of Business',
      code: 'SSL'
    },
    'SAS': {
      fullName: 'School of Advanced Sciences',
      code: 'SAS'
    },
    'SMEC': {
      fullName: 'School of Mechanical Engineering',
      code: 'SMEC'
    },
    'SCE': {
      fullName: 'School of Civil Engineering',
      code: 'SCE'
    }
  };

  const departmentsBySchool = {
    'SCOPE': [
      'B.Tech. Computer Science and Engineering',
      'B.Tech. Computer Science and Engineering (Artificial Intelligence and Machine Learning)',
      'B.Tech. Computer Science and Engineering (Cyber Physical Systems)',
      'B.Tech. Computer Science and Engineering (Artificial Intelligence and Robotics)',
      'B.Tech. Computer Science and Engineering (Data Science)',
      'B.Tech. Computer Science and Engineering (Cyber Security)',
      'B.Sc. Computer Science',
    ],
    'SELECT': [
      'B.Tech. Electrical and Electronics Engineering',
      'B.Tech. Electrical and Computer Science Engineering',
    ],
    'SENSE': [
      'B. Tech in Electronics and Communication Engineering',
      'B. Tech in Electronics and Computer Engineering',
      'B. Tech in Electronics Engineering (VLSI Design and Technology)',
    ],
    'SSL': [
      'BBA',
      'MBA',
      'MBA with Business Analytics',
      'MBA with Digital Marketing',
      'BBA with Digital Marketing',
      'BBA with International Business'
    ],
    'SAS': [
      'BSc Mathematics',
      'BSc Physics',
      'BSc Chemistry',
      'BSc Statistics',
      'MSc Mathematics',
      'MSc Physics',
      'MSc Applied Mathematics'
    ],
    'SMEC': [
      'B.Tech. Mechanical Engineering',
      'B.Tech. Mechatronics and Automation',
      'B.Tech. Mechanical Engineering (Electric Vehicles)',
    ],
    'SCE': [
      'B.Tech Civil Engineering',
      'B.Tech Civil Engineering(In Collaboration with L & T)',
    ]
  };

  const validateContext = useCallback((contextData) => {
    if (!contextData || typeof contextData !== 'object') {
      return false;
    }

    const { school, department } = contextData;
    
    if (!school || typeof school !== 'string' || school.trim().length === 0) {
      return false;
    }
    
    if (!department || typeof department !== 'string' || department.trim().length === 0) {
      return false;
    }

    const validSchools = Object.keys(schoolsData);
    
    if (!validSchools.includes(school)) {
      console.log(`Invalid school: ${school}. Valid schools:`, validSchools);
      return false;
    }

    const validDepartments = departmentsBySchool[school] || [];
    if (!validDepartments.includes(department)) {
      console.log(`Invalid department: ${department} for school: ${school}. Valid departments:`, validDepartments);
      return false;
    }

    return true;
  }, []);

  const getContext = useCallback(() => {
    try {
      const sessionData = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        if (validateContext(parsed)) {
          return parsed;
        } else {
          console.log('Invalid context in sessionStorage:', parsed);
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting admin context:', error);
      setError('Failed to retrieve admin context');
      return null;
    }
  }, [validateContext]);

  const setContext = useCallback((newContext) => {
    try {
      if (!validateContext(newContext)) {
        console.log('Failed to validate context:', newContext);
        setError('Invalid context data provided');
        return false;
      }

      const contextString = JSON.stringify(newContext);
      sessionStorage.setItem(SESSION_STORAGE_KEY, contextString);
      
      setContextState(newContext);
      setError(null);
      
      console.log('Admin context updated:', newContext);
      return true;
    } catch (error) {
      console.error('Error setting admin context:', error);
      setError('Failed to save admin context');
      return false;
    }
  }, [validateContext]);

  // REMOVED ALL CLEARING FUNCTIONS AS REQUESTED
  const clearContext = useCallback(() => {
    console.log('Clear context called - but clearing disabled as requested');
    // All clearing logic removed as per user request
  }, []);

  const redirectToSelection = useCallback(() => {
    navigate('/admin/school-selection');
  }, [navigate]);

  const isValidAdmin = useCallback(() => {
    const token = sessionStorage.getItem('token');
    const role = sessionStorage.getItem('role');
    return !!(token && role === 'admin');
  }, []);

  // Initialize context on hook mount
  useEffect(() => {
    const initializeContext = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!isValidAdmin()) {
          navigate('/admin/login');
          return;
        }

        const existingContext = getContext();
        
        if (existingContext) {
          console.log('Found existing valid context:', existingContext);
          setContextState(existingContext);
        } else {
          console.log('No valid context found, redirecting to selection');
          redirectToSelection();
        }
      } catch (error) {
        console.error('Error initializing admin context:', error);
        setError('Failed to initialize admin context');
        redirectToSelection();
      } finally {
        setLoading(false);
      }
    };

    initializeContext();
  }, [getContext, isValidAdmin, navigate, redirectToSelection]);

  const refreshContext = useCallback(() => {
    const currentContext = getContext();
    setContextState(currentContext);
  }, [getContext]);

  const updateContext = useCallback((newContext, redirectPath = null) => {
    const success = setContext(newContext);
    if (success && redirectPath) {
      navigate(redirectPath);
    }
    return success;
  }, [setContext, navigate]);

  const getDisplayString = useCallback(() => {
    if (!context) return 'No context selected';
    
    const schoolName = schoolsData[context.school]?.fullName || context.school;
    return `${schoolName} - ${context.department}`;
  }, [context]);

  const getSchoolFullName = useCallback(() => {
    if (!context?.school) return '';
    return schoolsData[context.school]?.fullName || context.school;
  }, [context]);

  const getAvailableDepartments = useCallback(() => {
    if (!context?.school) return [];
    return departmentsBySchool[context.school] || [];
  }, [context]);

  return {
    // State
    context,
    loading,
    error,
    
    // Methods
    getContext,
    setContext,
    clearContext, // Now does nothing but kept for compatibility
    refreshContext,
    updateContext,
    redirectToSelection,
    
    // Utilities
    validateContext,
    isValidAdmin,
    getDisplayString,
    getSchoolFullName,
    getAvailableDepartments,
    
    // Computed values
    isContextValid: !!context,
    hasContext: !!context,
    school: context?.school || null,
    department: context?.department || null,
    schoolFullName: context?.school ? (schoolsData[context.school]?.fullName || context.school) : null,
    
    // Data references
    schoolsData,
    departmentsBySchool
  };
};

export default useAdminContext;
