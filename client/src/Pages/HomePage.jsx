import React from 'react';
import { Navigate } from 'react-router-dom';
import Navbar from "../Components/UniversalNavbar";

const VITHomepage = () => {
    const [navigateTo, setNavigateTo] = React.useState(null);
    const [navigateTo1, setNavigateTo1] = React.useState(null);

    if (navigateTo === "faculty") {
        return <Navigate to="/login" />;
    }

    if (navigateTo1 === "admin") {
        return <Navigate to="/admin/login" />;
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-white flex flex-col items-center justify-center">
                <h1 style={{ color: 'rgba(52, 131, 219, 1)' }} className="text-3xl align-self-center font-semibold text-center">
                    VCapDesk - VIT Capstone Student Management Desk
                </h1>
                <div className="flex gap-12 mt-12">
                    <button
                        className="w-64 h-40 bg-blue-600 text-white text-3xl font-bold rounded-lg shadow-lg hover:bg-blue-700 transition"
                        onClick={() => setNavigateTo("faculty")}
                    >
                        Faculty
                    </button>
                    <button className="w-64 h-40 bg-green-600 text-white text-3xl font-bold rounded-lg shadow-lg hover:bg-green-700 transition"
                        onClick={() => setNavigateTo1("admin")}
                    >
                        Admin
                    </button>
                </div>
            </div>
        </>
    );
};

export default VITHomepage;