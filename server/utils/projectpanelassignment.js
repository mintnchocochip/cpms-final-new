import xlsx from "xlsx";
import axios from "axios";
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./db.js";
import Panel from "../models/panelSchema.js";
import Project from "../models/projectSchema.js";
import Faculty from "../models/facultySchema.js";

dotenv.config();

const EXCEL_PATH = "E:/Desktop/CPMS/mca panel assignement.xlsx"; // Update path if needed
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
    // Project and panel columns - update if your file has different column names
    const projectTitle =
      row["Project"] || row["project"] || row[Object.keys(row)[0]];
    const panelString =
      row["Panel"] ||
      row["panel"] ||
      row["PANEL MEMBERS"] ||
      row[Object.keys(row)[1]];

    if (!projectTitle || !panelString) {
      console.warn("Missing project/panel:", row);
      continue;
    }

    // Extract the employee ids from the panel string (5 digits)
    const panelEmpIds =
      typeof panelString === "string" ? panelString.match(/\b\d{5}\b/g) : [];
    if (!panelEmpIds || panelEmpIds.length < 2) {
      console.warn(
        "Could not extract panel employee IDs for project:",
        projectTitle
      );
      continue;
    }

    // Get faculty ObjectIds for these employee IDs
    const panelMemberDocs = await Faculty.find({
      employeeId: { $in: panelEmpIds.map(String) },
    });
    if (panelMemberDocs.length < panelEmpIds.length) {
      console.warn(
        "Could not resolve all ObjectIds for employee IDs:",
        panelEmpIds,
        "| Got:",
        panelMemberDocs.map((f) => f.employeeId)
      );
      continue;
    }
    const panelMemberObjectIds = panelMemberDocs.map((f) => f._id);

    // Find the panel with the exact members
    const panel = await Panel.findOne({
      members: {
        $all: panelMemberObjectIds,
        $size: panelMemberObjectIds.length,
      },
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

    // Exact match for project name
    const project = await Project.findOne({
      name: projectTitle,
    });
    if (!project) {
      console.error("Project not found:", projectTitle);
      continue;
    }

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
