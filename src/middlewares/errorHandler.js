// src/middlewares/errorHandler.js

/**
 * Custom error classes for different error types
 */
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized access") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden access") {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, 409);
  }
}

/**
 * Main error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Default error values
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  err.message = err.message || "Internal Server Error";

  // Log error in development
  if (process.env.NODE_ENV === "development") {
    console.error("💥 ERROR:", {
      message: err.message,
      stack: err.stack,
      name: err.name,
      statusCode: err.statusCode,
    });
  }

  // Handle specific error types
  if (err.name === "JsonWebTokenError") {
    err = new UnauthorizedError("Invalid token. Please log in again.");
  }

  if (err.name === "TokenExpiredError") {
    err = new UnauthorizedError("Token expired. Please log in again.");
  }

  if (err.name === "PrismaClientKnownRequestError") {
    err = handlePrismaError(err);
  }

  if (err.name === "PrismaClientValidationError") {
    err = new ValidationError("Invalid data provided");
  }

  // Validation error (Joi or similar)
  if (err.name === "ValidationError" || err.errors) {
    err = new ValidationError("Validation failed", err.errors);
  }

  // Send error response
  if (err.isOperational) {
    // Operational, trusted error: send message to client
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      ...(err.errors && { errors: err.errors }), // Include validation errors if present
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }), // Include stack trace in development
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error("💥 UNHANDLED ERROR:", err);

    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

/**
 * Handle Prisma specific errors
 */
function handlePrismaError(err) {
  // Unique constraint violation
  if (err.code === "P2002") {
    const field = err.meta?.target?.[0] || "field";
    return new ConflictError(`A record with this ${field} already exists`);
  }

  // Record not found
  if (err.code === "P2025") {
    return new NotFoundError("Record not found");
  }

  // Foreign key constraint failed
  if (err.code === "P2003") {
    return new ValidationError("Invalid reference ID provided");
  }

  // Value too long for column
  if (err.code === "P2000") {
    return new ValidationError("Value too long for field");
  }

  // Default Prisma error
  return new AppError("Database operation failed", 500);
}

/**
 * Async error wrapper - use this to avoid try-catch blocks in controllers
 */
export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * 404 handler middleware
 */
export const notFoundHandler = (req, res, next) => {
  next(new NotFoundError(`Route ${req.originalUrl} not found`));
};

export default errorHandler;
