import mongoose from "mongoose";
import Faculty from "../models/facultySchema.js";
import bcrypt from "bcryptjs";
import Student from "../models/studentSchema.js";
import Request from "../models/requestSchema.js";
import Project from "../models/projectSchema.js";
import Panel from "../models/panelSchema.js";
import MarkingSchema from "../models/markingSchema.js";

// for updating the structure of the marks
export async function createOrUpdateMarkingSchema(req, res) {
  const { school, department, reviews } = req.body;

  if (
    !school ||
    !department ||
    !Array.isArray(reviews) ||
    reviews.length === 0
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Missing or invalid fields." });
  }

  const updated = await MarkingSchema.findOneAndUpdate(
    { school, department },
    { reviews },
    { new: true, upsert: true }
  );

  res
    .status(200)
    .json({ success: true, message: "Marking schema saved.", data: updated });
}

export async function createFaculty(req, res) {
  const { name, emailId, password, employeeId, school, department } = req.body;

  // for otp testing used gmail - need some profs mail id for checking with vit.ac.in
  // Only allow college emails
  if (!emailId.endsWith("@vit.ac.in")) {
    return res.status(400).json({
      success: false,
      message: "Only college emails allowed!",
    });
  }

  // Password validation
  if (
    password.length < 8 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
    });
  }

  // Check if email is already registered
  const existingFaculty = await Faculty.findOne({ emailId });
  if (existingFaculty) {
    return res.status(400).json({
      success: false,
      message: "Faculty already registered!",
    });
  }

  // Hash password before saving
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create faculty
  const newFaculty = new Faculty({
    name,
    emailId,
    password: hashedPassword,
    employeeId,
    role: "faculty",
    school,
    department,
  });

  await newFaculty.save();

  return res.status(201).json({
    success: true,
    message: "Faculty created successfully!",
  });
}
export async function createFacultyBulk(req, res) {
  try {
    const { facultyList, school, department } = req.body;

    if (!Array.isArray(facultyList) || facultyList.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Faculty list is required and must be a non-empty array",
      });
    }

    if (!school || !department) {
      return res.status(400).json({
        success: false,
        message: "School and department are required",
      });
    }

    const results = {
      created: 0,
      errors: 0,
      details: []
    };

    // Process each faculty member
    for (let i = 0; i < facultyList.length; i++) {
      const faculty = facultyList[i];
      
      try {
        // Validate each faculty record
        if (!faculty.name || !faculty.emailId || !faculty.password || !faculty.employeeId) {
          results.errors++;
          results.details.push({
            row: i + 1,
            error: "Missing required fields"
          });
          continue;
        }

        if (!faculty.emailId.endsWith("@vit.ac.in")) {
          results.errors++;
          results.details.push({
            row: i + 1,
            error: "Invalid email domain"
          });
          continue;
        }

        // Check if faculty already exists
        const existingFaculty = await Faculty.findOne({ 
          $or: [
            { emailId: faculty.emailId },
            { employeeId: faculty.employeeId }
          ]
        });

        if (existingFaculty) {
          results.errors++;
          results.details.push({
            row: i + 1,
            error: "Faculty with this email or employee ID already exists"
          });
          continue;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(faculty.password, salt);

        // Create faculty
        const newFaculty = new Faculty({
          name: faculty.name.trim(),
          emailId: faculty.emailId.trim().toLowerCase(),
          password: hashedPassword,
          employeeId: faculty.employeeId.trim().toUpperCase(),
          role: faculty.role || "faculty",
          school: school,
          department: department,
        });

        await newFaculty.save();
        results.created++;

      } catch (error) {
        results.errors++;
        results.details.push({
          row: i + 1,
          error: error.message
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: `Bulk faculty creation completed. ${results.created} created, ${results.errors} errors.`,
      data: results
    });

  } catch (error) {
    console.error("Error in bulk faculty creation:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during bulk creation",
      error: error.message,
    });
  }
}

export async function getAllFaculty(req, res) {
  const allFaculty = await Faculty.find({});

  if (allFaculty.length === 0) {
    console.log("no faculty found");
    return res.status(404).json({
      success: false,
      message: "No Faculty found",
    });
  }

  return res.status(200).json({
    success: true,
    data: allFaculty,
  });
}

