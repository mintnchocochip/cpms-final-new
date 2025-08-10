import mongoose from "mongoose";
import Project from "../models/projectSchema.js";
import Student from "../models/studentSchema.js"; // Ensure this path is correct
import Faculty from "../models/facultySchema.js";
// Import Panel model at the top of your file
import Panel from "../models/panelSchema.js";
import MarkingSchema from "../models/markingSchema.js";
/**
 * Create a new project.
 * Expected req.body:
 * {
 *   name: "Project Name", // Unique identifier for the project
 *   students: [ { regNo, name, emailId, draftReview, review0, review1, review2, review3, pptApproved, attendance }, ... ],
 *   guideFacultyEmpId: "guide faculty employee id"
 * }
 */
/**
 * Create a new project.
 * Expected req.body:
 * {
 *   name: "Project Name", // Unique identifier for the project
 *   students: [ { regNo, name, emailId, draftReview, review0, review1, review2, review3, review3, pptApproved, deadline }, ... ],
 *   guideFacultyEmpId: "guide faculty employee id"
 * }
 */



export async function createProject(req, res, next) {
  // Start a session for transaction
  const session = await mongoose.startSession();
  
  try {
    // Start transaction
    session.startTransaction();
    
    const { name, students: studentDetails, guideFacultyEmpId } = req.body;

    if (!Array.isArray(studentDetails) || studentDetails.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Student details are required and should be a non-empty array.",
      });
    }

    const { school, department } = studentDetails[0];
    if (!school || !department) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "School and department must be provided for the students.",
      });
    }

    const markingSchema = await MarkingSchema.findOne({ school, department }).session(session);
    if (!markingSchema) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Marking schema not found for school: ${school}, department: ${department}`,
      });
    }

    // Check if guide faculty exists before creating students
    const guideFacultyDoc = await Faculty.findOne({
      employeeId: guideFacultyEmpId,
    }).session(session);
    if (!guideFacultyDoc) {
      await session.abortTransaction();
      throw new Error(
        `Guide faculty with employee id ${guideFacultyEmpId} not found`
      );
    }

    // Extract review keys and their default deadlines from markingSchema
    const reviewKeys = markingSchema.reviews.map((review) => review.reviewName);

    // Build default deadline map from markingSchema reviews
    const defaultDeadlinesMap = new Map();

    markingSchema.reviews.forEach((review) => {
      if (review.deadline && review.deadline.from && review.deadline.to) {
        defaultDeadlinesMap.set(review.reviewName, {
          from: review.deadline.from,
          to: review.deadline.to,
        });
      } else {
        defaultDeadlinesMap.set(review.reviewName, null);
      }
    });

    // Create all students within the transaction
    const studentIds = await Promise.all(
      studentDetails.map(async (studentObj) => {
        const {
          regNo,
          name: studentName,
          emailId,
          reviews = {},
          pptApproved,
          deadline,
          school: studSchool,
          department: studDept,
        } = studentObj;

        if (studSchool !== school || studDept !== department) {
          throw new Error(
            `Student ${regNo} has mismatched school or department. All students should belong to same school and department.`
          );
        }

        // Check if student already exists (with session)
        const existingStudent = await Student.findOne({ regNo }).session(session);
        if (existingStudent) {
          throw new Error(`Student already exists with regNo ${regNo}`);
        }

        const reviewsMap = new Map();

        for (const reviewKey of reviewKeys) {
          const reviewDef = markingSchema.reviews.find(
            (rev) => rev.reviewName === reviewKey
          );

          const inputReview = reviews?.[reviewKey] || {};

          let marks = {};

          if (reviewDef && Array.isArray(reviewDef.components)) {
            for (const comp of reviewDef.components) {
              marks[comp.name] = inputReview.marks?.[comp.name] || 0;
            }
          } else {
            marks = inputReview.marks || {};
          }

          const attendance = inputReview.attendance || {
            value: false,
            locked: false,
          };
          const locked = inputReview.locked || false;
          const comments = inputReview.comments || "";

          reviewsMap.set(reviewKey, {
            marks,
            comments,
            attendance,
            locked,
          });
        }

        let studentDeadlineMap;

        if (
          deadline &&
          typeof deadline === "object" &&
          Object.keys(deadline).length > 0
        ) {
          studentDeadlineMap = new Map();

          for (const [key, value] of Object.entries(deadline)) {
            studentDeadlineMap.set(key, value);
          }
        } else {
          studentDeadlineMap = new Map(defaultDeadlinesMap);
        }

        const student = new Student({
          regNo,
          name: studentName,
          emailId,
          reviews: reviewsMap,
          pptApproved: pptApproved || { approved: false, locked: false },
          deadline: studentDeadlineMap,
          school,
          department,
        });

        // Save with session (part of transaction)
        await student.save({ session });
        return student._id;
      })
    );

    // Create project within the same transaction
    const newProject = new Project({
      name,
      students: studentIds,
      guideFaculty: guideFacultyDoc._id,
      panel: null,
      school,
      department,
    });

    // Save project with session
    await newProject.save({ session });

    // If everything is successful, commit the transaction
    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: {
        projectId: newProject._id,
        name: newProject.name,
        studentsCount: studentIds.length
      }
    });

  } catch (error) {
    // If any error occurs, abort the transaction
    await session.abortTransaction();
    
    console.error("Error creating project:", error);

    // Handle MongoDB duplicate key errors specifically
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];
      const duplicateValue = error.keyValue[duplicateField];
      
      return res.status(409).json({
        success: false,
        message: `Project with ${duplicateField} "${duplicateValue}" already exists. Please choose a different ${duplicateField}.`,
        errorType: 'DUPLICATE_KEY',
        field: duplicateField,
        value: duplicateValue
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation error: " + error.message,
        errorType: 'VALIDATION_ERROR'
      });
    }

    // Handle custom thrown errors (like existing student, faculty not found, etc.)
    if (error.message.includes('Student already exists') || 
        error.message.includes('Guide faculty') || 
        error.message.includes('mismatched school')) {
      return res.status(400).json({
        success: false,
        message: error.message,
        errorType: 'BUSINESS_LOGIC_ERROR'
      });
    }

    // Handle all other errors
    return res.status(500).json({
      success: false,
      message: "Failed to create project. Please try again.",
      errorType: 'INTERNAL_ERROR',
      // Only include error details in development
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  } finally {
    // Always end the session
    session.endSession();
  }
}

export async function createProjectsBulk(req, res) {
  try {
    const { school, department, projects, guideFacultyEmpId } = req.body;

    if (!school || !department) {
      return res.status(400).json({
        success: false,
        message: "School and department are required.",
      });
    }

    if (!Array.isArray(projects) || projects.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Projects array is required and must be non-empty.",
      });
    }

    if (!guideFacultyEmpId) {
      return res.status(400).json({
        success: false,
        message: "Guide faculty employee ID is required.",
      });
    }

    // Verify marking schema exists for school/department
    const markingSchema = await MarkingSchema.findOne({ school, department });
    if (!markingSchema) {
      return res.status(400).json({
        success: false,
        message: `Marking schema not found for school: ${school}, department: ${department}`,
      });
    }

    // Verify guide faculty exists
    const guideFacultyDoc = await Faculty.findOne({
      employeeId: guideFacultyEmpId,
      school,
      department,
    });
    if (!guideFacultyDoc) {
      return res.status(400).json({
        success: false,
        message: `Guide faculty with employee ID ${guideFacultyEmpId} not found in ${school}-${department}`,
      });
    }

    const results = {
      created: 0,
      errors: 0,
      details: []
    };

    // Extract review keys and default deadlines from markingSchema
    const reviewKeys = markingSchema.reviews.map((review) => review.reviewName);
    const defaultDeadlinesMap = new Map();

    markingSchema.reviews.forEach((review) => {
      if (review.deadline && review.deadline.from && review.deadline.to) {
        defaultDeadlinesMap.set(review.reviewName, {
          from: review.deadline.from,
          to: review.deadline.to,
        });
      } else {
        defaultDeadlinesMap.set(review.reviewName, null);
      }
    });

    // Process each project
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      
      try {
        // Validate project structure
        if (!project.name || !Array.isArray(project.students) || project.students.length === 0) {
          results.errors++;
          results.details.push({
            project: project.name || `Project ${i + 1}`,
            error: "Missing project name or students array"
          });
          continue;
        }

        // Check if project already exists
        const existingProject = await Project.findOne({ 
          name: project.name,
          school,
          department 
        });

        if (existingProject) {
          results.errors++;
          results.details.push({
            project: project.name,
            error: "Project with this name already exists"
          });
          continue;
        }

        // Process students for this project
        const studentIds = [];
        let studentError = false;

        for (const studentObj of project.students) {
          try {
            const { regNo, name: studentName, emailId } = studentObj;

            if (!regNo || !studentName || !emailId) {
              throw new Error("Student missing required fields (regNo, name, emailId)");
            }

            // Check if student already exists
            const existingStudent = await Student.findOne({ regNo });
            if (existingStudent) {
              throw new Error(`Student already exists with regNo ${regNo}`);
            }

            // Create reviews map with default structure
            const reviewsMap = new Map();
            for (const reviewKey of reviewKeys) {
              const reviewDef = markingSchema.reviews.find(
                (rev) => rev.reviewName === reviewKey
              );

              let marks = {};
              if (reviewDef && Array.isArray(reviewDef.components)) {
                for (const comp of reviewDef.components) {
                  marks[comp.name] = 0;
                }
              }

              reviewsMap.set(reviewKey, {
                marks,
                comments: "",
                attendance: { value: false, locked: false },
                locked: false,
              });
            }

            // Create student with default deadlines
            const student = new Student({
              regNo,
              name: studentName,
              emailId,
              reviews: reviewsMap,
              pptApproved: { approved: false, locked: false },
              deadline: new Map(defaultDeadlinesMap),
              school,
              department,
            });

            await student.save();
            studentIds.push(student._id);

          } catch (studentError) {
            throw new Error(`Student ${studentObj.regNo}: ${studentError.message}`);
          }
        }

        if (!studentError) {
          // Create the project
          const newProject = new Project({
            name: project.name,
            students: studentIds,
            guideFaculty: guideFacultyDoc._id,
            panel: null,
            school,
            department,
          });

          await newProject.save();
          results.created++;
        }

      } catch (error) {
        results.errors++;
        results.details.push({
          project: project.name || `Project ${i + 1}`,
          error: error.message
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: `Bulk project creation completed. ${results.created} created, ${results.errors} errors.`,
      data: results
    });

  } catch (error) {
    console.error("Error in bulk project creation:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during bulk project creation",
      error: error.message,
    });
  }
}


export async function deleteProject(req, res) {
  try {
    const { projectId } = req.params;

    const deletedProject = await Project.findByIdAndDelete(projectId);

    if (!deletedProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error deleting project", error: error.message });
  }
}

/**
 * Get all projects where the logged-in faculty is the guide.
 * Relies on req.user.id (set by authMiddleware).
 */
export async function getAllGuideProjects(req, res) {
  try {
    const userId = req.user.id; // Get the authenticated user's ID

    // Added by theju - Add debug logging
    console.log("getAllGuideProjects called for user:", userId);

    // Find projects where the user is the guide
    const projects = await Project.find({
      guideFaculty: userId,
    }).populate("students guideFaculty");

    // Added by theju - Debug each project's PPT status
    projects.forEach((project) => {
      console.log(`Project ${project.name} PPT status:`, project.pptApproved);
    });

    return res.status(200).json({
      success: true,
      data: projects,
      message: "Guide projects fetched successfully",
    });
  } catch (error) {
    console.error("Error in getAllGuideProjects:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching guide projects",
      error: error.message,
    });
  }
}

/**
 * Get all projects where the logged-in faculty is a panel member.
 * Relies on req.user.id (set by authMiddleware).
 */
export async function getAllPanelProjects(req, res, next) {
  try {
    console.log("=== getAllPanelProjects CALLED ===");
    console.log("req.user:", req.user);
    console.log("facultyId:", req.user?.id);

    const facultyId = req.user.id;

    if (!facultyId) {
      console.log("ERROR: No faculty ID found in request");
      return res.status(400).json({
        success: false,
        message: "Faculty ID not found in request",
      });
    }

    console.log("Looking for panels with faculty:", facultyId);

    const panels = await Panel.find({
      $or: [{ faculty1: facultyId }, { faculty2: facultyId }],
    });

    console.log("Found panels:", panels.length);
    console.log("Panel details:", panels);

    if (panels.length === 0) {
      console.log("No panels found for this faculty");
      return res.status(200).json({
        success: true,
        data: [],
        message: "No panels found for this faculty.",
      });
    }

    const panelIds = panels.map((panel) => panel._id);
    console.log("Panel IDs to search for:", panelIds);

    const panelProjects = await Project.find({
      panel: { $in: panelIds },
    })
      .populate("students")
      .populate("guideFaculty")
      .populate({
        path: "panel",
        populate: [
          { path: "faculty1", model: "Faculty" },
          { path: "faculty2", model: "Faculty" },
        ],
      });

    console.log("Panel projects found:", panelProjects.length);
    console.log("Projects:", panelProjects);

    return res.status(200).json({
      success: true,
      data: panelProjects,
      message: "Panel projects fetched successfully",
    });
  } catch (error) {
    console.error("=== ERROR in getAllPanelProjects ===");
    console.error("Error details:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching panel projects",
      error: error.message,
    });
  }
}

/**
 * Update the details of a project.
 * Expected req.params: { name: "Project Name" }
 * Expected req.body: { ...updateData } (fields to update)
 */
// In this i have chosen to update the whole project even if there is only change for 1 student, this is bcos,
// we dont have an update button for individual btn in the fronend just one for the whole project...
// if this seems inefficient we can change it have individual endpoints for different updates...
// Update your updateProjectDetails function to handle comments:

export async function updateProjectDetails(req, res, next) {
  try {
    const { projectId, studentUpdates, pptApproved } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    const updateResults = [];

    for (const studentData of studentUpdates) {
      const {
        studentId,
        reviews = {},
        pptApproved: individualPPT,
      } = studentData;

      if (!studentId) {
        updateResults.push({ status: "Missing studentId", studentId: null });
        continue;
      }

      const student = await Student.findById(studentId);
      if (!student) {
        updateResults.push({ studentId, status: "Student not found" });
        continue;
      }

      // Update each review key dynamically
      for (const reviewKey in reviews) {
        const inputReview = reviews[reviewKey];
        const current = student.reviews.get(reviewKey) || {};

        student.reviews.set(reviewKey, {
          marks: inputReview.marks || current.marks || {},
          comments: (inputReview.comments ?? current.comments) || "",
          attendance: inputReview.attendance ||
            current.attendance || { value: false, locked: false },
          locked: (inputReview.locked ?? current.locked) || false,
        });
      }

      if (individualPPT) {
        student.pptApproved = individualPPT;
      }

      await student.save();
      updateResults.push({ studentId, status: "Updated successfully" });
    }

    // Apply team-wide PPT update
    if (pptApproved) {
      await Promise.all(
        studentUpdates.map(async (stu) => {
          if (stu.studentId) {
            await Student.findByIdAndUpdate(stu.studentId, {
              $set: { pptApproved: pptApproved },
            });
          }
        })
      );
    }

    return res.status(200).json({
      message: "All student marks updated successfully",
      updates: updateResults,
      data: {
        success: true,
        message: "Project updated successfully",
      },
    });
  } catch (error) {
    console.error("Error updating student marks:", error);
    return res.status(500).json({
      message: "Server error while updating marks",
      error: error.message,
    });
  }
}

/**
 * Get the details of a specific project by its name.
 * Expected req.params: { name: "Project Name" }
 */
// i dont think we'll use this endpoint... cos only we'll disp all the projects
// based on the faculty and we dont reroute to a new page... still...
export async function getProjectDetails(req, res, next) {
  try {
    const { projectId } = req.params;

    // Get the project based on the unique name
    const requiredProject = await Project.findOne({ _id: projectId })
      .populate("students")
      .populate("guideFaculty")
      .populate("panelFaculty");

    if (!requiredProject) {
      return res.status(404).send({
        message: "No project found with this name.",
        team: requiredProject,
      });
    }

    return res.status(200).send({ results: requiredProject });
  } catch (error) {
    console.error("Error fetching project details: ", error);
    return res.status(500).json({
      message: "Error fetching project details",
      error: error.message,
    });
  }
}
