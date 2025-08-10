import express from "express";
import {
  getAllFaculty,getDefaultDeadline,
  setDefaultDeadline,createFaculty,createFacultyBulk,
  createAdmin,
  updateRequestStatus,
  getAllRequests,
  assignPanelToProject,
  autoCreatePanels,
  createPanelManually,
  assignExistingPanelToProject,
  autoAssignPanelsToProjects,
  deletePanel,
  getAllPanels,
  getAllGuideWithProjects,
  getAllPanelsWithProjects,
  getAllFacultyWithProjects,
  getFacultyBySchoolAndDept,
  createOrUpdateMarkingSchema,
} from "../controllers/adminController.js";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";
import { getAllGuideProjects } from "../controllers/projectController.js";

const adminRouter = express.Router();

adminRouter.post(
  "/markingSchema",
  adminMiddleware,
  createOrUpdateMarkingSchema
);

adminRouter.post("/createAdmin", adminMiddleware, createAdmin);

// Admin should create faculty accounts
adminRouter.post("/createFaculty", adminMiddleware, createFaculty);

adminRouter.get("/getAllFaculty", adminMiddleware, getAllFaculty);

adminRouter.get(
  "/faculty/:school/:department",
  adminMiddleware,
  getFacultyBySchoolAndDept
);

// seems redundant as all details will be fetched from "/getAllGuideProjects" and "/getAllPanelProjects" endpoints
// adminRouter.get(
//   "/allFacultyWithProjects",
//   adminMiddleware,
//   getAllFacultyWithProjects
// );

// get all the guide facuties with their projects
adminRouter.get("/getAllGuideProjects", adminMiddleware, getAllGuideWithProjects);

// get all the panel facuties with their projects
adminRouter.get(
  "/getAllPanelProjects",
  adminMiddleware,
  getAllPanelsWithProjects
);

// retriving all the requests with faculty type as
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

// panel creation, deletion and assingment
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

// this creates new panels before assinging them to the project (these are not existing panels)
// as per the frontend design this should not be used as we create panels before assigning them to projects
// adminRouter.post("/assignPanel", adminMiddleware, assignPanelToProject);

// this we dont need
// adminRouter.post(
//   "/updateStudentDeadline",
//   adminMiddleware,
//   updateStudentDeadline
// );

export default adminRouter;
