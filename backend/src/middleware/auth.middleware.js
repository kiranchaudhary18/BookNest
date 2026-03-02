import jwt from "jsonwebtoken";
import User from "../models/User.js";

// const response = await fetch(`http://localhost:3000/api/books`, {
//   method: "POST",
//   body: JSON.stringify({
//     title,
//     caption
//   }),
//   headers: { Authorization: `Bearer ${token}` },
// });

const protectRoute = async (req, res, next) => {
  try {
    // get token
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "No authentication token, access denied" });

    // verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // find user by userId from token
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return res.status(401).json({ message: "Token is not valid" });

    // Attach both user object and user.id for flexibility
    req.user = user;
    req.user.id = user._id.toString();
    next();
  } catch (error) {
    console.error("Authentication error:", error.message);
    res.status(401).json({ message: "Token is not valid" });
  }
};

// Export as both default and named export
export const verifyToken = protectRoute;
export default protectRoute;
