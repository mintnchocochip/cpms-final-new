import express from "express";
import {
  createProject,
  getAllGuideProjects,
  getAllPanelProjects,
  getAllProjects,
  updateProjectDetails,
  deleteProject,
  createProjectsBulk,
} from "../controllers/projectController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import jwtAuthMiddleware from "../middlewares/juwAuthMiddleware.js";

const projectRouter = express.Router();

// add new team
projectRouter.post("/create", jwtAuthMiddleware, createProject);
projectRouter.post(
  "/createProjectsBulk",
  jwtAuthMiddleware,
  createProjectsBulk
);

// get project details
projectRouter.get("/all", jwtAuthMiddleware, getAllProjects);

// delete project
projectRouter.delete("/:projectId", jwtAuthMiddleware, deleteProject);

// returns all the project as guide
projectRouter.get("/guide", jwtAuthMiddleware, getAllGuideProjects);

// returns all the projects as panel
projectRouter.get("/panel", jwtAuthMiddleware, getAllPanelProjects);

// seems redendant as all details will be fetched from the "/:facultyId/panel" endpoint, further decision needed

// update an existing project
projectRouter.put("/update", jwtAuthMiddleware, updateProjectDetails);

// these two endpoints does the same and "/:projectId", further decision needed
// projectRouter.put("/:facultyId/:regNo/updateGuideMarks", updateGuideMarks);

// projectRouter.put("/:facultyId/:regNo/updatePanelMarks", updatePanelMarks);

export default projectRouter;
