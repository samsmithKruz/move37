// src/app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
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
import { initializeWebSocket, getWebSocketService } from "./config/websocket.js";

// Load environment variables
dotenv.config({ quiet: true });

const app = express();

// Create WebSocket server
const wss = new WebSocketServer({ noServer: true });

// Initialize WebSocket service
initializeWebSocket(wss, models);

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
    origin: "*",
  })
);
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Attach models and WebSocket server to app
app.use((req, res, next) => {
  req.models = models;
  req.wss = wss; // Attach WebSocket server to request
  next();
});

// Store WebSocket server on app for easy access
app.set("wss", wss);

// API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get("/health", async (req, res) => {
  const dbStatus = await database.checkConnection();

  res.status(dbStatus.success ? 200 : 503).json({
    status: dbStatus.success ? "OK" : "Degraded",
    message: dbStatus.success ? "Server is running" : "Database connection issue",
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

app.use(notFoundHandler);
app.use(errorHandler);

// Export both app and wss for server.js
export { wss };
export default app;