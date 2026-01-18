import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";

import connectDB from "./config/db.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/payment.js";

// =====================
// Load ENV
// =====================
dotenv.config();

// =====================
// App Init
// =====================
const app = express();

// =====================
// MongoDB Connection
// =====================
const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed");
    process.exit(1);
  }
};

startServer();

// =====================
// Middleware
// =====================
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================
// CORS Setup - UPDATED FOR PRODUCTION
// =====================
const allowedOrigins = [
  "https://www.kongdoon.com",
  "https://kongdoon.com",
  "https://ecommerce-frontend-flame-tau.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

// For local development only
if (process.env.NODE_ENV !== "production") {
  allowedOrigins.push("http://localhost:5173");
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// =====================
// Health Check
// =====================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend is running 🚀",
    environment: process.env.NODE_ENV || "development",
  });
});

// =====================
// Routes
// =====================
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);

// =====================
// Error Handler
// =====================
app.use((err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "CORS blocked this request",
    });
  }

  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

// =====================
// Start Server
// =====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});