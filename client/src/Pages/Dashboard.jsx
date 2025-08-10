import { useState } from "react";
import AdminPanelManagement from "./AdminPanelManagement";
import FacultyListView from "./FacultyListView";

const Dashboard = () => {
  const [selectedView, setSelectedView] = useState("panel");

  // const renderView = () => {
  //   switch (selectedView) {
  //     case "panel":
  //       // return <AdminPanelManagement hideNavbar={true} />;
  //     case "faculty":
  //       // return <FacultyListView hideNavbar={true} />;
  //     default:
  //       return <div className="p-8 text-center text-gray-500">Select a section from the dropdown.</div>;
  //   }
  // };

  return (
    <>
      
      <div className="container mx-auto px-4 pt-20  pb-12">
        <div className="flex justify-between items-center mb-6 px-4">
          <h1 className="text-2xl font-bold"></h1>
          <select
            value={selectedView}
            onChange={(e) => setSelectedView(e.target.value)}
            className="border px-2 py-2 rounded shadow"
          >
            <option value="panel">Panel Management</option>
            <option value="faculty">Faculty List</option>
            {/* Add more views here as needed */}
          </select>
        </div>

        <div className="">
          {/* {renderView()} */}
        </div>
      </div>
    </>
  );
};

export default Dashboard;