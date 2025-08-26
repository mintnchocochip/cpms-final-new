import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const API = axios.create({
  baseURL: `${API_BASE_URL}`,
});

const buildAdminContextParams = (school = null, department = null) => {
  const params = new URLSearchParams();
  if (school) params.append('school', school);
  if (department) params.append('department', department);
  return params.toString();
};

API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const adminLogin = (data) => API.post("/auth/login", data);

// Admin endpoints
export const getAllPanelProjects = (school = null, department = null) => {
  const queryString = buildAdminContextParams(school, department);
  return API.get(`/admin/getAllPanelProjects${queryString ? `?${queryString}` : ''}`);
};

export const getAllGuideProjects = (school = null, department = null) => {
  const queryString = buildAdminContextParams(school, department);
  return API.get(`/admin/getAllGuideProjects${queryString ? `?${queryString}` : ''}`);
};

// Faculty endpoint
export const getAllFaculty = () => API.get("/admin/getAllFaculty");

export const getFacultyBySchoolAndDept = (school, department) => {
  if (!school || !department) {
    return API.get("/admin/getAllFaculty");
  }
  return API.get(`/admin/faculty/${school}/${department}`);
};

export const getGuideTeams = () => API.get("/project/guide");
export const getPanelTeams = () => API.get("/project/panel");

export const getAllPanels = (school = null, department = null) => {
  const queryString = buildAdminContextParams(school, department);
  return API.get(`/admin/getAllPanels${queryString ? `?${queryString}` : ''}`);
};

export const createPanelManual = (data) => API.post("/admin/createPanel", data);
export const autoCreatePanelManual = () => API.post("/admin/autoCreatePanels", { force: true });
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

// ✅ FIXED: Completely removed hardcoded values
export async function checkAllRequestStatuses(teamsList) {
  const statuses = {};
  
  for (const team of teamsList) {
    // ✅ Only process teams with valid schemas
    if (!team.markingSchema?.reviews) {
      console.log(`⚠️ [API] No schema for team ${team.title}, skipping request status check`);
      continue;
    }
    
    const isPanel = team.panel !== undefined;
    const facultyType = isPanel ? 'panel' : 'guide';
    
    // ✅ Get review types from schema only
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

// Batch check request statuses for multiple students/reviews
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
export const createProjectsBulk = (payload) => {
  return API.post("/project/createProjectsBulk", payload);
};

export const createProject = (projectData) => API.post("/project/create", projectData);
export const createProjects = (data) => API.post("/project/createProjects", data);
export const deleteProject = (projectId) => API.delete(`/project/${projectId}`);
export const getGuideProjects = () => API.get("/project/guide");
export const getPanelProjects = () => API.get("/project/panel");
export const updateProject = (updatePayload) => API.put("/project/update", updatePayload);
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
