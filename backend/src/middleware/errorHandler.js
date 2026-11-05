import { ZodError } from "zod";

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error.";
  let details;

  if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed.";
    details = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
  }

  if (err.code === "P2002") {
    statusCode = 409;
    message = "A record with this value already exists.";
  } else if (err.code === "P2025") {
    statusCode = 404;
    message = "Requested record not found.";
  } else if (err.code === "P2003") {
    statusCode = 400;
    message = "Related record does not exist.";
  }

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message:
      process.env.NODE_ENV === "production" && statusCode >= 500
        ? "Something went wrong."
        : message,
    ...(details && { errors: details }),
  });
};
