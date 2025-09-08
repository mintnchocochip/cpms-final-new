import mongoose from "mongoose";
import Faculty from "../models/facultySchema.js";
import bcrypt from "bcryptjs";
import Student from "../models/studentSchema.js";
import Request from "../models/requestSchema.js";
import Project from "../models/projectSchema.js";
import Panel from "../models/panelSchema.js";
import MarkingSchema from "../models/markingSchema.js";

// for updating the structure of the marks
// Updated createOrUpdateMarkingSchema function
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

  // Validate reviews structure
  for (const review of reviews) {
    if (!review.reviewName || !review.facultyType || !['guide', 'panel'].includes(review.facultyType)) {
      return res.status(400).json({ 
        success: false, 
        message: "Each review must have reviewName and facultyType (guide or panel)" 
      });
    }
    
    if (!review.deadline || !review.deadline.from || !review.deadline.to) {
      return res.status(400).json({ 
        success: false, 
        message: "Each review must have valid deadline with from and to dates" 
      });
    }
  }

  try {
    const updated = await MarkingSchema.findOneAndUpdate(
      { school, department },
      { reviews },
      { new: true, upsert: true }
    );

    res.status(200).json({ 
      success: true, 
      message: "Marking schema saved successfully.", 
      data: updated 
    });
  } catch (error) {
    console.error("Error saving marking schema:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error while saving marking schema" 
    });
  }
}

// Updated getDefaultDeadline function
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

    res.status(200).json({
      success: true,
      data: {
        school: markingSchema.school,
        department: markingSchema.department,
        reviews: markingSchema.reviews.map(review => ({
          reviewName: review.reviewName,
          displayName: review.displayName || review.reviewName,
          facultyType: review.facultyType || 'guide',
          components: review.components || [],
          deadline: review.deadline || null,
          requiresPPT: review.requiresPPT || false
        }))
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


export async function createFaculty(req, res) {
  try {
    const {
      name,
      emailId,
      password,
      employeeId,
      school,
      department,
      specialization,
      imageUrl,
      role = "faculty"
    } = req.body;

    // Validate required fields
    if (!name || !emailId || !password || !employeeId) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, and employee ID are required",
      });
    }

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

    // Validate school, department, and specialization arrays
    if (!school || !Array.isArray(school) || school.length === 0) {
      return res.status(400).json({
        success: false,
        message: "School must be a non-empty array",
      });
    }

    if (!department || !Array.isArray(department) || department.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Department must be a non-empty array",
      });
    }

    if (!specialization || !Array.isArray(specialization) || specialization.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Specialization must be a non-empty array",
      });
    }

    // Check if email is already registered
    const existingFaculty = await Faculty.findOne({ 
      $or: [
        { emailId: emailId.trim().toLowerCase() },
        { employeeId: employeeId.trim().toUpperCase() }
      ]
    });
    
    if (existingFaculty) {
      return res.status(400).json({
        success: false,
        message: "Faculty with this email or employee ID already exists!",
      });
    }

    // Hash password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create faculty with correct field names matching schema
    const newFaculty = new Faculty({
      imageUrl: imageUrl || "",
      name: name.trim(),
      emailId: emailId.trim().toLowerCase(),
      password: hashedPassword,
      employeeId: employeeId.trim().toUpperCase(),
      role: role,
      school: school.map(s => s.trim()), // Array field
      department: department.map(d => d.trim()), // Array field
      specialization: specialization.map(sp => sp.trim()), // Array field
    });

    await newFaculty.save();

    return res.status(201).json({
      success: true,
      message: "Faculty created successfully!",
    });

  } catch (error) {
    console.error("Error creating faculty:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating faculty",
      error: error.message,
    });
  }
}

