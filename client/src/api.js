import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const API = axios.create({
  baseURL: `${API_BASE_URL}`,
});


// Add these to your existing api.js file

// Update student (keep existing but ensure it only sends basic fields)
export const updateStudent = async (regNo, studentData) => {
  // Filter to only send editable fields that match your schema
  const allowedData = {
    name: studentData.name,
    emailId: studentData.emailId,
    school: studentData.school,
    department: studentData.department
    // Note: reviews, pptApproved, deadline typically managed by backend
  };

  return API.put(`/student/${regNo}`, allowedData);
};

// Add this to your existing api.js file
export const getMarkingSchema = async (school, department) => {
  try {
    const params = new URLSearchParams({ school, department });
    const response = await fetch(`${API_BASE_URL}/student/marking-schema?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add your existing auth headers here if needed
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching marking schema:', error);
    throw error;
  }
};


// Delete student (using axios like other endpoints)
export const deleteStudent = async (regNo) => {
  return API.delete(`/student/${regNo}`);
};

// Get filtered students
export const getFilteredStudents = (params = new URLSearchParams()) => {
  const queryString = params.toString();
  return API.get(`student/students${queryString ? `?${queryString}` : ''}`);
};


// Helper function to build query parameters for school/department filtering
const buildAdminContextParams = (school = null, department = null) => {
  const params = new URLSearchParams();
  if (school) params.append('school', school);
  if (department) params.append('department', department);
  return params.toString();
};

// Add authorization token to all requests if available
API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const adminLogin = (data) => API.post("/auth/login", data);

// ✅ FIXED: Client-side getAllFaculty function
export const getAllFaculty = (
  school = null,
  department = null,
  specialization = null,
  sortBy = null,
  sortOrder = null
) => {
  // Build query string for optional parameters
  const params = new URLSearchParams();

  if (school && school !== 'all') params.append('school', school);
  if (department && department !== 'all') params.append('department', department);
  if (specialization && specialization !== 'all') params.append('specialization', specialization);
  if (sortBy) params.append('sortBy', sortBy);
  if (sortOrder) params.append('sortOrder', sortOrder);

  const queryString = params.toString();

  // Use query params for flexible route handling
  return API.get(`/admin/getAllFaculty${queryString ? `?${queryString}` : ''}`);
};

// Keep the old function for backward compatibility
export const getFacultyBySchoolAndDept = (school, department) => {
  return getAllFaculty(school, department);
};

// Get faculty projects (for detailed view)
export const getFacultyProjects = (employeeId) => {
  return API.get(`/faculty/${employeeId}/projects`);
};

// ✅ Faculty CRUD operations
export const deleteFacultyByEmployeeId = (employeeId) => {
  return API.delete(`/admin/faculty/${employeeId}`);
};

export const updateFaculty = (employeeId, facultyData) => {
  return API.put(`/admin/faculty/${employeeId}`, facultyData);
};

// Admin endpoints
export const getAllPanelProjects = (school = null, department = null) => {
  const queryString = buildAdminContextParams(school, department);
  return API.get(`/admin/getAllPanelProjects${queryString ? `?${queryString}` : ''}`);
};

export const getAllGuideProjects = (school = null, department = null) => {
  const queryString = buildAdminContextParams(school, department);
  return API.get(`/admin/getAllGuideProjects${queryString ? `?${queryString}` : ''}`);
};

export const getGuideTeams = () => API.get("/project/guide");
export const getPanelTeams = () => API.get("/project/panel");

export const getAllPanelsWithProjects = async (school = null, department = null) => {
  try {
    const params = new URLSearchParams();
    if (school) params.append('school', school);
    if (department) params.append('department', department);
    
    const response = await axios.get(`/api/admin/getAllPanelProjects?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching panels with projects:', error);
    throw error;
  }
};


export const getAllPanels = (school = null, department = null) => {
  const queryString = buildAdminContextParams(school, department);
  return API.get(`/admin/getAllPanels${queryString ? `?${queryString}` : ''}`);
};

export const createPanelManual = (data) => API.post("/admin/createPanel", data);
export const autoCreatePanelManual = (payload) => API.post("/admin/autoCreatePanels", payload);

export const deletePanel = (panelId) => API.delete(`/admin/${panelId}/deletePanel`);
export const assignPanelToProject = (data) => API.post("/admin/assignPanel", data);
export const autoAssignPanelsToProjects = () => API.post("/admin/autoAssignPanel");
export const getAllRequests = () => API.get("/admin/getAllRequests");

export const fetchRequests = async (type, school = null, department = null) => {
  try {
    const queryString = buildAdminContextParams(school, department);
    const res = await API.get(`/admin/getAllRequests/${type}${queryString ? `?${queryString}` : ''}`);
    const all = res.data.data || [];
    const unresolved = all.filter((req) => !req.resolvedAt);
    return { data: unresolved };
  } catch (err) {
    return { error: err.response?.data?.message || "Something went wrong" };
  }
};

export const updateRequestStatus = async (facultyType, data) => {
  try {
    const response = await API.post(`/admin/${facultyType}/updateRequest`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating request status:", error);
    return {
      success: false,
      message: error.response?.data?.message || "An unexpected error occurred",
    };
  }
};

export const getDefaultDeadline = (school = null, department = null) => {
  const queryString = buildAdminContextParams(school, department);
  return API.get(`/admin/getDefaultDeadline${queryString ? `?${queryString}` : ''}`);
};

export const setDefaultDeadline = (payload) => {
  return API.post("/admin/setDefaultDeadline", payload);
};

export const createOrUpdateMarkingSchema = (payload) => {
  return API.post("/admin/MarkingSchema", payload);
};

export const getFacultyMarkingSchema = () => {
  return API.get("/faculty/getMarkingSchema");
};

export async function createReviewRequest(facultyType, requestData) {
  try {
    const res = await API.post(`/student/${facultyType}/requestAdmin`, requestData);
    return { success: true, message: res.data.message };
  } catch (error) {
    console.error("❌ Error creating review request:", error);
    return { success: false, message: error.response?.data?.message || 'Error creating request' };
  }
}

export async function checkRequestStatus(facultyType, regNo, reviewType) {
  try {
    const res = await API.get(`/student/${facultyType}/checkRequestStatus`, {
      params: { regNo, reviewType }
    });
    return res.data;
  } catch (error) {
    console.error("Error checking request status:", error);
    return { status: "none" };
  }
}

export async function checkAllRequestStatuses(teamsList) {
  const statuses = {};
  
  for (const team of teamsList) {
    if (!team.markingSchema?.reviews) {
      console.log(`⚠️ [API] No schema for team ${team.title}, skipping request status check`);
      continue;
    }
    
    const isPanel = team.panel !== undefined;
    const facultyType = isPanel ? 'panel' : 'guide';
    
    const reviewTypes = team.markingSchema.reviews
      .filter(review => review.facultyType === facultyType)
      .map(review => review.reviewName);
    
    console.log(`📋 [API] Schema-based ${facultyType} reviews for ${team.title}:`, reviewTypes);
    
    if (reviewTypes.length === 0) {
      console.log(`⚠️ [API] No ${facultyType} reviews found in schema for ${team.title}`);
      continue;
    }
    
    for (const student of team.students) {
      for (const reviewType of reviewTypes) {
        try {
          const status = await checkRequestStatus(facultyType, student.regNo, reviewType);
          if (status?.status && status.status !== 'none') {
            const key = `${student.regNo}_${reviewType}`;
            statuses[key] = status;
            console.log(`✅ [API] Found status for ${student.regNo} ${reviewType}:`, status);
          }
        } catch (error) {
          console.error(`❌ [API] Error checking status:`, error);
        }
      }
    }
  }
  
  return statuses;
}

export async function batchCheckRequestStatuses(requests) {
  try {
    const res = await API.post('/student/batchCheckRequestStatus', { requests });
    return res.data.statuses || {};
  } catch (error) {
    console.error('Error in batchCheckRequestStatuses:', error);
    return {};
  }
}

export const submitReview = (projectId, reviewType, reviewData) =>
  API.put(`/project/${projectId}`, {
    reviewType,
    ...reviewData,
  });

// Project endpoints
export const getAllProjects = (params = new URLSearchParams()) => {
  const queryString = params.toString();
  return API.get(`/project/all${queryString ? `?${queryString}` : ''}`);
};

// Update project (using existing project/update endpoint)
export const updateProject = async (projectIdOrData, projectData = null) => {
  try {
    let payload;
    
    // Handle both calling patterns
    if (typeof projectIdOrData === 'string' && projectData) {
      // Called as updateProject(projectId, projectData)
      payload = {
        projectId: projectIdOrData,
        projectUpdates: projectData.projectUpdates || {},
        studentUpdates: projectData.studentUpdates || [],
      };
      
      if (projectData.hasOwnProperty('pptApproved')) {
        payload.pptApproved = projectData.pptApproved;
      }
    } else if (typeof projectIdOrData === 'object') {
      // Called as updateProject(updatePayload) - your current pattern
      payload = projectIdOrData;
      
      // Validate required fields
      if (!payload.projectId) {
        throw new Error('Project ID is required');
      }
    } else {
      throw new Error('Invalid parameters - expected (projectId, projectData) or (updatePayload)');
    }

    console.log("📤 [FRONTEND] Sending update request:", JSON.stringify(payload, null, 2));

    return API.put('/project/update', payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error("❌ [FRONTEND] Error in updateProject:", error);
    throw error;
  }
};



// Delete project (using existing project/:projectId endpoint)
export const deleteProject = async (projectId) => {
  return API.delete(`/project/${projectId}`);
};

// Get project by ID (using existing project endpoint)
export const getProjectById = async (projectId) => {
  return API.get(`/project/${projectId}`);
};

// Get all guide projects with optional filtering
export const getAllGuideProjectsAdmin = (params = new URLSearchParams()) => {
  const queryString = params.toString();
  return API.get(`/project/guide/all${queryString ? `?${queryString}` : ''}`);
};

// Get all panel projects with optional filtering  
export const getAllPanelProjectsAdmin = (params = new URLSearchParams()) => {
  const queryString = params.toString();
  return API.get(`/project/panel/all${queryString ? `?${queryString}` : ''}`);
};
export const createProjectsBulk = (payload) => {
  return API.post("/project/createProjectsBulk", payload);
};

export const createProject = (projectData) => API.post("/project/create", projectData);
export const createProjects = (data) => API.post("/project/createProjects", data);
export const getGuideProjects = () => API.get("/project/guide");
export const getPanelProjects = () => API.get("/project/panel");
export const getProjectDetails = (projectId) => API.get(`/project/${projectId}`);

// OTP endpoints
export const sendOTP = async (emailId) => {
  try {
    const response = await API.post("/otp/sendOtp", { emailId });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const verifyOTPAndResetPassword = async (emailId, otp, newPassword, confirmPassword) => {
  try {
    const response = await API.post("/otp/verifyOtpReset", {
      emailId,
      otp,
      newPassword,
      confirmPassword
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const resendOTP = async (emailId) => {
  try {
    const response = await API.post("/otp/resendOtp", { emailId });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createFaculty = async (facultyData) => {
  const response = await API.post("/admin/createFaculty", facultyData);
  return response.data;
};

export const createFacultyBulk = async (bulkData) => {
  try {
    const response = await API.post("/admin/createFacultyBulk", bulkData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createAdmin = async (adminData) => {
  const response = await API.post("/admin/createAdmin", adminData);
  return response.data;
};

export default API;
