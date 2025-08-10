import { useState} from "react";
import { useNavigate,useLocation } from "react-router-dom";
import { ArrowLeft, Menu } from 'lucide-react';

function Leftmenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const setnav = useNavigate();
  const location = useLocation();
  const [isactive, setactive] = useState(location.pathname.replace("/", ""));


  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const active = (text) => {
    setactive((prev) => (prev === text ? "" : text));
    setnav(`/${text}`);
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
            <div className="h-14 flex justify-between items-center pr-4" style={{ backgroundColor: 'rgba(36, 85, 163, 1)' }} >
              <p className=" pl-20 items-center text-white  " >V Menu</p>
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
                onClick={() => active('Panel')}
                className={`h-16 w-32 transition ease-in-out delay-150 hover:-translate-y-1 hover:text-xl font-semibold font-roboto rounded-lg hover:scale-110 duration-300 hover:bg-[#22C55E] hover:text-white ${
                  isactive === 'Panel' ? "bg-[#22C55E] text-white" : " bg-gray-100 text-black"
                }`}
              >
                Panel
              </button>
              <button 
                onClick={() => active('Guide')}
                className={`h-16 w-32 transition ease-in-out delay-150 hover:-translate-y-1 hover:text-xl font-semibold font-roboto rounded-lg hover:scale-110 duration-300 hover:bg-[#22C55E] hover:text-white ${
                  isactive === 'Guide' ? "bg-[#22C55E] text-white" : " bg-gray-100 text-black"
                }`}
              >
                Guide
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Header with menu button for collapsed menu */}
            <div className="h-14 flex justify-center items-center" style={{ backgroundColor: 'rgba(36, 85, 163, 1)' }} >
              <button 
                onClick={toggleMenu} 
                className="focus:outline-none hover:transition hover:ease-in-out hover:delay-150 hover:scale-125 "
              >
                <Menu color="white" />
              </button>
            </div>
            
            {/* Menu items for collapsed menu */}
            <div className="flex flex-col items-center gap-5 pt-5">
              <button 
                onClick={() => active('Panel')} 
                className={`h-10 w-10 transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300 text-2xl flex items-center justify-center hover:bg-[#22C55E] hover:text-white ${
                  isactive === 'Panel' ? "bg-[#22C55E] text-white" : "bg-gray-100 text-black"
                } rounded-md focus:outline-none`}
              >
                P
              </button>
              <button 
                onClick={() => active('Guide')} 
                className={`h-10 w-10 transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300 text-2xl flex items-center justify-center hover:bg-[#22C55E] hover:text-white ${
                  isactive === 'Guide' ? "bg-[#22C55E] text-white" : "bg-gray-100 text-black"
                } rounded-md focus:outline-none`}
              >
                G
              </button>
            </div>
          </>
        )}
      </div>

      <div className={`pt-20 ${isMenuOpen ? "ml-20" : "ml-20"} `}>
        
      </div> 
        
    </div>
  );
}

export default Leftmenu;