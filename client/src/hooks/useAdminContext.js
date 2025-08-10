import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Custom hook for managing admin context (school and department selection)
 * Provides methods to get, set, and clear admin context with validation and error handling
 */
export const useAdminContext = () => {
  const navigate = useNavigate();
  const [context, setContextState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const SESSION_STORAGE_KEY = 'adminContext';
  const LOCAL_STORAGE_KEY = 'adminContext_backup';

  /**
   * Validates admin context structure
   * @param {any} contextData - The context data to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  const validateContext = useCallback((contextData) => {
    if (!contextData || typeof contextData !== 'object') {
      return false;
    }

    const { school, department } = contextData;
    
    // Check if required fields exist and are non-empty strings
    if (!school || typeof school !== 'string' || school.trim().length === 0) {
      return false;
    }
    
    if (!department || typeof department !== 'string' || department.trim().length === 0) {
      return false;
    }

    // Validate against expected values
    const validSchools = ['School of Computing', 'School of Electrical'];
    const validDepartments = ['CSE', 'EEE'];

    if (!validSchools.includes(school)) {
      return false;
    }

    if (!validDepartments.includes(department)) {
      return false;
    }

    // Validate school-department combinations
    if (school === 'School of Computing' && department !== 'CSE') {
      return false;
    }

    if (school === 'School of Electrical' && department !== 'EEE') {
      return false;
    }

    return true;
  }, []);

  /**
   * Gets admin context from storage with fallback mechanism
   * @returns {object|null} - The admin context or null if not found/invalid
   */
  const getContext = useCallback(() => {
    try {
      // Try sessionStorage first
      const sessionData = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        if (validateContext(parsed)) {
          return parsed;
        }
      }

      // Fallback to localStorage
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (localData) {
        const parsed = JSON.parse(localData);
        if (validateContext(parsed)) {
          // Restore to sessionStorage
          sessionStorage.setItem(SESSION_STORAGE_KEY, localData);
          return parsed;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting admin context:', error);
      setError('Failed to retrieve admin context');
      return null;
    }
  }, [validateContext]);

  /**
   * Sets admin context in both session and local storage
   * @param {object} newContext - The new context to set
   * @returns {boolean} - True if successful, false otherwise
   */
  const setContext = useCallback((newContext) => {
    try {
      if (!validateContext(newContext)) {
        setError('Invalid context data provided');
        return false;
      }

      const contextString = JSON.stringify(newContext);
      
      // Set in both storages
      sessionStorage.setItem(SESSION_STORAGE_KEY, contextString);
      localStorage.setItem(LOCAL_STORAGE_KEY, contextString);
      
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

  /**
   * Clears admin context from all storages
   */
  const clearContext = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setContextState(null);
      setError(null);
      
      console.log('Admin context cleared');
    } catch (error) {
      console.error('Error clearing admin context:', error);
      setError('Failed to clear admin context');
    }
  }, []);

  /**
   * Redirects to school selection page
   */
  const redirectToSelection = useCallback(() => {
    navigate('/admin/school-selection');
  }, [navigate]);

  /**
   * Checks if user has valid admin role
   * @returns {boolean} - True if user is admin, false otherwise
   */
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

        // Check if user is valid admin
        if (!isValidAdmin()) {
          navigate('/admin/login');
          return;
        }

        // Try to get existing context
        const existingContext = getContext();
        
        if (existingContext) {
          setContextState(existingContext);
        } else {
          // No valid context found, redirect to selection
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

  /**
   * Refreshes context from storage
   */
  const refreshContext = useCallback(() => {
    const currentContext = getContext();
    setContextState(currentContext);
  }, [getContext]);

  /**
   * Updates context and optionally redirects
   * @param {object} newContext - The new context to set
   * @param {string} redirectPath - Optional path to redirect to after setting
   */
  const updateContext = useCallback((newContext, redirectPath = null) => {
    const success = setContext(newContext);
    if (success && redirectPath) {
      navigate(redirectPath);
    }
    return success;
  }, [setContext, navigate]);

  /**
   * Gets formatted context display string
   * @returns {string} - Formatted context string
   */
  const getDisplayString = useCallback(() => {
    if (!context) return 'No context selected';
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
  };
};

export default useAdminContext;
