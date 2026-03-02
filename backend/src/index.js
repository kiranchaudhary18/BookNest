import express from "express";
import cors from "cors";
import "dotenv/config";
import job from "./lib/cron.js";

import authRoutes from "./routes/authRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import userRoutes from "./routes/userRoutes.js";

import { connectDB } from "./lib/db.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Start cron job only if API_URL is configured (for production keep-alive)
if (process.env.API_URL && process.env.API_URL.trim() !== "") {
  job.start();
  console.log("Cron job started for keep-alive requests");
}

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());

// Test routes to verify backend is running
app.get("/", (req, res) => {
  res.status(200).json({
    message: "BookNest Backend is running",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api", (req, res) => {
  res.status(200).json({
    message: "BookNest API is working",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      books: "/api/books",
      users: "/api/users",
    },
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/users", userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.path,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log(`Test URL: http://192.168.43.171:${PORT}/api`);
  connectDB();
});