// controller for getAllFaculty based on school and dept
export async function getFacultyBySchoolAndDept(req, res) {
  const { school, department } = req.params;

  try {
    const faculty = await Faculty.find({ school, department });

    if (!faculty.length) {
      return res.status(404).json({
        success: false,
        message: "No faculty found for this school and department.",
      });
    }

    res.status(200).json({
      success: true,
      data: faculty.map((f) => ({
        _id: f._id,
        name: f.name,
        employeeId: f.employeeId,
        emailId: f.emailId,
        role: f.role,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// without dept and school, can be used for getting all the details
// export async function getAllGuideWithProjects(req, res) {
//   const faculties = await Faculty.find({ role: "faculty" });

//   const result = await Promise.all(
//     faculties.map(async (faculty) => {
//       const guidedProjects = await Project.find({ guideFaculty: faculty._id })
//         .populate("students", "regNo name")
//         .lean();
//       return {
//         faculty: {
//           _id: faculty._id,
//           employeeId: faculty.employeeId,
//           name: faculty.name,
//           emailId: faculty.emailId,
//           school: faculty.school,
//           department: faculty.department,
//         },
//         guidedProjects,
//       };
//     })
//   );

//   res.status(200).json({ success: true, data: result });
// }

// export async function getAllPanelsWithProjects(req, res) {
//   const panels = await Panel.find()
//     .populate("faculty1", "employeeId name emailId")
//     .populate("faculty2", "employeeId name emailId")
//     .lean();

//   const result = await Promise.all(
//     panels.map(async (panel) => {
//       const projects = await Project.find({ panel: panel._id })
//         .populate("students", "regNo name")
//         .lean();

//       return {
//         panelId: panel._id,
//         faculty1: panel.faculty1,
//         faculty2: panel.faculty2,
//         projects,
//       };
//     })
//   );

//   res.status(200).json({ success: true, data: result });
// }

// with dept and school specific
export async function getAllGuideWithProjects(req, res) {
  try {
    const { school, department } = req.query;

    if (!school || !department) {
      return res.status(400).json({
        success: false,
        message: "school and department query parameters are required.",
      });
    }

    // Find faculties by role, school, and department
    const faculties = await Faculty.find({
      role: "faculty",
      school,
      department,
    });

    const result = await Promise.all(
      faculties.map(async (faculty) => {
        // Find projects guided by this faculty that belong to the same school and department
        const guidedProjects = await Project.find({
          guideFaculty: faculty._id,
          school,
          department,
        })
          .populate("students", "regNo name")
          .lean();

        return {
          faculty: {
            _id: faculty._id,
            employeeId: faculty.employeeId,
            name: faculty.name,
            emailId: faculty.emailId,
            school: faculty.school,
            department: faculty.department,
          },
          guidedProjects,
        };
      })
    );

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error in getAllGuideWithProjects:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getAllPanelsWithProjects(req, res) {
  try {
    const { school, department } = req.query;

    if (!school || !department) {
      return res.status(400).json({
        success: false,
        message: "school and department query parameters are required.",
      });
    }

    // Find panels where both faculties belong to the given school and department
    const panels = await Panel.find()
      .populate("faculty1", "employeeId name emailId school department")
      .populate("faculty2", "employeeId name emailId school department")
      .lean();

    // Filter panels where both faculty1 and faculty2 belong to the requested school and department
    const filteredPanels = panels.filter(
      (panel) =>
        panel.faculty1?.school === school &&
        panel.faculty1?.department === department &&
        panel.faculty2?.school === school &&
        panel.faculty2?.department === department
    );

    // For each panel, find projects in the same school and department linked to this panel
    const result = await Promise.all(
      filteredPanels.map(async (panel) => {
        const projects = await Project.find({
          panel: panel._id,
          school,
          department,
        })
          .populate("students", "regNo name")
          .lean();

        return {
          panelId: panel._id,
          faculty1: panel.faculty1,
          faculty2: panel.faculty2,
          projects,
        };
      })
    );

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error in getAllPanelsWithProjects:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createAdmin(req, res) {
  const { name, emailId, password, employeeId, school, department } = req.body;

  if (!emailId.endsWith("@vit.ac.in")) {
    return res.status(400).json({
      success: false,
      message: "Only college emails allowed!",
    });
  }

  // Password validation
  if (
    password.length < 8 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
    });
  }

  const existingFaculty = await Faculty.findOne({ emailId });
  if (existingFaculty) {
    return res.status(400).json({
      success: false,
      message: "Admin already registered!",
    });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newFaculty = new Faculty({
    name,
    emailId,
    password: hashedPassword,
    employeeId,
    role: "admin",
    school,
    department,
  });

  await newFaculty.save();

  return res.status(201).json({
    success: true,
    message: "Admin created successfully!",
  });
}

export async function getDefaultDeadline(req, res) {
  try {
    const { school, department } = req.query;

    if (!school || !department) {
      return res.status(400).json({
        success: false,
        message: "school and department query parameters are required.",
      });
    }

    const markingSchema = await MarkingSchema.findOne({ school, department });

    if (!markingSchema) {
      return res.status(404).json({
        success: false,
        message: "No marking schema found for this school and department.",
      });
    }

    // ✅ FIXED: Return the complete marking schema instead of just deadlines
    res.status(200).json({
      success: true,
      data: {
        school: markingSchema.school,
        department: markingSchema.department,
        reviews: markingSchema.reviews, // ✅ Return full reviews with components and weights
        deadlines: markingSchema.reviews.map((review) => ({
          reviewName: review.reviewName,
          deadline: review.deadline || null,
        })),
      },
    });
  } catch (error) {
    console.error("Error in getDefaultDeadline:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}



export async function setDefaultDeadline(req, res) {
  try {
    const { school, department, deadlines } = req.body;

    if (!school || !department) {
      return res.status(400).json({
        success: false,
        message: "school and department are required.",
      });
    }

    if (
      !Array.isArray(deadlines) ||
      deadlines.some(
        (d) =>
          !d.reviewName || !d.deadline || !d.deadline.from || !d.deadline.to
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "deadlines must be an array of objects with reviewName and deadline { from, to }.",
      });
    }

    // Fetch existing marking schema or create new one
    let markingSchema = await MarkingSchema.findOne({ school, department });

    if (!markingSchema) {
      // Create new markingSchema with empty reviews (will get updated now)
      markingSchema = new MarkingSchema({ school, department, reviews: [] });
    }

    // Merge/update deadlines for reviews
    // Loop through the input deadlines, for each review update or add deadline object
    deadlines.forEach(({ reviewName, deadline }) => {
      // Find if the review exists
      const idx = markingSchema.reviews.findIndex(
        (rev) => rev.reviewName === reviewName
      );
      if (idx !== -1) {
        // Update deadline of existing review
        markingSchema.reviews[idx].deadline = deadline;
      } else {
        // Add new review with empty components but provided deadline
        markingSchema.reviews.push({
          reviewName,
          components: [],
          deadline,
        });
      }
    });

    await markingSchema.save();

    res.status(200).json({
      success: true,
      message: "Default deadlines set successfully.",
      data: markingSchema,
    });
  } catch (error) {
    console.error("Error in setDefaultDeadline:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}

// need to restructure this

export async function updateRequestStatus(req, res) {
  try {
    const { requestId, status, newDeadline } = req.body;

    console.log("=== UPDATING REQUEST STATUS ===");
    console.log("Request ID:", requestId);
    console.log("Status:", status);
    console.log("New Deadline:", newDeadline);

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value. Must be 'approved' or 'rejected'.",
      });
    }

    if (status === "approved") {
      if (!newDeadline) {
        return res.status(400).json({
          success: false,
          message: "newDeadline is required for approved requests.",
        });
      }
      if (isNaN(new Date(newDeadline).getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format for newDeadline.",
        });
      }
    }

    const request = await Request.findById(requestId)
      .populate("student")
      .populate("faculty");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found!",
      });
    }

    const student = request.student;
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "No student mapped to the request.",
      });
    }

    const reviewType = request.reviewType;
    console.log("Review Type:", reviewType);
    console.log("Student RegNo:", student.regNo);

    if (status === "approved") {
      request.status = "approved";
      request.resolvedAt = new Date();

      // Unlock review in student's reviews map (if present)
      if (student.reviews?.has(reviewType)) {
        const reviewData = student.reviews.get(reviewType);
        reviewData.locked = false;
        student.reviews.set(reviewType, reviewData);
      }

      // Update or create student deadline Map entry for this reviewType
      const existingDeadline = student.deadline?.get(reviewType);
      if (existingDeadline) {
        existingDeadline.to = new Date(newDeadline);
        student.deadline.set(reviewType, existingDeadline);
      } else {
        student.deadline.set(reviewType, {
          from: new Date(),
          to: new Date(newDeadline),
        });
      }

      await student.save();
    } else {
      request.status = "rejected";
      request.resolvedAt = new Date();
    }

    await request.save();

    return res.status(200).json({
      success: true,
      message: `Request ${status} successfully.`,
      data: request,
    });
  } catch (error) {
    console.error("Error in updateRequestStatus:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

// without dept and school
// export async function getAllRequests(req, res) {
//   const { facultyType } = req.params;

//   if (!["panel", "guide"].includes(facultyType)) {
//     return res.status(400).json({
//       success: false,
//       message: "facultyType should either be 'guide' or 'panel'",
//     });
//   }

//   const requests = await Request.find({ facultyType })
//     .populate("faculty", "name empId")
//     .populate("student", "name regNo");

//   if (!requests.length) {
//     return res.status(404).json({
//       success: false,
//       message: `No requests found for the ${facultyType}`,
//     });
//   }

//   // Grouping by faculty
//   const grouped = {};

//   requests.forEach((req) => {
//     const faculty = req.faculty[0];
//     const facultyId = faculty._id.toString();

//     if (!grouped[facultyId]) {
//       grouped[facultyId] = {
//         _id: facultyId,
//         name: faculty.name,
//         empId: faculty.empId,
//         students: [],
//       };
//     }

//     grouped[facultyId].students.push({
//       _id: req._id,
//       name: req.student.name,
//       regNo: req.student.regNo,
//       projectType: req.reviewType,
//       comments: req.reason,
//       approved:
//         req.status === "approved"
//           ? true
//           : req.status === "rejected"
//           ? false
//           : null,
//     });
//   });

//   const result = Object.values(grouped);

//   return res.status(200).json({
//     success: true,
//     message: "Operation successful",
//     data: result,
//   });
// }

export async function getAllRequests(req, res) {
  try {
    const { facultyType } = req.params;
    const { school, department } = req.query;

    if (!["panel", "guide"].includes(facultyType)) {
      return res.status(400).json({
        success: false,
        message: "facultyType should either be 'guide' or 'panel'",
      });
    }

    // Fetch requests and populate faculty and student with necessary fields
    const requests = await Request.find({ facultyType })
      .populate({
        path: "faculty",
        select: "name employeeId school department",
        match: {
          ...(school ? { school } : {}),
          ...(department ? { department } : {}),
        },
      })
      .populate("student", "name regNo")
      .lean();

    // Filter out requests whose faculty is null (due to mismatch in school/department)
    const filteredRequests = requests.filter((req) => req.faculty !== null);

    if (!filteredRequests.length) {
      return res.status(404).json({
        success: false,
        message: `No requests found for the ${facultyType} with specified filters`,
      });
    }

    // Group by faculty
    const grouped = {};

    filteredRequests.forEach((req) => {
      const faculty = req.faculty;
      const facultyId = faculty._id.toString();

      if (!grouped[facultyId]) {
        grouped[facultyId] = {
          _id: facultyId,
          name: faculty.name,
          empId: faculty.employeeId, // Note: you had empId in original, faculty schema likely uses employeeId
          school: faculty.school,
          department: faculty.department,
          students: [],
        };
      }

      grouped[facultyId].students.push({
        _id: req._id,
        name: req.student.name,
        regNo: req.student.regNo,
        projectType: req.reviewType,
        comments: req.reason,
        approved:
          req.status === "approved"
            ? true
            : req.status === "rejected"
            ? false
            : null,
      });
    });

    const result = Object.values(grouped);

    return res.status(200).json({
      success: true,
      message: "Operation successful",
      data: result,
    });
  } catch (error) {
    console.error("Error in getAllRequests:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}

export async function createPanelManually(req, res) {
  try {
    const { faculty1Id, faculty2Id } = req.body;

    if (!faculty1Id || !faculty2Id || faculty1Id === faculty2Id) {
      return res.status(400).json({
        success: false,
        message: "Two distinct faculty IDs are required.",
      });
    }

    const faculty1 = await Faculty.findById(faculty1Id);
    const faculty2 = await Faculty.findById(faculty2Id);

    if (!faculty1 || !faculty2) {
      return res.status(404).json({
        success: false,
        message: "One or both faculty not found.",
      });
    }

    // Ensure same school and department for panel members
    if (
      faculty1.school !== faculty2.school ||
      faculty1.department !== faculty2.department
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Faculty members belong to different schools or departments. Panel must be within the same school and department.",
      });
    }

    const panel = new Panel({
      faculty1: faculty1Id,
      faculty2: faculty2Id,
      school: faculty1.school,
      department: faculty1.department,
    });

    await panel.save();

    return res.status(201).json({
      success: true,
      message: "Panel created successfully",
      data: panel,
    });
  } catch (error) {
    console.error("Error creating panel:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}

export async function deletePanel(req, res) {
  try {
    const { panelId } = req.params;

    const deletedPanel = await Panel.findByIdAndDelete(panelId);

    if (!deletedPanel) {
      return res.status(404).json({
        success: false,
        message: "No panel found for the provided ID",
      });
    }

    // Remove panel references from projects
    await Project.updateMany({ panel: panelId }, { $set: { panel: null } });

    return res.status(200).json({
      success: true,
      message:
        "Panel deleted successfully and removed from associated projects",
      data: deletedPanel,
    });
  } catch (error) {
    console.error("Error deleting panel:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}

// without dept and school
// export async function getAllPanels(req, res) {
//   const panel = await Panel.find().populate("faculty1").populate("faculty2");
//   // FIX: Always return 200 with empty array if no panels
//   return res.status(200).json({
//     success: true,
//     message: "Operation Successful",
//     data: panel || [],
//   });
// }

export async function getAllPanels(req, res) {
  try {
    const { school, department } = req.query;

    const filter = {};
    if (school) filter.school = school;
    if (department) filter.department = department;

    const panels = await Panel.find(filter)
      .populate("faculty1", "employeeId name emailId school department")
      .populate("faculty2", "employeeId name emailId school department")
      .lean();

    return res.status(200).json({
      success: true,
      message: "Operation Successful",
      data: panels || [],
    });
  } catch (error) {
    console.error("Error in getAllPanels:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}

export async function assignExistingPanelToProject(req, res) {
  try {
    const { panelId, projectId } = req.body;

    // Handle panel removal
    if (!panelId || panelId === "null") {
      const updatedProject = await Project.findByIdAndUpdate(
        projectId,
        { panel: null },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: "Panel removed from project successfully",
        data: updatedProject,
      });
    }

    const panel = await Panel.findById(panelId);
    if (!panel) {
      return res.status(404).json({
        success: false,
        message: "Panel not found.",
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    // Optionally validate same school and department
    if (
      panel.school !== project.school ||
      panel.department !== project.department
    ) {
      return res.status(400).json({
        success: false,
        message: "Panel and project belong to different school or department.",
      });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { panel: panel._id },
      { new: true }
    ).populate("panel");

    return res.status(200).json({
      success: true,
      message: "Panel assigned successfully",
      data: updatedProject,
    });
  } catch (error) {
    console.error("Error assigning panel to project:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}

export async function autoAssignPanelsToProjects(req, res) {
  try {
    const unassignedProjects = await Project.find({ panel: null }).populate(
      "guideFaculty"
    );
    const panels = await Panel.find().populate(["faculty1", "faculty2"]);

    if (!panels.length) {
      return res
        .status(400)
        .json({ success: false, message: "No panels available." });
    }

    // Initialize a map to hold assignments
    const panelAssignments = {};
    panels.forEach((panel) => {
      panelAssignments[panel._id.toString()] = [];
    });

    let panelIndex = 0;

    for (const project of unassignedProjects) {
      const guideId = project.guideFaculty?._id?.toString();
      const guideSchool = project.guideFaculty?.school;
      const guideDepartment = project.guideFaculty?.department;

      // Filter panels to only those with matching school and department
      let eligiblePanels = panels.filter((panel) => {
        const { faculty1, faculty2 } = panel;
        // Both faculties must exist
        if (!faculty1 || !faculty2) return false;

        // Check school and department match (both faculties assumed to belong to same dept & school in your model)
        if (
          faculty1.school !== guideSchool ||
          faculty2.school !== guideSchool ||
          faculty1.department !== guideDepartment ||
          faculty2.department !== guideDepartment
        ) {
          return false; // Different school or department
        }

        // Skip if guide is on the panel
        if (guideId) {
          if (
            faculty1._id.toString() === guideId ||
            faculty2._id.toString() === guideId
          ) {
            return false;
          }
        }

        return true;
      });

      // If no eligible panel found (due to mismatches), allow all as fallback
      if (!eligiblePanels.length) {
        eligiblePanels = panels;
      }

      // Assign to next eligible panel in round-robin
      const eligiblePanel = eligiblePanels[panelIndex % eligiblePanels.length];
      project.panel = eligiblePanel._id;
      await project.save();
      panelAssignments[eligiblePanel._id.toString()].push(project._id);

      panelIndex++;
    }

    return res.status(200).json({
      success: true,
      message: "Panels assigned equally to unassigned projects.",
      assignments: panelAssignments,
    });
  } catch (error) {
    console.error("Error in autoAssignPanelsToProjects:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function assignPanelToProject(req, res) {
  try {
    const { panelFacultyIds, projectId } = req.body;

    if (!Array.isArray(panelFacultyIds) || panelFacultyIds.length !== 2) {
      return res.status(400).json({
        success: false,
        message: "Exactly 2 panel faculty IDs required.",
      });
    }

    // Check distinctness
    if (panelFacultyIds[0] === panelFacultyIds[1]) {
      return res.status(400).json({
        success: false,
        message: "Panel faculty members must be distinct.",
      });
    }

    const [faculty1, faculty2] = await Promise.all([
      Faculty.findById(panelFacultyIds[0]),
      Faculty.findById(panelFacultyIds[1]),
    ]);

    if (!faculty1 || !faculty2) {
      return res.status(404).json({
        success: false,
        message: "One or both faculty not found.",
      });
    }

    const project = await Project.findById(projectId).populate("guideFaculty");
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    if (!project.guideFaculty) {
      return res.status(400).json({
        success: false,
        message: "Project has no guide faculty to check.",
      });
    }

    // Check that panel faculty and guide faculty have same school and dept
    if (
      faculty1.school !== project.guideFaculty.school ||
      faculty2.school !== project.guideFaculty.school ||
      faculty1.department !== project.guideFaculty.department ||
      faculty2.department !== project.guideFaculty.department
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Panel faculty and guide faculty must belong to the same school and department.",
      });
    }

    // Prevent guide faculty from being panel member
    if (
      project.guideFaculty._id.toString() === panelFacultyIds[0] ||
      project.guideFaculty._id.toString() === panelFacultyIds[1]
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Guide faculty cannot be a panel member for their own project.",
      });
    }

    // Create panel
    const panel = new Panel({
      faculty1: panelFacultyIds[0],
      faculty2: panelFacultyIds[1],
      school: faculty1.school,
      department: faculty1.department,
    });
    await panel.save();

    // Assign panel to project
    project.panel = panel._id;
    await project.save();

    const populatedProject = await Project.findById(projectId).populate({
      path: "panel",
      populate: [{ path: "faculty1" }, { path: "faculty2" }],
    });

    return res.status(200).json({
      success: true,
      message: "Panel assigned successfully",
      data: populatedProject,
    });
  } catch (error) {
    console.error("Error in assignPanelToProject:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}


export async function autoCreatePanels(req, res) {
  try {
    const existingPanelsCount = await Panel.countDocuments();
    const force = req.body.force === true || req.body.force === "true";

    if (existingPanelsCount > 0 && !force) {
      return res.status(400).json({
        success: false,
        message:
          "Panels already exist. Use force=true parameter to recreate panels.",
        existingPanels: existingPanelsCount,
      });
    }

    if (existingPanelsCount > 0 && force) {
      await Project.updateMany(
        { panel: { $exists: true, $ne: null } },
        { $set: { panel: null } }
      );
      await Panel.deleteMany({});
      console.log(
        `Deleted ${existingPanelsCount} existing panels due to force=${force}`
      );
    }

    const faculties = await Faculty.find({ role: "faculty" });
    if (faculties.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Not enough faculty members to create panels.",
      });
    }

    // Group faculties by school and department
    const groupedFaculties = {};
    for (const faculty of faculties) {
      const key = `${faculty.school}||${faculty.department}`;
      if (!groupedFaculties[key]) groupedFaculties[key] = [];
      groupedFaculties[key].push(faculty);
    }

    const createdPanels = [];
    // To track which faculty have already been paired
    for (const groupKey in groupedFaculties) {
      const groupFaculties = groupedFaculties[groupKey];
      const [school, department] = groupKey.split("||");
      // Keep track of which faculty are already used in panels for possible pairing of the last odd one
      const usedIndexes = new Set();
      const n = groupFaculties.length;
      // Pair off sequentially
      for (let i = 0; i + 1 < n; i += 2) {
        const faculty1 = groupFaculties[i];
        const faculty2 = groupFaculties[i + 1];
        usedIndexes.add(i);
        usedIndexes.add(i + 1);
        const panel = new Panel({
          faculty1: faculty1._id,
          faculty2: faculty2._id,
          school,
          department,
        });
        await panel.save();
        createdPanels.push(panel);
      }
      // ODD: assign the last one with a previous faculty (not always the first for fairness)
      if (n % 2 !== 0) {
        const leftoverIndex = n - 1;
        let partnerIndex = (leftoverIndex - 1 + n) % n; // partner with just before (but not self!)
        if (partnerIndex === leftoverIndex) partnerIndex = 0; // just in case only one left (min n=1 shouldn’t happen)
        const faculty1 = groupFaculties[leftoverIndex];
        const faculty2 = groupFaculties[partnerIndex];
        // Avoid duplicating an existing pair
        const alreadyExists = createdPanels.some(
          (p) =>
            (p.faculty1.equals(faculty1._id) &&
              p.faculty2.equals(faculty2._id)) ||
            (p.faculty1.equals(faculty2._id) && p.faculty2.equals(faculty1._id))
        );
        if (!alreadyExists) {
          const panel = new Panel({
            faculty1: faculty1._id,
            faculty2: faculty2._id,
            school,
            department,
          });
          await panel.save();
          createdPanels.push(panel);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message:
        existingPanelsCount > 0
          ? "Existing panels replaced successfully."
          : "Panels created successfully.",
      panelsCreated: createdPanels.length,
    });
  } catch (error) {
    console.error("Error in autoCreatePanels:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}

export async function getAllFacultyWithProjects(req, res) {
  try {
    const { school, department } = req.query;

    // Filter faculties optionally by school and department
    const facultyFilter = {};
    if (school) facultyFilter.school = school;
    if (department) facultyFilter.department = department;

    const allFaculty = await Faculty.find(facultyFilter);

    const facultyWithProjects = [];

    for (const faculty of allFaculty) {
      const facultyId = faculty._id;

      // Guided projects in same school and dept as faculty
      const guidedProjects = await Project.find({
        guideFaculty: facultyId,
        school: faculty.school,
        department: faculty.department,
      })
        .populate("students", "name regNo")
        .populate("panel");

      // Panels where faculty is either member and panel in same school/department
      const panelsWithFaculty = await Panel.find({
        $or: [{ faculty1: facultyId }, { faculty2: facultyId }],
        school: faculty.school,
        department: faculty.department,
      });

      const panelIds = panelsWithFaculty.map((panel) => panel._id);

      const panelProjects = await Project.find({
        panel: { $in: panelIds },
        school: faculty.school,
        department: faculty.department,
      })
        .populate("students", "name regNo")
        .populate("panel");

      facultyWithProjects.push({
        faculty: {
          name: faculty.name,
          employeeId: faculty.employeeId,
          emailId: faculty.emailId,
          school: faculty.school,
          department: faculty.department,
        },
        guide: guidedProjects,
        panel: panelProjects,
      });
    }

    return res.status(200).json({
      success: true,
      data: facultyWithProjects,
    });
  } catch (error) {
    console.error("Error in getAllFacultyWithProjects:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}
