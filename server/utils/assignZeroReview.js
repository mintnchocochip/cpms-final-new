import xlsx from "xlsx";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const EXCEL_PATH = "E:/Desktop/CPMS/BCSE497J-Project-Zeroth-Review-Marks.xlsx";
const API_BASE_URL =
  process.env.API_BASE_URL || "http://localhost:3000/api/admin";
const AUTH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2QwMGY4MjdmNzI5NDhjMzQzNjY4MSIsImVtYWlsSWQiOiJhZG1pbkB2aXQuYWMuaW4iLCJlbXBsb3llZUlkIjoiQURNSU4wMDEiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTgyODU2NzQsImV4cCI6MTc1ODM3MjA3NH0.t1KSe8rof5vG6r1d97qMuAQGkGX0BYAX4J0Y_-Eb91A";

// Sheet column mapping (change if your columns differ)
const SHEET_NAME = "VTOP -Zeroth Review Mark entry";
const REG_NO_KEY = "Student Register No";
const MARK_KEY = "Mark(5)";

async function updateZerothReviewMarks() {
  const workbook = xlsx.readFile(EXCEL_PATH);
  const sheet = workbook.Sheets[SHEET_NAME];
  const rows = xlsx.utils.sheet_to_json(sheet);

  for (const row of rows) {
    const regNo = row[REG_NO_KEY]?.toString().trim();
    const mark =
      typeof row[MARK_KEY] === "number" ? row[MARK_KEY] : Number(row[MARK_KEY]);

    if (!regNo || isNaN(mark)) {
      console.warn(
        `Skipping row due to missing or invalid data. regNo=${regNo}, mark=${mark}`
      );
      continue;
    }

    const payload = {
      marksUpdate: [
        {
          reviewName: "draftReview", // Or "Review-0", adjust as per your schema!
          marks: { Zero: mark },
        },
      ],
    };

    try {
      const res = await axios.put(
        `${API_BASE_URL}/students/${regNo}`,
        payload,
        { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
      );
      console.log(`Updated ${regNo}:`, res.data);
    } catch (error) {
      console.error(
        `Failed to update ${regNo}:`,
        error.response?.data || error.message
      );
    }
  }
}

updateZerothReviewMarks();
