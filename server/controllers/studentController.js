import Faculty from "../models/facultySchema.js";
import Student from "../models/studentSchema.js";
import Request from "../models/requestSchema.js";
import MarkingSchema from "../models/markingSchema.js";
import Project from "../models/projectSchema.js";
import { logger, safeMeta } from "../utils/logger.js";

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
    const students = await Student.find(filter).lean();

    // Process students to ensure pptApproved field is properly structured
    const processedStudents = students.map(student => {
      // Convert MongoDB Map to plain object for reviews
      let processedReviews = {};
      if (student.reviews) {
        if (student.reviews instanceof Map) {
          processedReviews = Object.fromEntries(student.reviews);
        } else if (typeof student.reviews === 'object') {
          processedReviews = { ...student.reviews };
        }
      }

      // Convert deadline Map to plain object
      let processedDeadlines = {};
      if (student.deadline) {
        if (student.deadline instanceof Map) {
          processedDeadlines = Object.fromEntries(student.deadline);
        } else if (typeof student.deadline === 'object') {
          processedDeadlines = { ...student.deadline };
        }
      }

      return {
        ...student,
        reviews: processedReviews,
        deadline: processedDeadlines,
        // Always return pptApproved object with proper structure and fallback values
        pptApproved: {
          approved: student.pptApproved?.approved ?? false,
          locked: student.pptApproved?.locked ?? false,
        },
      };
    });

    return res.json({ students: processedStudents });
  } catch (error) {
    return res.status(500).json({ message: error.stack });
  }
}

