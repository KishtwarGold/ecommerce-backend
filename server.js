import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/payment.js";

// =====================
// ES Module __dirname fix
// =====================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
  allowedOrigins.push("http://localhost:5174");
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);

      console.log("⚠️ CORS blocked origin:", origin);
      return callback(null, true); // Allow all in development
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
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

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

// =====================
// Routes
// =====================
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);

// =====================
// 404 Handler - MUST BE AFTER ALL ROUTES
// =====================
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      "GET /",
      "GET /health",
      "POST /api/payment/create",
      "POST /api/payment/verify",
      "POST /api/payment/webhook",
      "POST /api/orders/*"
    ]
  });
});

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

  console.error("❌ Error:", err.stack);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "production" 
      ? "Internal Server Error" 
      : err.message,
  });
});

// =====================
// Start Server
// =====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Allowed origins:`, allowedOrigins);
});