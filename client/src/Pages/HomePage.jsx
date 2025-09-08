import React from 'react';
import { Navigate } from 'react-router-dom';
import Adm from '../Images/admin-alt.png';
import Fac from '../Images/Faculty.png';
import Navbar from '../Components/UniversalNavbar';

const VITHomepage = () => {
    const [navigateTo, setNavigateTo] = React.useState(null);
    const [navigateTo1, setNavigateTo1] = React.useState(null);

    if (navigateTo === 'faculty') {
        return <Navigate to='/login' />;
    }
    if (navigateTo1 === 'admin') {
        return <Navigate to='/admin/login' />;
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center p-4 sm:p-6">
                {/* Hero Section */}
                <div className="text-center mb-8 sm:mb-12 max-w-4xl mx-auto">
                    <h1 
                        style={{ color: 'rgba(52, 131, 219, 1)' }} 
                        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4 leading-tight"
                    >
                        VCapDesk
                    </h1>
                    <p className="text-lg sm:text-xl md:text-2xl text-gray-600 font-medium">
                        VIT Capstone Student Management Desk
                    </p>
                    <div className="w-24 h-1 bg-blue-500 mx-auto mt-6 rounded-full"></div>
                </div>

                {/* Login Options */}
                <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 md:gap-12 w-full max-w-2xl">
                    <div className="flex-1 group">
                        <button
                            className="w-full h-36 sm:h-40 md:h-44 bg-gradient-to-br from-blue-600 to-blue-700 text-white text-xl sm:text-2xl md:text-3xl font-bold rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:from-blue-700 hover:to-blue-800 flex flex-col items-center justify-center space-y-3"
                            onClick={() => setNavigateTo('faculty')}
                        >
                            <img src={Fac} alt="Faculty" className="h-10 sm:h-12 md:h-14" />
                            <span>Faculty</span>
                        </button>
                    </div>
                    
                    <div className="flex-1 group">
                        <button 
                            className="w-full h-36 sm:h-40 md:h-44 bg-gradient-to-br from-green-600 to-green-700 text-white text-xl sm:text-2xl md:text-3xl font-bold rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:from-green-700 hover:to-green-800 flex flex-col items-center justify-center space-y-3"
                            onClick={() => setNavigateTo1('admin')}
                        >
                            <img src={Adm} alt="Admin" className="h-10 sm:h-12 md:h-14" />
                            <span>Admin</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default VITHomepage;