// Faculty requests admin to unlock a review
export async function requestAdmin(req, res, next) {
  try {
    const { facultyType } = req.params;
    const { regNo, reviewType, reason } = req.body;

  logger.info('request_admin_called', safeMeta({ facultyType, regNo, reviewType, user: req.user?.id }));

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
  logger.info('request_saved', safeMeta({ requestId: request._id, faculty: { id: facultyId, name: facultyDoc.name, employeeId: facultyDoc.employeeId }, student: student._id, reviewType }));
    return res.status(201).json({ message: "Request successfully posted" });
  } catch (error) {
  logger.error('request_admin_error', safeMeta({ error: error?.message, stack: error?.stack }));
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

  logger.info('update_student_called', safeMeta({ regNo, user: req.user?.id }));
  logger.debug('update_student_payload', safeMeta({ regNo, updateFieldsKeys: Object.keys(updateFields || {}) }));

    // Allowed fields for direct update
    const allowedFields = [
      "name",
      "emailId",
      "school",
      "department",
      "pptApproved",
      "deadline",
      "PAT",
      "requiresContribution",
      "contributionType", // ✅ NEW: Added contributionType
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (updateFields[field] !== undefined) {
        updates[field] = updateFields[field];
      }
    }

    // Validate requiresContribution if provided
    if (
      updateFields.requiresContribution !== undefined &&
      typeof updateFields.requiresContribution !== "boolean"
    ) {
      logger.warn('invalid_requiresContribution', safeMeta({ regNo, requiresContribution: updateFields.requiresContribution }));
      return res.status(400).json({
        success: false,
        message: "requiresContribution must be a boolean value",
      });
    }

    // ✅ NEW: Validate contributionType if provided
    if (updateFields.contributionType !== undefined) {
      const validContributionTypes = [
        'none',
        'Patent Filed',
        'Journal Publication',
        'Book Chapter Contribution'
      ];

      if (!validContributionTypes.includes(updateFields.contributionType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid contribution type. Must be one of: ${validContributionTypes.join(', ')}`,
          allowedValues: validContributionTypes,
        });
      }

  logger.info('update_contribution_type', safeMeta({ regNo, contributionType: updateFields.contributionType }));
    }

    // ✅ NEW: Logic validation - if requiresContribution is false, contributionType should be 'none'
    if (updateFields.requiresContribution === false && updateFields.contributionType && updateFields.contributionType !== 'none') {
  logger.warn('contribution_type_mismatch_forced', safeMeta({ regNo, forcedTo: 'none', provided: updateFields.contributionType }));
      updates.contributionType = 'none';
    }

    // Validate school and department change
    if (updateFields.school || updateFields.department) {
      const student = await Student.findOne({ regNo });
      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found.",
        });
      }

      const newSchool = updateFields.school || student.school;
      const newDepartment = updateFields.department || student.department;

      // Check if marking schema exists for new school/department
      const markingSchema = await MarkingSchema.findOne({
        school: newSchool,
        department: newDepartment,
      });

      if (!markingSchema) {
        return res.status(400).json({
          success: false,
          message: `No marking schema found for school: ${newSchool}, department: ${newDepartment}`,
        });
      }

      logger.info('marking_schema_found_on_student_update', safeMeta({ regNo, newSchool, newDepartment, requiresContribution: markingSchema.requiresContribution, contributionType: markingSchema.contributionType }));

      // ✅ NEW: Optionally inherit contribution settings from new schema if not explicitly provided
      if (updateFields.requiresContribution === undefined && updateFields.contributionType === undefined) {
  logger.info('inheriting_contribution_settings', safeMeta({ regNo, fromSchema: { requiresContribution: markingSchema.requiresContribution, contributionType: markingSchema.contributionType } }));
        updates.requiresContribution = markingSchema.requiresContribution || false;
        updates.contributionType = markingSchema.contributionType || 'none';
      }
    }

    // Handle marks, comments, and attendance updates
    let marksUpdateOps = {};
    if (Array.isArray(updateFields.marksUpdate)) {
      logger.info('processing_marks_updates', safeMeta({ regNo, updatesCount: updateFields.marksUpdate?.length || 0 }));

      for (const reviewUpdate of updateFields.marksUpdate) {
        const { reviewName, marks, comments, attendance, locked } =
          reviewUpdate;

        if (!reviewName) {
          return res.status(400).json({
            success: false,
            message: "reviewName is required in marksUpdate array",
          });
        }

  logger.info('updating_review', safeMeta({ regNo, reviewName }));

        // Add marks updates
        if (marks && typeof marks === "object") {
          for (const [componentName, markValue] of Object.entries(marks)) {
            if (typeof markValue !== "number") {
              logger.warn('invalid_mark_value', safeMeta({ regNo, reviewName, componentName, markValue }));
              return res.status(400).json({
                success: false,
                message: `Mark value for ${componentName} must be a number`,
              });
            }
            marksUpdateOps[`reviews.${reviewName}.marks.${componentName}`] =
              markValue;
          }
        }

        // Add comments if present
        if (comments !== undefined) {
          if (typeof comments !== "string") {
            logger.warn('invalid_comments_type', safeMeta({ regNo, reviewName, commentsType: typeof comments }));
            return res.status(400).json({
              success: false,
              message: "Comments must be a string",
            });
          }
          marksUpdateOps[`reviews.${reviewName}.comments`] = comments;
        }

        // Add attendance if present
        if (attendance !== undefined) {
          if (
            typeof attendance !== "object" ||
            typeof attendance.value !== "boolean"
          ) {
            logger.warn('invalid_attendance_type', safeMeta({ regNo, reviewName, attendance }));
            return res.status(400).json({
              success: false,
              message:
                "Attendance must be an object with a boolean 'value' property",
            });
          }
          marksUpdateOps[`reviews.${reviewName}.attendance`] = attendance;
        }

        // Add locked status if present
        if (locked !== undefined) {
          if (typeof locked !== "boolean") {
            return res.status(400).json({
              success: false,
              message: "Locked must be a boolean value",
            });
          }
          marksUpdateOps[`reviews.${reviewName}.locked`] = locked;
        }
      }
    } else if (updateFields.marksUpdate) {
      // For backward compatibility (single review update)
    logger.info('processing_single_review_update', safeMeta({ regNo }));

      const { reviewName, marks, comments, attendance, locked } =
        updateFields.marksUpdate;

      if (!reviewName) {
        return res.status(400).json({
          success: false,
          message: "reviewName is required in marksUpdate",
        });
      }

  logger.info('updating_single_review', safeMeta({ regNo, reviewName }));

      // Add marks updates
      if (marks && typeof marks === "object") {
        for (const [componentName, markValue] of Object.entries(marks)) {
          if (typeof markValue !== "number") {
            return res.status(400).json({
              success: false,
              message: `Mark value for ${componentName} must be a number`,
            });
          }
          marksUpdateOps[`reviews.${reviewName}.marks.${componentName}`] =
            markValue;
        }
      }

      if (comments !== undefined) {
        if (typeof comments !== "string") {
          return res.status(400).json({
            success: false,
            message: "Comments must be a string",
          });
        }
        marksUpdateOps[`reviews.${reviewName}.comments`] = comments;
      }

      if (attendance !== undefined) {
        if (
          typeof attendance !== "object" ||
          typeof attendance.value !== "boolean"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Attendance must be an object with a boolean 'value' property",
        });
        }
        marksUpdateOps[`reviews.${reviewName}.attendance`] = attendance;
      }

      if (locked !== undefined) {
        if (typeof locked !== "boolean") {
          return res.status(400).json({
            success: false,
            message: "Locked must be a boolean value",
          });
        }
        marksUpdateOps[`reviews.${reviewName}.locked`] = locked;
      }
    }

    // Combine all update operations
    const updateOps = Object.keys(updates).length > 0 ? { ...updates } : {};
    if (Object.keys(marksUpdateOps).length > 0) {
      Object.assign(updateOps, marksUpdateOps);
    }

    // Check if there are any updates to apply
    if (Object.keys(updateOps).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    // Enrich logs with actor (faculty) info and existing student snapshot
    const actor = req.user?.id ? await Faculty.findById(req.user.id).select('name employeeId').lean() : null;
    const existingStudent = await Student.findOne({ regNo }).lean();
    // Try to find the project and panel associated with this student to log panel info
    let projectForStudent = null;
    try {
      if (existingStudent) {
        projectForStudent = await Project.findOne({ students: existingStudent._id })
          .populate({ path: 'panel', populate: { path: 'members', model: 'Faculty', select: 'name employeeId' } })
          .lean();
      }
    } catch (e) {
      // non-fatal for logging
      logger.warn('project_lookup_failed_for_logging', safeMeta({ regNo, error: e?.message }));
    }

    // Build a human-friendly summary of marks/comments being applied
    const marksSummary = [];
    if (Array.isArray(updateFields.marksUpdate)) {
      for (const ru of updateFields.marksUpdate) {
        marksSummary.push({
          reviewName: ru.reviewName,
          marks: ru.marks || null,
          comments: ru.comments || null,
          attendance: ru.attendance || null,
          locked: ru.locked !== undefined ? ru.locked : null,
        });
      }
    } else if (updateFields.marksUpdate) {
      const ru = updateFields.marksUpdate;
      marksSummary.push({
        reviewName: ru.reviewName,
        marks: ru.marks || null,
        comments: ru.comments || null,
        attendance: ru.attendance || null,
        locked: ru.locked !== undefined ? ru.locked : null,
      });
    }

    const pptChange = updates.pptApproved !== undefined ? { before: existingStudent?.pptApproved || null, after: updates.pptApproved } : null;

    logger.info('faculty_marks_update_attempt', safeMeta({
      actor: actor ? { id: actor._id, name: actor.name, employeeId: actor.employeeId } : null,
      regNo,
      marksSummary,
      pptChange,
      otherUpdates: Object.keys(updates).length ? updates : null,
      project: projectForStudent ? { id: projectForStudent._id, name: projectForStudent.name, panel: projectForStudent.panel ? { id: projectForStudent.panel._id, members: projectForStudent.panel.members } : null } : null,
    }));

    // Perform the update with validation
    const updatedStudent = await Student.findOneAndUpdate(
      { regNo },
      { $set: updateOps },
      {
        new: true,
        runValidators: true, // Enable schema validation
      }
    );

    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

  logger.info('student_updated_success', safeMeta({ regNo, studentId: updatedStudent._id, updatedFields: Object.keys(updateOps), requiresContribution: updatedStudent.requiresContribution, contributionType: updatedStudent.contributionType, user: req.user?.id }));

    return res.status(200).json({
      success: true,
      message: "Student details updated successfully.",
      student: updatedStudent,
      updatedFields: Object.keys(updateOps),
    });
  } catch (error) {
    logger.error('error_updating_student', safeMeta({ regNo, error: error?.message, stack: error?.stack }));

    // Handle validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.message,
        details: Object.keys(error.errors).map((key) => ({
          field: key,
          message: error.errors[key].message,
        })),
      });
    }

    // Handle cast errors (invalid data types)
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: `Invalid value for field: ${error.path}`,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
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
