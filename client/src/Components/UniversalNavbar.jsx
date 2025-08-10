import Logo from "../Images/VITLogoEmblem.png";
import Leftmenu from "./Leftmenu";      // Admin menu
import Leftmenu1 from "./Leftmenu1";    // Faculty menu
import Profile1 from "./Profile1";      // Universal profile

function UniversalNavbar({ 
  userType = "auto", 
  showLeftMenu = "auto",
  campusName = "(Chennai Campus)" 
}) {
    // Auto-detect user type if not specified
    const detectedUserType = userType === "auto" 
        ? (window.location.pathname.includes('/admin') ? 'admin' : 'faculty')
        : userType;

    // Auto-detect if left menu should be shown based on current path
    const shouldShowLeftMenu = () => {
        if (showLeftMenu === true) return true;
        if (showLeftMenu === false) return false;
        
        // Auto-detect based on current path
        const currentPath = window.location.pathname;
        
        // FIX: Only hide left menu on these specific pages
        const hideMenuPaths = [
            '/forgot-password',  // Fixed path format
            '/login',
            '/admin/login',
            '/',           // Homepagehi
            '/Home'        // Homepage alternative
        ];
        
        // Check if current path should hide menu (exact match or starts with path)
        const shouldHide = hideMenuPaths.some(path => {
            if (path === '/') {
                return currentPath === '/'; // Exact match for homepage
            }
            return currentPath === path || currentPath.startsWith(path + '/');
        });
        
        console.log('Menu visibility check:');
        console.log('- Current path:', currentPath);
        console.log('- Should hide menu:', shouldHide);
        
        // FIX: Show menu on ALL pages except the ones in hideMenuPaths
        return !shouldHide;
    };

    // FIX: Check if profile should be shown
    const shouldShowProfile = () => {
        const currentPath = window.location.pathname;
        
        // Hide profile on login and forgot password pages
        const hideProfilePaths = [
            '/login',
            '/admin/login',
            '/forgot-password',
            
            '/Home'  
        ];
        
        return !hideProfilePaths.some(path => 
            currentPath === path || currentPath.includes(path)
        );
    };

    const displayLeftMenu = shouldShowLeftMenu();
    const displayProfile = shouldShowProfile();

    console.log('UniversalNavbar Debug:');
    console.log('- Current path:', window.location.pathname);
    console.log('- User type:', detectedUserType);
    console.log('- Show left menu:', displayLeftMenu);
    console.log('- Show profile:', displayProfile);

    return (
        <div className="fixed top-0 left-0 w-screen h-14 z-50 bg-[linear-gradient(130deg,_rgba(36,85,163,1)_23%,_rgba(52,151,219,1)_52%,_rgba(52,142,219,1)_58%,_rgba(52,131,219,1)_65%,_rgba(40,116,166,1)_74%)]">
            <div className="flex justify-between items-center h-full">
                <div className="flex items-center pl-4 h-full">
                    {/* Show left menu on ALL pages except login and homepage */}
                    {displayLeftMenu && (
                        detectedUserType === 'admin' 
                            ? <Leftmenu />      // Admin menu
                            : <Leftmenu1 />     // Faculty menu
                    )}
                    
                    <div className="flex items-center space-x-2">
                        <img src={Logo} className="h-12 w-12" alt="Logo" />
                        <p className="m-0 leading-none text-white font-serif font-bold text-4xl">VIT</p>
                        <p className="m-0 leading-none text-white">{campusName}</p>
                    </div>
                </div>

                <div className="pr-4 flex items-center">
                    {/* FIX: Show profile only when shouldShowProfile returns true */}
                    {displayProfile && (
                        <Profile1 userType={detectedUserType} />
                    )}
                </div>
            </div>
        </div>
    );
}

export default UniversalNavbar;
