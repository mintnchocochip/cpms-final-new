import express from "express";
import {
  checkRequestStatus,
  requestAdmin,
  batchCheckRequestStatus,
  getFilteredStudents,
  updateStudentDetails,
} from "../controllers/studentController.js";

import authMiddleware from "../middlewares/authMiddleware.js";
import jwtAuthMiddleware from "../middlewares/juwAuthMiddleware.js";

const studentRouter = express.Router();

// Get all students filtered by school, department, and specialization
studentRouter.get("/students", jwtAuthMiddleware, getFilteredStudents);

// request to unlock the students grade
studentRouter.post("/:facultyType/requestAdmin", jwtAuthMiddleware, requestAdmin);
studentRouter.get("/:facultyType/checkRequestStatus", checkRequestStatus);
studentRouter.post("/batchCheckRequestStatus", batchCheckRequestStatus);

// update student details
studentRouter.put("/:regNo", jwtAuthMiddleware, updateStudentDetails);

export default studentRouter;
