import express from "express";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// Generate avatar URL from avatar ID
const getAvatarUrl = (avatarId) => {
  if (!avatarId || avatarId.startsWith("http")) {
    return avatarId || "https://api.dicebear.com/7.x/avataaars/svg?seed=default";
  }

  // Avatar options mapping - matches frontend constants
  const avatarMap = {
    avatar1: "avatar1",
    avatar2: "avatar2",
    avatar3: "avatar3",
    avatar4: "avatar4",
    avatar5: "avatar5",
    avatar6: "avatar6",
    avatar7: "avatar7",
    avatar8: "avatar8",
  };

  const seed = avatarMap[avatarId] || "default";
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
};

// Update user avatar
router.put("/avatar", verifyToken, async (req, res) => {
  try {
    const { avatar } = req.body;
    const userId = req.user.id;

    if (!avatar) {
      return res.status(400).json({ message: "Avatar is required" });
    }

    // Find and update user
    const user = await User.findByIdAndUpdate(
      userId,
      {
        avatar,
        profileImage: getAvatarUrl(avatar), // Generate and save the profile image URL
      },
      { new: true } // Return updated document
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Avatar updated successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
      profileImage: user.profileImage, // Return for mobile app
    });
  } catch (error) {
    console.error("Error updating avatar:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get user profile (including avatar)
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      user: {
        _id: user._id,
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
