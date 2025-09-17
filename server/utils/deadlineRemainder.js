import cron from "node-cron";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import MarkingSchema from "../models/markingSchema.js";
import Project from "../models/projectSchema.js";
import Faculty from "../models/facultySchema.js";
import Panel from "../models/panelSchema.js";

// Create email transporter with correct method name
const createEmailTransporter = () => {
  try {
    console.log("=== CREATING CRON EMAIL TRANSPORTER ===");
    
    const emailConfig = {
      user: "thejeshwaarsathishkumar@gmail.com",
      pass: "spagnmfzndzlmels",
    };

    console.log("Email config:", {
      user: emailConfig.user,
      passLength: emailConfig.pass.length,
    });

    // FIX: Use createTransport instead of createTransporter
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
    
    console.log("✅ Cron transporter created successfully");
    return { transporter, emailConfig };
  } catch (error) {
    console.error("❌ Failed to create cron transporter:", error);
    return null;
  }
};

// Track sent reminders to prevent duplicates
const sentReminders = new Map();

function isDeadlineWithinDays(toDate, days) {
  const now = new Date();
  const deadline = new Date(toDate);
  const diffDays = (deadline - now) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= days;
}

// Run every minute (as requested)
cron.schedule("0 9 * * *", async () => {
  console.log("=== CRON JOB RUNNING ===");
  console.log("Checking review deadlines at:", new Date().toISOString());
  
  try {
    // Create fresh transporter for each cron run
    const transporterResult = createEmailTransporter();
    
    if (!transporterResult) {
      console.error("❌ Failed to create email transporter for cron job");
      return;
    }

    const { transporter, emailConfig } = transporterResult;

    // Verify transporter connection
    try {
      console.log("🔍 Verifying email transporter...");
      await transporter.verify();
      console.log("✅ Email transporter verified successfully");
    } catch (verifyError) {
      console.error("❌ Email transporter verification failed:", verifyError);
      console.error("Verify error details:", verifyError.message);
      return;
    }

    const allMarkingSchemas = await MarkingSchema.find({});
    console.log(`Found ${allMarkingSchemas.length} marking schemas`);
    
    for (const schema of allMarkingSchemas) {
      console.log(
        `\n--- Checking schema for school=${schema.school} department=${schema.department} ---`
      );
      
      for (const review of schema.reviews) {
        console.log(
          `Review: ${review.reviewName}, deadline: ${review.deadline?.to}`
        );
        
        if (!review.deadline?.to) {
          console.log(`⚠️ Skipping review ${review.reviewName} - no 'to' date`);
          continue;
        }
        
        if (!isDeadlineWithinDays(review.deadline.to, 3)) {
          console.log(
            `⚠️ Skipping review ${review.reviewName} - deadline not within 3 days`
          );
          continue;
        }
        
        console.log(
          `🔍 Processing review: ${review.reviewName} with deadline ${review.deadline.to}`
        );
        
        // Find all projects under this school+department
        const projects = await Project.find({
          school: schema.school,
          department: schema.department,
        })
          .populate("guideFaculty")
          .populate({ 
            path: "panel", 
            populate: { path: "members" } 
          });
        
        console.log(
          `Found ${projects.length} projects for ${schema.school}-${schema.department} review=${review.reviewName}`
        );
        
        if (projects.length === 0) {
          console.log(
            `ℹ️ No projects found for schema ${schema.school}-${schema.department}`
          );
          continue;
        }
        
        let totalEmailsSent = 0;
        
        for (const project of projects) {
          // Create unique key with hour to send once per hour (to avoid spam)
          const currentHour = new Date().getHours();
          const reminderKey = `${project._id}-${review.reviewName}-${new Date(review.deadline.to).toDateString()}-${currentHour}`;
          
          // Check if reminder already sent this hour
          if (sentReminders.has(reminderKey)) {
            console.log(`📧 Reminder already sent this hour for project ${project.name} - ${review.reviewName}`);
            continue;
          }
          
          let recipients = [];
          let subject, htmlContent, recipientName;
          
          if (review.facultyType === "guide" && project.guideFaculty) {
            recipients = [project.guideFaculty.emailId];
            recipientName = project.guideFaculty.name;
            subject = `🚨 Review Deadline Reminder: ${review.displayName || review.reviewName}`;
            
            htmlContent = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #d32f2f;">⏰ Review Deadline Reminder</h2>
                <p>Dear <strong>${recipientName}</strong>,</p>
                <p>This is a reminder that the review "<strong>${review.displayName || review.reviewName}</strong>" for the project:</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #2455a3; margin: 15px 0;">
                  <h3 style="margin: 0; color: #2455a3;">${project.name}</h3>
                  <p style="margin: 5px 0;"><strong>School:</strong> ${schema.school}</p>
                  <p style="margin: 5px 0;"><strong>Department:</strong> ${schema.department}</p>
                </div>
                <p><strong style="color: #d32f2f;">Deadline: ${new Date(review.deadline.to).toLocaleString()}</strong></p>
                <p>Please ensure you complete your review before the deadline to avoid any delays.</p>
                <p>Best regards,<br><strong>CPMS Team</strong></p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                <p style="font-size: 12px; color: #666;">This is an automated reminder. Please do not reply to this email.</p>
              </div>
            `;
          } else if (
            review.facultyType === "panel" &&
            project.panel &&
            Array.isArray(project.panel.members) &&
            project.panel.members.length > 0
          ) {
            recipients = project.panel.members
              .map((m) => m.emailId)
              .filter((email) => !!email);
            
            recipientName = "Panel Member";
            subject = `🚨 Panel Review Deadline Reminder: ${review.displayName || review.reviewName}`;
            
            htmlContent = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #d32f2f;">⏰ Panel Review Deadline Reminder</h2>
                <p>Dear <strong>Panel Member</strong>,</p>
                <p>This is a reminder that the panel review "<strong>${review.displayName || review.reviewName}</strong>" for the project:</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #2455a3; margin: 15px 0;">
                  <h3 style="margin: 0; color: #2455a3;">${project.name}</h3>
                  <p style="margin: 5px 0;"><strong>School:</strong> ${schema.school}</p>
                  <p style="margin: 5px 0;"><strong>Department:</strong> ${schema.department}</p>
                  <p style="margin: 5px 0;"><strong>Guide:</strong> ${project.guideFaculty ? project.guideFaculty.name : 'N/A'}</p>
                </div>
                <p><strong style="color: #d32f2f;">Deadline: ${new Date(review.deadline.to).toLocaleString()}</strong></p>
                <p>Please ensure you complete your panel review before the deadline.</p>
                <p>Best regards,<br><strong>CPMS Team</strong></p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                <p style="font-size: 12px; color: #666;">This is an automated reminder. Please do not reply to this email.</p>
              </div>
            `;
          } else {
            console.log(
              `⚠️ No recipients found for review ${review.reviewName} of project ${project.name}`
            );
            continue;
          }
          
          if (recipients.length === 0) {
            console.log(
              `⚠️ No valid email addresses for review ${review.reviewName} of project ${project.name}`
            );
            continue;
          }
          
          console.log(`📤 Sending emails to: ${recipients.join(", ")}`);
          
          let emailsSentForProject = 0;
          
          for (const email of recipients) {
            try {
              console.log(`📧 Attempting to send email to: ${email}`);
              
              const mailOptions = {
                from: `VIT Faculty Portal <${emailConfig.user}>`,
                to: email,
                subject: subject,
                html: htmlContent,
                headers: {
                  'X-Priority': '3',
                  'X-Mailer': 'CPMS Notification System',
                },
              };
              
              console.log("Mail options:", {
                from: mailOptions.from,
                to: mailOptions.to,
                subject: mailOptions.subject,
                hasHtml: !!mailOptions.html
              });
              
              const info = await transporter.sendMail(mailOptions);
              
              console.log(
                `✅ Email sent successfully to ${email} for "${review.reviewName}" (Project: ${project.name}) - Message ID: ${info.messageId}`
              );
              
              emailsSentForProject++;
              totalEmailsSent++;
              
              // Add delay between emails to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 2000));
              
            } catch (emailError) {
              console.error(`❌ Failed to send email to ${email}:`, emailError);
              console.error("Email error details:", {
                code: emailError.code,
                command: emailError.command,
                response: emailError.response,
                responseCode: emailError.responseCode
              });
            }
          }
          
          // Mark reminder as sent if at least one email was successful
          if (emailsSentForProject > 0) {
            sentReminders.set(reminderKey, {
              timestamp: Date.now(),
              project: project.name,
              review: review.reviewName,
              emailsSent: emailsSentForProject
            });
            console.log(`✅ Reminder marked as sent for project: ${project.name}`);
          }
        }
        
        console.log(`📊 Total emails sent for review ${review.reviewName}: ${totalEmailsSent}`);
      }
    }
    
    // Clean up old reminder tracking (older than 24 hours)
    const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
    let cleanedCount = 0;
    
    for (const [key, data] of sentReminders.entries()) {
      if (data.timestamp < dayAgo) {
        sentReminders.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old reminder records`);
    }
    
    console.log(`📈 Current reminder tracking entries: ${sentReminders.size}`);
    console.log("=== CRON JOB COMPLETED ===\n");
    
  } catch (err) {
    console.error("❌ MarkingSchema deadline cron error:", err);
    console.error("Error stack:", err.stack);
  }
});

// Export for use in other modules
export default cron;

console.log("🚀 Cron job scheduled to run every minute");
