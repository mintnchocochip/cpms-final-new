import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx"; // Import xlsx library for Excel processing
import {
  getFacultyBySchoolAndDept,
  getAllPanels,
  getAllPanelProjects,
  getAllGuideProjects,
  createPanelManual,
  deletePanel,
  assignPanelToProject,
  autoAssignPanelsToProjects,
  autoCreatePanelManual,
} from "../api"; // Note: uploadFacultyExcel API is assumed to be added
import TeamPopup from "../Components/TeamPopup";
import ConfirmPopup from "../Components/ConfirmDialog";
import Navbar from "../Components/UniversalNavbar";
import {
  ChevronRight,
  ChevronDown,
  Users,
  Eye,
  Trash2,
  Plus,
  Zap,
  Bot,
  Building2,
  GraduationCap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
  Database,
  Search,
  Grid3X3,
  BarChart3,
  RefreshCw,
  Filter,
  Settings,
  Upload,
  Download,
} from "lucide-react";

const AdminPanelManagement = () => {
  const navigate = useNavigate();
  const [facultyList, setFacultyList] = useState([]);
  const [panels, setPanels] = useState([]);
  const [selectedPair, setSelectedPair] = useState({ f1: "", f2: "" });
  const [modalTeam, setModalTeam] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState({
    type: "",
    panelId: null,
    teamId: null,
  });
  
  // Auto operation confirmation states
  const [autoConfirmation, setAutoConfirmation] = useState({
    type: "", // "create" or "assign"
    isOpen: false,
    message: "",
    existingCount: 0,
  });

  // Auto create panel popup state
  const [autoCreatePopup, setAutoCreatePopup] = useState({
    isOpen: false,
    numPanels: "",
    department: "",
    error: "",
  });

  // Notification state for animated success/error messages
  const [notification, setNotification] = useState({
    isVisible: false,
    type: "", // "success" or "error"
    title: "",
    message: "",
    icon: null,
  });

  const [expandedPanel, setExpandedPanel] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [unassignedTeams, setUnassignedTeams] = useState([]);
  const [allGuideProjects, setAllGuideProjects] = useState([]);
  const [adminContext, setAdminContext] = useState(null);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [isAutoCreating, setIsAutoCreating] = useState(false);

  // Show notification function
  const showNotification = useCallback((type, title, message, duration = 4000) => {
    setNotification({
      isVisible: true,
      type,
      title,
      message,
      icon: type === "success" ? <CheckCircle className="h-6 w-6" /> : <XCircle className="h-6 w-6" />,
    });

    setTimeout(() => {
      setNotification(prev => ({ ...prev, isVisible: false }));
    }, duration);
  }, []);

  // Hide notification function
  const hideNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  }, []);

  // Handle Excel file upload
  const handleExcelUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      showNotification("error", "Invalid File", "Please upload a valid Excel file (.xlsx or .xls)");
      event.target.value = ""; // Reset input
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Validate headers
        const headers = jsonData[0].map(h => h.trim());
        const requiredHeaders = ["Faculty Name", "Emp ID", "Email ID", "Department"];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
          showNotification("error", "Invalid Format", `Missing required columns: ${missingHeaders.join(", ")}`);
          event.target.value = "";
          return;
        }

        // Process rows, skipping header
        const validDepartments = ["BTech", "MTech (integrated)", "MCS"];
        const facultyData = jsonData.slice(1).map(row => {
          const rowObj = {};
          headers.forEach((header, index) => {
            rowObj[header] = row[index] || "";
          });
          return rowObj;
        }).filter(row => row["Faculty Name"] && row["Emp ID"] && row["Email ID"] && validDepartments.includes(row["Department"]));

        if (facultyData.length === 0) {
          showNotification("error", "No Valid Data", "No valid faculty data found in the Excel file");
          event.target.value = "";
          return;
        }

        // Send to backend (assumes uploadFacultyExcel API exists)
        try {
          const response = await uploadFacultyExcel(facultyData); // API call to upload faculty data
          if (response?.data?.success && response.data.data) {
            setFacultyList(response.data.data);
            await fetchData();
            showNotification("success", "Upload Successful", "Faculty data uploaded and processed successfully");
          } else {
            showNotification("error", "Upload Failed", "Failed to process faculty data. Please try again.");
          }
        } catch (error) {
          console.error("Excel upload error:", error);
          showNotification("error", "Upload Failed", "Failed to upload faculty data. Please try again.");
        }
        event.target.value = ""; // Reset input
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Excel processing error:", error);
      showNotification("error", "Processing Error", "Failed to process Excel file. Please ensure it's valid.");
      event.target.value = "";
    }
  }, [showNotification, fetchData]);

  // Handle demo Excel download
  const handleDemoExcelDownload = useCallback(() => {
    const demoData = [
      ["Faculty Name", "Emp ID", "Email ID", "Department"],
      ["John Doe", "EMP001", "john.doe@university.edu", "BTech"],
      ["Jane Smith", "EMP002", "jane.smith@university.edu", "MTech (integrated)"],
      ["Alice Johnson", "EMP003", "alice.johnson@university.edu", "MCS"],
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(demoData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Faculty Template");
    XLSX.writeFile(workbook, "Faculty_Demo.xlsx");
  }, []);

  // Check for admin context - handle both specific and skip modes
  useEffect(() => {
    const savedAdminContext = sessionStorage.getItem("adminContext");
    if (!savedAdminContext) {
      navigate("/admin/school-selection");
      return;
    }
    
    try {
      const parsedContext = JSON.parse(savedAdminContext);
      
      if (parsedContext.skipped) {
        setAdminContext({ school: null, department: null, skipped: true });
      } else if (parsedContext.school && parsedContext.department) {
        setAdminContext(parsedContext);
      } else {
        navigate("/admin/school-selection");
      }
    } catch (error) {
      console.error("Failed to parse admin context:", error);
      navigate("/admin/school-selection");
    }
  }, [navigate]);

  // Fetch data function with proper backend API usage
  const fetchData = useCallback(async () => {
    if (!adminContext) return;
    
    try {
      setLoading(true);
      const { school, department, skipped } = adminContext;

      console.log("=== FETCHING PANEL DATA ===");
      console.log("Admin Context:", { school, department, skipped });

      const apiSchool = skipped ? null : school;
      const apiDepartment = skipped ? null : department;

      console.log("API Parameters:", { apiSchool, apiDepartment });

      const [facultyRes, panelRes, panelProjectsRes, guideProjectsRes] = await Promise.all([
        getFacultyBySchoolAndDept(apiSchool, apiDepartment),
        getAllPanels(apiSchool, apiDepartment),
        getAllPanelProjects(apiSchool, apiDepartment),
        getAllGuideProjects(apiSchool, apiDepartment),
      ]);

      console.log("=== RAW API RESPONSES ===");
      console.log("Faculty Response:", facultyRes);
      console.log("Panels Response:", panelRes);
      console.log("Panel Projects Response:", panelProjectsRes);
      console.log("Guide Projects Response:", guideProjectsRes);

      // Process Faculty
      let facultyData = [];
      if (facultyRes?.data?.success && facultyRes.data.data) {
        facultyData = facultyRes.data.data;
      } else if (facultyRes?.data?.faculties) {
        facultyData = facultyRes.data.faculties;
      } else if (facultyRes?.data && Array.isArray(facultyRes.data)) {
        facultyData = facultyRes.data;
      } else if (facultyRes?.success && facultyRes.data) {
        facultyData = facultyRes.data;
      }
      console.log("Processed Faculty Data:", facultyData);
      setFacultyList(facultyData);

      // Process All Panels Data - SIMPLIFIED APPROACH
      let allPanelsData = [];
      if (panelRes?.data?.success && panelRes.data.data) {
        allPanelsData = panelRes.data.data;
      } else if (panelRes?.data && Array.isArray(panelRes.data)) {
        allPanelsData = panelRes.data;
      } else if (panelRes?.success && panelRes.data) {
        allPanelsData = panelRes.data;
      }
      console.log("All Panels Data:", allPanelsData);

      // Process Panel Projects Data to get team assignments
      let panelProjectData = [];
      if (panelProjectsRes?.data?.success && panelProjectsRes.data.data) {
        panelProjectData = panelProjectsRes.data.data;
      } else if (panelProjectsRes?.data && Array.isArray(panelProjectsRes.data)) {
        panelProjectData = panelProjectsRes.data;
      } else if (panelProjectsRes?.success && panelProjectsRes.data) {
        panelProjectData = panelProjectsRes.data;
      }
      console.log("Panel Projects Data:", panelProjectData);

      // Create a map of panelId to teams for quick lookup
      const panelTeamsMap = new Map();
      panelProjectData.forEach((p) => {
        const teams = (p.projects || []).map((project) => ({
          id: project._id,
          name: project.name,
          domain: project.domain || "N/A",
          members: (project.students || []).map((s) => s.name || s.regNo),
          full: project,
        }));
        panelTeamsMap.set(p.panelId, teams);
      });

      // Format panels with their teams
      const formattedPanels = allPanelsData.map((panel) => ({
        panelId: panel._id,
        facultyIds: [panel.faculty1?._id, panel.faculty2?._id].filter(Boolean),
        facultyNames: [panel.faculty1?.name, panel.faculty2?.name].filter(Boolean),
        teams: panelTeamsMap.get(panel._id) || [],
      }));

      console.log("Final formatted panels:", formattedPanels);
      setPanels(formattedPanels);

      // Process Guide Projects for conflict detection
      let guideProjectData = [];
      if (guideProjectsRes?.data?.success && guideProjectsRes.data.data) {
        guideProjectData = guideProjectsRes.data.data;
      } else if (guideProjectsRes?.data && Array.isArray(guideProjectsRes.data)) {
        guideProjectData = guideProjectsRes.data;
      } else if (guideProjectsRes?.success && guideProjectsRes.data) {
        guideProjectData = guideProjectsRes.data;
      }

      const guideProjectRelationships = [];
      (guideProjectData || []).forEach((facultyObj) => {
        const facultyId = facultyObj.faculty?._id;
        (facultyObj.guidedProjects || []).forEach((project) => {
          guideProjectRelationships.push({
            projectId: project._id,
            guideId: facultyId,
            guideName: facultyObj.faculty?.name,
            department: project.department,
          });
        });
      });
      setAllGuideProjects(guideProjectRelationships);

      // Process Unassigned Teams
      const allProjectsFromGuides = (guideProjectData || []).flatMap(
        (facultyObj) => facultyObj.guidedProjects || []
      );

      const uniqueProjects = allProjectsFromGuides.filter(
        (project, index, self) => index === self.findIndex((p) => p._id === project._id)
      );

      const unassigned = uniqueProjects.filter((project) => project.panel === null);
      console.log("Unassigned teams:", unassigned);
      setUnassignedTeams(unassigned);

    } catch (err) {
      console.error("Error fetching data:", err);
      setPanels([]);
      setFacultyList([]);
      setUnassignedTeams([]);
      setAllGuideProjects([]);
      showNotification("error", "Fetch Failed", "Failed to load panel data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [adminContext, showNotification]);

  useEffect(() => {
    if (adminContext) {
      fetchData();
    }
  }, [adminContext, fetchData]);

  // Clear context before navigating
  const handleChangeSchoolDepartment = useCallback(() => {
    sessionStorage.removeItem("adminContext");
    sessionStorage.setItem('adminReturnPath', '/admin/panel-management');
    navigate("/admin/school-selection");
  }, [navigate]);

  // Conflict checking functions
  const canAssignProjectToPanel = useCallback((projectId, panelFacultyIds) => {
    const projectGuide = allGuideProjects.find(
      (rel) => rel.projectId === projectId
    );
    if (!projectGuide) return { canAssign: true, reason: "" };

    const hasConflict = panelFacultyIds.includes(projectGuide.guideId);
    if (hasConflict) {
      return {
        canAssign: false,
        reason: `Cannot assign: ${projectGuide.guideName} is the guide for this project`,
      };
    }

    return { canAssign: true, reason: "" };
  }, [allGuideProjects]);

  const getAvailableTeamsForPanel = useCallback((panelFacultyIds) => {
    return unassignedTeams.filter((team) => {
      const check = canAssignProjectToPanel(team._id, panelFacultyIds);
      return check.canAssign;
    });
  }, [unassignedTeams, canAssignProjectToPanel]);

  // Panel management functions
  const handleAddPanel = useCallback(async () => {
    const { f1, f2 } = selectedPair;
    if (!f1 || !f2 || f1 === f2) {
      showNotification("error", "Invalid Selection", "Please select two different faculty members");
      return;
    }
    
    const exists = panels.find(
      (p) => p.facultyIds.includes(f1) && p.facultyIds.includes(f2)
    );
    if (exists) {
      showNotification("error", "Panel Exists", "This panel combination already exists");
      return;
    }
    
    try {
      await createPanelManual({ faculty1Id: f1, faculty2Id: f2 });
      setSelectedPair({ f1: "", f2: "" });
      await fetchData();
      showNotification("success", "Panel Created!", "New panel has been created successfully");
    } catch (error) {
      console.error("Panel creation error:", error);
      showNotification("error", "Creation Failed", "Failed to create panel. Please try again.");
    }
  }, [selectedPair, panels, fetchData, showNotification]);

  // Enhanced Auto Assign with mutual exclusion
  const handleAutoAssign = useCallback(async () => {
    if (isAutoCreating) {
      showNotification("error", "Operation in Progress", "Cannot start auto assignment while auto panel creation is running. Please wait for it to complete.");
      return;
    }

    const assignedTeamsCount = panels.reduce((sum, panel) => sum + panel.teams.length, 0);
    
    if (assignedTeamsCount > 0) {
      setAutoConfirmation({
        type: "assign",
        isOpen: true,
        message: `There are already ${assignedTeamsCount} teams assigned to panels. Auto-assignment may reassign existing teams. Do you want to continue?`,
        existingCount: assignedTeamsCount,
      });
      return;
    }
    
    await executeAutoAssign();
  }, [isAutoCreating, panels, showNotification]);

  // Enhanced Auto Create with popup
  const handleAutoCreatePanel = useCallback(() => {
    if (isAutoAssigning) {
      showNotification("error", "Operation in Progress", "Cannot start auto panel creation while auto assignment is running. Please wait for it to complete.");
      return;
    }

    setAutoCreatePopup({
      isOpen: true,
      numPanels: "",
      department: "",
      error: "",
    });
  }, [isAutoAssigning, showNotification]);

  // Handle auto create popup confirmation
  const handleAutoCreateConfirm = useCallback(async () => {
    const numPanels = parseInt(autoCreatePopup.numPanels);
    const selectedDept = autoCreatePopup.department;

    // Filter faculty based on selected department
    const filteredFaculty = selectedDept
      ? facultyList.filter((faculty) =>
          faculty.guidedProjects?.some((project) => project.department === selectedDept)
        )
      : facultyList;

    const maxPanels = Math.floor(filteredFaculty.length / 2);

    if (!numPanels || numPanels <= 0) {
      setAutoCreatePopup(prev => ({
        ...prev,
        error: "Please enter a valid number of panels",
      }));
      return;
    }

    if (numPanels > maxPanels) {
      setAutoCreatePopup(prev => ({
        ...prev,
        error: `Cannot create ${numPanels} panels. Only ${maxPanels} panels are possible with ${filteredFaculty.length} available faculty for ${selectedDept || 'all departments'}.`,
      }));
      return;
    }

    if (panels.length > 0) {
      setAutoConfirmation({
        type: "create",
        isOpen: true,
        message: `There are already ${panels.length} panels created. Auto-creation will create up to ${numPanels} additional panels for ${selectedDept || 'all departments'} if needed. Do you want to continue?`,
        existingCount: panels.length,
      });
      setAutoCreatePopup({ isOpen: false, numPanels: "", department: "", error: "" });
      return;
    }

    await executeAutoCreate(numPanels, selectedDept);
    setAutoCreatePopup({ isOpen: false, numPanels: "", department: "", error: "" });
  }, [autoCreatePopup.numPanels, autoCreatePopup.department, facultyList, panels.length]);

  // Handle auto create popup cancellation
  const handleAutoCreateCancel = useCallback(() => {
    setAutoCreatePopup({ isOpen: false, numPanels: "", department: "", error: "" });
  }, []);

  // Execute auto assign with notification instead of alert
  const executeAutoAssign = useCallback(async () => {
    try {
      setIsAutoAssigning(true);
      await autoAssignPanelsToProjects();
      await fetchData();
      showNotification("success", "Auto-Assignment Complete!", "Teams have been automatically assigned to panels");
    } catch (error) {
      console.error("Auto assign error:", error);
      showNotification("error", "Assignment Failed", "Auto-assignment failed. Please try again.");
    } finally {
      setIsAutoAssigning(false);
    }
  }, [fetchData, showNotification]);

  // Execute auto create with notification instead of alert
  const executeAutoCreate = useCallback(async (numPanels, department) => {
    try {
      setIsAutoCreating(true);
      await autoCreatePanelManual({ numPanels, department });
      await fetchData();
      showNotification("success", "Auto-Creation Complete!", `Up to ${numPanels} panels have been automatically created for ${department || 'all departments'}`);
    } catch (error) {
      console.error("Auto create panel error:", error);
      showNotification("error", "Creation Failed", "Auto panel creation failed. Please try again.");
    } finally {
      setIsAutoCreating(false);
    }
  }, [fetchData, showNotification]);

  // Handle auto operation confirmation
  const handleAutoConfirm = useCallback(async () => {
    const currentType = autoConfirmation.type;
    const numPanels = parseInt(autoCreatePopup.numPanels) || 0;
    const department = autoCreatePopup.department;
    setAutoConfirmation({
      type: "",
      isOpen: false,
      message: "",
      existingCount: 0,
    });

    if (currentType === "assign") {
      await executeAutoAssign();
    } else if (currentType === "create") {
      await executeAutoCreate(numPanels, department);
    }
  }, [autoConfirmation.type, autoCreatePopup.numPanels, autoCreatePopup.department, executeAutoAssign, executeAutoCreate]);

  // Handle auto operation cancellation
  const handleAutoCancel = useCallback(() => {
    setAutoConfirmation({
      type: "",
      isOpen: false,
      message: "",
      existingCount: 0,
    });
  }, []);

  const handleManualAssign = useCallback(async (panelIndex, projectId) => {
    try {
      const panel = panels[panelIndex];
      if (!panel) return;

      const conflictCheck = canAssignProjectToPanel(projectId, panel.facultyIds);
      if (!conflictCheck.canAssign) {
        showNotification("error", "Assignment Conflict", conflictCheck.reason);
        return;
      }

      await assignPanelToProject({ panelId: panel.panelId, projectId });
      await fetchData();
      showNotification("success", "Team Assigned!", "Team has been successfully assigned to the panel");
    } catch (error) {
      console.error("Assignment error:", error);
      showNotification("error", "Assignment Failed", "Failed to assign team. Please try again.");
    }
  }, [panels, canAssignProjectToPanel, fetchData, showNotification]);

  const handleConfirmRemove = useCallback(async () => {
    const { type, panelId, teamId } = confirmRemove;
    try {
      if (type === "panel") {
        await deletePanel(panelId);
        showNotification("success", "Panel Deleted!", "Panel has been successfully removed");
      } else if (type === "team") {
        await assignPanelToProject({ panelId: null, projectId: teamId });
        showNotification("success", "Team Removed!", "Team has been successfully unassigned");
      }
      await fetchData();
    } catch (error) {
      console.error("Delete operation error:", error);
      showNotification("error", "Operation Failed", "Failed to complete the operation. Please try again.");
    }
    setConfirmRemove({ type: "", panelId: null, teamId: null });
  }, [confirmRemove, fetchData, showNotification]);

  // Calculate used faculty IDs from actual panels
  const usedFacultyIds = useMemo(
    () => panels.flatMap((p) => p.facultyIds || []),
    [panels]
  );

  const availableFaculty = useMemo(
    () => facultyList.filter((f) => !usedFacultyIds.includes(f._id)),
    [facultyList, usedFacultyIds]
  );

  const filterMatches = useCallback((str) =>
    str &&
    typeof str === "string" &&
    str.toLowerCase().includes(searchQuery.toLowerCase()),
    [searchQuery]
  );

  // Calculate maximum possible panels based on filtered faculty
  const filteredFaculty = useMemo(() => {
    const selectedDept = autoCreatePopup.department;
    return selectedDept
      ? facultyList.filter((faculty) =>
          faculty.guidedProjects?.some((project) => project.department === selectedDept)
        )
      : facultyList;
  }, [autoCreatePopup.department, facultyList]);

  const maxPanels = Math.floor(filteredFaculty.length / 2);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="pt-20 pl-4 sm:pl-6 md:pl-24 min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 md:p-12 max-w-md mx-auto text-center">
            <div className="relative mb-8">
              <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-4 border-slate-200 border-t-blue-600 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Database className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 animate-pulse" />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3">Loading Panel Management</h3>
            <p className="text-slate-600">Retrieving panel data and team assignments...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="pt-20 pl-4 sm:pl-6 md:pl-24 min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
        <div className=" " >
        {/* Page Header with Context */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg mx-4 sm:mx-6 md:mx-8 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-2 sm:p-3 rounded-xl">
                  <Database className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">Panel Management</h1>
                  <p className="text-indigo-100 mt-1 text-sm sm:text-base">Manage evaluation panels and team assignments</p>
                </div>
              </div>
              
              {adminContext && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 w-full sm:w-auto">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <div className="text-left sm:text-right w-full sm:w-auto">
                      <div className="text-white/90 text-xs sm:text-sm">Current Programme</div>
                      <div className="text-white font-semibold text-sm sm:text-base">
                        {adminContext.skipped ? 'All Schools & Departments' : `${adminContext.school} - ${adminContext.department}`}
                      </div>
                    </div>
                    <button
                      onClick={handleChangeSchoolDepartment}
                      className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all duration-200 font-medium w-full sm:w-auto text-center"
                    >
                      Change Programme
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="mx-4 sm:mx-6 md:mx-8 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs sm:text-sm font-medium">Total Faculty</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1">{facultyList.length}</p>
                </div>
                <div className="bg-white/20 p-2 sm:p-3 rounded-xl">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-xs sm:text-sm font-medium">Total Panels</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1">{panels.length}</p>
                </div>
                <div className="bg-white/20 p-2 sm:p-3 rounded-xl">
                  <div className="h-6 w-6 sm:h-8 sm:w-8 bg-white/30 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                    P
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-xs sm:text-sm font-medium">Assigned Teams</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1">
                    {panels.reduce((sum, panel) => sum + panel.teams.length, 0)}
                  </p>
                </div>
                <div className="bg-white/20 p-2 sm:p-3 rounded-xl">
                  <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-xs sm:text-sm font-medium">Unassigned Teams</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1">{unassignedTeams.length}</p>
                </div>
                <div className="bg-white/20 p-2 sm:p-3 rounded-xl">
                  <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Controls Panel */}
        <div className="mx-4 sm:mx-6 md:mx-8 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Panel Creation & Management</h2>
              </div>
              <div className="flex items-center space-x-4 w-full sm:w-auto">
                <button
                  onClick={() => fetchData()}
                  disabled={loading}
                  className="flex items-center space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium w-full sm:w-auto justify-center sm:justify-start"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search teams, faculty, or domains..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-slate-700 placeholder-slate-400 text-base sm:text-lg"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 hover:text-slate-600 transition-colors" />
                </button>
              )}
            </div>

            {/* Panel Creation Controls */}
            <div className="border-t border-slate-200 pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                    Faculty 1
                  </label>
                  <select
                    value={selectedPair.f1}
                    onChange={(e) =>
                      setSelectedPair({ ...selectedPair, f1: e.target.value })
                    }
                    className="w-full p-2 sm:p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                  >
                    <option key="empty-f1" value="">Select Faculty 1</option>
                    {availableFaculty.map((f) => (
                      <option key={`f1-${f._id}`} value={f._id}>
                        {f.name} ({f.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                    Faculty 2
                  </label>
                  <select
                    value={selectedPair.f2}
                    onChange={(e) =>
                      setSelectedPair({ ...selectedPair, f2: e.target.value })
                    }
                    className="w-full p-2 sm:p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                  >
                    <option key="empty-f2" value="">Select Faculty 2</option>
                    {availableFaculty.map((f) => (
                      <option key={`f2-${f._id}`} value={f._id}>
                        {f.name} ({f.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAddPanel}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-semibold transition-all duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-sm sm:text-base"
                  disabled={!selectedPair.f1 || !selectedPair.f2}
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  Add Panel
                </button>
                <button
                  onClick={handleAutoCreatePanel}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-semibold transition-all duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-sm sm:text-base"
                  disabled={isAutoCreating || isAutoAssigning}
                  title={
                    isAutoAssigning 
                      ? "Cannot create panels while auto assignment is running"
                      : panels.length > 0 
                        ? `${panels.length} panels already exist` 
                        : "Create panels automatically"
                  }
                >
                  {isAutoCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : isAutoAssigning ? (
                    <>
                      <div className="animate-pulse h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-slate-300"></div>
                      Waiting...
                    </>
                  ) : (
                    <>
                      <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
                      Auto Create
                      {panels.length > 0 && (
                        <span className="ml-1 bg-yellow-500 text-white text-xs rounded-full px-1.5 py-0.5 sm:px-2 sm:py-1">
                          {panels.length}
                        </span>
                      )}
                    </>
                  )}
                </button>
                <button
                  onClick={handleAutoAssign}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-semibold transition-all duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-sm sm:text-base"
                  disabled={isAutoAssigning || isAutoCreating}
                  title={
                    isAutoCreating
                      ? "Cannot assign teams while auto panel creation is running"
                      : panels.reduce((sum, panel) => sum + panel.teams.length, 0) > 0 
                        ? `${panels.reduce((sum, panel) => sum + panel.teams.length, 0)} teams already assigned` 
                        : "Assign teams automatically"
                  }
                >
                  {isAutoAssigning ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                      Assigning...
                    </>
                  ) : isAutoCreating ? (
                    <>
                      <div className="animate-pulse h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-slate-300"></div>
                      Waiting...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
                      Auto Assign
                      {panels.reduce((sum, panel) => sum + panel.teams.length, 0) > 0 && (
                        <span className="ml-1 bg-yellow-500 text-white text-xs rounded-full px-1.5 py-0.5 sm:px-2 sm:py-1">
                          {panels.reduce((sum, panel) => sum + panel.teams.length, 0)}
                        </span>
                      )}
                    </>
                  )}
                </button>
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                      Upload Faculty Excel
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleExcelUpload}
                        className="w-full p-2 sm:p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleDemoExcelDownload}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-sm sm:text-base"
                    title="Download a demo Excel file with the correct format"
                  >
                    <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                    Demo Excel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Auto Create Panel Popup */}
        {autoCreatePopup.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                      Auto Create Panels
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Specify the number of panels and department
                    </p>
                  </div>
                </div>
                
                <div className="mb-4 sm:mb-6 space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                      Department
                    </label>
                    <select
                      value={autoCreatePopup.department}
                      onChange={(e) =>
                        setAutoCreatePopup(prev => ({
                          ...prev,
                          department: e.target.value,
                          error: "",
                        }))
                      }
                      className="w-full p-2 sm:p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                    >
                      <option value="">All Departments</option>
                      <option value="BTech">BTech</option>
                      <option value="MTech (integrated)">MTech (integrated)</option>
                      <option value="MCS">MCS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                      Number of Panels (Max: {maxPanels})
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={autoCreatePopup.numPanels}
                      onChange={(e) =>
                        setAutoCreatePopup(prev => ({
                          ...prev,
                          numPanels: e.target.value,
                          error: "",
                        }))
                      }
                      className="w-full p-2 sm:p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                      placeholder="Enter number of panels"
                    />
                  </div>
                  {autoCreatePopup.error && (
                    <div className="mt-2 p-2 sm:p-3 bg-red-50 rounded-lg border-l-4 border-red-300">
                      <p className="text-xs sm:text-sm text-red-800">
                        {autoCreatePopup.error}
                      </p>
                    </div>
                  )}
                  <div className="mt-2 p-2 sm:p-3 bg-blue-50 rounded-lg border-l-4 border-blue-300">
                    <p className="text-xs sm:text-sm text-blue-800">
                      <strong>Note:</strong> Each panel requires 2 faculty members. With {filteredFaculty.length} faculty {autoCreatePopup.department ? `in ${autoCreatePopup.department}` : 'across all departments'}, up to {maxPanels} panels can be created.
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAutoCreateCancel}
                    className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-all text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAutoCreateConfirm}
                    className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all text-sm sm:text-base"
                  >
                    Create Panels
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Panels Data Display */}
        <div className="mx-4 sm:mx-6 md:mx-8 mb-8">
          <div className="bg-white rounded-2xl shadow-lg">
            {panels.length === 0 ? (
              <div className="text-center py-16 sm:py-20">
                <div className="mx-auto w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-6 sm:mb-8">
                  <Users className="h-12 w-12 sm:h-16 sm:w-16 text-slate-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-600 mb-3">No Panels Found</h3>
                <p className="text-slate-500 max-w-md mx-auto text-sm sm:text-base">
                  Create panels to get started with team assignments
                </p>
              </div>
            ) : (
              <div className="p-4 sm:p-6 md:p-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4 sm:gap-0">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
                      <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                      Panel Records ({panels.length.toLocaleString()})
                    </h2>
                  </div>
                </div>

                <div className="space-y-4">
                  {panels.map((panel, idx) => {
                    const shouldShow =
                      !searchQuery ||
                      panel.facultyNames.some((name) => filterMatches(name)) ||
                      panel.teams.some(
                        (team) => filterMatches(team.name) || filterMatches(team.domain)
                      );

                    if (!shouldShow) return null;

                    const availableTeamsForPanel = getAvailableTeamsForPanel(panel.facultyIds);
                    const isExpanded = expandedPanel === idx;

                    return (
                      <div
                        key={panel.panelId}
                        className="border border-slate-200 rounded-xl bg-gradient-to-r from-white to-slate-50 hover:shadow-lg transition-all duration-300"
                      >
                        <div
                          className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 cursor-pointer hover:bg-slate-50 transition-colors gap-4 sm:gap-0"
                          onClick={() => setExpandedPanel(expandedPanel === idx ? null : idx)}
                        >
                          <div className="flex items-center space-x-4 w-full sm:w-auto">
                            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl">
                              {isExpanded ? (
                                <ChevronDown className="text-blue-600 h-5 w-5 sm:h-6 sm:w-6" />
                              ) : (
                                <ChevronRight className="text-blue-600 h-5 w-5 sm:h-6 sm:w-6" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-bold text-lg sm:text-xl text-slate-800 mb-1">
                                Panel {idx + 1}: {panel.facultyNames.join(" & ")}
                              </h4>
                              <div className="flex items-center space-x-4 sm:space-x-6 text-xs sm:text-sm text-slate-600">
                                <span className="flex items-center space-x-1">
                                  <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span>{panel.teams.length} teams assigned</span>
                                </span>
                                {panel.teams.length > 0 && (
                                  <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-semibold">
                                    Active
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmRemove({
                                  type: "panel",
                                  panelId: panel.panelId,
                                });
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-1 sm:gap-2 text-sm"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              Remove Panel
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-slate-200 p-4 sm:p-6 bg-slate-50">
                            {/* Assigned Teams */}
                            <div className="mb-8">
                              <h5 className="font-bold text-lg sm:text-xl mb-4 sm:mb-6 text-slate-800 flex items-center space-x-2">
                                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                                <span>Assigned Teams</span>
                              </h5>
                              {panel.teams.length === 0 ? (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-6">
                                  <div className="flex items-center space-x-3 text-amber-800">
                                    <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
                                    <div>
                                      <span className="font-bold block text-sm sm:text-base">No Teams Assigned</span>
                                      <span className="text-xs sm:text-sm text-amber-700">Use the dropdown below to assign teams to this panel</span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
                                  {panel.teams.map((team) => (
                                    <div
                                      key={team.id}
                                      className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 shadow-sm"
                                    >
                                      <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4 sm:gap-0">
                                        <h6 className="font-bold text-base sm:text-lg text-slate-800">{team.name}</h6>
                                        <button
                                          onClick={() =>
                                            setConfirmRemove({
                                              type: "team",
                                              panelId: null,
                                              teamId: team.id,
                                            })
                                          }
                                          className="text-red-600 hover:text-red-800 p-1.5 sm:p-2 rounded-lg hover:bg-red-50 transition-all duration-200 flex items-center gap-1 text-xs sm:text-sm font-medium"
                                        >
                                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                          Remove
                                        </button>
                                      </div>
                                      
                                      {team.members && team.members.length > 0 && (
                                        <div className="space-y-3">
                                          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 space-x-0 sm:space-x-3 p-2 sm:p-3 bg-slate-50 rounded-lg">
                                            <span className="font-semibold text-slate-700 text-sm sm:text-base">Team Members:</span>
                                            <div className="flex flex-wrap gap-1 sm:gap-2">
                                              {team.members.map((member, memberIdx) => (
                                                <span
                                                  key={`${team.id}-member-${memberIdx}`}
                                                  className="bg-blue-100 text-blue-800 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs sm:text-sm font-semibold"
                                                >
                                                  {member}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Manual Assignment */}
                            <div className="border-t border-slate-200 pt-6">
                              <h5 className="font-bold text-lg sm:text-xl mb-4 text-slate-800 flex items-center space-x-2">
                                <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                                <span>Manual Assignment</span>
                                <span className="text-xs sm:text-sm font-normal text-slate-500">
                                  ({availableTeamsForPanel.length} available)
                                </span>
                              </h5>
                              {availableTeamsForPanel.length === 0 ? (
                                <div className="bg-slate-100 p-3 sm:p-4 rounded-xl text-center">
                                  <span className="text-slate-600 font-medium text-sm sm:text-base">
                                    {unassignedTeams.length === 0
                                      ? "✅ All teams have been assigned"
                                      : "⚠️ No teams available (guide conflicts)"}
                                  </span>
                                </div>
                              ) : (
                                <select
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleManualAssign(idx, e.target.value);
                                      e.target.value = "";
                                    }
                                  }}
                                  className="w-full p-2 sm:p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                                  defaultValue=""
                                >
                                  <option key={`panel-${panel.panelId}-empty`} value="" disabled>
                                    Select team to assign to this panel
                                  </option>
                                  {availableTeamsForPanel.map((team) => (
                                    <option key={`panel-${panel.panelId}-team-${team._id}`} value={team._id}>
                                      {team.name}
                                    </option>
                                  ))}
                                </select>
                              )}
                              {availableTeamsForPanel.length < unassignedTeams.length && (
                                <details className="mt-4 cursor-pointer">
                                  <summary className="text-xs sm:text-sm text-red-600 hover:text-red-800 font-medium">
                                    ⚠️ {unassignedTeams.length - availableTeamsForPanel.length} teams excluded due to guide conflicts
                                  </summary>
                                  <div className="mt-2 ml-4 text-xs sm:text-sm text-gray-600 bg-red-50 p-2 sm:p-3 rounded border-l-4 border-red-200">
                                    {unassignedTeams
                                      .filter(
                                        (team) =>
                                          !availableTeamsForPanel.find((apt) => apt._id === team._id)
                                      )
                                      .map((team) => {
                                        const guideInfo = allGuideProjects.find(
                                          (rel) => rel.projectId === team._id
                                        );
                                        return (
                                          <div key={`conflict-${team._id}`} className="text-red-700">
                                            <strong>{team.name}</strong> - Guide:{" "}
                                            {guideInfo?.guideName || "Unknown"}
                                          </div>
                                        );
                                      })}
                                  </div>
                                </details>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Notification */}
        {notification.isVisible && (
          <div className="fixed top-20 sm:top-24 right-4 sm:right-8 z-50 max-w-md w-full px-4 sm:px-0">
            <div className={`transform transition-all duration-500 ease-out ${
              notification.isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
            }`}>
              <div className={`rounded-xl shadow-2xl border-l-4 p-4 sm:p-6 ${
                notification.type === "success" 
                  ? "bg-emerald-50 border-emerald-400" 
                  : "bg-red-50 border-red-400"
              }`}>
                <div className="flex items-start">
                  <div className={`flex-shrink-0 ${
                    notification.type === "success" ? "text-emerald-500" : "text-red-500"
                  }`}>
                    {notification.type === "success" ? (
                      <div className="relative">
                        <div className="animate-ping absolute inline-flex h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-emerald-400 opacity-75"></div>
                        <CheckCircle className="relative inline-flex h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                    ) : (
                      <XCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                    )}
                  </div>
                  <div className="ml-3 sm:ml-4 flex-1">
                    <h3 className={`text-xs sm:text-sm font-bold ${
                      notification.type === "success" ? "text-emerald-800" : "text-red-800"
                    }`}>
                      {notification.title}
                    </h3>
                    <p className={`mt-1 text-xs sm:text-sm ${
                      notification.type === "success" ? "text-emerald-700" : "text-red-700"
                    }`}>
                      {notification.message}
                    </p>
                  </div>
                  <button
                    onClick={hideNotification}
                    className={`flex-shrink-0 ml-2 sm:ml-3 ${
                      notification.type === "success" 
                        ? "text-emerald-400 hover:text-emerald-600" 
                        : "text-red-400 hover:text-red-600"
                    } transition-colors`}
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        <TeamPopup team={modalTeam} onClose={() => setModalTeam(null)} />
        <ConfirmPopup
          isOpen={!!confirmRemove.type}
          onClose={() => setConfirmRemove({ type: "", panelId: null, teamId: null })}
          onConfirm={handleConfirmRemove}
          type={confirmRemove.type}
        />

        {/* Auto Operation Confirmation Dialog */}
        {autoConfirmation.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                      {autoConfirmation.type === "create" ? "Confirm Auto Panel Creation" : "Confirm Auto Assignment"}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      This action will modify existing data
                    </p>
                  </div>
                </div>
                
                <div className="mb-4 sm:mb-6">
                  <p className="text-slate-700 leading-relaxed text-sm sm:text-base">
                    {autoConfirmation.message}
                  </p>
                  
                  {autoConfirmation.type === "assign" && (
                    <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-300">
                      <p className="text-xs sm:text-sm text-yellow-800">
                        <strong>Note:</strong> This may reassign teams that are already assigned to panels.
                      </p>
                    </div>
                  )}
                  
                  {autoConfirmation.type === "create" && (
                    <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-blue-50 rounded-lg border-l-4 border-blue-300">
                      <p className="text-xs sm:text-sm text-blue-800">
                        <strong>Note:</strong> Up to {autoCreatePopup.numPanels || 0} additional panels will be created for {autoCreatePopup.department || 'all departments'} only if needed based on available faculty.
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAutoCancel}
                    className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-all text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAutoConfirm}
                    className={`flex-1 px-3 py-1.5 sm:px-4 sm:py-2 text-white rounded-lg font-medium transition-all text-sm sm:text-base ${
                      autoConfirmation.type === "create"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-purple-600 hover:bg-purple-700"
                    }`}
                  >
                    {autoConfirmation.type === "create" ? "Create Panels" : "Assign Teams"}
                  </button>
                </div>
              </div>
              
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
};

export default AdminPanelManagement;