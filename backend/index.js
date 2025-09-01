require('dotenv').config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

// Import routes
const authRoutes = require("./routes/auth.route.js");
const userRoutes = require("./routes/user.route.js");
const itemRoutes = require("./routes/item.route.js");
const outfitRoutes = require("./routes/outfit.route.js");
const itemTypeRoutes = require("./routes/itemType.route.js");
const weatherRoutes = require("./routes/weather.route.js");

//middleware
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// CORS configuration for React Native
app.use(cors({
  origin: ["http://localhost:8081", "http://192.168.15.11:19006", "exp://192.168.15.11:19000"], // Expo dev server URLs
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Error handling middleware for JSON parsing
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format',
    });
  }
  next();
});

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/items", itemRoutes);
app.use("/outfits", outfitRoutes);
app.use("/itemType", itemTypeRoutes);
app.use("/api/weather", weatherRoutes);

// Basic route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Outfitly API Server",
    version: "1.0.0",
    endpoints: {
      auth: "/auth",
      users: "/users",
      items: "/items",
      outfits: "/outfits",
      itemTypes: "/itemType"
    }
  });
});

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
  });
});

// Handle 404 routes
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Global error:", err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

//Connect to MongoDB
mongoose.set("strictQuery", false);
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb+srv://hirushiaramandeniya23:1111@outfitly.lllvj.mongodb.net/Outfitly"
  )
  .then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Node API app is running on port ${PORT}`);
      
      // Debug: Check if environment variables are loaded
      console.log("\n=== Environment Variables Check ===");
      console.log("NODE_ENV:", process.env.NODE_ENV || "development");
      console.log("JWT_SECRET:", process.env.JWT_SECRET ? "✓ Set" : "✗ Not set (using default)");
      console.log("AWS_REGION:", process.env.AWS_REGION);
      console.log("AWS_BUCKET_NAME:", process.env.AWS_BUCKET_NAME);
      console.log("AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID ? "✓ Set" : "✗ Not set");
      console.log("AWS_SECRET_ACCESS_KEY:", process.env.AWS_SECRET_ACCESS_KEY ? "✓ Set" : "✗ Not set");
      console.log("=====================================\n");
    });
    console.log("Connected to MongoDB");
  })
  .catch((err) => console.error("Could not connect to MongoDB", err));