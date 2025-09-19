import xlsx from "xlsx";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const EXCEL_PATH =
  "E:/Desktop/CPMS/Copy of PMCA698J-Internship-1_and_disseration-1_-_Review_1_marks_as_per_template(2).xlsx";
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api";
const AUTH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2QwMGY4MjdmNzI5NDhjMzQzNjY4MSIsImVtYWlsSWQiOiJhZG1pbkB2aXQuYWMuaW4iLCJlbXBsb3llZUlkIjoiQURNSU4wMDEiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTgyODU2NzQsImV4cCI6MTc1ODM3MjA3NH0.t1KSe8rof5vG6r1d97qMuAQGkGX0BYAX4J0Y_-Eb91A";

const SHEET_NAME = "Mark entry template"; // Leading space
const REG_NO_KEY = "Student Register No";
const MARK_KEY = "Mark (20)";

async function updateZerothReviewMarks() {
  const workbook = xlsx.readFile(EXCEL_PATH);
  const sheet = workbook.Sheets[SHEET_NAME];
  const rows = xlsx.utils.sheet_to_json(sheet);

  console.log(`Loaded sheet: ${SHEET_NAME}`);
  console.log(`Total rows loaded: ${rows.length}`);

  for (const [index, row] of rows.entries()) {
    console.log(`Processing row ${index + 1}:`, row);

    const regNoRaw = row[REG_NO_KEY];
    const regNo = regNoRaw ? regNoRaw.toString().replace(/\s+/g, "") : "";
    if (!regNo) {
      console.warn(`Skipping row ${index + 1} due to missing regNo`);
      continue;
    }

    const rawMark = row[MARK_KEY];
    const mark =
      typeof rawMark === "number"
        ? rawMark
        : Number(rawMark?.toString().trim());
    if (isNaN(mark)) {
      console.warn(
        `Skipping row ${index + 1} due to invalid mark: '${rawMark}'`
      );
      continue;
    }

    const payload = {
      marksUpdate: [
        {
          reviewName: "draftReview",
          marks: { "Title and Problem statement": mark },
          comments: "auto filled",
          attendance: { value: true, locked: false },
        },
      ],
    };

    try {
      const res = await axios.put(
        `${API_BASE_URL}/student/${regNo}`,
        payload,
        { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
      );
      if (res.data && res.data.success) {
        console.log(`Successfully updated student ${regNo}`);
      } else {
        console.warn(
          `Update response for student ${regNo} missing success flag:`,
          res.data
        );
      }
    } catch (error) {
      console.error(
        `Failed to update student ${regNo}:`,
        error.response?.data || error.message || error
      );
    }
  }
}

updateZerothReviewMarks().catch((err) => {
  console.error("Unhandled error in updateZerothReviewMarks:", err);
});
