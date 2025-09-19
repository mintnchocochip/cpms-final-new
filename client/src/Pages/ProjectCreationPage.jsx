import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Database, Settings, Building2 } from "lucide-react";

import Navbar from "../Components/UniversalNavbar";
import { useAdminContext } from '../hooks/useAdminContext';
import ProjectHeader from '../Components/ProjectHeader';
import ProjectTabs from '../Components/ProjectTabs';
import SingleProjectForm from '../Components/SingleProjectForm';
import BulkProjectForm from '../Components/BulkProjectForm';
import NotificationProvider from '../Components/NotificationProvider';  // ✅ Fixed path
import LoadingScreen from '../Components/LoadingScreen';
import ContextSelection from '../Components/ContextSelection';

const ProjectCreationPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('single');

  // Handle useAdminContext safely
  let hookResult;
  try {
    hookResult = useAdminContext();
  } catch (error) {
    console.error('useAdminContext error:', error);
    hookResult = {
      school: '',
      department: '',
      specialization: [],
      type: [],
      getDisplayString: () => '',
      clearContext: () => {},
      loading: false,
      error: null
    };
  }

  const { school, department, specialization, type, loading: contextLoading, error: contextError } = hookResult;

  // Authentication check
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const role = sessionStorage.getItem('role');
    
    if (!token || role !== 'admin') {
      navigate('/admin/login');
      return;
    }
  }, [navigate]);

  // Get admin context
  const getAdminContext = () => {
    try {
      const context = sessionStorage.getItem('adminContext');
      return context ? JSON.parse(context) : null;
    } catch {
      return null;
    }
  };

  const [adminContext] = useState(getAdminContext());
  const schoolFromContext = adminContext?.school || school || '';
  const departmentFromContext = adminContext?.department || department || '';
  const specializationFromContext = adminContext?.specialization || specialization || [];
  const typeFromContext = adminContext?.type || type || [];
  const hasContext = Boolean(schoolFromContext && departmentFromContext);
  const isAllMode = Boolean(adminContext?.skipped);

  // Handle context selection
  const handleSelectContext = () => {
    try {
      sessionStorage.removeItem('adminContext');
      sessionStorage.setItem('adminReturnPath', window.location.pathname);
      navigate('/admin/school-selection');
    } catch (error) {
      console.error('Navigation error:', error);
      window.location.href = '/admin/school-selection';
    }
  };

  // Loading state
  if (contextLoading) {
    return <LoadingScreen type="context" />;
  }

  // Show context selection if needed
  if (!isAllMode && (!schoolFromContext || !departmentFromContext)) {
    return <ContextSelection onSelectContext={handleSelectContext} error={contextError} />;
  }

  return (
    <NotificationProvider>
      <Navbar />
      <div className="pt-16 sm:pt-20 pl-4 sm:pl-24 min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
        
        <ProjectHeader 
          isAllMode={isAllMode}
          schoolFromContext={schoolFromContext}
          departmentFromContext={departmentFromContext}
          specializationFromContext={specializationFromContext}
          onSelectContext={handleSelectContext}
        />

        <ProjectTabs 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="mx-4 sm:mx-8 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl shadow-lg">
            {activeTab === 'single' ? (
              <SingleProjectForm 
                isAllMode={isAllMode}
                schoolFromContext={schoolFromContext}
                departmentFromContext={departmentFromContext}
                specializationFromContext={specializationFromContext}
                typeFromContext={typeFromContext}
                hasContext={hasContext}
              />
            ) : (
              <BulkProjectForm 
                isAllMode={isAllMode}
                schoolFromContext={schoolFromContext}
                departmentFromContext={departmentFromContext}
                specializationFromContext={specializationFromContext}
                typeFromContext={typeFromContext}
                hasContext={hasContext}
              />
            )}
          </div>
        </div>
      </div>
    </NotificationProvider>
  );
};

export default ProjectCreationPage;
