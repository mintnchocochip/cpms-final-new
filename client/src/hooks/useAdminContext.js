import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAdminContext = () => {
  const navigate = useNavigate();
  const [context, setContextState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const SESSION_STORAGE_KEY = 'adminContext';

  // Simplified validation - only check structure, not content
  const validateContext = useCallback((contextData) => {
    if (!contextData || typeof contextData !== 'object') {
      return false;
    }

    // Allow super admin mode
    if (contextData.skipped === true) {
      return true;
    }

    // Simple structure check
    return Boolean(contextData.school && contextData.department);
  }, []);

  const getContext = useCallback(() => {
    try {
      const sessionData = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        if (validateContext(parsed)) {
          return parsed;
        } else {
          console.log('Invalid context structure in sessionStorage:', parsed);
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

  const clearContext = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      setContextState(null);
      setError(null);
      console.log('Admin context cleared successfully');
    } catch (error) {
      console.error('Error clearing admin context:', error);
      setError('Failed to clear admin context');
    }
  }, []);

  const redirectToSelection = useCallback(() => {
    navigate('/admin/school-selection');
  }, [navigate]);

  const isValidAdmin = useCallback(() => {
    const token = sessionStorage.getItem('token');
    const role = sessionStorage.getItem('role');
    return !!(token && role === 'admin');
  }, []);

  // Initialize context without automatic redirects
  useEffect(() => {
    const initializeContext = async () => {
      try {
        setLoading(true);
        setError(null);

        const existingContext = getContext();
        
        if (existingContext) {
          console.log('Found existing valid context:', existingContext);
          setContextState(existingContext);
        } else {
          console.log('No valid context found');
        }
      } catch (error) {
        console.error('Error initializing admin context:', error);
        setError('Failed to initialize admin context');
      } finally {
        setLoading(false);
      }
    };

    initializeContext();
  }, [getContext]);

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
    
    // Handle skipped context
    if (context.skipped) return 'All Schools (Super Admin)';
    
    return `${context.school} - ${context.department}`;
  }, [context]);

  return {
    // State
    context,
    loading,
    error,
    
    // Methods
    getContext,
    setContext,
    clearContext,
    refreshContext,
    updateContext,
    redirectToSelection,
    
    // Utilities
    validateContext,
    isValidAdmin,
    getDisplayString,
    
    // Computed values
    isContextValid: !!context,
    hasContext: !!context,
    school: context?.school || null,
    department: context?.department || null,
    specialization: context?.specialization || []
  };
};

export default useAdminContext;
