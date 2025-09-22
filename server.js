// server.js
import app, { wss } from "./src/app.js"; // Import both app and wss
import database from "./src/config/database.js";

const PORT = process.env.PORT || 3000;

// Start HTTP server with database connection check
const startServer = async () => {
  try {
    // Check database connection
    const connection = await database.checkConnection();

    if (!connection.success) {
      throw new Error(`Database connection failed: ${connection.error}`);
    }

    console.log("✅ Database connection established successfully");

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`❤️  Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 WebSocket server initialized`);
    });

    // Handle WebSocket upgrades using the imported wss
    server.on("upgrade", (request, socket, head) => {
      // Optional: Add authentication for WebSocket connections
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

  if (server) {
    server.close(() => {
      console.log("✅ HTTP server closed");
    });
  }

  wss.close(() => {
    console.log("✅ WebSocket server closed");
  });

  await database.disconnect();
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGQUIT", () => shutdown("SIGQUIT"));

process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error);
  shutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  shutdown("UNHANDLED_REJECTION");
});