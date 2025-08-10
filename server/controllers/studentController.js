import Faculty from "../models/facultySchema.js";
import Student from "../models/studentSchema.js";
import Request from "../models/requestSchema.js";

// Faculty requests admin to unlock a review
export async function requestAdmin(req, res, next) {
  try {
    const { facultyType } = req.params;
    const { regNo, reviewType, reason } = req.body;

    console.log("Request admin called:", { facultyType, regNo, reviewType });

    // Validate facultyType
    if (!["guide", "panel"].includes(facultyType)) {
      return res.status(400).json({ message: "Invalid faculty type" });
    }

    // Get faculty from authenticated user
    const facultyDoc = await Faculty.findById(req.user.id);
    if (!facultyDoc) {
      return res
        .status(404)
        .json({ message: "Faculty not found in database!" });
    }
    const facultyId = facultyDoc._id;

    // Find student by registration number
    const student = await Student.findOne({ regNo });
    if (!student) {
      return res.status(404).json({ message: "Student not found!" });
    }

    // Validate reviewType exists in student's reviews Map
    if (!student.reviews.has(reviewType)) {
      return res.status(400).json({
        message: `Invalid reviewType: ${reviewType} for student ${regNo}`,
      });
    }

    // Allowed review types per faculty role - not needed as the marking is dynamic for each school and dept
    // const allowedReviewTypes = {
    //   guide: ["draftReview", "review0", "review1"],
    //   panel: ["review2", "review3", "review4"],
    // };

    // if (!allowedReviewTypes[facultyType].includes(reviewType)) {
    //   return res.status(403).json({
    //     message: `${facultyType} faculty cannot request access to ${reviewType}. Allowed types: ${allowedReviewTypes[
    //       facultyType
    //     ].join(", ")}`,
    //   });
    // }

    // Create new request document with single faculty ObjectId (not array)
    const request = new Request({
      faculty: facultyId,
      facultyType,
      student: student._id,
      reviewType,
      reason,
      status: "pending",
    });

    await request.save();
    console.log("Request saved successfully");
    return res.status(201).json({ message: "Request successfully posted" });
  } catch (error) {
    console.error("Error in requestAdmin:", error);
    return res.status(500).json({ message: error.message });
  }
}

// Check latest request status for a student-review-facultyType combo
export async function checkRequestStatus(req, res) {
  try {
    const { facultyType } = req.params;
    const { regNo, reviewType } = req.query;

    if (!["guide", "panel"].includes(facultyType)) {
      return res.status(400).json({ message: "Invalid faculty type" });
    }

    const student = await Student.findOne({ regNo });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Validate review exists
    if (!student.reviews.has(reviewType)) {
      return res
        .status(400)
        .json({ message: `Review type '${reviewType}' not found for student` });
    }

    const request = await Request.findOne({
      student: student._id,
      facultyType,
      reviewType,
    }).sort({ createdAt: -1 }); // latest request

    return res.json({ status: request?.status || "none" });
  } catch (error) {
    return res.status(500).json({ message: error.stack });
  }
}

// Check statuses in bulk
export async function batchCheckRequestStatus(req, res) {
  try {
    const { requests } = req.body;
    if (!Array.isArray(requests)) {
      return res.status(400).json({ message: "Requests must be an array" });
    }

    const statuses = {};

    for (const reqObj of requests) {
      const { regNo, reviewType, facultyType } = reqObj;

      if (!regNo || !reviewType || !facultyType) continue;
      if (!["guide", "panel"].includes(facultyType)) continue;

      const student = await Student.findOne({ regNo });
      if (!student || !student.reviews.has(reviewType)) {
        statuses[`${regNo}_${reviewType}`] = { status: "none" };
        continue;
      }

      const request = await Request.findOne({
        student: student._id,
        facultyType,
        reviewType,
      }).sort({ createdAt: -1 });

      statuses[`${regNo}_${reviewType}`] = {
        status: request?.status || "none",
      };
    }

    return res.json({ statuses });
  } catch (error) {
    return res.status(500).json({ message: error.stack });
  }
}
