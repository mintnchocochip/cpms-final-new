import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./utils/db.js";

import projectRouter from "./routes/projectRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import authRouter from "./routes/authRoutes.js";
import studentRouter from "./routes/studentRoutes.js";
import facultyRouter from "./routes/facultyRoutes.js";

import otpRouter from "./routes/otpRoutes.js";
import helmet from "helmet";

dotenv.config();
connectDB();

const app = express();

// Use Helmet
app.use(helmet());

// Set HSTS for 1 year (in seconds)
// Check if you're in development environment
if (process.env.NODE_ENV !== 'production') {
  // Disable HSTS completely in development
  app.use(helmet({
    hsts: false
  }));
} else {
  // Keep HSTS enabled in production
  app.use(
    helmet.hsts({
      maxAge: 31536000,       // 1 year in seconds
      includeSubDomains: true,
      preload: true,
    })
  );
}


const allowedOrigins = [
  'http://localhost:3000', // for development// your deployed frontend on Vercel
  'http://localhost:5173',
  'https://cpms-latest.vercel.app',
  'https://cpms-latest-projectpurposes-projects.vercel.app',
  'https://cpms-latest-git-main-projectpurposes-projects.vercel.app'
];


app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser()); // good to have for future

const PORT = process.env.PORT || 5000;

// Mount API routes
app.use("/api/auth", authRouter); // POST /api/auth/login
app.use("/api/project", projectRouter); // project routes
app.use("/api/admin", adminRouter); // GET /api/admin/allFaculty etc.
app.use("/api/student", studentRouter);
app.use("/api/faculty", facultyRouter); // GET /api/faculty/getFacultyDetails/:id
app.use("/api/otp", otpRouter);

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
