// adminc.js
import dotenv from "dotenv";
// If you run from server/ directory, this is sufficient:
dotenv.config({path:"D:/BTECH_CSEcore/Projects/pj2/cpms-final/server/.env"});
// Or, if you run from a different directory, use an absolute path:
// dotenv.config({ path: "d:/BTECH_CSEcore/Projects/pj2/cpms-final/server/.env" });

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectDB from "./utils/db.js";
import Faculty from "./models/facultySchema.js";

// Quick sanity check
if (!process.env.MONGOOSE_CONNECTION_STRING) {
  console.error("MONGOOSE_CONNECTION_STRING missing. Check .env and path.");
  process.exit(1);
}

const ADMIN_EMAIL = "admin@vit.ac.in";
const ADMIN_PASSWORD = "VITadmin@123";
const ADMIN_NAME = "Main Admin";
const ADMIN_EMPLOYEE_ID = "ADMIN001";
const ADMIN_SCHOOL = "School of Computing";
const ADMIN_DEPARTMENT = "CSE";

const createAdmin = async () => {
  console.log("Connecting to database...");
  await connectDB();

  try {
    console.log(`Checking if admin user ${ADMIN_EMAIL} already exists...`);
    const existingAdmin = await Faculty.findOne({ emailId: ADMIN_EMAIL });

    if (existingAdmin) {
      console.log(`Admin user ${ADMIN_EMAIL} already exists. No action taken.`);
      return;
    }

    console.log("Hashing admin password...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    const adminUser = new Faculty({
      name: ADMIN_NAME,
      emailId: ADMIN_EMAIL,
      password: hashedPassword,
      employeeId: ADMIN_EMPLOYEE_ID,
      role: "admin",
      school: [ADMIN_SCHOOL],
      department: [ADMIN_DEPARTMENT],
      phoneNumber: "9940573903",
      imageUrl: "",
      specialization: []
    });

    await adminUser.save();
    console.log(`Successfully created admin user: ${ADMIN_NAME} (${ADMIN_EMAIL})`);
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    console.log("Disconnecting from database...");
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
};

createAdmin();
