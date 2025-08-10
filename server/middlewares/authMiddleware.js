import Faculty from "../models/facultySchema.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const authMiddleware = async (req, res, next) => {
  const { emailId, password, expectedRole } = req.body;

  try {
    // Find faculty by email
    const faculty = await Faculty.findOne({ emailId });
    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found! this is auth" });
    }

    // Check role if expectedRole is provided
    if (expectedRole && faculty.role !== expectedRole) {
      return res.status(403).json({ message: "Unauthorized role access!" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, faculty.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials!" });
    }

    // Generate JWT Token
    const token = jwt.sign(
      {
        id: faculty._id,
        emailId: faculty.emailId,
        employeeId: faculty.employeeId,
        role: faculty.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({ token, faculty });
  } catch (error) {
    return res.status(500).json({ message: error.stack });
  }
};

export default authMiddleware;