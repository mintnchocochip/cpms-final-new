import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Menu, Users, BookOpen, Home } from 'lucide-react';

function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
    };
  }, [ref, handler]);
}

function Leftmenu() {
  const [isExpanded, setIsExpanded] = useState(true); // Start expanded by default on desktop
  const [isMobileOpen, setIsMobileOpen] = useState(false); // Separate state for mobile overlay
  const setnav = useNavigate();
  const location = useLocation();
  const [isactive, setactive] = useState(location.pathname.replace("/", ""));
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const sidebarRef = useRef(null);
  const toggleButtonRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 1024;
      setIsMobile(newIsMobile);
      
      // Close mobile menu on resize to desktop
      if (!newIsMobile && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobileOpen]);

  // Update active state when location changes
  useEffect(() => {
    setactive(location.pathname.replace("/", ""));
    setIsExpanded(false); // Collapse desktop menu on page navigation
  }, [location.pathname]);

  // Collapse menu when clicking outside (custom hook)
  useClickOutside(sidebarRef, (e) => {
    // Don't collapse if clicking on toggle button
    if (toggleButtonRef.current && toggleButtonRef.current.contains(e.target)) {
      return;
    }
    
    if (!isMobile && isExpanded) {
      setIsExpanded(false);
    }
    if (isMobile && isMobileOpen) {
      setIsMobileOpen(false);
    }
  });

  const toggleDesktopMenu = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const active = (text) => {
    setactive(text);
    setnav(`/${text}`);
    
    // Collapse menu after navigation
    if (isMobile) {
      setIsMobileOpen(false);
    } else {
      setIsExpanded(false); // Collapse desktop menu on page navigation
    }
  };

  const menuItems = [
    {
      key: "Panel",
      label: "Panel",
      icon: Users,
      shortLabel: "P",
      description: "Review panel projects",
      color: "from-blue-500 to-blue-600"
    },
    {
      key: "Guide",
      label: "Guide",
      icon: BookOpen,
      shortLabel: "G", 
      description: "Manage guided projects",
      color: "from-green-500 to-green-600"
    }
  ];

  // Different rendering for desktop vs mobile
  if (isMobile) {
    return (
      <>
        {/* Mobile Toggle Button */}
        {!isMobileOpen && (
          <button
            ref={toggleButtonRef}
            onClick={toggleMobileMenu}
            className="fixed top-16 left-4 z-50 h-10 w-10 flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg focus:outline-none hover:scale-110 transition-all duration-300 shadow-lg backdrop-blur-sm border border-white border-opacity-20"
            aria-label="Toggle menu"
          >
            <Menu color="white" size={18} />
          </button>
        )}

        {/* Mobile Backdrop */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <div
          ref={sidebarRef}
          className={`fixed top-14 left-0 h-[calc(100vh-3.5rem)] bg-white shadow-2xl z-40 transition-transform duration-300 ease-in-out border-r border-gray-100 w-72 ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Mobile Header */}
          <div className="h-14 flex justify-between items-center px-4 bg-gradient-to-r from-blue-600 to-blue-700 relative overflow-hidden">
            <div className="absolute inset-0 bg-white bg-opacity-10 backdrop-blur-sm"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-5 rounded-full -translate-y-16 translate-x-16"></div>
            
            <div className="relative z-10 flex items-center justify-between w-full">
              <div>
                <p className="text-white font-bold text-lg">Faculty Menu</p>
                <p className="text-blue-100 text-xs opacity-75">Navigation Panel</p>
              </div>
              
              <button
                onClick={toggleMobileMenu}
                className="focus:outline-none hover:scale-110 transition-all duration-300 p-2 rounded-lg hover:bg-white hover:bg-opacity-20"
                aria-label="Close menu"
              >
                <ArrowLeft color="white" size={18} />
              </button>
            </div>
          </div>

          {/* Mobile Menu Items */}
          <div className="flex flex-col gap-3 pt-6 pb-4 px-4">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActiveItem = isactive === item.key;
              
              return (
                <div key={item.key} className="relative group w-full">
                  <button
                    onClick={() => active(item.key)}
                    className={`relative w-full h-12 transition-all duration-300 ease-in-out font-semibold rounded-xl hover:scale-105 overflow-hidden flex items-center px-4 justify-start ${
                      isActiveItem 
                        ? `bg-gradient-to-r ${item.color} text-white shadow-lg shadow-blue-200` 
                        : "bg-gray-50 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 text-gray-700 hover:text-blue-700 hover:shadow-md"
                    }`}
                  >
                    <IconComponent 
                      size={20} 
                      className={`flex-shrink-0 transition-colors duration-300 mr-3 ${
                        isActiveItem ? 'text-white' : 'text-gray-600 group-hover:text-blue-600'
                      }`}
                    />
                    
                    <div className="flex flex-col items-start text-left">
                      <span className="text-sm font-semibold leading-tight">{item.label}</span>
                      <span className={`text-xs opacity-75 leading-tight ${
                        isActiveItem ? 'text-white' : 'text-gray-500 group-hover:text-blue-500'
                      }`}>
                        {item.description}
                      </span>
                    </div>

                    {isActiveItem && (
                      <div className="absolute inset-0 bg-white bg-opacity-10 animate-pulse"></div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Mobile Footer */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Home className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">Faculty Portal</p>
                  <p className="text-xs text-gray-600 truncate">VIT Chennai Campus</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Desktop version with different approach
  return (
    <>
      {/* Desktop Sidebar - Always visible, no overlay */}
      <div
        ref={sidebarRef}
        className={`fixed top-14 left-0 h-[calc(100vh-3.5rem)] bg-white shadow-xl z-40 transition-all duration-300 ease-in-out border-r border-gray-100 ${
          isExpanded ? 'w-64' : 'w-16'
        }`}
      >
        {/* Desktop Header - No close button overlap */}
        <div className="h-14 flex items-center px-4 bg-gradient-to-r from-blue-600 to-blue-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-white bg-opacity-10 backdrop-blur-sm"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-5 rounded-full -translate-y-16 translate-x-16"></div>
          
          <div className="relative z-10 flex items-center justify-between w-full">
            {/* Show Faculty Menu text only when expanded */}
            {isExpanded && (
              <div className="flex-1">
                <p className="text-white font-bold text-lg">Faculty Menu</p>
                <p className="text-blue-100 text-xs opacity-75">Navigation Panel</p>
              </div>
            )}
            
            {/* Desktop toggle button - positioned to avoid overlap */}
            <button
              ref={toggleButtonRef}
              onClick={toggleDesktopMenu}
              className={`${isExpanded ? 'ml-2' : 'mx-auto'} p-1.5 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-300`}
              aria-label={isExpanded ? 'Collapse menu' : 'Expand menu'}
            >
              {isExpanded ? (
                <ArrowLeft color="white" size={16} />
              ) : (
                <Menu color="white" size={16} />
              )}
            </button>
          </div>
        </div>

        {/* Desktop Menu Items */}
        <div className={`flex flex-col gap-2 pt-4 pb-4 ${isExpanded ? 'px-3' : 'px-1'}`}>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActiveItem = isactive === item.key;
            
            return (
              <div key={item.key} className="relative group w-full">
                <button
                  onClick={() => active(item.key)}
                  className={`relative w-full h-11 transition-all duration-300 ease-in-out font-semibold rounded-lg hover:scale-105 overflow-hidden flex items-center ${
                    isExpanded ? 'px-3 justify-start' : 'px-0 justify-center'
                  } ${
                    isActiveItem 
                      ? `bg-gradient-to-r ${item.color} text-white shadow-lg` 
                      : "bg-gray-50 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 text-gray-700 hover:text-blue-700 hover:shadow-md"
                  }`}
                >
                  <IconComponent 
                    size={19} 
                    className={`flex-shrink-0 transition-colors duration-300 ${
                      isActiveItem ? 'text-white' : 'text-gray-600 group-hover:text-blue-600'
                    } ${isExpanded ? 'mr-3' : ''}`}
                  />
                  
                  {isExpanded && (
                    <div className="flex flex-col items-start text-left">
                      <span className="text-sm font-semibold leading-tight">{item.label}</span>
                      <span className={`text-xs opacity-75 leading-tight ${
                        isActiveItem ? 'text-white' : 'text-gray-500 group-hover:text-blue-500'
                      }`}>
                        {item.description}
                      </span>
                    </div>
                  )}

                  {isActiveItem && (
                    <div className="absolute inset-0 bg-white bg-opacity-10"></div>
                  )}
                </button>

                {/* Desktop Tooltip for collapsed state */}
                {!isExpanded && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 z-60 whitespace-nowrap shadow-lg">
                    {item.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-800"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop Footer */}
        {isExpanded && (
          <div className="absolute bottom-4 left-3 right-3">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Home className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">Faculty Portal</p>
                  <p className="text-xs text-gray-600 truncate">VIT Chennai Campus</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Decorative line */}
        <div className="absolute top-14 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
      </div>
    </>
  );
}

export default Leftmenu;
