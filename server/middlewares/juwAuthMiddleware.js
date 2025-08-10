// jwtAuthMiddleware.js
import jwt from "jsonwebtoken";

const jwtAuthMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user data to request object
    req.user = decoded;

    // Check role if needed
    if (req.body.expectedRole && decoded.role !== req.body.expectedRole) {
      return res.status(403).json({ message: "Unauthorized role access!" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default jwtAuthMiddleware;
