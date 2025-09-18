// server.js
import app from "./src/app.js";
import { WebSocketServer } from "ws";
import { createWebSocketServer } from "./src/config/websocket.js";
import database from "./src/config/database.js";
import models from "./src/models/index.js";

const PORT = process.env.PORT || 3000;

// Initialize WebSocket server
const wss = new WebSocketServer({ noServer: true });
createWebSocketServer(wss, models); // Pass models to WebSocket server

// Start HTTP server with database connection check
const startServer = async () => {
  try {
    // Check database connection using singleton
    const connection = await database.checkConnection();

    if (!connection.success) {
      throw new Error(`Database connection failed: ${connection.error}`);
    }

    console.log("✅ Database connection established successfully");

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`❤️  Health check: http://localhost:${PORT}/health`);
    });

    // Handle WebSocket upgrades
    server.on("upgrade", (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    });

    return server;
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};
// Start the server
let server;

(async () => {
  server = await startServer();
})();

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n${signal} received, shutting down gracefully...`);

  // Close HTTP server
  if (server) {
    server.close(() => {
      console.log("✅ HTTP server closed");
    });
  }

  // Close WebSocket server
  wss.close(() => {
    console.log("✅ WebSocket server closed");
  });

  // Close database connection using singleton
  await database.disconnect();

  process.exit(0);
};

// Handle different shutdown signals
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGQUIT", () => shutdown("SIGQUIT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error);
  shutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  shutdown("UNHANDLED_REJECTION");
});
