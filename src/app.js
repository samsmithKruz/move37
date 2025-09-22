// src/app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import models from "./models/index.js";

// Import routes
import userRoutes from "./routes/userRoutes.js";
import pollRoutes from "./routes/pollRoutes.js";
import voteRoutes from "./routes/voteRoutes.js";

// Import middleware
import errorHandler, { notFoundHandler } from "./middlewares/errorHandler.js";

// Import Swagger documentation
import swaggerSpec from "./docs/swagger.js";
import swaggerUi from "swagger-ui-express";
import database from "./config/database.js";
import { getWebSocketService } from "./config/websocket.js";

// Load environment variables
dotenv.config({ quiet: true });

const app = express();

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
        scriptSrc: ["'self'", "https://unpkg.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:", "http:"],
        fontSrc: ["'self'", "https:", "data:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin: "*", // For development only, on production we change to match host
  })
);
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Attach models
app.use((req, res, next) => {
  req.models = models; // Attach models to request object
  next();
});

// API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get("/health", async (req, res) => {
  const dbStatus = await database.checkConnection();

  res.status(dbStatus.success ? 200 : 503).json({
    status: dbStatus.success ? "OK" : "Degraded",
    message: dbStatus.success
      ? "Server is running"
      : "Database connection issue",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus.success ? "connected" : "disconnected",
    environment: process.env.NODE_ENV,
    ...(!dbStatus.success && { error: dbStatus.error }),
  });
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/votes", voteRoutes);

app.get("/api/websocket-stats", (req, res) => {
  const webSocketService = getWebSocketService();
  if (webSocketService) {
    return res.json({
      status: "success",
      data: webSocketService.getStats(),
    });
  } 
    return res.status(503).json({
      status: "error",
      message: "WebSocket service not available",
    });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `The route ${req.originalUrl} does not exist`,
  });
});

// 404 handler - use our custom middleware
app.use(notFoundHandler);

// Error handling middleware (should be last)
app.use(errorHandler);

export default app;
