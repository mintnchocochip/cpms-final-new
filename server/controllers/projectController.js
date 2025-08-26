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
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      name,
      students: studentDetails,
      guideFacultyEmpId,
      specialization,
    } = req.body;

    if (!Array.isArray(studentDetails) || studentDetails.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message:
          "Student details are required and should be a non-empty array.",
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

    if (!specialization) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Specialization must be provided.",
      });
    }

    // Find marking schema with session
    const markingSchema = await MarkingSchema.findOne({
      school,
      department,
    }).session(session);
    if (!markingSchema) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Marking schema not found for school: ${school}, department: ${department}`,
      });
    }

    // Validate guide faculty existence
    const guideFacultyDoc = await Faculty.findOne({
      employeeId: guideFacultyEmpId,
    }).session(session);
    if (!guideFacultyDoc) {
      await session.abortTransaction();
      throw new Error(
        `Guide faculty with employee id ${guideFacultyEmpId} not found`
      );
    }

    // Extract review keys and deadlines
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

    // Create student documents within transaction
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

        const existingStudent = await Student.findOne({ regNo }).session(
          session
        );
        if (existingStudent) {
          throw new Error(`Student already exists with regNo ${regNo}`);
        }

        // Build reviews map with defaults
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

          reviewsMap.set(reviewKey, {
            marks,
            comments: inputReview.comments || "",
            attendance: inputReview.attendance || {
              value: false,
              locked: false,
            },
            locked: inputReview.locked || false,
          });
        }

        // Determine deadlines for student (use custom or default)
        let studentDeadlineMap;
        if (
          deadline &&
          typeof deadline === "object" &&
          Object.keys(deadline).length > 0
        ) {
          studentDeadlineMap = new Map(Object.entries(deadline));
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

        await student.save({ session });
        return student._id;
      })
    );

    // Create project referencing saved students and guide faculty
    const newProject = new Project({
      name,
      students: studentIds,
      guideFaculty: guideFacultyDoc._id,
      panel: null,
      school,
      department,
      specialization,
    });

    await newProject.save({ session });

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: {
        projectId: newProject._id,
        name: newProject.name,
        studentsCount: studentIds.length,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error creating project:", error);

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];
      const duplicateValue = error.keyValue[duplicateField];
      return res.status(409).json({
        success: false,
        message: `Project with ${duplicateField} "${duplicateValue}" already exists. Please choose a different ${duplicateField}.`,
        errorType: "DUPLICATE_KEY",
        field: duplicateField,
        value: duplicateValue,
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error: " + error.message,
        errorType: "VALIDATION_ERROR",
      });
    }

    if (
      error.message.includes("Student already exists") ||
      error.message.includes("Guide faculty") ||
      error.message.includes("mismatched school")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
        errorType: "BUSINESS_LOGIC_ERROR",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create project. Please try again.",
      errorType: "INTERNAL_ERROR",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  } finally {
    session.endSession();
  }
}

export async function createProjectsBulk(req, res) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { school, department, projects, guideFacultyEmpId } = req.body;

    if (!school || !department) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "School and department are required.",
      });
    }

    if (!Array.isArray(projects) || projects.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Projects array is required and must be non-empty.",
      });
    }

    if (!guideFacultyEmpId) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Guide faculty employee ID is required.",
      });
    }

    // Verify MarkingSchema for school/department in transaction session
    const markingSchema = await MarkingSchema.findOne({
      school,
      department,
    }).session(session);
    if (!markingSchema) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Marking schema not found for school: ${school}, department: ${department}`,
      });
    }

    // Verify guide faculty existence within the school and department
    const guideFacultyDoc = await Faculty.findOne({
      employeeId: guideFacultyEmpId,
      schools: school,
      departments: department,
    }).session(session);
    if (!guideFacultyDoc) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Guide faculty with employee ID ${guideFacultyEmpId} not found in ${school}-${department}`,
      });
    }

    // Prepare review keys and default deadlines map from markingSchema
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

    const results = { created: 0, errors: 0, details: [] };

    // Process projects sequentially for transactional safety
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];

      try {
        // Validate project name and students array
        if (
          !project.name ||
          !Array.isArray(project.students) ||
          project.students.length === 0
        ) {
          results.errors++;
          results.details.push({
            project: project.name || `Project ${i + 1}`,
            error: "Missing project name or students array",
          });
          continue;
        }

        // Check if project already exists with the same name, school, and department
        const existingProject = await Project.findOne({
          name: project.name,
          school,
          department,
        }).session(session);

        if (existingProject) {
          results.errors++;
          results.details.push({
            project: project.name,
            error: "Project with this name already exists",
          });
          continue;
        }

        const studentIds = [];

        // Process each student in this project
        for (const studentObj of project.students) {
          const {
            regNo,
            name: studentName,
            emailId,
            school: studSchool,
            department: studDept,
          } = studentObj;

          if (!regNo || !studentName || !emailId) {
            throw new Error(
              "Student missing required fields (regNo, name, emailId)"
            );
          }

          // Verify student's school and department match the provided ones
          if (studSchool !== school || studDept !== department) {
            throw new Error(
              `Student ${regNo} has mismatched school or department`
            );
          }

          // Check if student already exists
          const existingStudent = await Student.findOne({ regNo }).session(
            session
          );
          if (existingStudent) {
            throw new Error(`Student already exists with regNo ${regNo}`);
          }

          // Build default reviews map with zeros and defaults
          const reviewsMap = new Map();
          for (const reviewKey of reviewKeys) {
            const reviewDef = markingSchema.reviews.find(
              (rev) => rev.reviewName === reviewKey
            );
            const marks = {};

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

          // Create student with default deadlines and school/department
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

          await student.save({ session });
          studentIds.push(student._id);
        }

        // Create project document referencing students and guide faculty
        const newProject = new Project({
          name: project.name,
          students: studentIds,
          guideFaculty: guideFacultyDoc._id,
          panel: null,
          school,
          department,
          specialization: project.specialization || "", // if specialization is required, validate as needed
        });

        await newProject.save({ session });
        results.created++;
      } catch (error) {
        results.errors++;
        results.details.push({
          project: project.name || `Project ${i + 1}`,
          error: error.message,
        });
      }
    }

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: `Bulk project creation completed. ${results.created} created, ${results.errors} errors.`,
      data: results,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error in bulk project creation:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during bulk project creation",
      error: error.message,
    });
  } finally {
    session.endSession();
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
    const userId = req.user.id;
    console.log("getAllGuideProjects called for user:", userId);

    // ✅ FIXED: Populate ALL project details including student reviews and other nested data
    const projects = await Project.find({
      guideFaculty: userId,
    })
    .populate({
      path: "students",
      model: "Student",
      select: "regNo name emailId reviews pptApproved deadline school department" // ✅ Include all student fields
    })
    .populate({
      path: "guideFaculty", 
      model: "Faculty",
      select: "name emailId employeeId school department specialization" // ✅ Include all faculty fields
    })
    .populate({
      path: "panel",
      model: "Panel", 
      select: "name members school department", // ✅ Include panel details if exists
      populate: {
        path: "members",
        model: "Faculty",
        select: "name emailId employeeId"
      }
    })
    .lean(); // ✅ Use lean() for better performance since we're converting to object anyway

    console.log("Found guide projects:", projects.length);

    // ✅ Process each project to ensure all data is properly formatted
    const processedProjects = projects.map(project => {
      console.log(`🔄 Processing project: ${project.name}`);
      
      // ✅ Ensure students array is properly formatted with all nested data
      const processedStudents = project.students.map(student => {
        console.log(`👤 Processing student: ${student.name} (${student.regNo})`);
        
        // ✅ Convert MongoDB Map to plain object for reviews
        let processedReviews = {};
        if (student.reviews) {
          if (student.reviews instanceof Map) {
            // Convert Map to plain object
            processedReviews = Object.fromEntries(student.reviews);
          } else if (typeof student.reviews === 'object') {
            processedReviews = { ...student.reviews };
          }
        }
        
        // ✅ Convert deadline Map to plain object
        let processedDeadlines = {};
        if (student.deadline) {
          if (student.deadline instanceof Map) {
            processedDeadlines = Object.fromEntries(student.deadline);
          } else if (typeof student.deadline === 'object') {
            processedDeadlines = { ...student.deadline };
          }
        }

        console.log(`📊 Student ${student.name} reviews:`, Object.keys(processedReviews));
        console.log(`📅 Student ${student.name} deadlines:`, Object.keys(processedDeadlines));

        return {
          _id: student._id,
          regNo: student.regNo,
          name: student.name,
          emailId: student.emailId,
          reviews: processedReviews, // ✅ Plain object instead of Map
          pptApproved: student.pptApproved || { approved: false, locked: false },
          deadline: processedDeadlines, // ✅ Plain object instead of Map
          school: student.school,
          department: student.department
        };
      });

      return {
        ...project,
        students: processedStudents // ✅ Use processed students with converted Maps
      };
    });

    console.log("✅ All projects processed with full population");

    // ✅ Find unique school-department pairs across all projects
    const schoolDeptPairs = [...new Set(processedProjects.map(p => `${p.school}-${p.department}`))];
    console.log("Unique school-dept pairs:", schoolDeptPairs);

    // ✅ Batch fetch marking schemas for all unique pairs
    const markingSchemas = {};
    await Promise.all(schoolDeptPairs.map(async (pair) => {
      const [school, department] = pair.split('-');
      try {
        const schema = await MarkingSchema.findOne({ school, department }).lean();
        if (schema) {
          markingSchemas[pair] = schema;
          console.log(`✅ Found schema for ${school}-${department} with ${schema.reviews?.length || 0} reviews`);
        } else {
          console.log(`⚠️ No schema found for ${school}-${department}`);
        }
      } catch (error) {
        console.error(`❌ Error fetching schema for ${pair}:`, error);
      }
    }));

    // ✅ Attach the correct marking schema to each project
    const projectsWithSchemas = processedProjects.map(project => {
      const schemaKey = `${project.school}-${project.department}`;
      const projectSchema = markingSchemas[schemaKey];
      
      console.log(`Project ${project.name}: ${project.school}-${project.department} -> ${projectSchema ? 'HAS SCHEMA' : 'NO SCHEMA'}`);
      
      if (projectSchema) {
        console.log(`📋 Schema reviews for ${project.name}:`, projectSchema.reviews?.map(r => r.reviewName) || []);
      }
      
      return {
        ...project,
        markingSchema: projectSchema || null // ✅ Each project gets its own schema
      };
    });

    console.log("✅ Final response prepared with schemas and full population");
    
    // ✅ Log final data structure for debugging
    projectsWithSchemas.forEach(project => {
      console.log(`\n📊 Final Project: ${project.name}`);
      console.log(`👥 Students: ${project.students.length}`);
      project.students.forEach(student => {
        console.log(`  - ${student.name}: ${Object.keys(student.reviews || {}).length} reviews`);
      });
      console.log(`📋 Schema: ${project.markingSchema ? 'YES' : 'NO'}`);
      if (project.markingSchema) {
        console.log(`📋 Schema Reviews: ${project.markingSchema.reviews?.map(r => r.reviewName).join(', ') || 'None'}`);
      }
    });

    return res.status(200).json({
      success: true,
      data: projectsWithSchemas, // ✅ Each project now has its correct markingSchema and fully populated data
      message: "Guide projects fetched successfully",
    });
  } catch (error) {
    console.error("❌ Error in getAllGuideProjects:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching guide projects",
      error: error.message,
    });
  }
}

/**
 * ✅ UPDATED: Get all projects where the logged-in faculty is a panel member
 * Each project gets its own markingSchema based on project's school/department
 */
export async function getAllPanelProjects(req, res) {
  try {
    const facultyId = req.user.id;
    console.log("getAllPanelProjects called for user:", facultyId);

    // Find panels where this faculty is a member
    const panels = await Panel.find({
      $or: [{ faculty1: facultyId }, { faculty2: facultyId }],
    });

    console.log("Found panels:", panels.length);

    if (panels.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No panels found for this faculty.",
      });
    }

    const panelIds = panels.map((panel) => panel._id);

    // ✅ FIXED: Populate ALL project details including student reviews and other nested data
    const panelProjects = await Project.find({
      panel: { $in: panelIds },
    })
    .populate({
      path: "students",
      model: "Student",
      select: "regNo name emailId reviews pptApproved deadline school department" // ✅ Include all student fields
    })
    .populate({
      path: "guideFaculty", 
      model: "Faculty",
      select: "name emailId employeeId school department specialization" // ✅ Include all faculty fields
    })
    .populate({
      path: "panel",
      model: "Panel",
      select: "name faculty1 faculty2 school department", // ✅ Include panel details
      populate: [
        {
          path: "faculty1",
          model: "Faculty",
          select: "name emailId employeeId"
        },
        {
          path: "faculty2", 
          model: "Faculty",
          select: "name emailId employeeId"
        }
      ]
    })
    .lean(); // ✅ Use lean() for better performance

    console.log("Found panel projects:", panelProjects.length);

    // ✅ Process each project to ensure all data is properly formatted
    const processedProjects = panelProjects.map(project => {
      console.log(`🔄 Processing panel project: ${project.name}`);
      
      // ✅ Ensure students array is properly formatted with all nested data
      const processedStudents = project.students.map(student => {
        console.log(`👤 Processing panel student: ${student.name} (${student.regNo})`);
        
        // ✅ Convert MongoDB Map to plain object for reviews
        let processedReviews = {};
        if (student.reviews) {
          if (student.reviews instanceof Map) {
            // Convert Map to plain object
            processedReviews = Object.fromEntries(student.reviews);
          } else if (typeof student.reviews === 'object') {
            processedReviews = { ...student.reviews };
          }
        }
        
        // ✅ Convert deadline Map to plain object
        let processedDeadlines = {};
        if (student.deadline) {
          if (student.deadline instanceof Map) {
            processedDeadlines = Object.fromEntries(student.deadline);
          } else if (typeof student.deadline === 'object') {
            processedDeadlines = { ...student.deadline };
          }
        }

        console.log(`📊 Panel student ${student.name} reviews:`, Object.keys(processedReviews));
        console.log(`📅 Panel student ${student.name} deadlines:`, Object.keys(processedDeadlines));

        return {
          _id: student._id,
          regNo: student.regNo,
          name: student.name,
          emailId: student.emailId,
          reviews: processedReviews, // ✅ Plain object instead of Map
          pptApproved: student.pptApproved || { approved: false, locked: false },
          deadline: processedDeadlines, // ✅ Plain object instead of Map
          school: student.school,
          department: student.department
        };
      });

      return {
        ...project,
        students: processedStudents // ✅ Use processed students with converted Maps
      };
    });

    console.log("✅ All panel projects processed with full population");

    // ✅ Find unique school-department pairs across all panel projects
    const schoolDeptPairs = [...new Set(processedProjects.map(p => `${p.school}-${p.department}`))];
    console.log("Unique school-dept pairs for panel projects:", schoolDeptPairs);

    // ✅ Batch fetch marking schemas for all unique pairs
    const markingSchemas = {};
    await Promise.all(schoolDeptPairs.map(async (pair) => {
      const [school, department] = pair.split('-');
      try {
        const schema = await MarkingSchema.findOne({ school, department }).lean();
        if (schema) {
          markingSchemas[pair] = schema;
          console.log(`✅ Found panel schema for ${school}-${department} with ${schema.reviews?.length || 0} reviews`);
        } else {
          console.log(`⚠️ No panel schema found for ${school}-${department}`);
        }
      } catch (error) {
        console.error(`❌ Error fetching panel schema for ${pair}:`, error);
      }
    }));

    // ✅ Attach the correct marking schema to each project
    const projectsWithSchemas = processedProjects.map(project => {
      const schemaKey = `${project.school}-${project.department}`;
      const projectSchema = markingSchemas[schemaKey];
      
      console.log(`Panel project ${project.name}: ${project.school}-${project.department} -> ${projectSchema ? 'HAS SCHEMA' : 'NO SCHEMA'}`);
      
      if (projectSchema) {
        console.log(`📋 Panel schema reviews for ${project.name}:`, projectSchema.reviews?.map(r => r.reviewName) || []);
      }
      
      return {
        ...project,
        markingSchema: projectSchema || null // ✅ Each project gets its own schema
      };
    });

    console.log("✅ Final panel response prepared with schemas and full population");
    
    // ✅ Log final data structure for debugging
    projectsWithSchemas.forEach(project => {
      console.log(`\n📊 Final Panel Project: ${project.name}`);
      console.log(`👥 Students: ${project.students.length}`);
      project.students.forEach(student => {
        console.log(`  - ${student.name}: ${Object.keys(student.reviews || {}).length} reviews`);
      });
      console.log(`📋 Schema: ${project.markingSchema ? 'YES' : 'NO'}`);
      if (project.markingSchema) {
        console.log(`📋 Panel Schema Reviews: ${project.markingSchema.reviews?.map(r => r.reviewName).join(', ') || 'None'}`);
      }
    });

    return res.status(200).json({
      success: true,
      data: projectsWithSchemas, // ✅ Each project now has its correct markingSchema and fully populated data
      message: "Panel projects fetched successfully",
    });
  } catch (error) {
    console.error("❌ Error in getAllPanelProjects:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching panel projects",
      error: error.message,
    });
  }
}


/**
 * Update project details with review data
 */
export const updateProjectDetails = async (req, res) => {
  try {
    const { projectId, studentUpdates, pptApproved } = req.body;
    
    console.log('=== [BACKEND] UPDATE PROJECT STARTED ===');
    console.log('📋 [BACKEND] Project ID:', projectId);
    console.log('📋 [BACKEND] Student Updates:', JSON.stringify(studentUpdates, null, 2));

    // Find the project and populate students
    const project = await Project.findById(projectId).populate('students');
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    console.log('✅ [BACKEND] Project found:', project.name);

    // ✅ CRITICAL FIX: Process each student update properly
    const updatePromises = studentUpdates.map(async (update) => {
      const { studentId, reviews: reviewsToUpdate, pptApproved: studentPptApproved } = update;
      
      const student = await Student.findById(studentId);
      if (!student) {
        console.error('❌ [BACKEND] Student not found:', studentId);
        return null;
      }

      console.log('✅ [BACKEND] Processing student:', student.name);
      console.log('📋 [BACKEND] Reviews before update:', student.reviews);

      // ✅ KEY FIX: Merge updates into existing reviews Map instead of overwriting
      for (const [reviewType, reviewData] of Object.entries(reviewsToUpdate)) {
        console.log(`📋 [BACKEND] MERGING review '${reviewType}' for ${student.name}`);
        console.log('📋 [BACKEND] New review data:', JSON.stringify(reviewData, null, 2));
        
        // ✅ Initialize reviews Map if it doesn't exist
        if (!student.reviews) {
          student.reviews = new Map();
        }
        
        // ✅ Use Map.set() to merge the specific review, not replace entire Map
        student.reviews.set(reviewType, {
          marks: new Map(Object.entries(reviewData.marks || {})),
          comments: reviewData.comments || '',
          attendance: reviewData.attendance || { value: false, locked: false },
          locked: reviewData.locked || false
        });
        
        console.log('✅ [BACKEND] Review merged successfully');
      }

      // Update PPT approval if provided
      if (studentPptApproved) {
        student.pptApproved = studentPptApproved;
        console.log(`📋 [BACKEND] Updated PPT approval for ${student.name}:`, studentPptApproved);
      }

      // ✅ Save the student with merged reviews
      await student.save();
      console.log('✅ [BACKEND] Student saved:', student.name);
      console.log('📋 [BACKEND] Final reviews after save:', student.reviews);
      
      return student;
    });

    const results = await Promise.all(updatePromises);
    const successfulUpdates = results.filter(result => result !== null);

    // Update project-level PPT approval if provided
    if (pptApproved) {
      project.pptApproved = pptApproved;
      await project.save();
      console.log('📋 [BACKEND] Updated project-level PPT approval:', pptApproved);
    }

    console.log('✅ [BACKEND] All updates completed');

    res.status(200).json({
      success: true,
      message: `Successfully updated ${successfulUpdates.length} students`,
      updates: successfulUpdates.length,
      projectId: project._id
    });

  } catch (error) {
    console.error('❌ [BACKEND] Error updating project:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during project update',
      error: error.message
    });
  }
};






// Export other existing functions...


export async function getProjectDetails(req, res) {
  try {
    const { projectId } = req.params;

    const requiredProject = await Project.findOne({ _id: projectId })
      .populate("students")
      .populate("guideFaculty")
      .populate("panel");

    if (!requiredProject) {
      return res.status(404).send({
        message: "No project found with this ID.",
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