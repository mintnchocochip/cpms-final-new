import express from "express";
import {
  checkRequestStatus,
  requestAdmin,
  batchCheckRequestStatus,
  getFilteredStudents,
  updateStudentDetails,
  deleteStudent, // Add this import
} from "../controllers/studentController.js";

import authMiddleware from "../middlewares/authMiddleware.js";
import jwtAuthMiddleware from "../middlewares/juwAuthMiddleware.js";

const studentRouter = express.Router();

// Get all students filtered by school, department, and specialization
studentRouter.get("/students", jwtAuthMiddleware, getFilteredStudents);

// Request to unlock the students grade
studentRouter.post("/:facultyType/requestAdmin", jwtAuthMiddleware, requestAdmin);
studentRouter.get("/:facultyType/checkRequestStatus", checkRequestStatus);
studentRouter.post("/batchCheckRequestStatus", batchCheckRequestStatus);

// Update student details
studentRouter.put("/:regNo", jwtAuthMiddleware, updateStudentDetails);

// Delete student - Add this route
studentRouter.delete("/:regNo", jwtAuthMiddleware, deleteStudent);

export default studentRouter;
