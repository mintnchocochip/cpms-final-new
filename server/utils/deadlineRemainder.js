import cron from "node-cron";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import MarkingSchema from "../models/markingSchema.js";
import Project from "../models/projectSchema.js";
import Faculty from "../models/facultySchema.js";
import Panel from "../models/panelSchema.js";

// Create email transporter
const createEmailTransporter = () => {
  try {
    const emailConfig = {
      user: "thejeshwaarsathishkumar@gmail.com",
      pass: "spagnmfzndzlmels",
    };

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      secure: true,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass,
      },
      pool: true,
      maxConnections: 1,
      rateDelta: 20000,
      rateLimit: 5,
    });
    
    console.log("✅ Transporter created successfully");
    return { transporter, emailConfig };
  } catch (error) {
    console.error("❌ Failed to create transporter:", error);
    return null;
  }
};

// Track sent reminders to prevent duplicates
const sentReminders = new Map();

// Check if today is the deadline day
function isDeadlineToday(toDate) {
  const now = new Date();
  const deadline = new Date(toDate);
  const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const deadlineDateOnly = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
  return nowDateOnly.getTime() === deadlineDateOnly.getTime();
}

// Get time remaining until deadline
function getTimeRemainingUntilDeadline(toDate) {
  const now = new Date();
  const deadline = new Date(toDate);
  const diffMs = deadline - now;
  if (diffMs <= 0) {
    return "OVERDUE";
  }
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) {
    return `${hours} hours and ${minutes} minutes`;
  } else {
    return `${minutes} minutes`;
  }
}

