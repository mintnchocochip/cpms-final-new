import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  BellRing, 
  Clock, 
  ArrowLeft, 
  Menu, 
  UserRoundPlus, 
  FileUp, 
  FileText, 
  Users, 
  Settings, 
  Calendar,
  Database
} from 'lucide-react';

function Leftmenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [isactive, setactive] = useState(location.pathname.replace("/", ""));

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const active = (text) => {
    setactive((prev) => (prev === text ? "" : text));
    navigate(`/${text}`);
  };

  return (
    <div className="relative h-screen">
      {/* Sidebar menu */}
      <div 
        className={`fixed top-0 left-0 h-full transition-all duration-300 ease-in-out z-50 ${
          isMenuOpen ? "w-64" : "w-20"
        } bg-white shadow-lg`}
      >
        {isMenuOpen ? (
          <>
            {/* Header with close button for expanded menu */}
            <div className="h-14 flex justify-between items-center pr-4" style={{ backgroundColor: 'rgba(36, 85, 163, 1)' }}>
              <p className="pl-20 items-center text-white">V Menu</p>
              <button 
                onClick={toggleMenu} 
                className="focus:outline-none hover:transition hover:ease-in-out hover:delay-150 hover:scale-125"
              >
                <ArrowLeft color="white" />
              </button>
            </div>
            
            {/* Menu items for expanded menu */}
            <div className="flex flex-col gap-5 items-center pt-5">
              <button 
                onClick={() => active('admin/Request')}
                className={`h-16 w-32 transition ease-in-out delay-150 hover:-translate-y-1 hover:text-xl font-semibold font-roboto rounded-lg hover:scale-110 duration-300 hover:bg-[#22C55E] hover:text-white ${
                  isactive === 'admin/Request' ? "bg-[#22C55E] text-white" : "bg-gray-100 text-black"
                }`}
              >
                <div className="flex justify-center items-center gap-2">
                  Request
                </div>
              </button>
              
              <button 
                onClick={() => active('admin/createFaculty')}
                className={`h-16 w-32 transition ease-in-out delay-150 hover:-translate-y-1 hover:text-xl font-semibold font-roboto rounded-lg hover:scale-110 duration-300 hover:bg-[#22C55E] hover:text-white ${
                  isactive === 'admin/createFaculty' ? "bg-[#22C55E] text-white" : "bg-gray-100 text-black"
                }`}
              >
                <div className="flex justify-center items-center gap-2">
                  Add Faculty
                </div>
              </button>
              
              <button 
                onClick={() => active('admin/panel-management')}
                className={`h-16 w-32 transition ease-in-out delay-150 hover:-translate-y-1 hover:text-xl font-semibold font-roboto rounded-lg hover:scale-110 duration-300 hover:bg-[#22C55E] hover:text-white ${
                  isactive === 'admin/panel-management' ? "bg-[#22C55E] text-white" : "bg-gray-100 text-black"
                }`}
              >
                <div className="flex justify-center items-center gap-2">
                  Panel Management
                </div>
              </button>

              <button 
                onClick={() => active('admin/project-management')}
                className={`h-16 w-32 transition ease-in-out delay-150 hover:-translate-y-1 hover:text-xl font-semibold font-roboto rounded-lg hover:scale-110 duration-300 hover:bg-[#22C55E] hover:text-white ${
                  isactive === 'admin/project-management' ? "bg-[#22C55E] text-white" : "bg-gray-100 text-black"
                }`}
              >
                <div className="flex justify-center items-center gap-2">
                  Project Database
                </div>
              </button>
              
              <button 
                onClick={() => active('admin/facultylistview-adminGuide')}
                className={`h-16 w-32 transition ease-in-out delay-150 hover:-translate-y-1 hover:text-xl font-semibold font-roboto rounded-lg hover:scale-110 duration-300 hover:bg-[#22C55E] hover:text-white ${
                  isactive === 'admin/facultylistview-adminGuide' ? "bg-[#22C55E] text-white" : "bg-gray-100 text-black"
                }`}
              >
                <div className="flex justify-center items-center gap-2">
                  Faculty List
                </div>
              </button>
              
              <button 
                onClick={() => active('admin/addProject')}
                className={`h-16 w-32 transition ease-in-out delay-150 hover:-translate-y-1 hover:text-xl font-semibold font-roboto rounded-lg hover:scale-110 duration-300 hover:bg-[#22C55E] hover:text-white ${
                  isactive === 'admin/addProject' ? "bg-[#22C55E] text-white" : "bg-gray-100 text-black"
                }`}
              >
                <div className="flex justify-center items-center gap-2">
                  Add Projects
                </div>
              </button>
              
              <button 
                onClick={() => active('admin/Schedule')}
                className={`h-16 w-32 transition ease-in-out delay-150 hover:-translate-y-1 hover:text-xl font-semibold font-roboto rounded-lg hover:scale-110 duration-300 hover:bg-[#22C55E] hover:text-white ${
                  isactive === 'admin/Schedule' ? "bg-[#22C55E] text-white" : "bg-gray-100 text-black"
                }`}
              >
                <div className="flex justify-center items-center gap-2">
                  Schedule
                </div>
              </button>
              
              <button 
                onClick={() => active('admin/student-management')}
                className={`h-16 w-32 transition ease-in-out delay-150 hover:-translate-y-1 hover:text-xl font-semibold font-roboto rounded-lg hover:scale-110 duration-300 hover:bg-[#22C55E] hover:text-white ${
                  isactive === 'admin/student-management' ? "bg-[#22C55E] text-white" : "bg-gray-100 text-black"
                }`}
              >
                <div className="flex justify-center items-center gap-2">
                  Student Management
                </div>
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Header with menu button for collapsed menu */}
            <div className="h-14 flex justify-center items-center" style={{ backgroundColor: 'rgba(36, 85, 163, 1)' }}>
              <button 
                onClick={toggleMenu} 
                className="focus:outline-none hover:transition hover:ease-in-out hover:delay-150 hover:scale-125"
              >
                <Menu color="white" />
              </button>
            </div>
            
            {/* Menu items for collapsed menu with tooltips */}
            <div className="flex flex-col items-center gap-5 pt-5">
              <div className="relative group">
                <button 
                  onClick={() => active('admin/Request')}
                  className={`flex justify-center items-center h-10 w-10 transition ease-in-out delay-150 hover:-translate-y-1 hover:text-xl font-semibold font-roboto rounded-lg hover:scale-110 duration-300 hover:bg-[#22C55E] hover:text-white ${
                    isactive === 'admin/Request' ? "bg-[#22C55E] text-white" : "bg-gray-100 text-black"
                  }`}
                >
                  <BellRing className="h-5 w-5"/>
                </button>
                <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  Request
                </span>
              </div>
              
              <div className="relative group">
                <button 
                  onClick={() => active('admin/createFaculty')}
                  className={`flex justify-center items-center h-10 w-10 transition ease-in-out delay-150 hover:-translate-y-1 hover:text-xl font-semibold font-roboto rounded-lg hover:scale-110 duration-300 hover:bg-[#22C55E] hover:text-white ${
                    isactive === 'admin/createFaculty' ? "bg-[#22C55E] text-white" : "bg-gray-100 text-black"
                  }`}
                >
                  <UserRoundPlus className="h-5 w-5"/>
                </button>
                <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  Add Faculty
                </span>
              </div>
              
              <div className="relative group">
                <button 
                  onClick={() => active('admin/panel-management')} 
                  className={`h-10 w-10 transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300 text-2xl flex items-center justify-center hover:bg-[#22C55E] hover:text-white ${
                    isactive === 'admin/panel-management' ? "bg-[#22C55E] text-white" : "bg-gray-100 text-black"
                  } rounded-md focus:outline-none`}
                >
                  P
                </button>
                <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  Panel Management
                </span>
              </div>

              <div className="relative group">
                <button 
                  onClick={() => active('admin/project-management')} 
                  className={`h-10 w-10 transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300 flex items-center justify-center hover:bg-[#22C55E] hover:text-white ${
                    isactive === 'admin/project-management' ? "bg-[#22C55E] text-white" : "bg-gray-100 text-black"
                  } rounded-md focus:outline-none`}
                >
                  <Database className="h-5 w-5"/>
                </button>
                <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  Project Database
                </span>
              </div>
              
              <div className="relative group">
                <button 
                  onClick={() => active('admin/facultylistview-adminGuide')} 
                  className={`h-10 w-10 transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300 text-2xl flex items-center justify-center hover:bg-[#22C55E] hover:text-white ${
                    isactive === 'admin/facultylistview-adminGuide' ? "bg-[#22C55E] text-white" : "bg-gray-100 text-black"
                  } rounded-md focus:outline-none`}
                >
                  F
                </button>
                <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  Faculty List
                </span>
              </div>
              
              <div className="relative group">
                <button 
                  onClick={() => active('admin/addProject')} 
                  className={`h-10 w-10 transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300 text-2xl flex items-center justify-center hover:bg-[#22C55E] hover:text-white ${
                    isactive === 'admin/addProject' ? "bg-[#22C55E] text-white" : "bg-gray-100 text-black"
                  } rounded-md focus:outline-none`}
                >
                  <FileUp className="h-5 w-5"/>
                </button>
                <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  Add Projects
                </span>
              </div>
              
              <div className="relative group">
                <button 
                  onClick={() => active('admin/Schedule')}
                  className={`flex justify-center items-center h-10 w-10 transition ease-in-out delay-150 hover:-translate-y-1 hover:text-xl font-semibold font-roboto rounded-lg hover:scale-110 duration-300 hover:bg-[#22C55E] hover:text-white ${
                    isactive === 'admin/Schedule' ? "bg-[#22C55E] text-white" : "bg-gray-100 text-black"
                  }`}
                >
                  <Clock className="h-5 w-5"/>
                </button>
                <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  Schedule
                </span>
              </div>
              
              <div className="relative group">
                <button 
                  onClick={() => active('admin/student-management')} 
                  className={`h-10 w-10 transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300 text-2xl flex items-center justify-center hover:bg-[#22C55E] hover:text-white ${
                    isactive === 'admin/student-management' ? "bg-[#22C55E] text-white" : "bg-gray-100 text-black"
                  } rounded-md focus:outline-none`}
                >
                  <Users className="h-5 w-5"/>
                </button>
                <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  Student Management
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className={`pt-20 ${isMenuOpen ? "ml-64" : "ml-20"}`}>
        
      </div>
      
    </div>
  );
}

export default Leftmenu;