import cron from "node-cron";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import MarkingSchema from "../models/markingSchema.js";
import Project from "../models/projectSchema.js";
import Faculty from "../models/facultySchema.js";
import Panel from "../models/panelSchema.js";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


function isDeadlineWithinDays(toDate, days) {
  const now = new Date();
  const deadline = new Date(toDate);
  const diffDays = (deadline - now) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= days;
}

cron.schedule("* * * * *", async () => {
  console.log("Cron job running: checking review deadlines...");
  try {
    const allMarkingSchemas = await MarkingSchema.find({});
    console.log(`Found ${allMarkingSchemas.length} marking schemas`);

    for (const schema of allMarkingSchemas) {
      console.log(
        `Checking schema for school=${schema.school} department=${schema.department}`
      );

      for (const review of schema.reviews) {
        console.log(
          `Review: ${review.reviewName}, deadline: ${review.deadline?.to}`
        );

        if (!review.deadline?.to) {
          console.log(`Skipping review ${review.reviewName} - no 'to' date`);
          continue;
        }

        if (!isDeadlineWithinDays(review.deadline.to, 3)) {
          console.log(
            `Skipping review ${review.reviewName} - deadline not within 3 days`
          );
          continue;
        }

        console.log(
          `Processing review: ${review.reviewName} with deadline ${review.deadline.to}`
        );

        // find all projects under this school+department
        const projects = await Project.find({
          school: schema.school,
          department: schema.department,
        })
          .populate("guideFaculty")
          .populate({ path: "panel", populate: { path: "members" } });

        console.log(
          `Found ${projects.length} projects for ${schema.school}-${schema.department} review=${review.reviewName}`
        );

        if (projects.length === 0) {
          console.log(
            `No projects found for schema ${schema.school}-${schema.department}`
          );
          continue;
        }

        for (const project of projects) {
          let recipients = [];
          let subject, text;

          if (review.facultyType === "guide" && project.guideFaculty) {
            recipients = [project.guideFaculty.emailId];
            subject = `Review Deadline Imminent: ${
              review.displayName || review.reviewName
            }`;
            text = `Dear ${project.guideFaculty.name},
The review "${review.displayName || review.reviewName}" for the project "${
              project.name
            }" in ${schema.school} - ${
              schema.department
            } is ending on ${new Date(review.deadline.to).toLocaleString()}.
Please ensure you complete your review before the deadline.

Regards,
CPMS`;
          } else if (
            review.facultyType === "panel" &&
            project.panel &&
            Array.isArray(project.panel.members)
          ) {
            recipients = project.panel.members
              .map((m) => m.emailId)
              .filter((email) => !!email);
            subject = `Panel Review Deadline Imminent: ${
              review.displayName || review.reviewName
            }`;
            text = `Dear Panel Member,
The review "${review.displayName || review.reviewName}" for the project "${
              project.name
            }" in ${schema.school} - ${
              schema.department
            } is ending on ${new Date(review.deadline.to).toLocaleString()}.
Please ensure you complete your panel review before the deadline.

Regards,
CPMS`;
          } else {
            console.log(
              `No recipients found for review ${review.reviewName} of project ${project.name}`
            );
          }

          console.log(`Recipients emails: ${recipients.join(", ")}`);

          for (const email of recipients) {
            try {
              await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject,
                text,
              });
              console.log("EMAIL_USER:", process.env.EMAIL_USER);
              console.log(
                "EMAIL_PASS:",
                process.env.EMAIL_PASS ? "****" : "not set"
              );
              console.log(
                `[MarkingSchema Deadline Reminder] Sent to ${email} for "${review.reviewName}" (Project: ${project.name})`
              );
            } catch (err) {
              console.error("[Reminder Email Error]", email, err.message);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("MarkingSchema deadline cron error:", err);
  }
});