import express from "express";
import {
  getFacultyDetails,
  getFacultyProjects,
  getMarkingSchema,
  getFacultyBroadcasts,
} from "../controllers/facultyController.js";
import jwtAuthMiddleware from "../middlewares/juwAuthMiddleware.js";

const facultyRouter = express.Router();

facultyRouter.get("/getFacultyDetails/:employeeId", jwtAuthMiddleware, getFacultyDetails);

// here school and department are query parameter
facultyRouter.get("/getMarkingSchema", jwtAuthMiddleware, getMarkingSchema);

facultyRouter.get("/broadcasts", jwtAuthMiddleware, getFacultyBroadcasts);

facultyRouter.get("/:employeeId/projects", getFacultyProjects);

export default facultyRouter