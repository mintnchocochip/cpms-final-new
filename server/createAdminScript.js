import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import Faculty from "./models/facultySchema.js";

dotenv.config();

const ADMIN_EMAIL = "admin@vit.ac.in";
const ADMIN_PASSWORD = "admin";
const ADMIN_NAME = "Main Admin";
const ADMIN_EMPLOYEE_ID = "ADMIN001";
const ADMIN_SCHOOL = "School of Computing"; // Adjust as necessary
const ADMIN_DEPARTMENT = "CSE"; // Adjust as necessary

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

    console.log(`Admin user ${ADMIN_EMAIL} not found. Creating...`);

    // Hash password (consider enforcing password policy in real use)
    console.log("Hashing admin password...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    const adminUser = new Faculty({
      name: ADMIN_NAME,
      emailId: ADMIN_EMAIL,
      password: hashedPassword,
      employeeId: ADMIN_EMPLOYEE_ID,
      role: "admin",
      school: ADMIN_SCHOOL,
      department: ADMIN_DEPARTMENT,
      imageUrl: "",
    });

    await adminUser.save();
    console.log(
      `Successfully created admin user: ${ADMIN_NAME} (${ADMIN_EMAIL})`
    );
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    console.log("Disconnecting from database...");
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
};

createAdmin();
