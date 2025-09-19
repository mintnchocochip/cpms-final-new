import xlsx from "xlsx";
import axios from "axios";
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./db.js";
import Panel from "../models/panelSchema.js";
import Project from "../models/projectSchema.js";
import Faculty from "../models/facultySchema.js";

dotenv.config();

const EXCEL_PATH = "E:/Desktop/CPMS/projects_with_panel_CORRECT_FIXED_692.xlsx";
const API_BASE_URL =
  process.env.API_BASE_URL || "http://localhost:3000/api/admin";
const AUTH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2JmOGU3ZDg4NzdkMDEzODVjZDY3YSIsImVtYWlsSWQiOiJhZG1pbkB2aXQuYWMuaW4iLCJlbXBsb3llZUlkIjoiQURNSU4wMDEiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTgyMDY3NDEsImV4cCI6MTc1ODI5MzE0MX0.udp-Gjv3TdpbAWuYponH2kUf-l9N6BJbewNKoE1o3zs";


async function main() {
  await connectDB();
  const workbook = xlsx.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);

  for (const row of data) {
    const projectTitle = row["project"] ? String(row["project"]).trim() : "";
    const panelString = row["panel"];
    if (!projectTitle || !panelString) {
      console.warn("Missing project/panel:", row);
      continue;
    }

    // Extract 5-digit employee IDs from panel field
    const employeeIds = (panelString.match(/\b\d{5}\b/g) || []).map((eid) =>
      eid.trim()
    );
    if (employeeIds.length < 2) {
      console.warn(
        "Could not extract panel employee IDs for project:",
        projectTitle
      );
      continue;
    }

    // Map employee IDs to faculty ObjectIds
    const memberObjects = await Faculty.find({
      employeeId: { $in: employeeIds },
    });
    if (memberObjects.length !== employeeIds.length) {
      console.error(
        "Some faculty not found for panel:",
        employeeIds,
        memberObjects.map((f) => f.employeeId)
      );
      continue;
    }
    const memberObjectIds = memberObjects.map((f) => f._id);

    // Find the panel by members (ObjectId array)
    const panel = await Panel.findOne({
      members: { $all: memberObjectIds },
    });
    if (!panel) {
      console.error(
        "Panel not found for faculty IDs/objectIds:",
        employeeIds,
        memberObjectIds,
        "for project:",
        projectTitle
      );
      continue;
    }

    // Find project by name, robust to whitespace/casing
    const cleanedProjectTitle = projectTitle.trim();
    const project = await Project.findOne({
      name: { $regex: new RegExp(`^${cleanedProjectTitle}$`, "i") },
    });
    if (!project) {
      console.error("Project not found:", cleanedProjectTitle);
      continue;
    }

    // Assign panel via API
    try {
      const response = await axios.post(
        `${API_BASE_URL}/assignPanel`,
        { panelId: panel._id, projectId: project._id },
        { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
      );
      console.log(
        `Assigned panel to project "${cleanedProjectTitle}":`,
        response.data.success
      );
    } catch (error) {
      console.error(
        `Failed to assign panel to project "${cleanedProjectTitle}":`,
        error.response?.data || error.message
      );
    }
  }
  await mongoose.disconnect();
}

main();
