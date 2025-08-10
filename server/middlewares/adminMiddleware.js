import jwt from "jsonwebtoken";
import Faculty from "../models/facultySchema.js";

export async function adminMiddleware(req, res, next) {
  try {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ message: "Access Denied. No Token Provided!" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    const faculty = await Faculty.findOne({ employeeId: req.user.employeeId });
    if (!faculty) {
      return res.status(404).json({ message: "Faculty Not Found!" });
    }

    if (req.user.role !== "admin") {
      return res.status(401).json({ message: "Admin only access!" });
    }

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid token" });
    } else if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Token expired" });
    }
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
}
