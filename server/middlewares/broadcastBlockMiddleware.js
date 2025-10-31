import BroadcastMessage from "../models/broadcastMessageSchema.js";
import Faculty from "../models/facultySchema.js";

// Middleware to block faculty API access when an active blocking broadcast exists
export default async function broadcastBlockMiddleware(req, res, next) {
  try {
    // Allow fetching broadcasts even when blocked so faculty can see the notice
    if (req.path && req.path.includes('/broadcasts')) {
      return next();
    }

    const facultyId = req.user && req.user.id;
    if (!facultyId) {
      // If no authenticated user, let other auth middleware handle it
      return next();
    }

    const faculty = await Faculty.findById(facultyId).select('school department');
    if (!faculty) return next();

    const facultySchools = Array.isArray(faculty.school) ? faculty.school.filter(Boolean) : [];
    const facultyDepartments = Array.isArray(faculty.department) ? faculty.department.filter(Boolean) : [];

    const now = new Date();

    try {
      await BroadcastMessage.updateMany(
        {
          isActive: true,
          expiresAt: { $exists: true, $lte: now },
        },
        { $set: { isActive: false } }
      );
    } catch (deactivateError) {
      console.error('WARN auto-deactivate broadcasts failed in middleware', deactivateError);
    }

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
      action: 'block',
      isActive: true,
      $and: audienceFilter,
      expiresAt: { $exists: true, $gt: now },
    };

    const blocking = await BroadcastMessage.findOne(filters).lean();

    if (blocking) {
      return res.status(403).json({
        success: false,
        message: "Access temporarily blocked by administrator",
        broadcast: blocking,
      });
    }

    return next();
  } catch (err) {
    // don't block access if the middleware itself fails; log and continue
    // use console.error cautiously; in production this should use the request logger
    console.error('broadcastBlockMiddleware error', err);
    return next();
  }
}