// SEND SAMPLE TEST EMAIL WITH ACTUAL FORMAT TO THEJESHWAAR
const sendSampleTestEmail = async () => {
  try {
    console.log("🧪 SENDING SAMPLE TEST EMAIL WITH ACTUAL FORMAT...");
    
    const transporterResult = createEmailTransporter();
    if (!transporterResult) return;

    const { transporter, emailConfig } = transporterResult;
    await transporter.verify();

    // Create sample email that looks exactly like the real ones will look
    const sampleEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 3px solid #ff9800;">
        <div style="background-color: #e3f2fd; padding: 10px; margin-bottom: 15px; border-radius: 5px; text-align: center;">
          <strong style="color: #1976d2;">🧪 SAMPLE FORMAT - This is how real deadline emails will look to faculty</strong>
        </div>
        <h2 style="color: #ff9800;">⏰ DEADLINE TODAY</h2>
        <p>Dear <strong>Dr. Faculty Name</strong>,</p>
        <p>This is an <strong style="color: #ff9800;">URGENT REMINDER</strong> that the deadline for the review is <strong>TODAY</strong>:</p>
        <div style="background-color: #fff3e0; padding: 15px; border-left: 4px solid #ff9800; margin: 15px 0;">
          <h3 style="margin: 0; color: #2455a3;">AI-Based Healthcare Management System</h3>
          <p style="margin: 5px 0;"><strong>Review:</strong> Project Report Submission (Guide Review 3)</p>
          <p style="margin: 5px 0;"><strong>School:</strong> SCOPE</p>
          <p style="margin: 5px 0;"><strong>Department:</strong> BTech</p>
        </div>
        <div style="background-color: #ff9800; color: white; padding: 15px; text-align: center; margin: 15px 0; border-radius: 5px;">
          <h3 style="margin: 0;">Deadline: ${new Date().toLocaleString()} (Sample Deadline)</h3>
          <p style="margin: 5px 0; font-size: 18px; font-weight: bold;">
            Time Remaining: 8 hours and 45 minutes (Sample)
          </p>
        </div>
        <p style="font-size: 16px; color: #ff9800; font-weight: bold;">
          Please complete your review TODAY before the deadline to avoid any delays.
        </p>
        <div style="background-color: #e8f5e8; padding: 15px; border-left: 4px solid #4CAF50; margin: 15px 0;">
          <h3 style="margin: 0; color: #2e7d32;">📧 SAMPLE EMAIL INFO</h3>
          <p style="margin: 5px 0;"><strong>This sample shows exactly how real emails will look</strong></p>
          <p style="margin: 5px 0;"><strong>Real emails sent daily at 10:00 AM</strong></p>
          <p style="margin: 5px 0;"><strong>Only sent when deadlines match today's date</strong></p>
          <p style="margin: 5px 0;"><strong>Test sent to:</strong> thejeshwaarsathishkumar@gmail.com</p>
        </div>
        <p>Best regards,<br><strong>CPMS Team</strong></p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
        <p style="font-size: 12px; color: #666;">This is a sample showing the actual email format that faculty will receive.</p>
      </div>
    `;

    await transporter.sendMail({
      from: `VIT Faculty Portal - SAMPLE <${emailConfig.user}>`,
      to: "thejeshwaarsathishkumar@gmail.com",
      subject: "🧪 SAMPLE: This is how deadline emails will look to faculty",
      html: sampleEmailContent,
      headers: {
        'X-Priority': '1',
        'Importance': 'high',
      },
    });

    console.log("✅ SAMPLE TEST EMAIL SENT TO THEJESHWAAR");
    
  } catch (error) {
    console.error("❌ Failed to send sample test email:", error);
  }
};

// SEND SAMPLE TEST EMAIL IMMEDIATELY WHEN SERVER STARTS
sendSampleTestEmail();

// RUN CRON JOB DAILY AT 10:00 AM (NOT EVERY MINUTE)
cron.schedule("0 10 * * *", async () => {
  console.log("=== DAILY DEADLINE CHECK AT 10:00 AM ===");
  console.log("Date & Time:", new Date().toLocaleString());
  
  try {
    const transporterResult = createEmailTransporter();
    if (!transporterResult) return;
    
    const { transporter, emailConfig } = transporterResult;
    await transporter.verify();
    console.log("✅ Email system verified");
    
    // Set longer timeout for mongoose operations
    const allMarkingSchemas = await MarkingSchema.find({}).maxTimeMS(30000);
    console.log(`📋 Found ${allMarkingSchemas.length} marking schemas`);
    
    let totalEmailsSent = 0;
    let deadlinesFound = 0;
    
    for (const schema of allMarkingSchemas) {
      console.log(`\n🔍 Checking ${schema.school} - ${schema.department}`);
      
      for (const review of schema.reviews) {
        if (!review.deadline?.to) continue;
        
        if (isDeadlineToday(review.deadline.to)) {
          deadlinesFound++;
          console.log(`🚨 DEADLINE TODAY: ${review.reviewName} (${review.displayName})`);
          
          const projects = await Project.find({
            school: schema.school,
            department: schema.department,
          }).populate("guideFaculty").populate({ 
            path: "panel", 
            populate: { path: "members" } 
          }).maxTimeMS(30000);
          
          console.log(`📚 Found ${projects.length} projects`);
          
          for (const project of projects) {
            // Use date instead of hour for daily check
            const reminderKey = `${project._id}-${review.reviewName}-${new Date().toDateString()}`;
            
            if (sentReminders.has(reminderKey)) {
              console.log(`📧 Email already sent today for ${project.name}`);
              continue;
            }
            
            let recipients = [];
            let recipientName;
            const timeRemaining = getTimeRemainingUntilDeadline(review.deadline.to);
            const isOverdue = timeRemaining === "OVERDUE";
            
            // SEND TO ACTUAL FACULTY
            if (review.facultyType === "guide" && project.guideFaculty) {
              recipients = [project.guideFaculty.emailId];
              recipientName = project.guideFaculty.name;
            } else if (review.facultyType === "panel" && project.panel?.members?.length > 0) {
              recipients = project.panel.members.map(m => m.emailId).filter(email => !!email);
              recipientName = "Panel Member";
            }
            
            if (recipients.length === 0) {
              console.log(`⚠️ No recipients for ${project.name}`);
              continue;
            }
            
            const subject = isOverdue ? 
              `🚨 OVERDUE: Review Deadline Passed - ${review.displayName || review.reviewName}` :
              `🚨 URGENT: Review Deadline TODAY - ${review.displayName || review.reviewName}`;
            
            const htmlContent = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 3px solid ${isOverdue ? '#d32f2f' : '#ff9800'};">
                <h2 style="color: ${isOverdue ? '#d32f2f' : '#ff9800'};">${isOverdue ? '🚨 OVERDUE DEADLINE' : '⏰ DEADLINE TODAY'}</h2>
                <p>Dear <strong>${recipientName}</strong>,</p>
                <p>${isOverdue ? 
                  'This is an <strong style="color: #d32f2f;">URGENT NOTICE</strong> that the deadline for the review has PASSED:' :
                  'This is an <strong style="color: #ff9800;">URGENT REMINDER</strong> that the deadline for the review is <strong>TODAY</strong>:'
                }</p>
                <div style="background-color: ${isOverdue ? '#ffebee' : '#fff3e0'}; padding: 15px; border-left: 4px solid ${isOverdue ? '#d32f2f' : '#ff9800'}; margin: 15px 0;">
                  <h3 style="margin: 0; color: #2455a3;">${project.name}</h3>
                  <p style="margin: 5px 0;"><strong>Review:</strong> ${review.displayName || review.reviewName}</p>
                  <p style="margin: 5px 0;"><strong>School:</strong> ${schema.school}</p>
                  <p style="margin: 5px 0;"><strong>Department:</strong> ${schema.department}</p>
                </div>
                <div style="background-color: ${isOverdue ? '#d32f2f' : '#ff9800'}; color: white; padding: 15px; text-align: center; margin: 15px 0; border-radius: 5px;">
                  <h3 style="margin: 0;">Deadline: ${new Date(review.deadline.to).toLocaleString()}</h3>
                  <p style="margin: 5px 0; font-size: 18px; font-weight: bold;">
                    ${isOverdue ? 'DEADLINE HAS PASSED!' : `Time Remaining: ${timeRemaining}`}
                  </p>
                </div>
                <p style="font-size: 16px; ${isOverdue ? 'color: #d32f2f;' : 'color: #ff9800;'} font-weight: bold;">
                  ${isOverdue ? 
                    'Please complete your review IMMEDIATELY to avoid further delays.' :
                    'Please complete your review TODAY before the deadline to avoid any delays.'
                  }
                </p>
                <p>Best regards,<br><strong>CPMS Team</strong></p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                <p style="font-size: 12px; color: #666;">This is an automated deadline notification. Please do not reply to this email.</p>
              </div>
            `;
            
            // Send to all recipients
            for (const email of recipients) {
              try {
                console.log(`📤 Sending deadline email to: ${email}`);
                
                await transporter.sendMail({
                  from: `VIT Faculty Portal - URGENT <${emailConfig.user}>`,
                  to: email,
                  subject: subject,
                  html: htmlContent,
                  headers: {
                    'X-Priority': '1',
                    'Importance': 'high',
                  },
                });
                
                console.log(`✅ Email sent to ${email}`);
                totalEmailsSent++;
                
                // Delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 3000));
                
              } catch (emailError) {
                console.error(`❌ Failed to send to ${email}:`, emailError);
              }
            }
            
            // Mark as sent for today
            sentReminders.set(reminderKey, {
              timestamp: Date.now(),
              project: project.name,
              review: review.reviewName,
              emailsSent: recipients.length
            });
          }
        }
      }
    }
    
    console.log(`\n📊 DAILY SUMMARY:`);
    console.log(`🎯 Deadlines found today: ${deadlinesFound}`);
    console.log(`📧 Total emails sent: ${totalEmailsSent}`);
    console.log(`⏰ Next check: Tomorrow at 10:00 AM`);
    console.log("=== DAILY DEADLINE CHECK COMPLETED ===\n");
    
  } catch (err) {
    console.error("❌ Daily deadline check error:", err);
  }
});

export default cron;

console.log("🚀 Deadline notification system started");
console.log("🧪 Sample email sent to thejeshwaarsathishkumar@gmail.com");
console.log("⏰ Daily deadline check scheduled for 10:00 AM every day");
console.log("📧 Real deadline emails will be sent to actual faculty when deadlines match");