export async function createFacultyBulk(req, res) {
  try {
    const { facultyList } = req.body;
    if (!Array.isArray(facultyList) || facultyList.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Faculty list is required and must be a non-empty array",
      });
    }

    const results = {
      created: 0,
      errors: 0,
      details: [],
    };

    for (let i = 0; i < facultyList.length; i++) {
      const faculty = facultyList[i];
      try {
        // Validate required fields including arrays for schools, departments and specialization
        if (
          !faculty.name ||
          !faculty.emailId ||
          !faculty.password ||
          !faculty.employeeId ||
          !faculty.schools ||
          !faculty.departments ||
          !faculty.specialization
        ) {
          results.errors++;
          results.details.push({
            row: i + 1,
            error:
              "Missing required fields including schools, departments, or specialization",
          });
          continue;
        }

        if (
          !Array.isArray(faculty.schools) ||
          faculty.schools.length === 0 ||
          !Array.isArray(faculty.departments) ||
          faculty.departments.length === 0 ||
          !Array.isArray(faculty.specialization) ||
          faculty.specialization.length === 0
        ) {
          results.errors++;
          results.details.push({
            row: i + 1,
            error:
              "Schools, departments, and specialization must be non-empty arrays",
          });
          continue;
        }

        if (!faculty.emailId.endsWith("@vit.ac.in")) {
          results.errors++;
          results.details.push({
            row: i + 1,
            error: "Invalid email domain",
          });
          continue;
        }

        // Check existing faculty by email or employeeId (case normalized)
        const existingFaculty = await Faculty.findOne({
          $or: [
            { emailId: faculty.emailId.trim().toLowerCase() },
            { employeeId: faculty.employeeId.trim().toUpperCase() },
          ],
        });
        
        if (existingFaculty) {
          results.errors++;
          results.details.push({
            row: i + 1,
            error: "Faculty with this email or employee ID already exists",
          });
          continue;
        }

        // Hash password securely
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(faculty.password, salt);

        // Create new faculty record with array fields and other details
        const newFaculty = new Faculty({
          imageUrl: faculty.imageUrl || "",
          name: faculty.name.trim(),
          emailId: faculty.emailId.trim().toLowerCase(),
          password: hashedPassword,
          employeeId: faculty.employeeId.trim().toUpperCase(),
          role: faculty.role || "faculty",
          school: faculty.schools.map((s) => s.trim()), // Note: frontend sends 'schools' but schema expects 'school'
          department: faculty.departments.map((d) => d.trim()), // Note: frontend sends 'departments' but schema expects 'department'
          specialization: faculty.specialization.map((sp) => sp.trim()),
        });

        await newFaculty.save();
        console.log(newFaculty)
        results.created++;
      } catch (error) {
        results.errors++;
        results.details.push({
          row: i + 1,
          error: error.message,
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: `Bulk faculty creation completed. ${results.created} created, ${results.errors} errors.`,
      data: results,
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

export async function updateFaculty(req, res) {
  try {
    const { employeeId } = req.params;
    const {
      name,
      emailId,
      password,
      school,
      department,
      specialization,
      role,
      imageUrl,
    } = req.body;

    // Find existing faculty by employeeId (normalize case if needed)
    const faculty = await Faculty.findOne({
      employeeId: employeeId.trim().toUpperCase(),
    });
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty with the given employee ID not found.",
      });
    }

    // Validate updated email if provided
    if (emailId && !emailId.endsWith("@vit.ac.in")) {
      return res.status(400).json({
        success: false,
        message: "Only college emails allowed!",
      });
    }

    // If email is updated and different, check uniqueness
    if (emailId && emailId !== faculty.emailId) {
      const emailExists = await Faculty.findOne({ emailId });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Another faculty with this email already exists.",
        });
      }
    }

    // Validate password if provided
    if (password) {
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
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      faculty.password = await bcrypt.hash(password, salt);
    }

    // Update fields if provided
    if (name) faculty.name = name;
    if (emailId) faculty.emailId = emailId.trim().toLowerCase();
    if (role && ["admin", "faculty"].includes(role)) faculty.role = role;
    if (Array.isArray(school) && school.length > 0) faculty.school = school;
    if (Array.isArray(department) && department.length > 0)
      faculty.department = department;
    if (Array.isArray(specialization) && specialization.length > 0)
      faculty.specialization = specialization;
    if (imageUrl !== undefined) faculty.imageUrl = imageUrl;

    await faculty.save();
    console.log(faculty)

    return res.status(200).json({
      success: true,
      message: "Faculty updated successfully!",
    });
  } catch (error) {
    console.error("Error updating faculty:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating faculty",
    });
  }
}

// export async function getAllFaculty(req, res) {
//   const allFaculty = await Faculty.find({});

//   if (allFaculty.length === 0) {
//     console.log("no faculty found");
//     return res.status(404).json({
//       success: false,
//       message: "No Faculty found",
//     });
//   }

//   return res.status(200).json({
//     success: true,
//     data: allFaculty,
//   });
// }


// controller for getAllFaculty based on school, dept or specilization 

