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
  assignPanelToProject,
  autoAssignPanelsToProjects,
  deletePanel,
  getAllPanels,
  getAllGuideWithProjects,
  getAllPanelsWithProjects,
  createOrUpdateMarkingSchema,
  updateFaculty,
  deleteFacultyByEmployeeId,
  createBroadcastMessage,
  getBroadcastMessages,
  updateBroadcastMessage,
  deleteBroadcastMessage,
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

// Faculty retrival routes
adminRouter.get("/getAllFaculty", adminMiddleware, getAllFaculty);

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
adminRouter.post("/assignPanel", adminMiddleware, assignPanelToProject);
adminRouter.post("/autoAssignPanel", adminMiddleware, autoAssignPanelsToProjects);

// Broadcast routes
adminRouter.post("/broadcasts", adminMiddleware, createBroadcastMessage);
adminRouter.get("/broadcasts", adminMiddleware, getBroadcastMessages);
adminRouter.patch("/broadcasts/:id", adminMiddleware, updateBroadcastMessage);
adminRouter.delete("/broadcasts/:id", adminMiddleware, deleteBroadcastMessage);

export default adminRouter;
