import xlsx from "xlsx";
import axios from "axios";
import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import connectDB from "./db.js";
import Student from "../models/studentSchema.js";

dotenv.config();

// Configuration
const EXCEL_PATH = "/home/administrator/Desktop/excel-files/Upload/internship_Reg.xlsx";
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api/students";
const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Zjg5N2JlMjJiN2QwODQ3NDRmNjU0OCIsImVtYWlsSWQiOiJhZG1pbkB2aXQuYWMuaW4iLCJlbXBsb3llZUlkIjoiQURNSU4wMDEiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjE4MTU3ODIsImV4cCI6MTc2MTkwMjE4Mn0.vRP4lnIiMidjCgbD__3jsNhEprnlXbA0MkqtYJECO2o";

// Statistics tracking
const stats = {
  total: 0,
  successful: 0,
  failed: 0,
  errors: [],
};

/**
 * Update PPT approval status for a single student
 */
async function updatePPTApproval(regNo) {
  try {
    // First, verify student exists in database
    const student = await Student.findOne({ regNo });
    if (!student) {
      console.error(`❌ Student not found in DB: ${regNo}`);
      stats.errors.push({
        regNo,
        error: "Student not found in database",
      });
      stats.failed++;
      return false;
    }

    // Make API call to update pptApproved status
    const response = await axios.put(
      `${API_BASE_URL}/${regNo}`,
      { pptApproved: true },
      {
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 second timeout
      }
    );

    if (response.data.success) {
      console.log(`✅ ${regNo} - PPT approval updated successfully`);
      stats.successful++;
      return true;
    } else {
      console.error(`❌ ${regNo} - API returned success=false:`, response.data.message);
      stats.errors.push({
        regNo,
        error: response.data.message || "API returned success=false",
      });
      stats.failed++;
      return false;
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    const statusCode = error.response?.status;
    
    console.error(
      `❌ ${regNo} - Failed to update: ${errorMsg}${statusCode ? ` (Status: ${statusCode})` : ""}`
    );
    
    stats.errors.push({
      regNo,
      error: errorMsg,
      statusCode,
    });
    stats.failed++;
    return false;
  }
}

/**
 * Process students in batches with delay between batches
 */
async function processBatch(regNos, batchSize = 10, delayMs = 1000) {
  console.log(`\n🚀 Starting batch processing for ${regNos.length} students...\n`);

  for (let i = 0; i < regNos.length; i += batchSize) {
    const batch = regNos.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(regNos.length / batchSize);

    console.log(
      `📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} students)...`
    );

    // Process batch concurrently
    await Promise.all(batch.map((regNo) => updatePPTApproval(regNo)));

    // Delay between batches to avoid overwhelming the server
    if (i + batchSize < regNos.length) {
      console.log(`⏳ Waiting ${delayMs}ms before next batch...\n`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

/**
 * Generate and save detailed report
 */
function generateReport() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportFileName = `ppt_approval_report_${timestamp}.json`;

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: stats.total,
      successful: stats.successful,
      failed: stats.failed,
      successRate:
        stats.total > 0
          ? ((stats.successful / stats.total) * 100).toFixed(2) + "%"
          : "0%",
    },
    errors: stats.errors,
  };

  // Save report to file
  const reportPath = `./reports/${reportFileName}`;
  
  // Create reports directory if it doesn't exist
  if (!fs.existsSync('./reports')) {
    fs.mkdirSync('./reports');
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📊 Detailed report saved to: ${reportPath}`);

  return report;
}

/**
 * Display summary statistics
 */
function displaySummary() {
  console.log("\n" + "=".repeat(60));
  console.log("📈 SUMMARY REPORT");
  console.log("=".repeat(60));
  console.log(`Total Students:    ${stats.total}`);
  console.log(`✅ Successful:      ${stats.successful}`);
  console.log(`❌ Failed:          ${stats.failed}`);
  console.log(
    `📊 Success Rate:    ${stats.total > 0 ? ((stats.successful / stats.total) * 100).toFixed(2) : 0}%`
  );
  console.log("=".repeat(60));

  if (stats.errors.length > 0) {
    console.log("\n⚠️  Failed Updates:");
    stats.errors.forEach((err) => {
      console.log(
        `  - ${err.regNo}: ${err.error}${err.statusCode ? ` (Status: ${err.statusCode})` : ""}`
      );
    });
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log("🎯 PPT Approval Batch Update Script");
    console.log("=".repeat(60) + "\n");

    // Validate configuration
    if (AUTH_TOKEN === "YOUR_JWT_TOKEN_HERE") {
      throw new Error("❌ Please update AUTH_TOKEN with your actual token");
    }

    // Connect to database
    console.log("🔌 Connecting to database...");
    await connectDB();
    console.log("✅ Database connected successfully\n");

    // Check if Excel file exists
    if (!fs.existsSync(EXCEL_PATH)) {
      throw new Error(`❌ Excel file not found at path: ${EXCEL_PATH}`);
    }

    // Read Excel file
    console.log("📖 Reading Excel file...");
    const workbook = xlsx.readFile(EXCEL_PATH);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Extract registration numbers
    const regNos = data
      .map((row) => row.regno || row.regNo || row.REGNO)
      .filter((regNo) => regNo && String(regNo).trim() !== "");

    if (regNos.length === 0) {
      throw new Error("❌ No registration numbers found in Excel file");
    }

    stats.total = regNos.length;
    console.log(`✅ Found ${regNos.length} registration numbers\n`);

    // Display confirmation
    console.log(`⚠️  You are about to update pptApproved=true for ${regNos.length} students`);
    console.log(`📍 Target URL: ${API_BASE_URL}`);
    console.log(`📍 Excel File: ${EXCEL_PATH}\n`);

    // Process all students
    await processBatch(regNos, 10, 1000); // 10 students per batch, 1 second delay

    // Generate report and display summary
    generateReport();
    displaySummary();

    console.log("\n✨ Script execution completed!\n");

    // Disconnect from database
    await mongoose.disconnect();
    console.log("🔌 Database disconnected");

    // Exit with appropriate code
    process.exit(stats.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("\n❌ Fatal Error:", error.message);
    
    // Attempt to disconnect from database
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.error("Error disconnecting from database:", disconnectError.message);
    }
    
    process.exit(1);
  }
}

// Run the script
main();
