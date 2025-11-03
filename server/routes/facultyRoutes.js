import express from "express";
import {
  getFacultyDetails,
  getFacultyProjects,
  getMarkingSchema,
  getFacultyBroadcasts,
} from "../controllers/facultyController.js";
import jwtAuthMiddleware from "../middlewares/juwAuthMiddleware.js";
import broadcastBlockMiddleware from "../middlewares/broadcastBlockMiddleware.js";

const facultyRouter = express.Router();

facultyRouter.get(
  "/getFacultyDetails/:employeeId",
  jwtAuthMiddleware,
  broadcastBlockMiddleware,
  getFacultyDetails
);

// here school and department are query parameter
facultyRouter.get(
  "/getMarkingSchema",
  jwtAuthMiddleware,
  broadcastBlockMiddleware,
  getMarkingSchema
);

// faculty should always be able to fetch broadcasts (even when blocked)
facultyRouter.get("/broadcasts", jwtAuthMiddleware, getFacultyBroadcasts);

// Protect projects route as well
facultyRouter.get(
  "/:employeeId/projects",
  jwtAuthMiddleware,
  broadcastBlockMiddleware,
  getFacultyProjects
);

export default facultyRouter