import Faculty from "../models/facultySchema.js";
import Project from "../models/projectSchema.js";
import Panel from "../models/panelSchema.js";
import MarkingSchema from "../models/markingSchema.js";
import BroadcastMessage from "../models/broadcastMessageSchema.js";
import { logger, safeMeta } from "../utils/logger.js";

// Get details of a faculty by employee ID
export async function getFacultyDetails(req, res) {
  try {
    const { employeeId } = req.params;

    const faculty = await Faculty.findOne({ employeeId });
    if (!faculty) {
      return res
        .status(404)
        .json({ message: "No faculty found with the provided ID" });
    }

    return res.status(200).json({
      success: true,
      message: "Operation successful",
      data: faculty,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// Replaces getDefaultDeadline (returns the marking schema for a department)
// Update this function in your facultyController.js
export async function getMarkingSchema(req, res) {
  try {
    logger.info('get_marking_schema_called', safeMeta({ method: req.method, url: req.url, user: req.user?.id, requestId: req.requestId }));

    // Get school and department from authenticated faculty user
    const facultyId = req.user.id;
    
    // Get faculty details to extract school and department
    const faculty = await Faculty.findById(facultyId);
    console.log('Faculty found:', faculty ? {
      id: faculty._id,
      name: faculty.name,
      employeeId: faculty.employeeId,
      school: faculty.school,
      department: faculty.department
    } : 'null');

    if (!faculty) {
      console.error('❌ Faculty not found in database for ID:', facultyId);
      return res.status(404).json({
        success: false,
        message: "Faculty not found"
      });
    }

    const { school, department } = faculty;
    console.log(`🔍 Searching for marking schema - School: ${school}, Department: ${department}`);

    if (!school || !department) {
      console.error('❌ Faculty missing school or department:', { school, department });
      return res.status(400).json({
        success: false,
        message: "Faculty school or department not set"
      });
    }

    const schema = await MarkingSchema.findOne({ school, department });
    console.log('Marking schema found:', schema ? {
      id: schema._id,
      school: schema.school,
      department: schema.department,
      reviewsCount: schema.reviews?.length || 0
    } : 'null');

    if (!schema) {
      console.log('⚠️ No marking schema found, creating default response');
      return res.status(200).json({
        success: false,
        message: "No marking schema found for this school and department.",
        data: null
      });
    }

    logger.info('marking_schema_retrieved', safeMeta({ schemaId: schema._id, reviewsCount: schema.reviews?.length || 0 }));

    return res.status(200).json({
      success: true,
      data: schema,
      message: "Marking schema retrieved successfully"
    });
  } catch (error) {
    console.error("❌ Error in getMarkingSchema:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
}


//  Get all guide and panel projects for a faculty
export async function getFacultyProjects(req, res) {
  try {
    const { employeeId } = req.params;

    logger.info('get_faculty_projects_called', safeMeta({ employeeId, requestId: req.requestId, user: req.user?.id }));

    const faculty = await Faculty.findOne({ employeeId });
    if (!faculty) {
      logger.warn('faculty_not_found_for_projects', safeMeta({ employeeId }));
      return res
        .status(404)
        .json({ message: "No faculty found with the provided employeeId." });
    }

    // Projects where this faculty is the guide
    const guideProjects = await Project.find({ guideFaculty: faculty._id })
      .populate("students", "name regNo emailId")
      .populate("guideFaculty", "name employeeId")
      .lean();

    // ✅ FIXED: Panels where this faculty is a member (updated to use members array)
    const panels = await Panel.find({
      members: faculty._id, // ✅ Updated from faculty1/faculty2 to members array
    }).select("_id");

    const panelIds = panels.map((panel) => panel._id);

    // Projects evaluated by these panels
    const panelProjects = await Project.find({ panel: { $in: panelIds } })
      .populate("students", "name regNo emailId")
      .populate("guideFaculty", "name employeeId")
      .populate({
        path: "panel",
        model: "Panel",
        select: "members venue school department", // ✅ Include venue field
        populate: {
          path: "members", // ✅ Populate members array
          model: "Faculty",
          select: "name employeeId",
        },
      })
      .lean();

    // Format response
    const formatProjects = (projects) =>
      projects.map((project) => ({
        _id: project._id,
        name: project.name,
        students: (project.students || []).map((student) => ({
          _id: student._id,
          name: student.name || "N/A",
          regNo: student.regNo || "N/A",
          emailId: student.emailId || "N/A",
        })),
        guideFaculty: project.guideFaculty
          ? {
              name: project.guideFaculty.name,
              employeeId: project.guideFaculty.employeeId,
            }
          : null,
        panel: project.panel ? {
          _id: project.panel._id,
          members: project.panel.members || [], // ✅ Include members data
          venue: project.panel.venue || null, // ✅ Include venue data
          school: project.panel.school,
          department: project.panel.department,
        } : null,
      }));

    return res.status(200).json({
      success: true,
      message: "Faculty project data fetched successfully",
      data: {
        guideProjects: formatProjects(guideProjects),
        panelProjects: formatProjects(panelProjects),
      },
    });
  } catch (error) {
    console.error("Error in getFacultyProjects:", error);
    res.status(500).json({ message: error.message });
  }
}

export async function getFacultyBroadcasts(req, res) {
  try {
    const facultyId = req.user.id;

    const faculty = await Faculty.findById(facultyId).select(
      "school department"
    );

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    const facultySchools = Array.isArray(faculty.school)
      ? faculty.school.filter(Boolean)
      : [];
    const facultyDepartments = Array.isArray(faculty.department)
      ? faculty.department.filter(Boolean)
      : [];

    const {
      since,
      limit = 20,
      includeExpired = "false",
    } = req.query;

    const parsedLimit = Math.min(Number(limit) || 20, 50);
    const now = new Date();

    const audienceFilter = [
      {
        $or: [
          { targetSchools: { $exists: false } },
          { targetSchools: { $size: 0 } },
          { targetSchools: { $in: facultySchools } },
        ],
      },
      {
        $or: [
          { targetDepartments: { $exists: false } },
          { targetDepartments: { $size: 0 } },
          { targetDepartments: { $in: facultyDepartments } },
        ],
      },
    ];

    const filters = {
      isActive: true,
      $and: audienceFilter,
    };

    if (since) {
      const sinceDate = new Date(since);
      if (!Number.isNaN(sinceDate.getTime())) {
        filters.createdAt = { $gt: sinceDate };
      }
    }

    if (includeExpired !== "true") {
      filters.$or = [{ expiresAt: null }, { expiresAt: { $gt: now } }];
    }

    const messages = await BroadcastMessage.find(filters)
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .lean();

    return res.status(200).json({
      success: true,
      data: messages,
      meta: {
        count: messages.length,
        limit: parsedLimit,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching faculty broadcasts:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch broadcast messages.",
      error: error.message,
    });
  }
}