// ✅ FIXED: Use query parameters instead of path parameters
export async function getAllFaculty(req, res) {
  const { school, department, specialization, sortBy, sortOrder } = req.query; // Changed from req.params to req.query

  try {
    // Build dynamic query based on provided params
    let query = {};
    
    if (school && school !== 'all') query.schools = school;
    if (department && department !== 'all') query.departments = department;
    if (specialization && specialization !== 'all') query.specialization = specialization;

    // If no filters provided, return all faculty
    // Remove the restriction that required at least one filter

    // Allowed sorting fields
    const validSortFields = ["schools", "departments", "specialization", "name", "employeeId"];
    
    let sortOption = {};
    if (sortBy && validSortFields.includes(sortBy)) {
      const order = sortOrder && sortOrder.toLowerCase() === "desc" ? -1 : 1;
      sortOption[sortBy] = order;
    } else {
      // Default sort by name
      sortOption.name = 1;
    }

    const faculty = await Faculty.find(query).sort(sortOption).select('-password');

    res.status(200).json({
      success: true,
      data: faculty.map((f) => ({
        _id: f._id,
        imageUrl: f.imageUrl,
        name: f.name,
        employeeId: f.employeeId,
        emailId: f.emailId,
        role: f.role,
        school: f.schools, // Note: using schools (array) from schema
        department: f.departments, // Note: using departments (array) from schema
        specialization: f.specialization,
      })),
      count: faculty.length
    });
  } catch (error) {
    console.error('Error in getAllFaculty:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
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

    // Build dynamic query for faculties by role and optional school and department
    const facultyQuery = { role: "faculty" };
    if (school) facultyQuery.school = school;
    if (department) facultyQuery.department = department;

    const faculties = await Faculty.find(facultyQuery);

    const result = await Promise.all(
      faculties.map(async (faculty) => {
        // Build dynamic query for projects by guideFaculty, and optional school and department
        const projectQuery = { guideFaculty: faculty._id };
        if (school) projectQuery.school = school;
        if (department) projectQuery.department = department;

        const guidedProjects = await Project.find(projectQuery)
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

    // Find all panels with populated faculties
    const panels = await Panel.find()
      .populate("faculty1", "employeeId name emailId school department")
      .populate("faculty2", "employeeId name emailId school department")
      .lean();

    // Filter panels based on school and department if provided
    const filteredPanels = panels.filter((panel) => {
      if (!panel.faculty1 || !panel.faculty2) return false;
      let schoolMatch = true;
      let departmentMatch = true;

      if (school) {
        schoolMatch =
          panel.faculty1.school?.includes(school) &&
          panel.faculty2.school?.includes(school);
      }
      if (department) {
        departmentMatch =
          panel.faculty1.department?.includes(department) &&
          panel.faculty2.department?.includes(department);
      }
      return schoolMatch && departmentMatch;
    });

    // For each filtered panel, find projects linked to it, optionally filtered by school and department
    const result = await Promise.all(
      filteredPanels.map(async (panel) => {
        const projectQuery = { panel: panel._id };
        if (school) projectQuery.school = school;
        if (department) projectQuery.department = department;

        const projects = await Project.find(projectQuery)
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

export async function deleteFacultyByEmployeeId(req, res) {
  const { employeeId } = req.params;

  try {
    const deletedFaculty = await Faculty.findOneAndDelete({
      employeeId: employeeId.trim().toUpperCase(),
    });

    if (!deletedFaculty) {
      return res.status(404).json({
        success: false,
        message: `No faculty found with employee ID: ${employeeId}`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Faculty with employee ID ${employeeId} has been deleted successfully.`,
      data: deletedFaculty,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while deleting faculty",
      error: error.message,
    });
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

    // ✅ FIXED: Handle array fields - check if they have common school and department
    const commonschool = faculty1.school.filter(s => faculty2.school.includes(s));
    const commondepartment = faculty1.department.filter(d => faculty2.department.includes(d));

    if (commonschool.length === 0 || commondepartment.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Faculty members must have at least one common school and department.",
      });
    }

    // Use the first common school and department
    const panel = new Panel({
      faculty1: faculty1Id,
      faculty2: faculty2Id,
      school: commonschool[0],
      department: commondepartment[0],
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


export async function autoCreatePanels(req, res) {
  try {
    // Request structure:
    // {
    //   "departments": {
    //     "BTech": { "panelsNeeded": 5, "panelSize": 3, "faculties": [Array of faculty _id] },
    //     "MCA": { "panelsNeeded": 2, "panelSize": 2, "faculties": [Array of faculty _id] }
    //   }
    // }

    const departments = req.body.departments;
    const createdPanels = [];
    const invalidFaculties = {};

    for (const [dept, { panelsNeeded, panelSize, faculties }] of Object.entries(departments)) {
      // 1. Validate all faculties exist and belong to the right department
      const foundFaculties = await Faculty.find({ _id: { $in: faculties }, department: dept });
      const foundIds = foundFaculties.map(f => f._id.toString());
      const missingIds = faculties.filter(fid => !foundIds.includes(fid.toString()));

      // Track any missing faculties
      if (missingIds.length > 0) {
        invalidFaculties[dept] = missingIds;
        continue; // Skip this department if any faculty is missing
      }

      // 2. Sort faculties by experience (employeeId ascending)
      foundFaculties.sort((a, b) => parseInt(a.employeeId) - parseInt(b.employeeId));

      // 3. Ensure enough faculties for panels
      const totalAvailable = foundFaculties.length;
      if (totalAvailable < panelsNeeded * panelSize) {
        invalidFaculties[dept] = [`Not enough faculties, need ${panelsNeeded * panelSize}, found ${totalAvailable}`];
        continue;
      }

      // 4. Build panels: always group most exp/least exp together in each panel
      const used = new Set();
      let facultyPool = [...foundFaculties];

      for (let i = 0; i < panelsNeeded; i++) {
        // Select faculty for panel: combine most and least experienced, no repeats
        let panelMembers = [];
        let left = 0, right = facultyPool.length - 1;

        // Try to add most + least experienced, avoid repeats, until panelSize is met
        while (panelMembers.length < panelSize && left <= right) {
          // Pick from extremes
          if (!used.has(facultyPool[left]._id.toString()) && panelMembers.length < panelSize) {
            panelMembers.push(facultyPool[left]);
            used.add(facultyPool[left]._id.toString());
          }
          if (left !== right && !used.has(facultyPool[right]._id.toString()) && panelMembers.length < panelSize) {
            panelMembers.push(facultyPool[right]);
            used.add(facultyPool[right]._id.toString());
          }
          left++; right--;
        }
        if (panelMembers.length !== panelSize) break; // Should not happen if checks are correct

        // Create and save panel
        const panel = new Panel({
          members: panelMembers.map(f => f._id), // If your schema uses faculty1/faculty2, adjust accordingly
          department: dept,
          school: panelMembers.school,
        });
        await panel.save();
        createdPanels.push(panel);
      }
    }

    res.status(200).json({
      success: Object.keys(invalidFaculties).length === 0,
      message: Object.keys(invalidFaculties).length === 0
        ? "Panels created successfully."
        : `Panels created with errors. Invalid/missing faculties: ${JSON.stringify(invalidFaculties)}`,
      panelsCreated: createdPanels.length,
      details: createdPanels.map(p => ({
        department: p.department,
        facultyIds: p.members // Or [p.faculty1, p.faculty2] per your schema
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
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

export async function assignPanelToProject(req, res) {
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
    // if (
    //   panel.school !== project.school ||
    //   panel.department !== project.department
    // ) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Panel and project belong to different school or department.",
    //   });
    // }

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
    const buffer = Number(req.body.buffer) || 0;

    const unassignedProjects = await Project.find({ panel: null }).populate(
      "guideFaculty"
    );
    const panels = await Panel.find().populate(["faculty1", "faculty2"]);

    if (!panels.length) {
      return res
        .status(400)
        .json({ success: false, message: "No panels available." });
    }

    // Only use eligible panels (excluding buffer)
    const panelsToAssign = panels.slice(0, panels.length - buffer);

    if (!panelsToAssign.length) {
      return res
        .status(400)
        .json({
          success: false,
          message: "No panels left for assignment (buffer too large).",
        });
    }

    // Initialize a map to hold assignments
    const panelAssignments = {};
    panelsToAssign.forEach((panel) => {
      panelAssignments[panel._id.toString()] = [];
    });

    let panelIndex = 0;

    for (const project of unassignedProjects) {
      const projSpec = project.specialization?.trim();

      // Filter panels for specialization match (as before)
      let eligiblePanels = panelsToAssign.filter((panel) => {
        const { faculty1, faculty2, specialization } = panel;
        if (!faculty1 || !faculty2) return false;
        if (!specialization || !projSpec || specialization.trim() !== projSpec)
          return false;
        const faculty1HasSpec = faculty1.specialization?.some(
          (s) => s.trim() === projSpec
        );
        const faculty2HasSpec = faculty2.specialization?.some(
          (s) => s.trim() === projSpec
        );
        return faculty1HasSpec || faculty2HasSpec;
      });

      // Fallback to any panel if none match by specialization
      if (!eligiblePanels.length) {
        eligiblePanels = panelsToAssign;
      }

      // Assign project to next eligible panel round-robin
      const eligiblePanel = eligiblePanels[panelIndex % eligiblePanels.length];
      project.panel = eligiblePanel._id;
      await project.save();

      panelAssignments[eligiblePanel._id.toString()].push(project._id);

      panelIndex++;
    }

    return res.status(200).json({
      success: true,
      message: `Panels assigned to unassigned projects. Last ${buffer} panels left unassigned.`,
      assignments: panelAssignments,
      bufferUnassigned: panels.slice(panels.length - buffer).map((p) => p._id),
    });
  } catch (error) {
    console.error("Error in autoAssignPanelsToProjects:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}


// export async function assignPanelToProject(req, res) {
//   try {
//     const { panelFacultyIds, projectId } = req.body;

//     if (!Array.isArray(panelFacultyIds) || panelFacultyIds.length !== 2) {
//       return res.status(400).json({
//         success: false,
//         message: "Exactly 2 panel faculty IDs required.",
//       });
//     }

//     // Check distinctness
//     if (panelFacultyIds[0] === panelFacultyIds[1]) {
//       return res.status(400).json({
//         success: false,
//         message: "Panel faculty members must be distinct.",
//       });
//     }

//     const [faculty1, faculty2] = await Promise.all([
//       Faculty.findById(panelFacultyIds[0]),
//       Faculty.findById(panelFacultyIds[1]),
//     ]);

//     if (!faculty1 || !faculty2) {
//       return res.status(404).json({
//         success: false,
//         message: "One or both faculty not found.",
//       });
//     }

//     const project = await Project.findById(projectId).populate("guideFaculty");
//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: "Project not found.",
//       });
//     }

//     if (!project.guideFaculty) {
//       return res.status(400).json({
//         success: false,
//         message: "Project has no guide faculty to check.",
//       });
//     }

//     // Check that panel faculty and guide faculty have same school and dept
//     if (
//       faculty1.school !== project.guideFaculty.school ||
//       faculty2.school !== project.guideFaculty.school ||
//       faculty1.department !== project.guideFaculty.department ||
//       faculty2.department !== project.guideFaculty.department
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Panel faculty and guide faculty must belong to the same school and department.",
//       });
//     }

//     // Prevent guide faculty from being panel member
//     if (
//       project.guideFaculty._id.toString() === panelFacultyIds[0] ||
//       project.guideFaculty._id.toString() === panelFacultyIds[1]
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Guide faculty cannot be a panel member for their own project.",
//       });
//     }

//     // Create panel
//     const panel = new Panel({
//       faculty1: panelFacultyIds[0],
//       faculty2: panelFacultyIds[1],
//       school: faculty1.school,
//       department: faculty1.department,
//     });
//     await panel.save();

//     // Assign panel to project
//     project.panel = panel._id;
//     await project.save();

//     const populatedProject = await Project.findById(projectId).populate({
//       path: "panel",
//       populate: [{ path: "faculty1" }, { path: "faculty2" }],
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Panel assigned successfully",
//       data: populatedProject,
//     });
//   } catch (error) {
//     console.error("Error in assignPanelToProject:", error);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// }

// export async function getAllFacultyWithProjects(req, res) {
//   try {
//     const { school, department } = req.query;

//     // Filter faculties optionally by school and department
//     const facultyFilter = {};
//     if (school) facultyFilter.school = school;
//     if (department) facultyFilter.department = department;

//     const allFaculty = await Faculty.find(facultyFilter);

//     const facultyWithProjects = [];

//     for (const faculty of allFaculty) {
//       const facultyId = faculty._id;

//       // Guided projects in same school and dept as faculty
//       const guidedProjects = await Project.find({
//         guideFaculty: facultyId,
//         school: faculty.school,
//         department: faculty.department,
//       })
//         .populate("students", "name regNo")
//         .populate("panel");

//       // Panels where faculty is either member and panel in same school/department
//       const panelsWithFaculty = await Panel.find({
//         $or: [{ faculty1: facultyId }, { faculty2: facultyId }],
//         school: faculty.school,
//         department: faculty.department,
//       });

//       const panelIds = panelsWithFaculty.map((panel) => panel._id);

//       const panelProjects = await Project.find({
//         panel: { $in: panelIds },
//         school: faculty.school,
//         department: faculty.department,
//       })
//         .populate("students", "name regNo")
//         .populate("panel");

//       facultyWithProjects.push({
//         faculty: {
//           name: faculty.name,
//           employeeId: faculty.employeeId,
//           emailId: faculty.emailId,
//           school: faculty.school,
//           department: faculty.department,
//         },
//         guide: guidedProjects,
//         panel: panelProjects,
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: facultyWithProjects,
//     });
//   } catch (error) {
//     console.error("Error in getAllFacultyWithProjects:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message,
//     });
//   }
// }