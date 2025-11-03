import React, { useContext, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import AdminProjectManagement from './Pages/AdminProjectManagement';
import Request from "./Pages/Request";
import Schedule from "./Pages/Schedule";
import FacultyListView from "./Pages/FacultyListView";
import FacultyLogin from './Pages/FacultyLogin';
import Guide from './Pages/Guide';
import Panel from './Pages/Panel';
import AdminLogin from './Pages/AdminLogin';
import AdminPanelManagement from './Pages/AdminPanelManagement'; 
import Dashboard from './Pages/Dashboard';
import Home from "./Pages/HomePage";
import ForgotPassword from "./Pages/ForgotPassword";
import ProjectCreationPage from "./Pages/ProjectCreationPage";
import AdminFacultyCreate from "./Pages/AdminFacultyCreation";
import AdminSchoolSelection from "./Pages/AdminSchoolSelection";
import NotificationProvider from './Components/NotificationProvider';
import AdminBroadcast from './Pages/AdminBroadcast';

// Import the new AdminStudentManagement component
import AdminStudentManagement from './Pages/AdminStudentManagement';

const AuthContext = React.createContext(null);
const BROADCAST_BLOCK_EVENT = 'faculty-blocked';

const token = sessionStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!sessionStorage.getItem('token')
  );
  const [role, setRole] = useState(sessionStorage.getItem('role') || null);

  const clearBroadcastBlock = () => {
    sessionStorage.removeItem('blockedBroadcast');
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent(BROADCAST_BLOCK_EVENT, { detail: null }));
    }
  };

  const login = (token, userRole) => {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('role', userRole);
    clearBroadcastBlock();
    setIsAuthenticated(true);
    setRole(userRole);
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    clearBroadcastBlock();
    setIsAuthenticated(false);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, role }}>
      {children}
    </AuthContext.Provider>
  );
};

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  if (!isAuthenticated) return <Navigate to="/login" />;
  return children;
};

