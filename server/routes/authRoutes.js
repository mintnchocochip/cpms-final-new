import express from "express";
import { facultyLogin } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", facultyLogin);

export default router;
