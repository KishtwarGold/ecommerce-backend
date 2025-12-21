// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import connectDB from "./config/db.js";
// import orderRoutes from "./routes/orderRoutes.js";


// dotenv.config();

// // MongoDB connect
// connectDB();

// const app = express();

// // Middlewares
// app.use(cors());
// app.use(express.json());

// app.use("/api/orders", orderRoutes);

// // Test route
// app.get("/", (req, res) => {
//   res.send("Backend is running 🚀");
// });

// // Port
// const PORT = process.env.PORT || 5000;

// // Server start
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });




import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import orderRoutes from "./routes/orderRoutes.js"; // ✅ IMPORTANT

import cors from "cors";
import morgan from "morgan";

dotenv.config();
const app = express();

// =====================
// MongoDB Connection
// =====================
connectDB()
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message || err);
    process.exit(1);
  });

// =====================
// Middleware
// =====================
app.use(morgan("dev"));
app.use(express.json());

// =====================
// ✅ CORS SETUP (FIXED)
// =====================
const allowedOrigins = [
  "http://localhost:5173",            // local frontend
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
].filter(Boolean); // remove undefined values

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow Postman / server requests
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("❌ Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// =====================
// API Routes
// =====================
app.use("/api/orders", orderRoutes);

// =====================
// Test API
// =====================
app.get("/api", (req, res) => {
  res.json({ success: true, message: "Backend is up and running 🚀" });
});

// =====================
// Global Error Handler
// =====================
app.use((err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      error: "CORS blocked this request",
    });
  }

  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: "Internal Server Error",
  });
});

// =====================
// Start Server
// =====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