// Enhanced ProtectedRoute that checks for admin 'block' broadcasts and
// displays a blocking notice to faculty users if one is active.
const FacultyProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const role = sessionStorage.getItem('role') || (sessionStorage.getItem('faculty') ? 'faculty' : null);
  const [blockedBroadcast, setBlockedBroadcast] = useState(() => {
    try {
      const stored = sessionStorage.getItem('blockedBroadcast');
      return stored ? JSON.parse(stored) : null;
    } catch (err) {
      console.error('Failed to hydrate blocked broadcast from storage', err);
      return null;
    }
  });
  const [checkingBroadcast, setCheckingBroadcast] = useState(() => {
    try {
      return !sessionStorage.getItem('blockedBroadcast');
    } catch (_) {
      return true;
    }
  });

  const updateBlockedState = React.useCallback((broadcast) => {
    try {
      if (broadcast) {
        sessionStorage.setItem('blockedBroadcast', JSON.stringify(broadcast));
      } else {
        sessionStorage.removeItem('blockedBroadcast');
      }
    } catch (err) {
      console.error('Failed to persist blocked broadcast state', err);
    }
    setBlockedBroadcast(broadcast || null);
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return () => undefined;
    const handler = (event) => {
      updateBlockedState(event.detail || null);
      setCheckingBroadcast(false);
    };
    window.addEventListener(BROADCAST_BLOCK_EVENT, handler);
    return () => {
      window.removeEventListener(BROADCAST_BLOCK_EVENT, handler);
    };
  }, [updateBlockedState]);

  React.useEffect(() => {
    let cancelled = false;

    const checkBroadcast = async () => {
      if (!isAuthenticated || role === 'admin') {
        setCheckingBroadcast(false);
        return;
      }

      try {
        const api = await import('./api');
        const res = await api.getFacultyBroadcastMessages({ limit: 5 });
        const payload = res?.data;
        const broadcasts = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];
        const blocking = broadcasts.find((msg) => msg?.action === 'block' && msg?.isActive);
        if (!cancelled) {
          updateBlockedState(blocking || null);
        }
      } catch (err) {
        console.error('Error checking broadcasts', err);
      } finally {
        if (!cancelled) {
          setCheckingBroadcast(false);
        }
      }
    };

    if (role !== 'admin') {
      checkBroadcast();
    } else {
      setCheckingBroadcast(false);
    }

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, role, updateBlockedState]);

  if (!isAuthenticated) return <Navigate to="/login" />;

  if (role !== 'admin' && checkingBroadcast) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900/30">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <div className="h-12 w-12 rounded-full border-4 border-slate-300 border-t-blue-500 animate-spin" />
          <p className="text-sm font-medium text-slate-500">Checking access permissions…</p>
        </div>
      </div>
    );
  }

  if (role !== 'admin' && blockedBroadcast) {
    const expiresAt = blockedBroadcast.expiresAt ? new Date(blockedBroadcast.expiresAt) : null;
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" aria-hidden="true" />
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
          <div className="max-w-2xl w-full bg-white/90 backdrop-blur rounded-2xl shadow-2xl px-6 py-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Administrator Notice</h2>
            {blockedBroadcast.title && (
              <h3 className="text-lg font-semibold text-slate-800 mb-2">{blockedBroadcast.title}</h3>
            )}
            <p
              className="text-slate-700 leading-relaxed"
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {blockedBroadcast.message}
            </p>
            <p className="text-sm text-slate-500 mt-4">
              Access to the faculty portal is temporarily restricted while this broadcast is active.
            </p>
            {expiresAt && !Number.isNaN(expiresAt.getTime()) && (
              <p className="text-xs text-slate-500 mt-2">
                Scheduled to lift on {expiresAt.toLocaleString()}.
              </p>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, role } = useContext(AuthContext);
  if (!isAuthenticated || role !== 'admin') {
    return <Navigate to="/admin/login" />;
  }
  return children;
};

const App = () => {

  // Your dummy data, state, and handlers as provided (unchanged)...

  const data1 = [{
    studentName: "John Doe",
    regNo: "S12345",
    course: "Computer Science",
    grade: "A"
  },
  {
    studentName: "Jane Smith",
    regNo: "S12346",
    course: "Electrical Engineering",
    grade: "B+"
  },
  {
    studentName: "Michael Johnson",
    regNo: "S12347",
    course: "Mechanical Engineering",
    grade: "A-"
  }];

  const data2 = [
    {
      facultyName: "Dr. Robert Wilson",
      empId: "F001",
      department: "Computer Science",
      coursesTaught: 3
    },
    {
      facultyName: "Dr. Sarah Parker",
      empId: "F002",
      department: "Electrical Engineering",
      coursesTaught: 4
    }
  ];

  const facultyData = [
    {
      name: "Faculty 1",
      empId: "EMP001",
      students: [
        {
          name: "John Doe",
          regNo: "2023A01",
          projectType: "AI",
          comments: "Good work",
          approved: null,
        },
        {
          name: "Jane Smith",
          regNo: "2023A02",
          projectType: "ML",
          comments: "Needs revision",
          approved: null,
        },
      ],
    },
    {
      name: "Faculty 2",
      empId: "EMP002",
      students: [
        {
          name: "Alice Johnson",
          regNo: "2023B01",
          projectType: "Web",
          comments: "",
          approved: null,
        },
        {
          name: "Bob Brown",
          regNo: "2023B02",
          projectType: "App",
          comments: "",
          approved: null,
        },
      ],
    },
  ];

  const dummyTeams = [
    {
      id: 1001,
      title: "Smart Health Monitoring System",
      description:
        "A wearable IoT device that monitors vital signs and alerts caregivers in emergencies.",
      students: [
        {
          id: 101,
          name: "Alex Johnson",
          email: "alex.j@university.edu",
          role: "Team Lead",
        },
        {
          id: 102,
          name: "Priya Patel",
          email: "priya.p@university.edu",
          role: "Hardware Engineer",
        },
        {
          id: 103,
          name: "Marcus Chen",
          email: "m.chen@university.edu",
          role: "Software Developer",
        },
      ],
    },
    {
      id: 1002,
      title: "EcoTrack: Sustainable Campus Initiative",
      description:
        "Mobile app for tracking and reducing carbon footprint across university facilities.",
      students: [
        {
          id: 104,
          name: "Sophia Williams",
          email: "s.williams@university.edu",
          role: "Project Manager",
        },
        {
          id: 105,
          name: "Jamal Hassan",
          email: "j.hassan@university.edu",
          role: "UI/UX Designer",
        },
        {
          id: 106,
          name: "Emma Rodriguez",
          email: "e.rodriguez@university.edu",
          role: "Backend Developer",
        },
        {
          id: 107,
          name: "Tyler Smith",
          email: "t.smith@university.edu",
          role: "Data Analyst",
        },
      ],
    },
    {
      id: 1003,
      title: "AR Campus Tour Guide",
      description:
        "Augmented reality application providing interactive tour of campus buildings and history.",
      students: [
        {
          id: 108,
          name: "David Kim",
          email: "d.kim@university.edu",
          role: "AR Developer",
        },
        {
          id: 109,
          name: "Aisha Nkosi",
          email: "a.nkosi@university.edu",
          role: "Content Creator",
        },
        {
          id: 110,
          name: "Liam O'Connor",
          email: "l.oconnor@university.edu",
          role: "3D Modeler",
        },
      ],
    },
    {
      id: 1004,
      title: "StudyBuddy: Collaborative Learning Platform",
      description:
        "Web platform connecting students for virtual study groups and resource sharing.",
      students: [
        {
          id: 111,
          name: "Nina Pham",
          email: "n.pham@university.edu",
          role: "Frontend Developer",
        },
        {
          id: 112,
          name: "Carlos Mendez",
          email: "c.mendez@university.edu",
          role: "Backend Developer",
        },
        {
          id: 113,
          name: "Sarah Al-Farsi",
          email: "s.alfarsi@university.edu",
          role: "UX Researcher",
        },
      ],
    },
  ];

  const dummyReviews = {
    1001: {
      milestone1: {
        progress: 75,
        comments:
          "Good progress on prototype. The team needs to focus more on battery optimization.",
        date: "2025-01-15",
      },
      milestone2: {
        progress: 85,
        comments:
          "Significant improvement in hardware integration. Software needs more testing.",
        date: "2025-02-10",
      },
    },
    1002: {
      milestone1: {
        progress: 60,
        comments:
          "Initial app design looks promising. Need more focus on data collection methods.",
        date: "2025-01-12",
      },
    },
    1003: {
      milestone1: {
        progress: 80,
        comments:
          "Excellent 3D modeling work. AR implementation progressing well.",
        date: "2025-01-20",
      },
      milestone2: {
        progress: 90,
        comments:
          "Testing on different devices shows good compatibility. Content needs more historical accuracy.",
        date: "2025-02-15",
      },
      final: {
        progress: 95,
        comments:
          "Almost ready for deployment. Final adjustments needed for accessibility features.",
        date: "2025-03-01",
      },
    },
  };

  const [teams, setTeams] = useState(dummyTeams);
  const [titles, setTitles] = useState(dummyTeams.map((team) => team.title));
  const [reviews, setReviews] = useState(dummyReviews);

  const handleReviewSubmit = (teamId, reviewType, reviewData) => {
    setReviews((prev) => ({
      ...prev,
      [teamId]: {
        ...(prev[teamId] || {}),
        [reviewType]: reviewData,
      },
    }));
  };

  return (
    <AuthProvider>
      <BrowserRouter>
      <NotificationProvider>
        <Routes>
          <Route path="/admin/project-management" element={<AdminProjectManagement />} />
          <Route path="/Home" element={<Home />} />
          <Route path="/" element={<Navigate to="/Home" replace />} />

          <Route exact path="/admin/Request" element={<Request facultyData={facultyData} />} />
          <Route exact path="/admin/createFaculty" element={<AdminFacultyCreate />} />
          <Route path="/admin/panel-management" element={
            <AdminRoute>
              <AdminPanelManagement />
            </AdminRoute>
          } />
          <Route path="/admin/broadcasts" element={
            <AdminRoute>
              <AdminBroadcast />
            </AdminRoute>
          } />
          <Route path="/admin/addProject" element={
            <AdminRoute>
              <ProjectCreationPage />
            </AdminRoute>
          } />
          <Route path="/admin/facultylistview-adminGuide" element={
            <AdminRoute>
              <FacultyListView />
            </AdminRoute>
          } />
          <Route exact path="/admin/Schedule" element={<Schedule />} />
          <Route path="/login" element={<FacultyLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/school-selection" element={
            <AdminRoute>
              <AdminSchoolSelection />
            </AdminRoute>
          } />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="admin/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/Guide" element={
            <FacultyProtectedRoute>
              <Guide />
            </FacultyProtectedRoute>
          } />
          <Route path="/Panel" element={
            <FacultyProtectedRoute>
              <Panel teams={teams} reviews={reviews} />
            </FacultyProtectedRoute>
          } />

          {/* ADDING THE NEW ADMIN STUDENT MANAGEMENT ROUTE */}
          <Route path="/admin/student-management" element={
            <AdminRoute>
              <AdminStudentManagement />
            </AdminRoute>
          } />

        </Routes>
        </NotificationProvider>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
export { AuthContext };
