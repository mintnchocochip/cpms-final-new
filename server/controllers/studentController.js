import Faculty from "../models/facultySchema.js";
import Student from "../models/studentSchema.js";
import Request from "../models/requestSchema.js";
import MarkingSchema from "../models/markingSchema.js";

export const getMarkingSchema = async (req, res) => {
  try {
    const { school, department } = req.query;

    if (!school || !department) {
      return res.status(400).json({
        message: "School and department parameters are required",
      });
    }

    // Query your marking schema collection - adjust the model name and fields as needed
    const markingSchema = await MarkingSchema.findOne({
      school: school,
      department: department,
    });

    if (!markingSchema) {
      return res.status(404).json({
        message: "Marking schema not found for this school and department",
      });
    }

    res.status(200).json({
      success: true,
      schema: markingSchema,
    });
  } catch (error) {
    console.error("Error fetching marking schema:", error);
    res.status(500).json({
      message: "Failed to fetch marking schema",
      error: error.message,
    });
  }
};
// Fetch students based on optional school, department, specialization filters
export async function getFilteredStudents(req, res) {
  try {
    const { school, department, specialization } = req.query;

    // Build dynamic filter object
    const filter = {};
    if (school) filter.school = school;
    if (department) filter.department = department;
    if (specialization) filter.specialization = specialization;

    // Query students matching the filter (if filter is empty returns all)
    const students = await Student.find(filter);

    return res.json({ students });
  } catch (error) {
    return res.status(500).json({ message: error.stack });
  }
}

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

export const updateStudentDetails = async (req, res) => {
  try {
    const { regNo } = req.params;
    const updateFields = req.body;

    const allowedFields = [
      "name",
      "emailId",
      "school",
      "department",
      "pptApproved",
      "deadline",
      "PAT", 
    ];
    const updates = {};
    for (const field of allowedFields) {
      if (updateFields[field] !== undefined) {
        updates[field] = updateFields[field];
      }
    }

    let marksUpdateOps = {};
    if (Array.isArray(updateFields.marksUpdate)) {
      for (const reviewUpdate of updateFields.marksUpdate) {
        const { reviewName, marks, comments, attendance } = reviewUpdate;

        // Add marks updates
        for (const [componentName, markValue] of Object.entries(marks || {})) {
          marksUpdateOps[`reviews.${reviewName}.marks.${componentName}`] =
            markValue;
        }
        // Add comments if present
        if (comments !== undefined) {
          marksUpdateOps[`reviews.${reviewName}.comments`] = comments;
        }
        // Add attendance if present
        if (attendance !== undefined) {
          marksUpdateOps[`reviews.${reviewName}.attendance`] = attendance;
        }
      }
    } else if (updateFields.marksUpdate) {
      // For backward compatibility (single review update)
      const { reviewName, marks, comments, attendance } =
        updateFields.marksUpdate;
      for (const [componentName, markValue] of Object.entries(marks || {})) {
        marksUpdateOps[`reviews.${reviewName}.marks.${componentName}`] =
          markValue;
      }
      if (comments !== undefined) {
        marksUpdateOps[`reviews.${reviewName}.comments`] = comments;
      }
      if (attendance !== undefined) {
        marksUpdateOps[`reviews.${reviewName}.attendance`] = attendance;
      }
    }

    const updateOps = Object.keys(updates).length > 0 ? { ...updates } : {};
    if (Object.keys(marksUpdateOps).length > 0) {
      Object.assign(updateOps, marksUpdateOps);
    }

    const updatedStudent = await Student.findOneAndUpdate(
      { regNo },
      { $set: updateOps },
      { new: true }
    );

    if (!updatedStudent) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Student details updated successfully.",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Error updating student details:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};


export const deleteStudent = async (req, res) => {
  try {
    const { regNo } = req.params;

    const deletedStudent = await Student.findOneAndDelete({ regNo });

    if (!deletedStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    // Also cleanup related requests
    await Request.deleteMany({ student: deletedStudent._id });

    return res.status(200).json({
      success: true,
      message: "Student deleted successfully.",
      student: deletedStudent,
    });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
// Add this to your existing student controller/routes file
