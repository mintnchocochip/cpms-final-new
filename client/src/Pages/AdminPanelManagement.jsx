import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "../api";
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
  const [expandedPanel, setExpandedPanel] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [unassignedTeams, setUnassignedTeams] = useState([]);
  const [allGuideProjects, setAllGuideProjects] = useState([]);
  const [adminContext, setAdminContext] = useState(null);

  // Check for admin context on component mount
  useEffect(() => {
    const savedAdminContext = sessionStorage.getItem("adminContext");
    if (!savedAdminContext) {
      navigate("/admin/school-selection");
      return;
    }
    
    try {
      const parsedContext = JSON.parse(savedAdminContext);
      setAdminContext(parsedContext);
    } catch (error) {
      console.error("Failed to parse admin context:", error);
      navigate("/admin/school-selection");
    }
  }, [navigate]);

  const fetchData = async () => {
    if (!adminContext) return;
    
    try {
      setLoading(true);
      const { school, department } = adminContext;

      console.log("=== FETCHING PANEL DATA ===");
      console.log("Admin Context:", { school, department });

      const [facultyRes, panelRes, panelProjectsRes, guideProjectsRes] = await Promise.all([
        getFacultyBySchoolAndDept(school, department),
        getAllPanels(school, department),
        getAllPanelProjects(school, department),
        getAllGuideProjects(school, department),
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

      // Format panels with their teams (NO DUPLICATES - just use getAllPanels data)
      const formattedPanels = allPanelsData.map((panel) => ({
        panelId: panel._id,
        facultyIds: [panel.faculty1?._id, panel.faculty2?._id].filter(Boolean),
        facultyNames: [panel.faculty1?.name, panel.faculty2?.name].filter(Boolean),
        teams: panelTeamsMap.get(panel._id) || [], // Get teams from map or empty array
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminContext) {
      fetchData();
    }
  }, [adminContext]);

  const handleChangeSchoolDepartment = () => {
    sessionStorage.removeItem("adminContext");
    navigate("/admin/school-selection");
  };

  const canAssignProjectToPanel = (projectId, panelFacultyIds) => {
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
  };

  const getAvailableTeamsForPanel = (panelFacultyIds) => {
    return unassignedTeams.filter((team) => {
      const check = canAssignProjectToPanel(team._id, panelFacultyIds);
      return check.canAssign;
    });
  };

  const handleAddPanel = async () => {
    const { f1, f2 } = selectedPair;
    if (!f1 || !f2 || f1 === f2)
      return alert("Select two different faculty members");
    
    const exists = panels.find(
      (p) => p.facultyIds.includes(f1) && p.facultyIds.includes(f2)
    );
    if (exists) return alert("Panel already exists");
    
    try {
      await createPanelManual({ faculty1Id: f1, faculty2Id: f2 });
      setSelectedPair({ f1: "", f2: "" });
      await fetchData();
      alert("Panel created successfully!");
    } catch (error) {
      console.error("Panel creation error:", error);
      alert("Panel creation failed.");
    }
  };

  const handleAutoAssign = async () => {
    try {
      await autoAssignPanelsToProjects();
      await fetchData();
      alert("Auto-assignment completed!");
    } catch (error) {
      console.error("Auto assign error:", error);
      alert("Auto assignment failed.");
    }
  };

  const handleAutoCreatePanel = async () => {
    try {
      await autoCreatePanelManual();
      await fetchData();
      alert("Auto Panel Creation completed!");
    } catch (error) {
      console.error("Auto create panel error:", error);
      alert("Auto Panel Creation failed.");
    }
  };

  const handleManualAssign = async (panelIndex, projectId) => {
    try {
      const panel = panels[panelIndex];
      if (!panel) return;

      const conflictCheck = canAssignProjectToPanel(projectId, panel.facultyIds);
      if (!conflictCheck.canAssign) {
        alert(conflictCheck.reason);
        return;
      }

      await assignPanelToProject({ panelId: panel.panelId, projectId });
      await fetchData();
      alert("Team assigned successfully!");
    } catch (error) {
      console.error("Assignment error:", error);
      alert("Assignment failed.");
    }
  };

  const handleConfirmRemove = async () => {
    const { type, panelId, teamId } = confirmRemove;
    try {
      if (type === "panel") {
        await deletePanel(panelId);
        alert("Panel deleted successfully!");
      } else if (type === "team") {
        await assignPanelToProject({ panelId: null, projectId: teamId });
        alert("Team removed successfully!");
      }
      await fetchData();
    } catch (error) {
      console.error("Delete operation error:", error);
      alert("Delete failed.");
    }
    setConfirmRemove({ type: "", panelId: null, teamId: null });
  };

  // FIXED: Calculate used faculty IDs from actual panels
  const usedFacultyIds = React.useMemo(
    () => panels.flatMap((p) => p.facultyIds || []),
    [panels]
  );

  const availableFaculty = React.useMemo(
    () => facultyList.filter((f) => !usedFacultyIds.includes(f._id)),
    [facultyList, usedFacultyIds]
  );

  const filterMatches = (str) =>
    str &&
    typeof str === "string" &&
    str.toLowerCase().includes(searchQuery.toLowerCase());

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            <div className="text-xl text-gray-600">Loading Panel Management...</div>
            <div className="text-sm text-gray-500">Please wait while we fetch the data</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-x-hidden">
        <div className="p-8 lg:p-20 lg:pl-28">
          <div className="shadow-xl rounded-2xl bg-white p-8 lg:p-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
              <div>
                <h2 className="font-bold font-roboto text-4xl text-gray-800 mb-2">
                  Panel Management
                </h2>
                <p className="text-gray-600">Manage evaluation panels and team assignments</p>
              </div>
              {adminContext && (
                <div className="flex items-center gap-4 mt-4 lg:mt-0">
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    <h3 className="font-semibold text-gray-800 mb-2">Current Context:</h3>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <span className="text-gray-700">School: <strong>{adminContext.school}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-purple-600" />
                        <span className="text-gray-700">Department: <strong>{adminContext.department}</strong></span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleChangeSchoolDepartment}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                  >
                    Change School/Department
                  </button>
                </div>
              )}
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">{facultyList.length}</div>
                    <div className="text-blue-100">Total Faculty</div>
                  </div>
                  <Users className="h-8 w-8 text-blue-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">{panels.length}</div>
                    <div className="text-green-100">Total Panels</div>
                  </div>
                  <div className="h-8 w-8 bg-green-400 rounded-lg flex items-center justify-center text-green-800 font-bold text-sm">
                    P
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">
                      {panels.reduce((sum, panel) => sum + panel.teams.length, 0)}
                    </div>
                    <div className="text-purple-100">Assigned Teams</div>
                  </div>
                  <div className="h-8 w-8 bg-purple-400 rounded-lg flex items-center justify-center text-purple-800 font-bold text-sm">
                    A
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">{unassignedTeams.length}</div>
                    <div className="text-orange-100">Unassigned Teams</div>
                  </div>
                  <div className="h-8 w-8 bg-orange-400 rounded-lg flex items-center justify-center text-orange-800 font-bold text-sm">
                    U
                  </div>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search teams, faculty, or domains..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-gray-700 placeholder-gray-400"
                />
                <div className="absolute right-3 top-4">
                  <svg
                    className="h-6 w-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Panel Creation Controls */}
            <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <h3 className="font-semibold text-lg mb-4 text-gray-800">
                Panel Creation & Management
              </h3>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Faculty 1
                  </label>
                  <select
                    value={selectedPair.f1}
                    onChange={(e) =>
                      setSelectedPair({ ...selectedPair, f1: e.target.value })
                    }
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option key="empty-f1" value="">Select Faculty 1</option>
                    {availableFaculty.map((f) => (
                      <option key={`f1-${f._id}`} value={f._id}>
                        {f.name} ({f.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Faculty 2
                  </label>
                  <select
                    value={selectedPair.f2}
                    onChange={(e) =>
                      setSelectedPair({ ...selectedPair, f2: e.target.value })
                    }
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg"
                  disabled={!selectedPair.f1 || !selectedPair.f2}
                >
                  <Plus className="h-5 w-5" />
                  Add Panel
                </button>
                <button
                  onClick={handleAutoCreatePanel}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  <Bot className="h-5 w-5" />
                  Auto Create
                </button>
                <button
                  onClick={handleAutoAssign}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  <Zap className="h-5 w-5" />
                  Auto Assign
                </button>
              </div>
            </div>

            {/* Debug Info
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-800">Debug Info:</h4>
                <p className="text-sm text-yellow-700">
                  Faculty: {facultyList.length} | Panels: {panels.length} | Available Faculty: {availableFaculty.length} | Unassigned Teams: {unassignedTeams.length}
                </p>
              </div>
            )} */}

            {/* Panels List */}
            {panels.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <Users className="h-20 w-20 mx-auto mb-4 text-gray-300" />
                <div className="text-2xl font-semibold text-gray-600 mb-2">No panels found</div>
                <div className="text-gray-500">Create panels to get started with team assignments</div>
              </div>
            ) : (
              <div className="space-y-6">
                {panels.map((panel, idx) => {
                  const shouldShow =
                    !searchQuery ||
                    panel.facultyNames.some((name) => filterMatches(name)) ||
                    panel.teams.some(
                      (team) => filterMatches(team.name) || filterMatches(team.domain)
                    );

                  if (!shouldShow) return null;

                  const availableTeamsForPanel = getAvailableTeamsForPanel(panel.facultyIds);

                  return (
                    <div
                      key={panel.panelId}
                      className="border-2 border-gray-200 rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <div
                        className="flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setExpandedPanel(expandedPanel === idx ? null : idx)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                            {expandedPanel === idx ? (
                              <ChevronDown className="text-blue-600 h-6 w-6" />
                            ) : (
                              <ChevronRight className="text-blue-600 h-6 w-6" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-xl text-gray-800">
                              Panel {idx + 1}: {panel.facultyNames.join(" & ")}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-gray-500">
                                {panel.teams.length} teams assigned
                              </span>
                              {panel.teams.length > 0 && (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                                  Active
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmRemove({
                              type: "panel",
                              panelId: panel.panelId,
                            });
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove Panel
                        </button>
                      </div>

                      {expandedPanel === idx && (
                        <div className="border-t border-gray-200 p-6 bg-gray-50">
                          {/* Assigned Teams */}
                          <div className="mb-6">
                            <h5 className="font-semibold text-lg mb-4 text-gray-800 flex items-center gap-2">
                              <Users className="h-5 w-5" />
                              Assigned Teams
                            </h5>
                            {panel.teams.length === 0 ? (
                              <div className="text-gray-500 text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-200">
                                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <div className="font-medium">No teams assigned to this panel</div>
                                <div className="text-sm">Use the dropdown below to assign teams</div>
                              </div>
                            ) : (
                              <div className="grid gap-4">
                                {panel.teams.map((team) => (
                                  <div
                                    key={team.id}
                                    className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                          <h6 className="font-bold text-lg text-gray-800">
                                            {team.name}
                                          </h6>
                                        </div>
                                        {team.members && team.members.length > 0 && (
                                          <div className="flex items-start gap-3">
                                            <Users className="h-5 w-5 text-gray-500 mt-1 flex-shrink-0" />
                                            <div>
                                              <span className="font-medium text-gray-700 text-sm">
                                                Team Members:
                                              </span>
                                              <div className="flex flex-wrap gap-2 mt-2">
                                                {team.members.map((member, memberIdx) => (
                                                  <span
                                                    key={`${team.id}-member-${memberIdx}`}
                                                    className="inline-block bg-blue-50 border border-blue-200 rounded-lg px-3 py-1 text-sm text-blue-800 font-medium"
                                                  >
                                                    {member}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      <button
                                        onClick={() =>
                                          setConfirmRemove({
                                            type: "team",
                                            panelId: null,
                                            teamId: team.id,
                                          })
                                        }
                                        className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-all duration-200 flex items-center gap-1"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="text-sm font-medium">Remove</span>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Manual Assignment */}
                          <div className="border-t border-gray-300 pt-6">
                            <h5 className="font-semibold text-lg mb-4 text-gray-800 flex items-center gap-2">
                              <Plus className="h-5 w-5" />
                              Manual Assignment
                              <span className="text-sm font-normal text-gray-500">
                                ({availableTeamsForPanel.length} available)
                              </span>
                            </h5>
                            {availableTeamsForPanel.length === 0 ? (
                              <div className="bg-gray-100 p-4 rounded-lg text-center">
                                <span className="text-gray-600 font-medium">
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
                                className="w-full border-2 border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
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
                                <summary className="text-sm text-red-600 hover:text-red-800 font-medium">
                                  ⚠️ {unassignedTeams.length - availableTeamsForPanel.length} teams excluded due to guide conflicts
                                </summary>
                                <div className="mt-2 ml-4 text-sm text-gray-600 bg-red-50 p-3 rounded border-l-4 border-red-200">
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
            )}

            <TeamPopup team={modalTeam} onClose={() => setModalTeam(null)} />
            <ConfirmPopup
              isOpen={!!confirmRemove.type}
              onClose={() => setConfirmRemove({ type: "", panelId: null, teamId: null })}
              onConfirm={handleConfirmRemove}
              type={confirmRemove.type}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminPanelManagement;
