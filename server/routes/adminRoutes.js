import express from "express";
import Faculty from "../models/facultySchema.js";
import {
  getAllFaculty,
  getDefaultDeadline,
  setDefaultDeadline,
  createFaculty,
  createFacultyBulk,
  createAdmin,
  updateRequestStatus,
  getAllRequests,
  autoCreatePanels,
  createPanelManually,
  assignExistingPanelToProject,
  autoAssignPanelsToProjects,
  deletePanel,
  getAllPanels,
  getAllGuideWithProjects,
  getAllPanelsWithProjects,
  createOrUpdateMarkingSchema,
  updateFaculty,
  deleteFacultyByEmployeeId,
} from "../controllers/adminController.js";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";

const adminRouter = express.Router();

// Marking schema routes
adminRouter.post("/markingSchema", adminMiddleware, createOrUpdateMarkingSchema);

// Admin creation
adminRouter.post("/createAdmin", adminMiddleware, createAdmin);

// Faculty creation
adminRouter.post("/createFaculty", adminMiddleware, createFaculty);
adminRouter.post("/createFacultyBulk", adminMiddleware, createFacultyBulk);

// ✅ FIXED: Faculty management routes
adminRouter.get("/getAllFaculty", adminMiddleware, async (req, res) => {
  try {
    console.log("=== getAllFaculty Route Called ===");
    console.log("Query params:", req.query);
    
    const { school, department } = req.query;
    
    let query = { role: "faculty" };
    
    // ✅ FIXED: Use $in operator for array fields
    if (school) {
      query.school = { $in: [school] };
    }
    
    if (department) {
      query.department = { $in: [department] };
    }

    console.log("Mongoose query:", JSON.stringify(query, null, 2));

    const faculty = await Faculty.find(query).sort({ name: 1 });
    
    console.log("Faculty found:", faculty.length);

    res.status(200).json({
      success: true,
      data: faculty.map((f) => ({
        _id: f._id,
        imageUrl: f.imageUrl,
        name: f.name,
        employeeId: f.employeeId,
        emailId: f.emailId,
        role: f.role,
        school: f.school,
        department: f.department,
        specialization: f.specialization,
      })),
    });
  } catch (error) {
    console.error("=== ERROR in getAllFaculty ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ✅ FIXED: Use adminRouter instead of router
adminRouter.get('/getAllFaculty/:school', adminMiddleware, getAllFaculty); // Filter by school
adminRouter.get('/getAllFaculty/:school/:department', adminMiddleware, getAllFaculty); // Filter by school and department
adminRouter.get('/getAllFaculty/:school/:department/:specialization', adminMiddleware, getAllFaculty); // Filter by all three

// Faculty update and delete routes
adminRouter.put('/faculty/:employeeId', adminMiddleware, updateFaculty); // Update faculty
adminRouter.delete('/faculty/:employeeId', adminMiddleware, deleteFacultyByEmployeeId); // Delete faculty

// Project routes
adminRouter.get("/getAllGuideProjects", adminMiddleware, getAllGuideWithProjects);
adminRouter.get("/getAllPanelProjects", adminMiddleware, getAllPanelsWithProjects);

// Request routes
adminRouter.get("/getAllRequests/:facultyType", adminMiddleware, getAllRequests);

// Deadline routes
adminRouter.get('/getDefaultDeadline', adminMiddleware, getDefaultDeadline);
adminRouter.post("/setDefaultDeadline", adminMiddleware, setDefaultDeadline);

// Request approval routes
adminRouter.post("/panel/updateRequest", adminMiddleware, updateRequestStatus);
adminRouter.post("/guide/updateRequest", adminMiddleware, updateRequestStatus);

// Panel routes
adminRouter.post("/createPanel", adminMiddleware, createPanelManually);
adminRouter.post("/autoCreatePanels", adminMiddleware, autoCreatePanels);
adminRouter.delete("/:panelId/deletePanel", adminMiddleware, deletePanel);
adminRouter.get("/getAllPanels", adminMiddleware, getAllPanels);

// Panel assignment routes
adminRouter.post("/assignPanel", adminMiddleware, assignExistingPanelToProject);
adminRouter.post("/autoAssignPanel", adminMiddleware, autoAssignPanelsToProjects);

export default adminRouter;
