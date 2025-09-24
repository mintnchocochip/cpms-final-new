import xlsx from "xlsx";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const EXCEL_PATH = "E:/Desktop/CPMS/BCSE497J Project -Zeroth Review-Marks.xlsx";
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api";
const AUTH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2Q4OWYwMmUzMmU2NzZhNTg3OGRhNCIsImVtYWlsSWQiOiJhZG1pbkB2aXQuYWMuaW4iLCJlbXBsb3llZUlkIjoiQURNSU4wMDEiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTg2NDI5ODMsImV4cCI6MTc1ODcyOTM4M30.OplMOvKATN-jlrkra2_fPOpKc46W88guQKG-aN2-57A";

const SHEET_NAME = " VTOP -Zeroth Review Mark entry";
const REG_NO_KEY = "Student Register No";
// const MARK_KEY = "Mark (20)";

async function updateGuideReviewMarks() {
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

    // const rawMark = row[MARK_KEY];
    // // Convert mark from 20-scale to 5-scale
    // const mark20 =
    //   typeof rawMark === "number"
    //     ? rawMark
    //     : Number(rawMark?.toString().trim());
    // if (isNaN(mark20)) {
    //   console.warn(
    //     `Skipping row ${index + 1} due to invalid mark: '${rawMark}'`
    //   );
    //   continue;
    // }
    // // Keep decimal values (no rounding)
    // const mark5 = (mark20 / 20) * 5;

    // Create payload: set draftReview to zero and set guideReview1 with mark5
    const payload = {
      PAT: false,
    };

    try {
      const res = await axios.put(`${API_BASE_URL}/student/${regNo}`, payload, {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      });
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

updateGuideReviewMarks().catch((err) => {
  console.error("Unhandled error in updateGuideReviewMarks:", err);
});
