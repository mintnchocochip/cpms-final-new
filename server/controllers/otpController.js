import Faculty from "../models/facultySchema.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

// In-memory OTP storage
const otpStorage = new Map();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create transporter function with error handling
const createEmailTransporter = () => {
  try {
    console.log("=== CREATING EMAIL TRANSPORTER ===");

    const emailConfig = {
      user: "thejeshwaarsathishkumar@gmail.com",
      pass: "spagnmfzndzlmels",
      from: "VIT Faculty Portal <thejeshwaarsathishkumar@gmail.com>",
    };

    console.log("Email config:", {
      user: emailConfig.user,
      passLength: emailConfig.pass.length,
      from: emailConfig.from,
    });

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass,
      },
    });

    console.log("✅ Transporter created successfully");
    return transporter;
  } catch (error) {
    console.error("❌ Failed to create transporter:", error);
    return null;
  }
};

// Send OTP via Email
export const sendOTP = async (req, res) => {
  try {
    console.log("=== SEND OTP REQUEST ===");
    console.log("Request body:", req.body);

    const { emailId } = req.body;

    // Validate input
    if (!emailId) {
      console.log("❌ Email ID missing");
      return res.status(400).json({
        success: false,
        message: "Email ID is required!",
      });
    }

    // Create transporter for each request
    const transporter = createEmailTransporter();

    if (!transporter) {
      console.error("❌ Failed to create email transporter");
      return res.status(500).json({
        success: false,
        message:
          "Email service is not available. Please contact administrator.",
      });
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(emailId)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address!",
      });
    }

    // Check if faculty exists
    const faculty = await Faculty.findOne({ emailId });
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address!",
      });
    }

    console.log("Faculty found:", faculty.name);

    // Generate OTP
    const otp = generateOTP();

    // Store OTP with 10-minute expiration
    otpStorage.set(emailId, {
      otp: otp,
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0,
      facultyName: faculty.name,
    });

    // Simple email content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2455a3;">VIT Faculty Portal - Password Reset</h2>
        <p>Hello ${faculty.name},</p>
        <p>Your OTP for password reset is: <strong style="font-size: 24px; color: #2455a3;">${otp}</strong></p>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>VIT Faculty Portal Team</p>
      </div>
    `;

    console.log("Attempting to send email...");
    console.log("Transporter available:", !!transporter);

    const mailOptions = {
      from: "VIT Faculty Portal <thejeshwaarsathishkumar@gmail.com>",
      to: emailId,
      subject: "VIT Faculty Portal - Password Reset OTP",
      html: htmlContent,
    };

    // Send email with proper error handling
    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent successfully!");
    console.log("Message ID:", info.messageId);
    console.log("Generated OTP:", otp); // Remove this in production

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email successfully! Please check your inbox.",
      expiresIn: "10 minutes",
    });
  } catch (error) {
    console.error("❌ Send OTP error:", error);

    // Remove OTP if email sending fails
    if (req.body?.emailId) {
      otpStorage.delete(req.body.emailId);
    }

    // Handle specific Gmail errors
    let errorMessage = "Error sending OTP email. Please try again.";

    if (error.code === "EAUTH") {
      errorMessage =
        "Email authentication failed. Please contact administrator.";
    } else if (error.code === "ENOTFOUND") {
      errorMessage = "Network error. Please check your internet connection.";
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message,
    });
  }
};

// Verify OTP and Reset Password - FIXED VERSION
export const verifyOTPAndResetPassword = async (req, res) => {
  try {
    console.log("=== VERIFY OTP AND RESET PASSWORD ===");
    console.log("Request body:", req.body);

    const { emailId, otp, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!emailId || !otp || !newPassword || !confirmPassword) {
      console.log("❌ Missing required fields");
      return res.status(400).json({
        success: false,
        message: "All fields are required!",
      });
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      console.log("❌ Passwords do not match");
      return res.status(400).json({
        success: false,
        message: "Passwords do not match!",
      });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      console.log("❌ Password too short");
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long!",
      });
    }

    // Check if OTP exists
    const otpData = otpStorage.get(emailId);
    if (!otpData) {
      console.log("❌ OTP not found");
      return res.status(400).json({
        success: false,
        message: "OTP not found or expired. Please request a new OTP.",
      });
    }

    console.log("OTP data found:", otpData);

    // Check if OTP expired
    if (Date.now() > otpData.expires) {
      console.log("❌ OTP expired");
      otpStorage.delete(emailId);
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    // Check attempt limit
    if (otpData.attempts >= 3) {
      console.log("❌ Too many attempts");
      otpStorage.delete(emailId);
      return res.status(400).json({
        success: false,
        message: "Too many failed attempts. Please request a new OTP.",
      });
    }

    // Verify OTP
    if (otpData.otp !== otp.trim()) {
      console.log("❌ OTP mismatch");
      // FIXED: Properly update the attempts in storage
      otpData.attempts += 1;
      otpStorage.set(emailId, otpData); // This was missing!

      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${3 - otpData.attempts} attempts remaining.`,
      });
    }

    console.log("✅ OTP verified successfully");

    // Find faculty
    const faculty = await Faculty.findOne({ emailId });
    if (!faculty) {
      console.log("❌ Faculty not found");
      otpStorage.delete(emailId);
      return res.status(404).json({
        success: false,
        message: "Faculty not found!",
      });
    }

    console.log("Faculty found for password update:", faculty.name);

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    console.log("✅ Password hashed successfully");

    // Update password
    faculty.password = hashedPassword;
    await faculty.save();
    console.log("✅ Password updated in database");

    // Remove OTP from storage
    otpStorage.delete(emailId);
    console.log("✅ OTP removed from storage");

    console.log("🎉 Password reset successful for:", faculty.name);

    return res.status(200).json({
      success: true,
      message:
        "Password reset successful! You can now login with your new password.",
    });
  } catch (error) {
    console.error("❌ Verify OTP and reset password error:", error);
    console.error("Error stack:", error.stack);

    // Clean up OTP on error
    if (req.body?.emailId) {
      otpStorage.delete(req.body.emailId);
    }

    return res.status(500).json({
      success: false,
      message: "Error resetting password. Please try again.",
      error: error.message,
    });
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  try {
    console.log("=== RESEND OTP REQUEST ===");
    console.log("Request body:", req.body);

    const { emailId } = req.body;

    if (!emailId) {
      return res.status(400).json({
        success: false,
        message: "Email ID is required!",
      });
    }

    // Clear existing OTP
    otpStorage.delete(emailId);

    // Use the same sendOTP logic
    return await sendOTP(req, res);
  } catch (error) {
    console.error("❌ Resend OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Error resending OTP. Please try again.",
      error: error.message,
    });
  }
};
