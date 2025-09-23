import xlsx from "xlsx";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const EXCEL_PATH = "./projects-with-panel.xlsx"; // Adjust path as needed
const API_BASE_URL =
  process.env.API_BASE_URL || "http://localhost:3000/api/admin";
const AUTH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2QwMGY4MjdmNzI5NDhjMzQzNjY4MSIsImVtYWlsSWQiOiJhZG1pbkB2aXQuYWMuaW4iLCJlbXBsb3llZUlkIjoiQURNSU4wMDEiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTgyODU2NzQsImV4cCI6MTc1ODM3MjA3NH0.t1KSe8rof5vG6r1d97qMuAQGkGX0BYAX4J0Y_-Eb91A"; // You need to set this JWT token for admin auth

async function assignPanelsManually() {
  const workbook = xlsx.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const projects = xlsx.utils.sheet_to_json(sheet);

  for (const project of projects) {
    // Adjust keys based on your sheet columns
    const projectId =
      project["Class Nbr"] ||
      project["ProjectId"] ||
      project["Student Register No"];
    const panelMemberStr = project["Panel Member"];

    if (!panelMemberStr || !projectId) {
      console.warn(
        "Skipping project due to missing Project ID or Panel Member"
      );
      continue;
    }

    // Extract employee IDs (assumed 5-digit numbers)
    const empIds = panelMemberStr.match(/\b\d{5}\b/g);
    if (!empIds || empIds.length < 2) {
      console.warn(`Invalid panel member format for project ${projectId}`);
      continue;
    }

    const payload = {
      projectId,
      // According to your backend, you might accept an array of faculty employeeIds or panel ID; adjust accordingly
      panelFacultyEmployeeIds: empIds.slice(0, 2),
    };

    try {
      const response = await axios.post(
        `${API_BASE_URL}/assignPanel`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${AUTH_TOKEN}`,
          },
        }
      );
      console.log(`Project ${projectId} assigned to panel:`, response.data);
    } catch (error) {
      console.error(
        `Failed to assign panel for project ${projectId}`,
        error.response?.data || error.message
      );
    }
  }
}

assignPanelsManually();