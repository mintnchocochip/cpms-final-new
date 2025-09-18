import xlsx from "xlsx";
import axios from "axios";
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./db.js";
import Panel from "../models/panelSchema.js";
import Project from "../models/projectSchema.js";

dotenv.config();

const EXCEL_PATH = "E:/Desktop/CPMS/projects_with_panel.xlsx";
const API_BASE_URL =
  process.env.API_BASE_URL || "http://localhost:3000/api/admin";
const AUTH_TOKEN = process.env.ADMIN_JWT_TOKEN; // Admin JWT

async function main() {
  await connectDB();
  const workbook = xlsx.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);

  for (const row of data) {
    // Adjust field names if needed
    const projectTitle = row["project"] || row["Project"];
    const panelString = row["panel"];
    if (!projectTitle || !panelString) {
      console.warn("Missing project/panel:", row);
      continue;
    }
    // Extract the employee ids from the panel field (5 digits)
    const panelEmpIds = panelString.match(/\b\d{5}\b/g);
    if (!panelEmpIds || panelEmpIds.length < 2) {
      console.warn(
        "Could not extract panel employee IDs for project:",
        projectTitle
      );
      continue;
    }
    // Find the panel in DB by the pair of members
    const panel = await Panel.findOne({
      memberEmployeeIds: { $all: panelEmpIds.map(String) },
    });
    if (!panel) {
      console.error(
        "Panel not found for:",
        panelEmpIds,
        "for project:",
        projectTitle
      );
      continue;
    }
    // Find the project in DB (by title, adjust if you have a better unique column)
    const project = await Project.findOne({ title: projectTitle });
    if (!project) {
      console.error("Project not found:", projectTitle);
      continue;
    }

    // Assign via API
    try {
      const response = await axios.post(
        `${API_BASE_URL}/assignPanel`,
        { panelId: panel._id, projectId: project._id },
        { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
      );
      console.log(
        `Assigned panel to project "${projectTitle}":`,
        response.data.success
      );
    } catch (error) {
      console.error(
        `Failed to assign panel to project "${projectTitle}":`,
        error.response?.data || error.message
      );
    }
  }
  await mongoose.disconnect();
}

main();
