import express from "express";
import Faculty from "../models/facultySchema.js";  // ✅ ADD THIS LINE
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
} from "../controllers/adminController.js";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";

const adminRouter = express.Router();

// ... rest of your routes

adminRouter.post(
  "/markingSchema",
  adminMiddleware,
  createOrUpdateMarkingSchema
);

adminRouter.post("/createAdmin", adminMiddleware, createAdmin);

// Admin should create faculty accounts
adminRouter.post("/createFaculty", adminMiddleware, createFaculty);

// ✅ FIXED: Faculty routes - Handle both all and specific filtering
adminRouter.get(
  "/faculty/:school/:department/:specialization",
  adminMiddleware,
  getAllFaculty
);
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


// ✅ FIXED: Correct route names to match controller functions
// get all the guide faculties with their projects
adminRouter.get("/getAllGuideProjects", adminMiddleware, getAllGuideWithProjects);

// get all the panel faculties with their projects - FIXED NAME
adminRouter.get("/getAllPanelProjects", adminMiddleware, getAllPanelsWithProjects);

// retrieving all the requests with faculty type as
adminRouter.get(
  "/getAllRequests/:facultyType",  
  adminMiddleware,
  getAllRequests
);

adminRouter.post("/createFacultyBulk", adminMiddleware, createFacultyBulk);

// GET /admin/getDefaultDeadline
adminRouter.get('/getDefaultDeadline', adminMiddleware, getDefaultDeadline);

// Update the default Deadline i.e. the systemconfig
adminRouter.post("/setDefaultDeadline", adminMiddleware, setDefaultDeadline);

// approving and rejecting the request
adminRouter.post("/panel/updateRequest", adminMiddleware, updateRequestStatus);
adminRouter.post("/guide/updateRequest", adminMiddleware, updateRequestStatus);

// panel creation, deletion and assignment
adminRouter.post("/createPanel", adminMiddleware, createPanelManually);
adminRouter.post("/autoCreatePanels", adminMiddleware, autoCreatePanels);
adminRouter.delete("/:panelId/deletePanel", adminMiddleware, deletePanel);
adminRouter.get("/getAllPanels", adminMiddleware, getAllPanels);

// assigning panels from the list of created panels
adminRouter.post(
  "/assignPanel",
  adminMiddleware,
  assignExistingPanelToProject
);

adminRouter.post(
  "/autoAssignPanel",
  adminMiddleware,
  autoAssignPanelsToProjects
);

export default adminRouter;
